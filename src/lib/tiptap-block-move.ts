import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

export type BlockSnapAlign = "left" | "center" | "right";
export type BlockAlign = BlockSnapAlign | "custom";

export const MAX_BLOCK_OFFSET = 720;
export const BLOCK_NUDGE_STEP = 8;
export const BLOCK_INDENT_STEP = 24;

const DRAG_THRESHOLD = 4;
const HORIZONTAL_INTENT_THRESHOLD = 6;
const VERTICAL_MOVE_THRESHOLD = 16;
const SNAP_THRESHOLD = 10;
const AUTOSCROLL_EDGE = 48;
const AUTOSCROLL_MAX_SPEED = 18;

export function clampBlockOffset(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_BLOCK_OFFSET, Math.round(value)));
}

export function parseBlockAlign(value: unknown, fallback: BlockAlign): BlockAlign {
  return value === "left" || value === "center" || value === "right" || value === "custom"
    ? value
    : fallback;
}

/**
 * Horizontal position as a share of the free space beside the block:
 * 0 = flush left, 0.5 = centered, 1 = flush right. Unlike a px offset this
 * reproduces the same placement at every container width.
 */
export function clampOffsetRatio(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.max(0, Math.min(1, n)) * 10000) / 10000;
}

export function offsetToRatio(offset: number, freeSpace: number): number {
  if (!Number.isFinite(freeSpace) || freeSpace <= 0) return 0;
  return clampOffsetRatio(offset / freeSpace) ?? 0;
}

export function parseOffsetRatioFromElement(element: HTMLElement): number | null {
  return clampOffsetRatio(element.getAttribute("data-offset-ratio"));
}

export function leftWithin(container: HTMLElement, el: HTMLElement): number {
  return Math.max(
    0,
    Math.round(el.getBoundingClientRect().left - container.getBoundingClientRect().left),
  );
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;

  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }

  return null;
}

/**
 * Positions a movable block's frame inside its full-width wrapper.
 * A saved `ratio` wins over the px `offset`; `width` (when known) keeps legacy
 * px offsets inside narrower editors.
 */
export function applyBlockFrameLayout(
  frame: HTMLElement,
  align: BlockAlign,
  offset: number,
  width: number | null = null,
  ratio: number | null = null,
) {
  frame.dataset.align = align;
  frame.style.transform = "";
  frame.style.left = "";
  frame.style.translate = "";

  if (align === "custom" && ratio !== null) {
    // `left` resolves against the wrapper, `translate` against the frame: r × (free space).
    const percent = ratio * 100;
    frame.style.marginLeft = "0px";
    frame.style.marginRight = "auto";
    frame.style.left = `${percent}%`;
    frame.style.translate = `${-percent}% 0`;
  } else if (align === "center") {
    frame.style.marginLeft = "auto";
    frame.style.marginRight = "auto";
  } else if (align === "right") {
    frame.style.marginLeft = "auto";
    frame.style.marginRight = "0px";
  } else if (align === "custom") {
    const px = clampBlockOffset(offset);
    frame.style.marginLeft = width
      ? `max(0px, min(${px}px, calc(100% - ${width}px)))`
      : `${px}px`;
    frame.style.marginRight = "auto";
  } else {
    frame.style.marginLeft = "0px";
    frame.style.marginRight = "auto";
  }
}

/** Visual left offset of the selected movable block (works for centered/right blocks too). */
function getSelectedBlockDom(editor: Editor) {
  const dom = editor.view.nodeDOM(editor.state.selection.from);
  if (!(dom instanceof HTMLElement)) return null;
  const frame = dom.querySelector<HTMLElement>("[data-block-frame]");
  return frame ? { wrapper: dom, frame } : null;
}

export function getSelectedBlockOffset(editor: Editor, nodeName: string): number {
  const attrs = editor.getAttributes(nodeName);
  const stored = clampBlockOffset(Number(attrs.offset) || 0);
  const dom = getSelectedBlockDom(editor);
  return dom ? leftWithin(dom.wrapper, dom.frame) : stored;
}

export function nudgeSelectedBlock(editor: Editor, nodeName: string, delta: number): boolean {
  if (!editor.isActive(nodeName)) return false;

  const dom = getSelectedBlockDom(editor);
  const freeSpace = dom ? Math.max(0, dom.wrapper.clientWidth - dom.frame.offsetWidth) : MAX_BLOCK_OFFSET;
  const current = getSelectedBlockOffset(editor, nodeName);
  const next = clampBlockOffset(Math.min(freeSpace, current + delta));

  return editor
    .chain()
    .focus()
    .updateAttributes(nodeName, {
      align: "custom",
      offset: next,
      offsetRatio: offsetToRatio(next, freeSpace),
    })
    .run();
}

type BlockMoverOptions = {
  editor: Editor;
  getPos: () => number | undefined;
  /** Full-width node view root. */
  wrapper: HTMLElement;
  /** Fit-content element that hugs the visible content. */
  frame: HTMLElement;
  nodeName: string;
};

/**
 * Pointer-driven move for block node views:
 * left/right sets `align` + `offset` (snapping to left / center / right),
 * up/down moves the node between top-level blocks.
 */
export function createBlockMover({ editor, getPos, wrapper, frame, nodeName }: BlockMoverOptions) {
  let active = false;
  let pointerId: number | null = null;
  let captureEl: HTMLElement | null = null;

  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let startLeft = 0;
  let maxLeft = 0;
  let nextLeft = 0;
  let moved = false;
  let snapped: BlockSnapAlign | null = null;
  let dropPos: number | null = null;
  let scrollParent: HTMLElement | null = null;
  let startScrollTop = 0;
  let rafId = 0;
  let indicator: HTMLDivElement | null = null;

  const removeIndicator = () => {
    indicator?.remove();
    indicator = null;
  };

  const showIndicator = (lineY: number) => {
    const editorRect = editor.view.dom.getBoundingClientRect();
    const clip = scrollParent?.getBoundingClientRect();

    if (clip && (lineY < clip.top || lineY > clip.bottom)) {
      removeIndicator();
      return;
    }

    if (!indicator) {
      indicator = document.createElement("div");
      indicator.className = "qb-block-drop-indicator";
      document.body.appendChild(indicator);
    }

    indicator.style.left = `${editorRect.left}px`;
    indicator.style.width = `${editorRect.width}px`;
    indicator.style.top = `${Math.round(lineY) - 2}px`;
  };

  /** Top-level insertion point closest to clientY, or null when it would be a no-op. */
  const findDropTarget = (clientY: number): { pos: number; lineY: number } | null => {
    const pos = getPos();
    if (pos === undefined) return null;

    const { state, view } = editor;
    const self = state.doc.nodeAt(pos);
    if (!self) return null;

    let target: number | null = null;
    let lineY = 0;
    let prevBottom: number | null = null;
    let lastBottom = 0;

    state.doc.forEach((child, offset) => {
      if (target !== null) return;

      const dom = view.nodeDOM(offset);
      if (!(dom instanceof HTMLElement)) return;

      const rect = dom.getBoundingClientRect();

      if (clientY < rect.top + rect.height / 2) {
        target = offset;
        lineY = prevBottom == null ? rect.top : (prevBottom + rect.top) / 2;
        return;
      }

      prevBottom = rect.bottom;
      lastBottom = rect.bottom;
    });

    if (target === null) {
      target = state.doc.content.size;
      lineY = lastBottom;
    }

    if (target === pos || target === pos + self.nodeSize) return null;

    return { pos: target, lineY };
  };

  const updatePreview = () => {
    const dx = lastX - startX;
    const scrollDelta = scrollParent ? scrollParent.scrollTop - startScrollTop : 0;
    const dy = lastY - startY + scrollDelta;

    let left = startLeft;
    snapped = null;

    if (Math.abs(dx) >= HORIZONTAL_INTENT_THRESHOLD) {
      left = Math.max(0, Math.min(maxLeft, startLeft + dx));
      const centerLeft = maxLeft / 2;

      if (Math.abs(left - centerLeft) <= SNAP_THRESHOLD) {
        left = centerLeft;
        snapped = "center";
      } else if (left <= SNAP_THRESHOLD) {
        left = 0;
        snapped = "left";
      } else if (maxLeft - left <= SNAP_THRESHOLD) {
        left = maxLeft;
        snapped = "right";
      }
    }

    nextLeft = Math.round(left);

    frame.style.transform = `translate(${nextLeft - startLeft}px, ${dy}px)`;
    wrapper.classList.toggle("qb-block-snap-center", snapped === "center");

    const target = Math.abs(dy) >= VERTICAL_MOVE_THRESHOLD ? findDropTarget(lastY) : null;
    dropPos = target?.pos ?? null;

    if (target) {
      showIndicator(target.lineY);
    } else {
      removeIndicator();
    }
  };

  const autoScrollTick = () => {
    if (!active) return;

    if (moved && scrollParent) {
      const rect = scrollParent.getBoundingClientRect();
      let delta = 0;

      if (lastY < rect.top + AUTOSCROLL_EDGE) {
        delta = -((rect.top + AUTOSCROLL_EDGE - lastY) / AUTOSCROLL_EDGE) * AUTOSCROLL_MAX_SPEED;
      } else if (lastY > rect.bottom - AUTOSCROLL_EDGE) {
        delta = ((lastY - (rect.bottom - AUTOSCROLL_EDGE)) / AUTOSCROLL_EDGE) * AUTOSCROLL_MAX_SPEED;
      }

      if (delta !== 0) {
        delta = Math.max(-AUTOSCROLL_MAX_SPEED, Math.min(AUTOSCROLL_MAX_SPEED, delta));
        const before = scrollParent.scrollTop;
        scrollParent.scrollTop += Math.round(delta);
        if (scrollParent.scrollTop !== before) updatePreview();
      }
    }

    rafId = requestAnimationFrame(autoScrollTick);
  };

  const commit = () => {
    const pos = getPos();
    if (pos === undefined) return;

    let layout: { align: BlockAlign; offset: number; offsetRatio: number | null } | null = null;

    if (Math.abs(lastX - startX) >= HORIZONTAL_INTENT_THRESHOLD) {
      layout = snapped
        ? { align: snapped, offset: 0, offsetRatio: null }
        : {
            align: "custom",
            offset: clampBlockOffset(nextLeft),
            offsetRatio: offsetToRatio(nextLeft, maxLeft),
          };
    }

    const target = dropPos;
    if (!layout && target === null) return;

    let finalPos = pos;

    const ok = editor
      .chain()
      .focus()
      .command(({ tr }) => {
        const current = tr.doc.nodeAt(pos);
        if (!current || current.type.name !== nodeName) return false;

        const attrs = layout ? { ...current.attrs, ...layout } : current.attrs;

        if (target === null) {
          tr.setNodeMarkup(pos, undefined, attrs);
          return true;
        }

        tr.delete(pos, pos + current.nodeSize);
        finalPos = tr.mapping.map(target);
        tr.insert(finalPos, current.type.create(attrs, current.content, current.marks));
        return true;
      })
      .run();

    if (!ok) return;
    if (editor.state.doc.nodeAt(finalPos)?.isAtom) {
      editor.commands.setNodeSelection(finalPos);
    } else {
      // Blocks with editable content (tables) keep a text cursor inside instead.
      editor
        .chain()
        .command(({ tr }) => {
          tr.setSelection(TextSelection.near(tr.doc.resolve(finalPos + 1)));
          return true;
        })
        .run();
    }
  };

  const onMove = (event: PointerEvent) => {
    if (!active || event.pointerId !== pointerId) return;

    lastX = event.clientX;
    lastY = event.clientY;

    if (!moved) {
      if (Math.hypot(lastX - startX, lastY - startY) < DRAG_THRESHOLD) return;
      moved = true;
      wrapper.classList.add("qb-block-dragging");
    }

    updatePreview();
  };

  const detach = () => {
    cancelAnimationFrame(rafId);
    removeIndicator();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
  };

  const end = (event: PointerEvent, shouldCommit: boolean) => {
    if (!active || event.pointerId !== pointerId) return;

    active = false;
    pointerId = null;
    detach();

    try {
      captureEl?.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released.
    }
    captureEl = null;

    wrapper.classList.remove("qb-block-dragging", "qb-block-snap-center");
    frame.style.transform = "";

    if (shouldCommit && moved) commit();
  };

  const onUp = (event: PointerEvent) => end(event, true);
  const onCancel = (event: PointerEvent) => end(event, false);

  const start = (event: PointerEvent, target: HTMLElement) => {
    if (active || !editor.isEditable || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const pos = getPos();
    if (pos !== undefined && editor.state.doc.nodeAt(pos)?.isAtom) {
      editor.chain().focus().setNodeSelection(pos).run();
    }

    active = true;
    pointerId = event.pointerId;
    captureEl = target;
    moved = false;
    snapped = null;
    dropPos = null;

    startX = lastX = event.clientX;
    startY = lastY = event.clientY;

    startLeft = leftWithin(wrapper, frame);
    maxLeft = Math.max(0, wrapper.clientWidth - frame.offsetWidth);
    nextLeft = startLeft;

    scrollParent = findScrollParent(wrapper);
    startScrollTop = scrollParent?.scrollTop ?? 0;

    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // Window listeners below still track the pointer.
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);

    rafId = requestAnimationFrame(autoScrollTick);
  };

  return {
    start,
    isActive: () => active,
    destroy: detach,
  };
}

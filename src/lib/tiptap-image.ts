import Image from "@tiptap/extension-image";
import { mergeAttributes, type Editor } from "@tiptap/core";

export type QbImageSnapAlign = "left" | "center" | "right";
export type QbImageAlign = QbImageSnapAlign | "custom";

export const IMAGE_NUDGE_STEP = 8;
export const IMAGE_INDENT_STEP = 24;
export const MAX_IMAGE_OFFSET = 720;

export const MIN_IMAGE_WIDTH = 80;
export const MAX_IMAGE_WIDTH = 1200;
export const IMAGE_RESIZE_STEP = 20;

const DRAG_THRESHOLD = 4;
const HORIZONTAL_INTENT_THRESHOLD = 6;
const VERTICAL_MOVE_THRESHOLD = 16;
const SNAP_THRESHOLD = 10;
const AUTOSCROLL_EDGE = 48;
const AUTOSCROLL_MAX_SPEED = 18;
const SIZE_PRESETS = [25, 50, 75, 100] as const;

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "w" | "e";
const RESIZE_HANDLES: ResizeHandle[] = ["nw", "ne", "sw", "se", "w", "e"];

const ALIGN_CLASS: Record<QbImageAlign, string> = {
  left: "qb-img-align-left",
  center: "qb-img-align-center",
  right: "qb-img-align-right",
  custom: "qb-img-align-custom",
};

export function clampImageOffset(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.max(
    0,
    Math.min(MAX_IMAGE_OFFSET, Math.round(value)),
  );
}

export function nextImageOffset(
  current: number,
  delta: number,
): number {
  return clampImageOffset(current + delta);
}

function clampImageWidth(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.max(
    MIN_IMAGE_WIDTH,
    Math.min(MAX_IMAGE_WIDTH, Math.round(value)),
  );
}

function parseWidthFromElement(element: HTMLElement): number | null {
  const dataWidth = element.getAttribute("data-width");

  if (dataWidth != null && dataWidth !== "") {
    const width = Number.parseFloat(dataWidth);

    if (Number.isFinite(width) && width > 0) {
      return clampImageWidth(width);
    }
  }

  const widthAttribute = element.getAttribute("width");

  if (widthAttribute != null && widthAttribute !== "") {
    const width = Number.parseFloat(widthAttribute);

    if (Number.isFinite(width) && width > 0) {
      return clampImageWidth(width);
    }
  }

  const style = element.getAttribute("style") ?? "";

  const match = style.match(
    /(?:^|;)\s*width\s*:\s*(\d+(?:\.\d+)?)px/i,
  );

  if (match?.[1]) {
    const width = Number.parseFloat(match[1]);

    if (Number.isFinite(width) && width > 0) {
      return clampImageWidth(width);
    }
  }

  return null;
}

function parseOffsetFromElement(element: HTMLElement): number {
  const data = element.getAttribute("data-offset");

  if (data != null && data !== "") {
    const n = Number.parseFloat(data);

    if (Number.isFinite(n)) {
      return clampImageOffset(n);
    }
  }

  const style = element.getAttribute("style") ?? "";

  if (/margin-left\s*:\s*auto/i.test(style)) {
    return 0;
  }

  const match = style.match(
    /margin-left\s*:\s*(\d+(?:\.\d+)?)px/i,
  );

  if (match?.[1]) {
    return clampImageOffset(
      Number.parseFloat(match[1]),
    );
  }

  return 0;
}

function parseAlignFromElement(
  element: HTMLElement,
): QbImageAlign {
  if (
    element.classList.contains(ALIGN_CLASS.custom) ||
    element.getAttribute("data-align") === "custom"
  ) {
    return "custom";
  }

  const offset = parseOffsetFromElement(element);

  if (offset > 0) {
    return "custom";
  }

  for (const align of [
    "center",
    "right",
    "left",
  ] as const) {
    if (
      element.classList.contains(
        ALIGN_CLASS[align],
      )
    ) {
      return align;
    }
  }

  const dataAlign = element.getAttribute(
    "data-align",
  );

  if (
    dataAlign === "center" ||
    dataAlign === "right" ||
    dataAlign === "left"
  ) {
    return dataAlign;
  }

  return "left";
}

function imageLayoutAttrs(
  align: QbImageAlign,
  offset: number,
): Record<string, string> {
  if (align === "custom") {
    const px = clampImageOffset(offset);

    return {
      class: `qb-inline-image ${ALIGN_CLASS.custom}`,
      "data-align": "custom",
      "data-offset": String(px),
      style: `
        display: block;
        margin-left: ${px}px;
        margin-right: auto;
      `.replace(/\s+/g, " ").trim(),
    };
  }

  if (align === "center") {
    return {
      class: `qb-inline-image ${ALIGN_CLASS.center}`,
      "data-align": "center",
      style:
        "display: block; margin-left: auto; margin-right: auto;",
    };
  }

  if (align === "right") {
    return {
      class: `qb-inline-image ${ALIGN_CLASS.right}`,
      "data-align": "right",
      style:
        "display: block; margin-left: auto; margin-right: 0;",
    };
  }

  return {
    class: `qb-inline-image ${ALIGN_CLASS.left}`,
    "data-align": "left",
  };
}

function readLayout(attrs: Record<string, unknown>) {
  const align = (attrs.align as QbImageAlign) || "left";
  const offset = clampImageOffset(Number(attrs.offset) || 0);
  const width =
    Number(attrs.width) > 0 ? clampImageWidth(Number(attrs.width)) : null;

  return { align, offset, width };
}

/**
 * In the editor the frame (not the <img>) carries the horizontal position,
 * so the frame always hugs the image and the handles sit on its edges.
 */
function applyLayoutToFrame(
  frame: HTMLElement,
  img: HTMLImageElement,
  attrs: Record<string, unknown>,
) {
  const { align, offset, width } = readLayout(attrs);

  frame.dataset.align = align;
  frame.style.transform = "";

  if (align === "center") {
    frame.style.marginLeft = "auto";
    frame.style.marginRight = "auto";
  } else if (align === "right") {
    frame.style.marginLeft = "auto";
    frame.style.marginRight = "0px";
  } else if (align === "custom") {
    // Keep the image inside the editor when it is narrower than when saved.
    frame.style.marginLeft = width
      ? `max(0px, min(${offset}px, calc(100% - ${width}px)))`
      : `${offset}px`;
    frame.style.marginRight = "auto";
  } else {
    frame.style.marginLeft = "0px";
    frame.style.marginRight = "auto";
  }

  img.className = "qb-inline-image";

  if (width) {
    img.setAttribute("data-width", String(width));
    img.style.width = `${width}px`;
  } else {
    img.removeAttribute("data-width");
    img.style.width = "";
  }

  if (typeof attrs.src === "string" && attrs.src && img.getAttribute("src") !== attrs.src) {
    img.src = attrs.src;
  }

  img.alt = typeof attrs.alt === "string" ? attrs.alt : "";

  if (typeof attrs.title === "string" && attrs.title) {
    img.title = attrs.title;
  } else {
    img.removeAttribute("title");
  }
}

function leftWithin(container: HTMLElement, el: HTMLElement): number {
  return Math.max(
    0,
    Math.round(
      el.getBoundingClientRect().left -
        container.getBoundingClientRect().left,
    ),
  );
}

export function getImageHorizontalOffset(
  editor: Editor,
): number {
  const attrs =
    editor.getAttributes("image");

  const align =
    (attrs.align as QbImageAlign) || "left";

  const stored = clampImageOffset(
    Number(attrs.offset) || 0,
  );

  if (align === "custom" || align === "left") return stored;

  const dom = editor.view.nodeDOM(
    editor.state.selection.from,
  );

  if (!(dom instanceof HTMLElement)) return stored;

  const frame = dom.querySelector<HTMLElement>(".qb-image-frame");

  if (frame) return leftWithin(dom, frame);

  const img = dom instanceof HTMLImageElement ? dom : dom.querySelector("img");

  if (img?.parentElement) return leftWithin(img.parentElement, img);

  return stored;
}

export function nudgeSelectedImage(
  editor: Editor,
  delta: number,
): boolean {
  if (!editor.isActive("image")) {
    return false;
  }

  const next = nextImageOffset(
    getImageHorizontalOffset(editor),
    delta,
  );

  return editor
    .chain()
    .focus()
    .updateAttributes("image", {
      align: "custom",
      offset: next,
    })
    .run();
}

export function resizeSelectedImage(
  editor: Editor,
  delta: number,
): boolean {
  if (!editor.isActive("image")) {
    return false;
  }

  const attrs = editor.getAttributes("image");
  let current = Number(attrs.width) || 0;

  if (!current) {
    const dom = editor.view.nodeDOM(editor.state.selection.from);
    const img =
      dom instanceof HTMLElement ? dom.querySelector("img") : null;
    current = img?.getBoundingClientRect().width ?? 0;
  }

  if (!current) return false;

  return editor
    .chain()
    .focus()
    .updateAttributes("image", {
      width: clampImageWidth(current + delta),
    })
    .run();
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;

  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);

    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }

    node = node.parentElement;
  }

  return null;
}

function createDiv(className: string): HTMLDivElement {
  const div = document.createElement("div");
  div.className = className;
  return div;
}

/**
 * Image NodeView.
 *
 * - Drag the image anywhere: left/right sets its horizontal position
 *   (snapping to left / center / right), up/down moves it between blocks.
 * - Drag any corner or side handle to resize; aspect ratio is always kept.
 * - Quick size presets appear when the image is selected.
 */
function createDraggableImageView({
  node,
  editor,
  getPos,
}: {
  node: {
    attrs: Record<string, unknown>;
    type: { name: string };
  };
  editor: Editor;
  getPos: () => number | undefined;
}) {
  let currentAttrs = node.attrs;

  const wrapper = createDiv("qb-image-node-view");
  const frame = createDiv("qb-image-frame");
  const img = document.createElement("img");
  img.draggable = false;

  frame.appendChild(img);

  const handles = RESIZE_HANDLES.map((position) => {
    const handle = createDiv(
      `qb-image-resize-handle qb-image-resize-${position}`,
    );
    handle.setAttribute("data-resize-handle", position);
    handle.setAttribute("aria-hidden", "true");
    frame.appendChild(handle);
    return { handle, position };
  });

  const badge = createDiv("qb-image-size-badge");
  badge.setAttribute("aria-hidden", "true");
  frame.appendChild(badge);

  const toolbar = createDiv("qb-image-toolbar");
  toolbar.setAttribute("data-image-toolbar", "true");

  const presetButtons: { button: HTMLButtonElement; percent: number | null }[] = [];

  for (const percent of [...SIZE_PRESETS, null]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = percent == null ? "Auto" : `${percent}%`;
    button.title =
      percent == null
        ? "Original size"
        : `Width ${percent}% of the editor`;
    toolbar.appendChild(button);
    presetButtons.push({ button, percent });
  }

  frame.appendChild(toolbar);
  wrapper.appendChild(frame);

  applyLayoutToFrame(frame, img, currentAttrs);

  let mode: "idle" | "drag" | "resize" = "idle";
  let activePointerId: number | null = null;

  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let startLeft = 0;
  let containerWidth = 0;

  // Drag state
  let moved = false;
  let maxLeft = 0;
  let nextLeft = 0;
  let snapped: QbImageSnapAlign | null = null;
  let dropPos: number | null = null;
  let scrollParent: HTMLElement | null = null;
  let startScrollTop = 0;
  let rafId = 0;
  let indicator: HTMLDivElement | null = null;

  // Resize state
  let resizeHandle: ResizeHandle | null = null;
  let resizeAnchor: "left" | "right" | "center" = "left";
  let startWidth = 0;
  let aspectRatio = 1;
  let nextWidth = 0;

  const getAlign = () => (currentAttrs.align as QbImageAlign) || "left";

  const selectImage = () => {
    const pos = getPos();
    if (pos === undefined) return;
    editor.chain().focus().setNodeSelection(pos).run();
  };

  const updateAttrs = (attrs: Record<string, unknown>) => {
    const pos = getPos();
    if (pos === undefined) return;
    editor
      .chain()
      .focus()
      .setNodeSelection(pos)
      .updateAttributes("image", attrs)
      .run();
  };

  /* ---------------- Move ---------------- */

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
      indicator = createDiv("qb-image-drop-indicator");
      document.body.appendChild(indicator);
    }

    indicator.style.left = `${editorRect.left}px`;
    indicator.style.width = `${editorRect.width}px`;
    indicator.style.top = `${Math.round(lineY) - 2}px`;
  };

  /** Top-level insertion point closest to clientY, or null when it would be a no-op. */
  const findDropTarget = (
    clientY: number,
  ): { pos: number; lineY: number } | null => {
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

  const updateDragPreview = () => {
    const dx = lastX - startX;
    const scrollDelta = scrollParent
      ? scrollParent.scrollTop - startScrollTop
      : 0;
    const dy = lastY - startY + scrollDelta;

    let left = Math.max(0, Math.min(maxLeft, startLeft + dx));
    snapped = null;

    if (Math.abs(dx) >= HORIZONTAL_INTENT_THRESHOLD) {
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
    } else {
      left = startLeft;
    }

    nextLeft = Math.round(left);

    frame.style.transform = `translate(${nextLeft - startLeft}px, ${dy}px)`;
    wrapper.classList.toggle("qb-image-snap-center", snapped === "center");

    const target =
      Math.abs(dy) >= VERTICAL_MOVE_THRESHOLD ? findDropTarget(lastY) : null;

    dropPos = target?.pos ?? null;

    if (target) {
      showIndicator(target.lineY);
    } else {
      removeIndicator();
    }
  };

  const autoScrollTick = () => {
    if (mode !== "drag") return;

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
        if (scrollParent.scrollTop !== before) updateDragPreview();
      }
    }

    rafId = requestAnimationFrame(autoScrollTick);
  };

  const commitMove = () => {
    const pos = getPos();
    if (pos === undefined) return;

    const horizontalChanged =
      Math.abs(lastX - startX) >= HORIZONTAL_INTENT_THRESHOLD;

    let layout: { align: QbImageAlign; offset: number } | null = null;

    if (horizontalChanged) {
      layout = snapped
        ? { align: snapped, offset: 0 }
        : { align: "custom", offset: clampImageOffset(nextLeft) };
    }

    const target = dropPos;

    if (!layout && target === null) return;

    let finalPos = pos;

    const ok = editor
      .chain()
      .focus()
      .command(({ tr }) => {
        const current = tr.doc.nodeAt(pos);
        if (!current || current.type.name !== "image") return false;

        const attrs = layout ? { ...current.attrs, ...layout } : current.attrs;

        if (target === null) {
          tr.setNodeMarkup(pos, undefined, attrs);
          return true;
        }

        tr.delete(pos, pos + current.nodeSize);
        finalPos = tr.mapping.map(target);
        tr.insert(finalPos, current.type.create(attrs));
        return true;
      })
      .run();

    if (ok) {
      editor.commands.setNodeSelection(finalPos);
    }
  };

  const onDragMove = (event: PointerEvent) => {
    if (mode !== "drag" || event.pointerId !== activePointerId) return;

    lastX = event.clientX;
    lastY = event.clientY;

    if (!moved) {
      if (Math.hypot(lastX - startX, lastY - startY) < DRAG_THRESHOLD) return;
      moved = true;
      wrapper.classList.add("qb-image-dragging");
    }

    updateDragPreview();
  };

  const endDrag = (event: PointerEvent, commit: boolean) => {
    if (mode !== "drag" || event.pointerId !== activePointerId) return;

    mode = "idle";
    activePointerId = null;
    cancelAnimationFrame(rafId);
    removeIndicator();

    try {
      img.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released.
    }

    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragUp);
    window.removeEventListener("pointercancel", onDragCancel);

    wrapper.classList.remove("qb-image-dragging", "qb-image-snap-center");
    frame.style.transform = "";

    if (commit && moved) {
      commitMove();
    }
  };

  const onDragUp = (event: PointerEvent) => endDrag(event, true);
  const onDragCancel = (event: PointerEvent) => endDrag(event, false);

  img.addEventListener("pointerdown", (event) => {
    if (!editor.isEditable || event.button !== 0 || mode !== "idle") return;

    event.preventDefault();
    event.stopPropagation();

    selectImage();

    mode = "drag";
    activePointerId = event.pointerId;
    moved = false;
    snapped = null;
    dropPos = null;

    startX = lastX = event.clientX;
    startY = lastY = event.clientY;

    containerWidth = wrapper.clientWidth;
    startLeft = leftWithin(wrapper, frame);
    maxLeft = Math.max(0, containerWidth - frame.offsetWidth);
    nextLeft = startLeft;

    scrollParent = findScrollParent(wrapper);
    startScrollTop = scrollParent?.scrollTop ?? 0;

    try {
      img.setPointerCapture(event.pointerId);
    } catch {
      // Ignore: window listeners below still track the pointer.
    }

    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragUp);
    window.addEventListener("pointercancel", onDragCancel);

    rafId = requestAnimationFrame(autoScrollTick);
  });

  img.addEventListener("dragstart", (event) => event.preventDefault());

  /* ---------------- Resize ---------------- */

  const updateBadge = (width: number) => {
    badge.textContent = `${width} × ${Math.round(width / aspectRatio)}`;
  };

  const onResizeMove = (event: PointerEvent) => {
    if (mode !== "resize" || !resizeHandle || event.pointerId !== activePointerId) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    const fromLeft = resizeHandle.includes("w");
    const signX = fromLeft ? -1 : 1;
    const signY = resizeHandle.startsWith("n") ? -1 : 1;

    let delta = signX * dx;

    if (resizeHandle.length === 2) {
      const fromY = signY * dy * aspectRatio;
      if (Math.abs(fromY) > Math.abs(delta)) delta = fromY;
    }

    if (resizeAnchor === "center") delta *= 2;

    let max = containerWidth;
    if (resizeAnchor === "left") max = containerWidth - startLeft;
    if (resizeAnchor === "right") max = startLeft + startWidth;
    max = Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, max));

    nextWidth = Math.round(
      Math.max(MIN_IMAGE_WIDTH, Math.min(max, startWidth + delta)),
    );

    img.style.width = `${nextWidth}px`;
    img.setAttribute("data-width", String(nextWidth));

    if (resizeAnchor === "right" && getAlign() !== "right") {
      frame.style.marginLeft = `${Math.max(0, startLeft + startWidth - nextWidth)}px`;
      frame.style.marginRight = "auto";
    }

    if (resizeAnchor === "left" && getAlign() !== "left") {
      frame.style.marginLeft = `${startLeft}px`;
      frame.style.marginRight = "auto";
    }

    updateBadge(nextWidth);
  };

  const endResize = (event: PointerEvent, commit: boolean) => {
    if (mode !== "resize" || event.pointerId !== activePointerId) return;

    mode = "idle";
    activePointerId = null;

    try {
      (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture may already be released.
    }

    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", onResizeUp);
    window.removeEventListener("pointercancel", onResizeCancel);

    wrapper.classList.remove("qb-image-resizing");

    const align = getAlign();
    const changed = Math.abs(nextWidth - Math.round(startWidth)) >= 1;

    if (!commit || !changed) {
      applyLayoutToFrame(frame, img, currentAttrs);
      resizeHandle = null;
      return;
    }

    const attrs: Record<string, unknown> = { width: clampImageWidth(nextWidth) };

    if (resizeAnchor === "right" && align !== "right") {
      const offset = clampImageOffset(startLeft + startWidth - nextWidth);
      attrs.align = offset === 0 ? "left" : "custom";
      attrs.offset = offset;
    }

    if (resizeAnchor === "left" && align !== "left") {
      attrs.align = startLeft === 0 ? "left" : "custom";
      attrs.offset = clampImageOffset(startLeft);
    }

    resizeHandle = null;
    updateAttrs(attrs);
  };

  const onResizeUp = (event: PointerEvent) => endResize(event, true);
  const onResizeCancel = (event: PointerEvent) => endResize(event, false);

  const startResize = (event: PointerEvent, position: ResizeHandle) => {
    if (!editor.isEditable || event.button !== 0 || mode !== "idle") return;

    event.preventDefault();
    event.stopPropagation();

    selectImage();

    mode = "resize";
    activePointerId = event.pointerId;
    resizeHandle = position;

    const rect = img.getBoundingClientRect();
    startWidth = rect.width;
    nextWidth = Math.round(rect.width);
    aspectRatio = rect.width / Math.max(1, rect.height);

    startX = event.clientX;
    startY = event.clientY;
    containerWidth = wrapper.clientWidth;
    startLeft = leftWithin(wrapper, frame);

    const align = getAlign();
    const fromLeft = position.includes("w");

    // The edge opposite the grabbed handle stays put; centered images grow evenly.
    if (align === "center") {
      resizeAnchor = "center";
    } else {
      resizeAnchor = fromLeft ? "right" : "left";
    }

    wrapper.classList.add("qb-image-resizing");
    updateBadge(nextWidth);

    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Ignore: window listeners below still track the pointer.
    }

    window.addEventListener("pointermove", onResizeMove);
    window.addEventListener("pointerup", onResizeUp);
    window.addEventListener("pointercancel", onResizeCancel);
  };

  for (const { handle, position } of handles) {
    handle.addEventListener("pointerdown", (event) => startResize(event, position));
    handle.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      updateAttrs({ width: null });
    });
  }

  /* ---------------- Size presets ---------------- */

  for (const { button, percent } of presetButtons) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!editor.isEditable) return;

      if (percent == null) {
        updateAttrs({ width: null });
        return;
      }

      const available = wrapper.clientWidth;
      const width = clampImageWidth((available * percent) / 100);
      const attrs: Record<string, unknown> = { width };

      if (getAlign() === "custom") {
        const offset = clampImageOffset(Number(currentAttrs.offset) || 0);
        attrs.offset = Math.max(0, Math.min(offset, available - width));
      }

      updateAttrs(attrs);
    });
  }

  const cleanupListeners = () => {
    cancelAnimationFrame(rafId);
    removeIndicator();
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragUp);
    window.removeEventListener("pointercancel", onDragCancel);
    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", onResizeUp);
    window.removeEventListener("pointercancel", onResizeCancel);
  };

  return {
    dom: wrapper,

    update: (updatedNode: {
      type: { name: string };
      attrs: Record<string, unknown>;
    }) => {
      if (updatedNode.type.name !== "image") {
        return false;
      }

      currentAttrs = updatedNode.attrs;

      if (mode === "idle") {
        applyLayoutToFrame(frame, img, currentAttrs);
      }

      return true;
    },

    stopEvent: (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return false;

      if (target.closest("[data-resize-handle], [data-image-toolbar]")) {
        return true;
      }

      if (
        target === img &&
        /^(pointer|mouse|drag|click|dblclick)/.test(event.type)
      ) {
        return true;
      }

      return false;
    },

    ignoreMutation: (mutation: { type: string }) =>
      mutation.type !== "selection",

    destroy: cleanupListeners,
  };
}

/**
 * Block image with:
 * - snap alignment
 * - free drag (horizontal position + move between blocks)
 * - corner/side resize
 * - persistent width
 */
export const QbImage =
  Image.extend({
    draggable: false,

    addAttributes() {
      return {
        ...this.parent?.(),

        align: {
          default:
            "left" as QbImageAlign,

          parseHTML: (element) =>
            parseAlignFromElement(
              element as HTMLElement,
            ),

          renderHTML: (attributes) => {
            const align =
              (attributes.align as QbImageAlign) ||
              "left";

            const offset =
              clampImageOffset(
                Number(attributes.offset) ||
                  0,
              );

            return imageLayoutAttrs(
              align,
              offset,
            );
          },
        },

        offset: {
          default: 0,

          parseHTML: (element) =>
            parseOffsetFromElement(
              element as HTMLElement,
            ),

          renderHTML: () => ({}),
        },

        /**
         * Stored in the document so resized images stay resized
         * after save/reload.
         */
        width: {
          default: null,

          parseHTML: (element) =>
            parseWidthFromElement(
              element as HTMLElement,
            ),

          renderHTML: (attributes) => {
            const width =
              Number(attributes.width);

            if (
              !Number.isFinite(width) ||
              width <= 0
            ) {
              return {};
            }

            const safeWidth =
              clampImageWidth(width);

            return {
              width: String(
                safeWidth,
              ),
              "data-width":
                String(safeWidth),
              style: `width: ${safeWidth}px; max-width: 100%; height: auto;`,
            };
          },
        },
      };
    },

    renderHTML({
      HTMLAttributes,
    }) {
      return [
        "img",
        mergeAttributes(
          this.options.HTMLAttributes,
          HTMLAttributes,
          {
            class:
              HTMLAttributes.class ??
              "qb-inline-image qb-img-align-left",
          },
        ),
      ];
    },

    addNodeView() {
      if (
        typeof document ===
        "undefined"
      ) {
        return null;
      }

      return ({
        node,
        editor,
        getPos,
      }) =>
        createDraggableImageView({
          node: node as {
            attrs: Record<
              string,
              unknown
            >;
            type: {
              name: string;
            };
          },

          editor,

          getPos,
        });
    },

    addKeyboardShortcuts() {
      return {
        ArrowLeft: () =>
          nudgeSelectedImage(
            this.editor,
            -IMAGE_NUDGE_STEP,
          ),

        ArrowRight: () =>
          nudgeSelectedImage(
            this.editor,
            IMAGE_NUDGE_STEP,
          ),

        "Shift-ArrowLeft": () =>
          resizeSelectedImage(
            this.editor,
            -IMAGE_RESIZE_STEP,
          ),

        "Shift-ArrowRight": () =>
          resizeSelectedImage(
            this.editor,
            IMAGE_RESIZE_STEP,
          ),
      };
    },
  }).configure({
    inline: false,

    allowBase64: false,

    HTMLAttributes: {
      class:
        "qb-inline-image qb-img-align-left",
    },
  });

export function qbImageAlignClass(
  align: QbImageAlign,
): string {
  return ALIGN_CLASS[align];
}

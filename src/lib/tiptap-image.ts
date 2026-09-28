import Image from "@tiptap/extension-image";
import { mergeAttributes, type Editor } from "@tiptap/core";
import {
  applyBlockFrameLayout,
  BLOCK_INDENT_STEP,
  BLOCK_NUDGE_STEP,
  clampOffsetRatio,
  createBlockMover,
  getSelectedBlockOffset,
  leftWithin,
  MAX_BLOCK_OFFSET,
  nudgeSelectedBlock,
  offsetToRatio,
  parseOffsetRatioFromElement,
  type BlockAlign,
  type BlockSnapAlign,
} from "@/lib/tiptap-block-move";

export type QbImageSnapAlign = BlockSnapAlign;
export type QbImageAlign = BlockAlign;

export const IMAGE_NUDGE_STEP = BLOCK_NUDGE_STEP;
export const IMAGE_INDENT_STEP = BLOCK_INDENT_STEP;
export const MAX_IMAGE_OFFSET = MAX_BLOCK_OFFSET;

export const MIN_IMAGE_WIDTH = 80;
export const MAX_IMAGE_WIDTH = 1200;
export const IMAGE_RESIZE_STEP = 20;

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
  ratio: number | null,
): Record<string, string> {
  if (align === "custom") {
    const px = clampImageOffset(offset);

    return {
      class: `qb-inline-image ${ALIGN_CLASS.custom}`,
      "data-align": "custom",
      "data-offset": String(px),
      ...(ratio !== null ? { "data-offset-ratio": String(ratio) } : {}),
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
  const ratio = clampOffsetRatio(attrs.offsetRatio);

  return { align, offset, width, ratio };
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
  const { align, offset, width, ratio } = readLayout(attrs);

  applyBlockFrameLayout(frame, align, offset, width, ratio);

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

export function getImageHorizontalOffset(
  editor: Editor,
): number {
  return getSelectedBlockOffset(editor, "image");
}

export function nudgeSelectedImage(
  editor: Editor,
  delta: number,
): boolean {
  return nudgeSelectedBlock(editor, "image", delta);
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

  frame.setAttribute("data-block-frame", "true");
  applyLayoutToFrame(frame, img, currentAttrs);

  const mover = createBlockMover({ editor, getPos, wrapper, frame, nodeName: "image" });

  let mode: "idle" | "resize" = "idle";
  let activePointerId: number | null = null;

  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let containerWidth = 0;

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

  img.addEventListener("pointerdown", (event) => {
    if (mode !== "idle") return;
    mover.start(event, img);
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
    const freeSpace = containerWidth - frame.offsetWidth;

    if (resizeAnchor === "right" && align !== "right") {
      const offset = clampImageOffset(startLeft + startWidth - nextWidth);
      attrs.align = offset === 0 ? "left" : "custom";
      attrs.offset = offset;
      attrs.offsetRatio = offset === 0 ? null : offsetToRatio(offset, freeSpace);
    }

    if (resizeAnchor === "left" && align !== "left") {
      attrs.align = startLeft === 0 ? "left" : "custom";
      attrs.offset = clampImageOffset(startLeft);
      attrs.offsetRatio = startLeft === 0 ? null : offsetToRatio(startLeft, freeSpace);
    }

    resizeHandle = null;
    updateAttrs(attrs);
  };

  const onResizeUp = (event: PointerEvent) => endResize(event, true);
  const onResizeCancel = (event: PointerEvent) => endResize(event, false);

  const startResize = (event: PointerEvent, position: ResizeHandle) => {
    if (!editor.isEditable || event.button !== 0 || mode !== "idle" || mover.isActive()) return;

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

    // Live resizing adjusts px margins, so pin a ratio-positioned frame in px first.
    if (align === "custom") {
      applyBlockFrameLayout(frame, "custom", startLeft);
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
        const freeSpace = Math.max(0, available - width);
        const ratio =
          clampOffsetRatio(currentAttrs.offsetRatio) ??
          offsetToRatio(leftWithin(wrapper, frame), wrapper.clientWidth - frame.offsetWidth);
        attrs.offset = clampImageOffset(ratio * freeSpace);
        attrs.offsetRatio = ratio;
      }

      updateAttrs(attrs);
    });
  }

  const cleanupListeners = () => {
    mover.destroy();
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

      if (mode === "idle" && !mover.isActive()) {
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
              clampOffsetRatio(attributes.offsetRatio),
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

        /** Width-independent position used by the editor and the student view. */
        offsetRatio: {
          default: null,

          parseHTML: (element) =>
            parseOffsetRatioFromElement(element as HTMLElement),

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

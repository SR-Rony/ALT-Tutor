import Image from "@tiptap/extension-image";
import { mergeAttributes, type Editor } from "@tiptap/core";

export type QbImageSnapAlign = "left" | "center" | "right";
export type QbImageAlign = QbImageSnapAlign | "custom";

export const IMAGE_NUDGE_STEP = 8;
export const IMAGE_INDENT_STEP = 24;
export const MAX_IMAGE_OFFSET = 720;

const ALIGN_CLASS: Record<QbImageAlign, string> = {
  left: "qb-img-align-left",
  center: "qb-img-align-center",
  right: "qb-img-align-right",
  custom: "qb-img-align-custom",
};

export function clampImageOffset(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_IMAGE_OFFSET, Math.round(value)));
}

export function nextImageOffset(current: number, delta: number): number {
  return clampImageOffset(current + delta);
}

function parseOffsetFromElement(element: HTMLElement): number {
  const data = element.getAttribute("data-offset");
  if (data != null && data !== "") {
    const n = Number.parseFloat(data);
    if (Number.isFinite(n)) return clampImageOffset(n);
  }
  const style = element.getAttribute("style") ?? "";
  if (/margin-left\s*:\s*auto/i.test(style)) return 0;
  const match = style.match(/margin-left\s*:\s*(\d+(?:\.\d+)?)px/i);
  if (match?.[1]) return clampImageOffset(Number.parseFloat(match[1]));
  return 0;
}

function parseAlignFromElement(element: HTMLElement): QbImageAlign {
  if (
    element.classList.contains(ALIGN_CLASS.custom) ||
    element.getAttribute("data-align") === "custom"
  ) {
    return "custom";
  }
  const offset = parseOffsetFromElement(element);
  if (offset > 0) return "custom";
  for (const align of ["center", "right", "left"] as const) {
    if (element.classList.contains(ALIGN_CLASS[align])) return align;
  }
  const dataAlign = element.getAttribute("data-align");
  if (dataAlign === "center" || dataAlign === "right" || dataAlign === "left") {
    return dataAlign;
  }
  return "left";
}

function imageLayoutAttrs(align: QbImageAlign, offset: number): Record<string, string> {
  if (align === "custom") {
    const px = clampImageOffset(offset);
    return {
      class: `qb-inline-image ${ALIGN_CLASS.custom}`,
      "data-align": "custom",
      "data-offset": String(px),
      style: `display: block; margin-left: ${px}px; margin-right: auto;`,
    };
  }
  if (align === "center") {
    return {
      class: `qb-inline-image ${ALIGN_CLASS.center}`,
      "data-align": "center",
      style: "display: block; margin-left: auto; margin-right: auto;",
    };
  }
  if (align === "right") {
    return {
      class: `qb-inline-image ${ALIGN_CLASS.right}`,
      "data-align": "right",
      style: "display: block; margin-left: auto; margin-right: 0;",
    };
  }
  return {
    class: `qb-inline-image ${ALIGN_CLASS.left}`,
    "data-align": "left",
  };
}

function applyLayoutToImg(el: HTMLImageElement, attrs: Record<string, unknown>) {
  const align = (attrs.align as QbImageAlign) || "left";
  const offset = clampImageOffset(Number(attrs.offset) || 0);
  const layout = imageLayoutAttrs(align, offset);
  el.className = layout.class;
  el.setAttribute("data-align", layout["data-align"]);
  if (layout["data-offset"]) el.setAttribute("data-offset", layout["data-offset"]);
  else el.removeAttribute("data-offset");
  if (layout.style) el.setAttribute("style", layout.style);
  else el.removeAttribute("style");
  if (typeof attrs.src === "string" && attrs.src) el.src = attrs.src;
  el.alt = typeof attrs.alt === "string" ? attrs.alt : "";
  if (typeof attrs.title === "string" && attrs.title) el.title = attrs.title;
  else el.removeAttribute("title");
}

function visualOffsetFromDom(el: HTMLElement): number {
  const parent = el.parentElement;
  if (!parent) return 0;
  return Math.max(
    0,
    Math.round(el.getBoundingClientRect().left - parent.getBoundingClientRect().left)
  );
}

export function getImageHorizontalOffset(editor: Editor): number {
  const attrs = editor.getAttributes("image");
  const align = (attrs.align as QbImageAlign) || "left";
  const stored = clampImageOffset(Number(attrs.offset) || 0);
  if (align === "custom") return stored;
  if (align === "left") return stored;

  const { view, state } = editor;
  const dom = view.nodeDOM(state.selection.from);
  const img =
    dom instanceof HTMLImageElement
      ? dom
      : dom instanceof HTMLElement
        ? dom.querySelector("img")
        : null;
  if (!img) return stored;
  return visualOffsetFromDom(img);
}

export function nudgeSelectedImage(editor: Editor, delta: number): boolean {
  if (!editor.isActive("image")) return false;
  const next = nextImageOffset(getImageHorizontalOffset(editor), delta);
  return editor.chain().updateAttributes("image", { align: "custom", offset: next }).run();
}

function createDraggableImageView({
  node,
  editor,
  getPos,
}: {
  node: { attrs: Record<string, unknown>; type: { name: string } };
  editor: Editor;
  getPos: () => number | undefined;
}) {
  const el = document.createElement("img");
  el.draggable = false;
  applyLayoutToImg(el, node.attrs);

  let dragging = false;
  let startX = 0;
  let startOffset = 0;
  let latestOffset = 0;

  const commitOffset = (offset: number) => {
    const pos = getPos();
    if (pos === undefined) return;
    editor
      .chain()
      .focus()
      .setNodeSelection(pos)
      .updateAttributes("image", { align: "custom", offset })
      .run();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;
    const parentWidth = el.parentElement?.clientWidth ?? MAX_IMAGE_OFFSET;
    const max = Math.max(0, parentWidth - el.offsetWidth);
    latestOffset = clampImageOffset(
      Math.min(max, startOffset + (event.clientX - startX))
    );
    el.style.display = "block";
    el.style.marginLeft = `${latestOffset}px`;
    el.style.marginRight = "auto";
    el.setAttribute("data-align", "custom");
    el.setAttribute("data-offset", String(latestOffset));
    el.className = `qb-inline-image ${ALIGN_CLASS.custom} qb-img-dragging`;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("qb-img-dragging");
    el.releasePointerCapture(event.pointerId);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    if (Math.abs(event.clientX - startX) < 4) return;
    commitOffset(latestOffset);
  };

  el.addEventListener("pointerdown", (event) => {
    if (!editor.isEditable || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const pos = getPos();
    if (pos !== undefined) {
      editor.chain().focus().setNodeSelection(pos).run();
    }
    dragging = true;
    startX = event.clientX;
    startOffset = getImageHorizontalOffset(editor);
    latestOffset = startOffset;
    el.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  });

  el.addEventListener("dragstart", (event) => event.preventDefault());

  return {
    dom: el,
    update: (updatedNode: { type: { name: string }; attrs: Record<string, unknown> }) => {
      if (updatedNode.type.name !== "image") return false;
      if (!dragging) applyLayoutToImg(el, updatedNode.attrs);
      return true;
    },
    ignoreMutation: () => dragging,
    destroy: () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    },
  };
}

/** Block image with snap align plus free horizontal offset. */
export const QbImage = Image.extend({
  draggable: false,

  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "left" as QbImageAlign,
        parseHTML: (element) => parseAlignFromElement(element as HTMLElement),
        renderHTML: (attributes) => {
          const align = (attributes.align as QbImageAlign) || "left";
          const offset = clampImageOffset(Number(attributes.offset) || 0);
          return imageLayoutAttrs(align, offset);
        },
      },
      offset: {
        default: 0,
        parseHTML: (element) => parseOffsetFromElement(element as HTMLElement),
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: HTMLAttributes.class ?? "qb-inline-image qb-img-align-left",
      }),
    ];
  },

  addNodeView() {
    if (typeof document === "undefined") return null;
    return ({ node, editor, getPos }) =>
      createDraggableImageView({
        node: node as { attrs: Record<string, unknown>; type: { name: string } },
        editor,
        getPos,
      });
  },

  addKeyboardShortcuts() {
    return {
      ArrowLeft: () => nudgeSelectedImage(this.editor, -IMAGE_NUDGE_STEP),
      ArrowRight: () => nudgeSelectedImage(this.editor, IMAGE_NUDGE_STEP),
    };
  },
}).configure({
  inline: false,
  allowBase64: false,
  HTMLAttributes: {
    class: "qb-inline-image qb-img-align-left",
  },
});

export function qbImageAlignClass(align: QbImageAlign): string {
  return ALIGN_CLASS[align];
}

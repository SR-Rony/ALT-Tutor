import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

export type QbImageAlign = "left" | "center" | "right";

const ALIGN_CLASS: Record<QbImageAlign, string> = {
  left: "qb-img-align-left",
  center: "qb-img-align-center",
  right: "qb-img-align-right",
};

function parseAlignFromElement(element: HTMLElement): QbImageAlign {
  for (const align of ["center", "right", "left"] as const) {
    if (element.classList.contains(ALIGN_CLASS[align])) return align;
  }
  const dataAlign = element.getAttribute("data-align");
  if (dataAlign === "center" || dataAlign === "right" || dataAlign === "left") {
    return dataAlign;
  }
  return "left";
}

/** Block image with left / center / right alignment for question-bank rich text. */
export const QbImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "left" as QbImageAlign,
        parseHTML: (element) => parseAlignFromElement(element as HTMLElement),
        renderHTML: (attributes) => {
          const align = (attributes.align as QbImageAlign) || "left";
          if (align === "center") {
            return {
              class: "qb-inline-image qb-img-align-center",
              "data-align": "center",
              style: "display: block; margin-left: auto; margin-right: auto;",
            };
          }
          if (align === "right") {
            return {
              class: "qb-inline-image qb-img-align-right",
              "data-align": "right",
              style: "display: block; margin-left: auto; margin-right: 0;",
            };
          }
          return {
            class: "qb-inline-image",
            "data-align": "left",
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: HTMLAttributes.class ?? "qb-inline-image",
      }),
    ];
  },
}).configure({
  inline: false,
  allowBase64: false,
  HTMLAttributes: {
    class: "qb-inline-image",
  },
});

export function qbImageAlignClass(align: QbImageAlign): string {
  return ALIGN_CLASS[align];
}

import { Extension } from "@tiptap/core";
import { IMAGE_INDENT_STEP, nudgeSelectedImage } from "@/lib/tiptap-image";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const INDENT_STEP_PX = 24;
export const MAX_INDENT = 8;

function readIndent(element: HTMLElement): number {
  const data = element.getAttribute("data-indent");
  if (data != null && data !== "") {
    const n = Number.parseInt(data, 10);
    if (Number.isFinite(n) && n > 0) return Math.min(MAX_INDENT, n);
  }

  const classMatch = Array.from(element.classList)
    .map((c) => c.match(/^qb-indent-(\d+)$/))
    .find(Boolean);
  if (classMatch?.[1]) {
    const n = Number.parseInt(classMatch[1], 10);
    if (Number.isFinite(n) && n > 0) return Math.min(MAX_INDENT, n);
  }

  const padding = element.style.paddingLeft || "";
  const px = Number.parseInt(padding, 10);
  if (Number.isFinite(px) && px > 0) {
    return Math.min(MAX_INDENT, Math.round(px / INDENT_STEP_PX));
  }
  return 0;
}

/**
 * Paragraph / heading indent.
 * Uses data-indent + CSS class so it does not clash with text-align inline styles.
 * Tab indents (or sinks list items); Shift+Tab outdents.
 */
export const Indent = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => readIndent(element as HTMLElement),
            renderHTML: (attributes) => {
              const level = Number(attributes.indent) || 0;
              if (level <= 0) return {};
              return {
                "data-indent": String(level),
                class: `qb-indent-${level}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ editor, commands }) => {
          if (editor.isActive("image")) {
            return nudgeSelectedImage(editor, IMAGE_INDENT_STEP);
          }
          if (editor.can().sinkListItem("listItem")) {
            return commands.sinkListItem("listItem");
          }
          const types = ["paragraph", "heading"] as const;
          for (const type of types) {
            if (!editor.isActive(type)) continue;
            const current = Number(editor.getAttributes(type).indent) || 0;
            if (current >= MAX_INDENT) return true;
            return commands.updateAttributes(type, { indent: current + 1 });
          }
          return false;
        },
      outdent:
        () =>
        ({ editor, commands }) => {
          if (editor.isActive("image")) {
            return nudgeSelectedImage(editor, -IMAGE_INDENT_STEP);
          }
          if (editor.can().liftListItem("listItem")) {
            return commands.liftListItem("listItem");
          }
          const types = ["paragraph", "heading"] as const;
          for (const type of types) {
            if (!editor.isActive(type)) continue;
            const current = Number(editor.getAttributes(type).indent) || 0;
            if (current <= 0) return true;
            return commands.updateAttributes(type, {
              indent: current - 1 <= 0 ? 0 : current - 1,
            });
          }
          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    };
  },
});

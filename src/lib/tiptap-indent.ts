import { Extension, Node, type Editor } from "@tiptap/core";
import { BLOCK_INDENT_STEP, nudgeSelectedBlock } from "@/lib/tiptap-block-move";

/**
 * A real tab character inside the text. Stored as `<span class="qb-tab">\t</span>` because
 * HTML (and TipTap's parser) collapse a bare `\t` into a single space.
 */
export const TabChar = Node.create({
  name: "tabChar",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,

  parseHTML() {
    return [{ tag: "span.qb-tab" }, { tag: "span[data-tab]" }];
  },

  renderHTML() {
    return ["span", { class: "qb-tab", "data-tab": "true" }, "\t"];
  },

  renderText() {
    return "\t";
  },

  addNodeView() {
    return () => {
      const dom = document.createElement("span");
      dom.className = "qb-tab";
      dom.contentEditable = "false";
      dom.textContent = "\t";
      return { dom };
    };
  },
});

function selectionSpansBlocks(editor: Editor): boolean {
  const { $from, $to } = editor.state.selection;
  return !$from.sameParent($to);
}

function cursorAtBlockStart(editor: Editor): boolean {
  const { selection } = editor.state;
  return selection.empty && selection.$from.parentOffset === 0;
}

const MOVABLE_BLOCKS = ["image", "mathDisplay"] as const;

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
 * Paragraph / heading indent (toolbar buttons).
 * Uses data-indent + CSS class so it does not clash with text-align inline styles.
 * Tab types a tab character at the cursor like a word processor; it only indents whole
 * paragraphs when several lines are selected, and sinks list items at the item start.
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
          for (const block of MOVABLE_BLOCKS) {
            if (editor.isActive(block)) return nudgeSelectedBlock(editor, block, BLOCK_INDENT_STEP);
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
          for (const block of MOVABLE_BLOCKS) {
            if (editor.isActive(block)) return nudgeSelectedBlock(editor, block, -BLOCK_INDENT_STEP);
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
      // Inside a table Tab / Shift+Tab move between cells (handled by the table extension).
      Tab: () => {
        const editor = this.editor;
        if (editor.isActive("table")) return false;
        if (MOVABLE_BLOCKS.some((block) => editor.isActive(block))) return editor.commands.indent();
        if (editor.isActive("listItem") && cursorAtBlockStart(editor)) {
          if (editor.commands.sinkListItem("listItem")) return true;
        }
        if (selectionSpansBlocks(editor)) return editor.commands.indent();
        editor.commands.insertContent({ type: "tabChar" });
        // Always swallow Tab so focus never jumps out of the editor.
        return true;
      },
      "Shift-Tab": () => {
        const editor = this.editor;
        if (editor.isActive("table")) return false;
        const { selection } = editor.state;
        if (selection.empty && selection.$from.nodeBefore?.type.name === "tabChar") {
          return editor.commands.deleteRange({ from: selection.from - 1, to: selection.from });
        }
        editor.commands.outdent();
        return true;
      },
      // Backspace at the start of an indented paragraph removes one indent level first.
      Backspace: () => {
        const editor = this.editor;
        const { selection } = editor.state;
        if (selection.empty && selection.$from.nodeBefore?.type.name === "tabChar") {
          return editor.commands.deleteRange({ from: selection.from - 1, to: selection.from });
        }
        if (!cursorAtBlockStart(editor)) return false;
        const parent = editor.state.selection.$from.parent;
        if (parent.type.name !== "paragraph" && parent.type.name !== "heading") return false;
        const level = Number(parent.attrs.indent) || 0;
        if (level <= 0) return false;
        return editor.commands.updateAttributes(parent.type.name, { indent: level - 1 });
      },
      Delete: () => {
        const { selection } = this.editor.state;
        if (!selection.empty || selection.$from.nodeAfter?.type.name !== "tabChar") return false;
        return this.editor.commands.deleteRange({ from: selection.from, to: selection.from + 1 });
      },
    };
  },
});

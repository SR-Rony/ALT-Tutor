import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import katex from "katex";

export type MathInlineOptions = {
  HTMLAttributes: Record<string, unknown>;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      insertMath: (latex: string, options?: { display?: boolean }) => ReturnType;
    };
  }
}

export const MATH_OPEN_EVENT = "qb-open-math-editor";

function latexFromElement(element: HTMLElement): string {
  return element.getAttribute("data-latex") ?? element.textContent ?? "";
}

export function isDisplayMathElement(element: HTMLElement): boolean {
  return (
    element.classList.contains("qb-math-display") ||
    element.getAttribute("data-display") === "true"
  );
}

export function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
    });
  } catch {
    return latex;
  }
}

function paintKatex(dom: HTMLElement, latex: string, display: boolean) {
  const value = String(latex ?? "");
  dom.setAttribute("data-latex", value);
  try {
    katex.render(value, dom, {
      throwOnError: false,
      displayMode: display,
    });
  } catch {
    dom.textContent = value;
  }
}

function createMathNodeView(display: boolean) {
  return ({
    node,
    editor,
    getPos,
  }: {
    node: ProseMirrorNode;
    editor: Editor;
    getPos: () => number | undefined;
  }) => {
    const dom = document.createElement(display ? "div" : "span");
    dom.className = display ? "qb-math qb-math-display" : "qb-math";
    if (display) dom.setAttribute("data-display", "true");
    dom.contentEditable = "false";
    paintKatex(dom, String(node.attrs.latex ?? ""), display);

    const openEditor = () => {
      const pos = getPos();
      if (pos !== undefined) {
        editor.chain().setNodeSelection(pos).run();
      }
      editor.view.dom.dispatchEvent(new CustomEvent(MATH_OPEN_EVENT, { bubbles: true }));
    };

    dom.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openEditor();
    });

    return {
      dom,
      ignoreMutation: () => true,
      update: (updated: ProseMirrorNode) => {
        if (updated.type !== node.type) return false;
        paintKatex(dom, String(updated.attrs.latex ?? ""), display);
        return true;
      },
    };
  };
}

/** Inline KaTeX node stored as `<span class="qb-math" data-latex="...">`. */
export const MathInline = Node.create<MathInlineOptions>({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => latexFromElement(element as HTMLElement),
        renderHTML: (attributes) => ({
          "data-latex": attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'span.qb-math[data-latex]:not(.qb-math-display):not([data-display="true"])' },
      { tag: 'span[data-latex]:not(.qb-math-display):not([data-display="true"])' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "qb-math",
        "data-latex": node.attrs.latex,
      }),
      node.attrs.latex,
    ];
  },

  addCommands() {
    return {
      insertMath:
        (latex: string, options) =>
        ({ commands }) => {
          const trimmed = latex.trim();
          if (!trimmed) return false;
          const display = options?.display !== false;
          return commands.insertContent({
            type: display ? "mathDisplay" : this.name,
            attrs: { latex: trimmed },
          });
        },
    };
  },

  addNodeView() {
    if (typeof document === "undefined") return null;
    return createMathNodeView(false);
  },
});

/** Centered display equation — Revision Village / exam-paper style. */
export const MathDisplay = Node.create({
  name: "mathDisplay",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => latexFromElement(element as HTMLElement),
        renderHTML: (attributes) => ({
          "data-latex": attributes.latex,
          "data-display": "true",
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: "div.qb-math-display" },
      { tag: "span.qb-math-display" },
      { tag: '[data-display="true"]' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "qb-math qb-math-display",
        "data-latex": node.attrs.latex,
        "data-display": "true",
      }),
      node.attrs.latex,
    ];
  },

  addNodeView() {
    if (typeof document === "undefined") return null;
    return createMathNodeView(true);
  },
});

/** Hydrate KaTeX inside sanitized HTML for read-only display. */
export function hydrateKatexHtml(html: string): string {
  if (typeof window === "undefined" || !html.includes("data-latex")) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("[data-latex]").forEach((el) => {
      const latex = el.getAttribute("data-latex") ?? "";
      const display = isDisplayMathElement(el as HTMLElement);
      try {
        el.innerHTML = renderKatex(latex, display);
        el.classList.add("qb-math");
        if (display) el.classList.add("qb-math-display");
      } catch {
        el.textContent = latex;
      }
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

export function readSelectedMath(editor: Editor): { latex: string; display: boolean } | null {
  if (editor.isActive("mathDisplay")) {
    return {
      latex: String(editor.getAttributes("mathDisplay").latex ?? ""),
      display: true,
    };
  }
  if (editor.isActive("mathInline")) {
    return {
      latex: String(editor.getAttributes("mathInline").latex ?? ""),
      display: false,
    };
  }
  return null;
}

export function applyEditorMath(editor: Editor, latex: string, display: boolean): boolean {
  const trimmed = latex.trim();
  if (!trimmed) return false;
  const type = display ? "mathDisplay" : "mathInline";
  const chain = editor.chain().focus();
  if (editor.isActive("mathInline") || editor.isActive("mathDisplay")) {
    chain.deleteSelection();
  }
  return chain.insertContent({ type, attrs: { latex: trimmed } }).run();
}

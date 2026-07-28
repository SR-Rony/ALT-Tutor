import { Node, mergeAttributes } from "@tiptap/core";
import katex from "katex";

export type MathInlineOptions = {
  HTMLAttributes: Record<string, unknown>;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      insertMath: (latex: string) => ReturnType;
    };
  }
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
        parseHTML: (element) => element.getAttribute("data-latex") ?? element.textContent ?? "",
        renderHTML: (attributes) => ({
          "data-latex": attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.qb-math[data-latex]" }, { tag: 'span[data-latex]' }];
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
        (latex: string) =>
        ({ commands }) => {
          const trimmed = latex.trim();
          if (!trimmed) return false;
          return commands.insertContent({
            type: this.name,
            attrs: { latex: trimmed },
          });
        },
    };
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");
      dom.className = "qb-math";
      dom.setAttribute("data-latex", node.attrs.latex);
      dom.contentEditable = "false";
      try {
        katex.render(String(node.attrs.latex ?? ""), dom, {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        dom.textContent = String(node.attrs.latex ?? "");
      }
      return { dom };
    };
  },
});

/** Hydrate KaTeX inside sanitized HTML for read-only display. */
export function hydrateKatexHtml(html: string): string {
  if (typeof window === "undefined" || !html.includes("data-latex")) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("[data-latex]").forEach((el) => {
      const latex = el.getAttribute("data-latex") ?? "";
      try {
        el.innerHTML = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
        });
        el.classList.add("qb-math");
      } catch {
        el.textContent = latex;
      }
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import katex from "katex";
import {
  applyBlockFrameLayout,
  BLOCK_NUDGE_STEP,
  clampBlockOffset,
  clampOffsetRatio,
  createBlockMover,
  nudgeSelectedBlock,
  parseBlockAlign,
  parseOffsetRatioFromElement,
  type BlockAlign,
} from "@/lib/tiptap-block-move";

/** Shared KaTeX options — exam / Revision Village style math. */
export const KATEX_OPTIONS = {
  throwOnError: false,
  strict: "ignore" as const,
  trust: false,
  macros: {
    "\\R": "\\mathbb{R}",
    "\\N": "\\mathbb{N}",
    "\\Z": "\\mathbb{Z}",
    "\\Q": "\\mathbb{Q}",
    "\\C": "\\mathbb{C}",
  },
};

/** Commands whose `{…}` argument is already text or a name — never rewrite inside. */
const VERBATIM_ARG_COMMANDS = new Set([
  "text",
  "textrm",
  "textbf",
  "textit",
  "textsf",
  "texttt",
  "mathrm",
  "mathbf",
  "mathit",
  "mathsf",
  "mathtt",
  "mathbb",
  "mathcal",
  "mathfrak",
  "operatorname",
  "mbox",
  "hbox",
  "begin",
  "end",
  "color",
  "textcolor",
]);

const PLAIN_WORDS_RE =
  /["“”]([^"“”]*)["“”]|(?<![A-Za-z])([A-Za-z]+(?:[ \t]+[A-Za-z]+)+|[A-Za-z]{4,})(?![A-Za-z])/g;

/**
 * Math mode drops spaces and italicises every letter, so "total energy output" would
 * render as one squashed variable. Quoted text, multi-word runs and long single words
 * become upright `\text{…}`; short symbols like `m`, `ac`, `mgh` stay as variables.
 */
function textifyPlainWords(segment: string): string {
  return segment.replace(PLAIN_WORDS_RE, (match, quoted: string | undefined, words: string | undefined) => {
    if (quoted !== undefined) {
      const inner = quoted.trim();
      return inner ? `\\text{${inner}}` : "";
    }
    if (words && /\s/.test(words) && !words.split(/\s+/).some((w) => w.length >= 3)) {
      return match;
    }
    return `\\text{${words}}`;
  });
}

function readBalancedGroup(latex: string, start: number): number {
  let depth = 0;
  for (let i = start; i < latex.length; i += 1) {
    const ch = latex[i];
    if (ch === "\\") {
      i += 1;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return latex.length;
}

/** Make hand-typed exam equations render like the printed paper. */
export function normalizeEquationLatex(latex: string): string {
  let out = "";
  let plain = "";
  let i = 0;
  const flushPlain = () => {
    out += textifyPlainWords(plain);
    plain = "";
  };

  while (i < latex.length) {
    const ch = latex[i];
    if (ch !== "\\") {
      plain += ch;
      i += 1;
      continue;
    }
    flushPlain();
    const name = /^[A-Za-z]+\*?/.exec(latex.slice(i + 1))?.[0];
    if (!name) {
      out += latex.slice(i, i + 2);
      i += 2;
      continue;
    }
    out += `\\${name}`;
    i += 1 + name.length;
    if (!VERBATIM_ARG_COMMANDS.has(name.replace(/\*$/, ""))) continue;
    const ws = /^\s*/.exec(latex.slice(i))?.[0] ?? "";
    if (latex[i + ws.length] !== "{") continue;
    const end = readBalancedGroup(latex, i + ws.length);
    out += latex.slice(i, end);
    i = end;
  }
  flushPlain();

  // A bare `%` starts a LaTeX comment and silently hides the rest of the equation.
  return out.replace(/(?<!\\)%/g, "\\%");
}

export function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(normalizeEquationLatex(latex), {
      ...KATEX_OPTIONS,
      displayMode,
    });
  } catch {
    return latex;
  }
}

/** Returns a human-readable parse error, or null if latex is valid. */
export function getKatexParseError(latex: string, displayMode = true): string | null {
  const trimmed = latex.trim();
  if (!trimmed) return null;
  try {
    katex.renderToString(normalizeEquationLatex(trimmed), {
      ...KATEX_OPTIONS,
      throwOnError: true,
      displayMode,
    });
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return message.replace(/^KaTeX parse error:\s*/i, "");
  }
}

function paintKatex(dom: HTMLElement, latex: string, display: boolean) {
  const value = String(latex ?? "");
  dom.setAttribute("data-latex", value);
  try {
    katex.render(normalizeEquationLatex(value), dom, {
      ...KATEX_OPTIONS,
      displayMode: display,
    });
  } catch {
    dom.textContent = value;
  }
}

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

export type MathInlineOptions = {
  HTMLAttributes: Record<string, unknown>;
};

type MathNodeViewProps = {
  node: ProseMirrorNode;
  editor: Editor;
  getPos: () => number | undefined;
};

function openMathEditor(editor: Editor, getPos: () => number | undefined) {
  const pos = getPos();
  if (pos !== undefined) {
    editor.chain().setNodeSelection(pos).run();
  }
  editor.view.dom.dispatchEvent(new CustomEvent(MATH_OPEN_EVENT, { bubbles: true }));
}

/** Inline equation: flows inside the text line; drag it (native) to another spot in the text. */
function createInlineMathView({ node, editor, getPos }: MathNodeViewProps) {
  const dom = document.createElement("span");
  dom.className = "qb-math";
  dom.contentEditable = "false";
  dom.title = "Double-click to edit · drag to move";
  let latex = String(node.attrs.latex ?? "");
  paintKatex(dom, latex, false);

  dom.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openMathEditor(editor, getPos);
  });

  return {
    dom,
    ignoreMutation: () => true,
    update: (updated: ProseMirrorNode) => {
      if (updated.type !== node.type) return false;
      const next = String(updated.attrs.latex ?? "");
      if (next !== latex) {
        latex = next;
        paintKatex(dom, latex, false);
      }
      return true;
    },
  };
}

function readMathLayout(attrs: Record<string, unknown>) {
  return {
    align: parseBlockAlign(attrs.align, "center"),
    offset: clampBlockOffset(Number(attrs.offset) || 0),
    ratio: clampOffsetRatio(attrs.offsetRatio),
  };
}

/** Display equation: own line, drag left/right to position it, up/down to move it between lines. */
function createDisplayMathView({ node, editor, getPos }: MathNodeViewProps) {
  const wrapper = document.createElement("div");
  wrapper.className = "qb-math-block-view";
  wrapper.contentEditable = "false";

  const frame = document.createElement("div");
  frame.className = "qb-math-frame";
  frame.setAttribute("data-block-frame", "true");
  frame.title = "Drag to move · double-click to edit";

  const math = document.createElement("div");
  math.className = "qb-math qb-math-display";
  math.setAttribute("data-display", "true");

  const hint = document.createElement("div");
  hint.className = "qb-math-block-hint";
  hint.textContent = "Drag to move · Double-click to edit";

  frame.append(math, hint);
  wrapper.appendChild(frame);

  let latex = String(node.attrs.latex ?? "");
  paintKatex(math, latex, true);

  const applyLayout = (attrs: Record<string, unknown>) => {
    const { align, offset, ratio } = readMathLayout(attrs);
    applyBlockFrameLayout(frame, align, offset, null, ratio);
  };
  applyLayout(node.attrs);

  const mover = createBlockMover({ editor, getPos, wrapper, frame, nodeName: "mathDisplay" });

  frame.addEventListener("pointerdown", (event) => mover.start(event, frame));
  frame.addEventListener("dragstart", (event) => event.preventDefault());
  frame.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openMathEditor(editor, getPos);
  });

  return {
    dom: wrapper,
    stopEvent: (event: Event) => {
      const target = event.target as HTMLElement | null;
      return Boolean(
        target?.closest(".qb-math-frame") &&
          /^(pointer|mouse|drag|click|dblclick)/.test(event.type),
      );
    },
    ignoreMutation: (mutation: { type: string }) => mutation.type !== "selection",
    update: (updated: ProseMirrorNode) => {
      if (updated.type !== node.type) return false;
      const next = String(updated.attrs.latex ?? "");
      if (next !== latex) {
        latex = next;
        paintKatex(math, latex, true);
      }
      if (!mover.isActive()) applyLayout(updated.attrs);
      return true;
    },
    destroy: () => mover.destroy(),
  };
}

/** Inline KaTeX node stored as `<span class="qb-math" data-latex="...">`. */
export const MathInline = Node.create<MathInlineOptions>({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

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
    return createInlineMathView;
  },
});

/** Display equation on its own line — centered by default, movable to any position. */
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
      align: {
        default: "center" as BlockAlign,
        parseHTML: (element) => {
          const el = element as HTMLElement;
          const data = el.getAttribute("data-align");
          if (data) return parseBlockAlign(data, "center");
          const textAlign = el.style.textAlign;
          return textAlign === "left" || textAlign === "right" ? textAlign : "center";
        },
        renderHTML: (attributes) => {
          const { align, offset, ratio } = readMathLayout(attributes);
          if (align === "center") return {};
          if (align === "custom") {
            return {
              "data-align": "custom",
              "data-offset": String(offset),
              ...(ratio !== null ? { "data-offset-ratio": String(ratio) } : {}),
              style: "text-align: left",
            };
          }
          return { "data-align": align, style: `text-align: ${align}` };
        },
      },
      offset: {
        default: 0,
        parseHTML: (element) =>
          clampBlockOffset(Number.parseFloat((element as HTMLElement).getAttribute("data-offset") ?? "")),
        renderHTML: () => ({}),
      },
      offsetRatio: {
        default: null,
        parseHTML: (element) => parseOffsetRatioFromElement(element as HTMLElement),
        renderHTML: () => ({}),
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      ArrowLeft: () => nudgeSelectedBlock(this.editor, this.name, -BLOCK_NUDGE_STEP),
      ArrowRight: () => nudgeSelectedBlock(this.editor, this.name, BLOCK_NUDGE_STEP),
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
    return createDisplayMathView;
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

  // Editing a display equation in place keeps its position.
  if (display && editor.isActive("mathDisplay")) {
    return editor.chain().focus().updateAttributes("mathDisplay", { latex: trimmed }).run();
  }
  if (!display && editor.isActive("mathInline")) {
    return editor.chain().focus().updateAttributes("mathInline", { latex: trimmed }).run();
  }

  const chain = editor.chain().focus();
  if (editor.isActive("mathInline") || editor.isActive("mathDisplay")) {
    chain.deleteSelection();
  }
  return chain.insertContent({ type, attrs: { latex: trimmed } }).run();
}

/** Inline when the cursor is inside a line that already has text; own line otherwise. */
export function suggestMathDisplayMode(editor: Editor): boolean {
  const { $from } = editor.state.selection;
  const parent = $from.parent;
  return !(parent.isTextblock && parent.textContent.trim().length > 0);
}

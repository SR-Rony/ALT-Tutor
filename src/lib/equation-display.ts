import katex from "katex";
import { looksLikeHtml, richTextToPlain } from "@/lib/rich-text";

const WORD = "[A-Za-z][A-Za-z\\-]*(?:\\s+[A-Za-z][A-Za-z\\-]*){0,4}";
/** Matches exam-style equations: acceleration = force / mass */
const SLASH_EQUATION_RE = new RegExp(
  `^(${WORD})\\s*=\\s*(${WORD})\\s*\\/\\s*(${WORD})$`,
  "i"
);
const SLASH_EQUATION_GLOBAL_RE = new RegExp(
  `(${WORD})\\s*=\\s*(${WORD})\\s*\\/\\s*(${WORD})`,
  "gi"
);

function escapeLatexText(text: string): string {
  return text
    .trim()
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([{}$&#^_%])/g, "\\$1");
}

function latexRoman(text: string): string {
  return `\\mathrm{${escapeLatexText(text)}}`;
}

/** Build upright stacked fraction equation for Cambridge-style MCQ options. */
export function slashEquationToLatex(lhs: string, num: string, den: string): string {
  return `${latexRoman(lhs)} = \\dfrac{${latexRoman(num)}}{${latexRoman(den)}}`;
}

export function tryParseSlashEquation(text: string): string | null {
  const match = text.replace(/\s+/g, " ").trim().match(SLASH_EQUATION_RE);
  if (!match) return null;
  return slashEquationToLatex(match[1], match[2], match[3]);
}

function renderEquationKatex(latex: string): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
    });
  } catch {
    return latex;
  }
}

/**
 * If the whole option is a slash equation (optionally italic/bold wrapped),
 * replace with a KaTeX stacked fraction — matches printed paper layout.
 */
export function enhanceSlashEquationsHtml(html: string): string {
  if (!html?.trim()) return html;
  if (typeof window === "undefined") return html;

  const plain = richTextToPlain(html);
  const wholeLatex = tryParseSlashEquation(plain);
  if (wholeLatex) {
    const rendered = renderEquationKatex(wholeLatex);
    return `<span class="qb-math qb-math-equation" data-latex="${escapeAttr(wholeLatex)}">${rendered}</span>`;
  }

  if (!looksLikeHtml(html) || !html.includes("/")) return html;

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node = walker.nextNode();
    while (node) {
      textNodes.push(node as Text);
      node = walker.nextNode();
    }

    for (const textNode of textNodes) {
      const value = textNode.nodeValue ?? "";
      if (!value.includes("/") || !value.includes("=")) continue;
      if (textNode.parentElement?.closest("[data-latex], .qb-math, .katex")) continue;

      SLASH_EQUATION_GLOBAL_RE.lastIndex = 0;
      if (!SLASH_EQUATION_GLOBAL_RE.test(value)) continue;
      SLASH_EQUATION_GLOBAL_RE.lastIndex = 0;

      const frag = doc.createDocumentFragment();
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = SLASH_EQUATION_GLOBAL_RE.exec(value)) !== null) {
        if (match.index > lastIndex) {
          frag.appendChild(doc.createTextNode(value.slice(lastIndex, match.index)));
        }
        const latex = slashEquationToLatex(match[1], match[2], match[3]);
        const span = doc.createElement("span");
        span.className = "qb-math qb-math-equation";
        span.setAttribute("data-latex", latex);
        span.innerHTML = renderEquationKatex(latex);
        frag.appendChild(span);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < value.length) {
        frag.appendChild(doc.createTextNode(value.slice(lastIndex)));
      }
      textNode.parentNode?.replaceChild(frag, textNode);
    }

    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

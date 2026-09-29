import { looksLikeHtml, richTextToPlain } from "@/lib/rich-text";

export type QuestionTitle = {
  /** Inline-only HTML (text, sup/sub, bold/italic, inline math) for a compact title. */
  html: string;
  /** Plain text version, math as LaTeX — for tooltips / search. */
  plain: string;
  /** Source code written in the prompt, e.g. `w17_v1_Q9` from "[w17_v1_Q9]". */
  sourceTag: string | null;
};

const SOURCE_TAG_RE = /\[\s*([A-Za-z0-9]+(?:_[A-Za-z0-9]+)+)\s*\]/;
const FIGURE_LABEL_RE = /^(?:fig(?:ure)?|table|diagram|graph)\.?\s*\d+(?:\.\d+)*[a-z]?\.?$/i;
const BLOCK_TAGS = new Set([
  "P", "DIV", "LI", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "TR",
]);
const KEEP_TAGS = new Set(["SUP", "SUB", "STRONG", "B", "EM", "I", "U", "S"]);
const DROP_SELECTOR = "img, figure, table, video, iframe, svg, hr, script, style";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(text: string) {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

function collapse(text: string) {
  return text.replace(/[\s\u00A0]+/g, " ").trim();
}

function splitSourceTag(html: string, plain: string) {
  const match = plain.match(SOURCE_TAG_RE);
  if (!match) return { html, plain, sourceTag: null };
  return {
    html: collapse(html.replace(SOURCE_TAG_RE, " ")),
    plain: collapse(plain.replace(SOURCE_TAG_RE, " ")),
    sourceTag: match[1],
  };
}

type Segment = { html: string; plain: string };

function serialize(node: Node, current: Segment, segments: Segment[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    current.html += escapeHtml(text);
    current.plain += text;
    return current;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return current;
  const el = node as HTMLElement;

  if (el.hasAttribute("data-latex")) {
    const latex = el.getAttribute("data-latex") ?? "";
    current.html += ` <span class="qb-math" data-latex="${escapeAttr(latex)}"></span> `;
    current.plain += ` ${latex} `;
    return current;
  }
  if (el.tagName === "BR") {
    segments.push(current);
    return { html: "", plain: "" };
  }

  const isBlock = BLOCK_TAGS.has(el.tagName);
  if (isBlock) {
    segments.push(current);
    current = { html: "", plain: "" };
  }
  const keep = KEEP_TAGS.has(el.tagName);
  const tag = el.tagName.toLowerCase();
  if (keep) current.html += `<${tag}>`;
  for (const child of Array.from(el.childNodes)) {
    current = serialize(child, current, segments);
  }
  if (keep) current.html += `</${tag}>`;
  if (isBlock) {
    segments.push(current);
    current = { html: "", plain: "" };
  }
  return current;
}

/**
 * Compact, readable title for question pickers: one flowing paragraph without
 * images, layout spacing, or stray figure labels, keeping sup/sub and math.
 */
export function questionTitle(prompt: string | null | undefined): QuestionTitle {
  const raw = prompt ?? "";
  if (!raw.trim()) return { html: "", plain: "", sourceTag: null };

  if (typeof window === "undefined" || !looksLikeHtml(raw)) {
    const plain = collapse(
      richTextToPlain(raw)
        .split("\n")
        .filter((line) => !FIGURE_LABEL_RE.test(line.trim()))
        .join(" ")
    );
    return splitSourceTag(escapeHtml(plain), plain);
  }

  const doc = new DOMParser().parseFromString(raw, "text/html");
  doc.body.querySelectorAll(DROP_SELECTOR).forEach((el) => el.remove());

  const segments: Segment[] = [];
  const last = serialize(doc.body, { html: "", plain: "" }, segments);
  segments.push(last);

  const kept = segments
    .map((s) => ({ html: collapse(s.html), plain: collapse(s.plain) }))
    .filter((s) => s.plain && !FIGURE_LABEL_RE.test(s.plain));

  return splitSourceTag(
    kept.map((s) => s.html).join(" "),
    kept.map((s) => s.plain).join(" ")
  );
}

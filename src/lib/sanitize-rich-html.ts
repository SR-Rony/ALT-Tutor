import DOMPurify from "dompurify";

const TEXT_ALIGN_RE =
  /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*;?/i;

const PADDING_LEFT_RE = /(?:^|;)\s*padding-left\s*:\s*(\d+(?:\.\d+)?)px\s*;?/i;
const MARGIN_LEFT_RE = /(?:^|;)\s*margin-left\s*:\s*(\d+(?:\.\d+)?)px\s*;?/i;
const FONT_SIZE_RE = /(?:^|;)\s*font-size\s*:\s*([^;]+)\s*;?/i;

const IMG_BLOCK_STYLE =
  /display\s*:\s*block\s*;?\s*(margin-left\s*:\s*auto\s*;?\s*margin-right\s*:\s*(auto|0)\s*;?)?/i;

const IMG_CUSTOM_MARGIN_RE = /margin-left\s*:\s*(\d+(?:\.\d+)?)px/i;
const IMG_MARGIN_LEFT_AUTO_RE = /margin-left\s*:\s*auto/i;
const MAX_IMAGE_OFFSET = 720;

function clampImageOffset(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_IMAGE_OFFSET, Math.round(value)));
}

const INDENT_STEP_PX = 24;
const MAX_INDENT = 8;

function normalizeAllowedFontSize(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)(px|pt|rem|em)?$/);
  if (!match) return null;
  const n = Number.parseFloat(match[1]!);
  if (!Number.isFinite(n) || n < 10 || n > 32) return null;
  const unit = match[2] || "px";
  if (unit === "px") return `${Math.round(n)}px`;
  if (unit === "pt") return `${Math.round(n * 1.333)}px`;
  if (unit === "rem" || unit === "em") return `${Math.round(n * 16)}px`;
  return null;
}

let styleHookRegistered = false;

function registerStyleHook() {
  if (styleHookRegistered || typeof window === "undefined") return;
  styleHookRegistered = true;
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    if (data.attrName !== "style") return;
    const el = node as Element;
    if (el.tagName === "IMG") {
      const customMatch = data.attrValue.match(IMG_CUSTOM_MARGIN_RE);
      if (customMatch && !IMG_MARGIN_LEFT_AUTO_RE.test(data.attrValue)) {
        const offset = clampImageOffset(Number.parseFloat(customMatch[1] ?? "0"));
        data.attrValue = `display: block; margin-left: ${offset}px; margin-right: auto;`;
        return;
      }
      if (IMG_BLOCK_STYLE.test(data.attrValue)) {
        const isCenter = /margin-right\s*:\s*auto/i.test(data.attrValue);
        const isRight = /margin-right\s*:\s*0/i.test(data.attrValue);
        if (isCenter) {
          data.attrValue = "display: block; margin-left: auto; margin-right: auto;";
          return;
        }
        if (isRight) {
          data.attrValue = "display: block; margin-left: auto; margin-right: 0;";
          return;
        }
      }
    }

    const parts: string[] = [];
    const alignMatch = data.attrValue.match(TEXT_ALIGN_RE);
    if (alignMatch) {
      parts.push(`text-align: ${alignMatch[1].toLowerCase()}`);
    }

    const fontSize = normalizeAllowedFontSize(data.attrValue.match(FONT_SIZE_RE)?.[1]);
    if (fontSize) {
      parts.push(`font-size: ${fontSize}`);
      if (el instanceof HTMLElement) {
        el.setAttribute("data-font-size", fontSize);
      }
    }

    const padMatch = data.attrValue.match(PADDING_LEFT_RE);
    const marginMatch = data.attrValue.match(MARGIN_LEFT_RE);
    const indentPx = Number.parseFloat(padMatch?.[1] ?? marginMatch?.[1] ?? "");
    if (Number.isFinite(indentPx) && indentPx > 0) {
      const level = Math.min(MAX_INDENT, Math.max(1, Math.round(indentPx / INDENT_STEP_PX)));
      parts.push(`padding-left: ${level * INDENT_STEP_PX}px`);
      if (el instanceof HTMLElement) {
        el.setAttribute("data-indent", String(level));
        el.classList.add(`qb-indent-${level}`);
      }
    }

    if (parts.length > 0) {
      data.attrValue = parts.join("; ");
      return;
    }
    data.keepAttr = false;
  });
}

function parseImageOffset(img: Element): number {
  const data = img.getAttribute("data-offset");
  if (data != null && data !== "") {
    const n = Number.parseFloat(data);
    if (Number.isFinite(n)) return clampImageOffset(n);
  }
  const style = img.getAttribute("style") ?? "";
  if (IMG_MARGIN_LEFT_AUTO_RE.test(style)) return 0;
  const match = style.match(IMG_CUSTOM_MARGIN_RE);
  if (match?.[1]) return clampImageOffset(Number.parseFloat(match[1]));
  return 0;
}

function parseOffsetRatio(el: Element): number | null {
  const raw = el.getAttribute("data-offset-ratio");
  if (raw == null || raw === "") return null;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.max(0, Math.min(1, n)) * 10000) / 10000;
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 10000) / 100}%`;
}

function applyImageCustom(img: Element, offset: number, width: number | null) {
  const px = clampImageOffset(offset);
  const ratio = parseOffsetRatio(img);
  img.classList.remove(
    "qb-img-align-left",
    "qb-img-align-center",
    "qb-img-align-right",
    "qb-img-align-custom"
  );
  img.classList.add("qb-inline-image", "qb-img-align-custom");
  img.setAttribute("data-align", "custom");
  img.setAttribute("data-offset", String(px));

  if (ratio !== null) {
    // left % = container width, translate % = image width → ratio × free space at any width.
    const percent = formatPercent(ratio);
    img.setAttribute("data-offset-ratio", String(ratio));
    img.setAttribute(
      "style",
      `display: block; position: relative; left: ${percent}; transform: translateX(-${percent}); margin-left: 0; margin-right: auto;`
    );
    return;
  }

  // Older content only has a px offset: keep it on wide screens, never push the image out.
  const margin = width
    ? `max(0px, min(${px}px, calc(100% - ${width}px)))`
    : `max(0px, min(${px}px, calc(100% - 120px)))`;
  const maxWidth = width ? "" : ` max-width: calc(100% - ${margin});`;
  img.setAttribute(
    "style",
    `display: block; margin-left: ${margin}; margin-right: auto;${maxWidth}`
  );
}

function applyImageAlign(img: Element, align: "left" | "center" | "right") {
  img.classList.remove(
    "qb-img-align-left",
    "qb-img-align-center",
    "qb-img-align-right",
    "qb-img-align-custom"
  );
  img.classList.add("qb-inline-image");
  img.removeAttribute("data-offset");
  img.setAttribute("data-align", align);
  if (align === "center") {
    img.classList.add("qb-img-align-center");
    img.setAttribute("style", "display: block; margin-left: auto; margin-right: auto;");
    return;
  }
  if (align === "right") {
    img.classList.add("qb-img-align-right");
    img.setAttribute("style", "display: block; margin-left: auto; margin-right: 0;");
    return;
  }
  img.classList.add("qb-img-align-left");
  img.removeAttribute("style");
}

const MIN_IMAGE_WIDTH = 80;
const MAX_IMAGE_WIDTH = 1200;

function parseImageWidth(img: Element): number | null {
  const raw = img.getAttribute("data-width") ?? img.getAttribute("width");
  const n = Number.parseFloat(raw ?? "");
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.max(MIN_IMAGE_WIDTH, Math.min(MAX_IMAGE_WIDTH, Math.round(n)));
}

/** Re-append the resized width after alignment rewrote the style attribute. */
function applyImageWidth(img: Element, width: number | null) {
  if (width == null) return;
  img.setAttribute("data-width", String(width));
  img.setAttribute("width", String(width));
  const base = (img.getAttribute("style") ?? "").trim().replace(/;?\s*$/, "");
  const widthStyle = /max-width\s*:/i.test(base)
    ? `width: ${width}px; height: auto;`
    : `width: ${width}px; max-width: 100%; height: auto;`;
  img.setAttribute("style", base ? `${base}; ${widthStyle}` : widthStyle);
}

function applyParagraphIndent(el: Element) {
  const dataIndent = el.getAttribute("data-indent");
  let level = Number.parseInt(dataIndent ?? "", 10);
  if (!Number.isFinite(level) || level <= 0) {
    const classMatch = Array.from(el.classList)
      .map((c) => c.match(/^qb-indent-(\d+)$/))
      .find(Boolean);
    level = classMatch?.[1] ? Number.parseInt(classMatch[1], 10) : 0;
  }
  if (!Number.isFinite(level) || level <= 0) {
    const style = el.getAttribute("style") ?? "";
    const px = Number.parseFloat(
      style.match(/padding-left\s*:\s*(\d+(?:\.\d+)?)px/i)?.[1] ??
        style.match(/margin-left\s*:\s*(\d+(?:\.\d+)?)px/i)?.[1] ??
        ""
    );
    if (Number.isFinite(px) && px > 0) {
      level = Math.round(px / INDENT_STEP_PX);
    }
  }
  if (!Number.isFinite(level) || level <= 0) return;

  level = Math.min(MAX_INDENT, Math.max(1, level));
  el.setAttribute("data-indent", String(level));
  for (let i = 1; i <= MAX_INDENT; i += 1) {
    el.classList.remove(`qb-indent-${i}`);
  }
  el.classList.add(`qb-indent-${level}`);

  const style = el.getAttribute("style") ?? "";
  const alignMatch = style.match(TEXT_ALIGN_RE);
  // --qb-indent-scale lets narrow screens shrink deep indents without losing the hierarchy.
  const padding = `padding-left: calc(${level * INDENT_STEP_PX}px * var(--qb-indent-scale, 1))`;
  const nextStyle = alignMatch
    ? `text-align: ${alignMatch[1].toLowerCase()}; ${padding}`
    : padding;
  el.setAttribute("style", nextStyle);
}

const PUSH_RIGHT_MIN_GAP = 8;
const PUSH_RIGHT_MAX_TAG = 32;
const TRAILING_TOKEN_RE = /(\S+(?:[ \u00A0]\S+){0,3})[ \u00A0]*$/;
const BRACKET_TAG_RE = /^(?:\[[^\]]*\]|\([^)]*\))$/;
const TRAILING_GAP_RE = /[ \u00A0]*$/;

/**
 * Authors push reference/mark tags such as "[w17_v1_Q9]" or "[2]" to the right edge
 * with long runs of spaces. That only lines up at the editor's width, so float the tag
 * to the right edge instead — same look on desktop, no broken wrapping on phones.
 */
function pushTrailingTagRight(block: Element) {
  const doc = block.ownerDocument;
  const walker = doc.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    texts.push(node as Text);
  }

  let lastIndex = texts.length - 1;
  while (lastIndex >= 0 && !/\S/.test(texts[lastIndex]!.data)) lastIndex -= 1;
  if (lastIndex < 0) return;

  const last = texts[lastIndex]!;
  if (last.parentElement?.closest("[data-latex], .qb-math, .katex, a, sup, sub")) return;

  const match = last.data.match(TRAILING_TOKEN_RE);
  if (!match || match.index === undefined) return;
  const tag = match[1]!;
  if (tag.length > PUSH_RIGHT_MAX_TAG || !BRACKET_TAG_RE.test(tag)) return;

  const before = last.data.slice(0, match.index);
  const ownGap = before.match(TRAILING_GAP_RE)![0].length;
  const trims: { node: Text; count: number }[] = [];
  let gap = ownGap;
  let reachedNodeStart = ownGap === before.length;

  for (let i = lastIndex - 1; reachedNodeStart && i >= 0; i -= 1) {
    const node = texts[i]!;
    if (node.parentElement?.closest("[data-latex], .qb-math, .katex")) break;
    const count = node.data.match(TRAILING_GAP_RE)![0].length;
    if (count > 0) trims.push({ node, count });
    gap += count;
    reachedNodeStart = count === node.data.length;
  }

  if (gap < PUSH_RIGHT_MIN_GAP) return;

  last.data = before.slice(0, before.length - ownGap);
  for (const { node, count } of trims) {
    node.data = node.data.slice(0, node.data.length - count);
  }

  const span = doc.createElement("span");
  span.className = "qb-push-right";
  span.textContent = tag;
  last.parentNode?.insertBefore(span, last.nextSibling);
  block.classList.add("qb-has-push-right");
}

/**
 * Keep saved alignment only — never force center.
 * Parent paragraph text-align is copied onto the image when explicit.
 */
export function normalizeRichHtmlLayout(html: string): string {
  if (typeof window === "undefined") return html;
  if (
    !html.includes("<img") &&
    !html.includes("data-indent") &&
    !html.includes("qb-indent-") &&
    !html.includes("padding-left") &&
    !html.includes("data-align") &&
    !html.includes("&nbsp;") &&
    !html.includes("<table")
  ) {
    return html;
  }
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");

    doc.querySelectorAll("p, h2, h3, h1, h4, li").forEach((el) => {
      applyParagraphIndent(el);
      if (el.tagName !== "LI" && !el.closest("td, th")) pushTrailingTagRight(el);
    });

    // Wide tables scroll sideways on small screens instead of overflowing the card.
    doc.querySelectorAll("table").forEach((table) => {
      let wrapper = table.parentElement;
      if (!wrapper?.classList.contains("qb-table-scroll")) {
        wrapper = doc.createElement("div");
        wrapper.className = "qb-table-scroll";
        table.replaceWith(wrapper);
        wrapper.appendChild(table);
      }
      applyTableLayout(wrapper, table);
    });

    doc.querySelectorAll("img").forEach((img) => {
      const width = parseImageWidth(img);
      applyImageLayout(img, width);
      applyImageWidth(img, width);
    });

    doc.querySelectorAll('.qb-math-display, [data-display="true"]').forEach((el) => {
      applyMathDisplayLayout(el);
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

/**
 * Tables sit left unless the editor saved another position. The free space beside the
 * table is split ratio : (1 - ratio), so placement matches at every width, and a table
 * wider than the screen still starts at the left edge and scrolls.
 */
function applyTableLayout(wrapper: Element, table: Element) {
  const align = table.getAttribute("data-align");
  let ratio: number | null = null;
  if (align === "center") ratio = 0.5;
  else if (align === "right") ratio = 1;
  else if (align === "custom") ratio = parseOffsetRatio(table);

  if (align === "custom" && ratio === null) {
    const px = clampImageOffset(Number.parseFloat(table.getAttribute("data-offset") ?? ""));
    wrapper.setAttribute("style", `padding-left: min(${px}px, 40%)`);
    table.removeAttribute("style");
    return;
  }
  if (!ratio) {
    wrapper.removeAttribute("style");
    table.removeAttribute("style");
    return;
  }
  const left = Math.round(ratio * 10000) / 10000;
  const right = Math.round((1 - ratio) * 10000) / 10000;
  wrapper.setAttribute(
    "style",
    `display: grid; grid-template-columns: minmax(0, ${left}fr) auto minmax(0, ${right}fr)`
  );
  table.setAttribute("style", "grid-column: 2");
}

/** Display equations: centered unless the editor saved another position. */
function applyMathDisplayLayout(el: Element) {
  const align = el.getAttribute("data-align");
  if (align !== "left" && align !== "right" && align !== "center" && align !== "custom") return;

  // The generic style hook may have turned padding into indent levels; the equation owns its offset.
  el.removeAttribute("data-indent");
  for (let i = 1; i <= MAX_INDENT; i += 1) {
    el.classList.remove(`qb-indent-${i}`);
  }

  if (align === "custom") {
    const px = clampImageOffset(Number.parseFloat(el.getAttribute("data-offset") ?? ""));
    const ratio = parseOffsetRatio(el);
    el.setAttribute("data-offset", String(px));
    if (ratio !== null) {
      // Free space is split ratio : (1 - ratio) around the equation; wide equations still scroll.
      el.setAttribute("data-offset-ratio", String(ratio));
      const left = Math.round(ratio * 10000) / 10000;
      const right = Math.round((1 - ratio) * 10000) / 10000;
      el.setAttribute(
        "style",
        `display: grid; grid-template-columns: minmax(0, ${left}fr) auto minmax(0, ${right}fr); text-align: left`
      );
      return;
    }
    el.setAttribute("style", `text-align: left; padding-left: min(${px}px, 40%)`);
    return;
  }

  el.removeAttribute("data-offset");
  el.removeAttribute("data-offset-ratio");
  el.setAttribute("style", `text-align: ${align}`);
}

function applyImageLayout(img: Element, width: number | null) {
  const dataAlign = img.getAttribute("data-align");
  if (
    dataAlign === "custom" ||
    img.classList.contains("qb-img-align-custom") ||
    parseImageOffset(img) > 0
  ) {
    applyImageCustom(img, parseImageOffset(img), width);
    return;
  }
  if (dataAlign === "left" || dataAlign === "center" || dataAlign === "right") {
    applyImageAlign(img, dataAlign);
    return;
  }
  if (img.classList.contains("qb-img-align-center")) {
    applyImageAlign(img, "center");
    return;
  }
  if (img.classList.contains("qb-img-align-right")) {
    applyImageAlign(img, "right");
    return;
  }
  if (img.classList.contains("qb-img-align-left")) {
    applyImageAlign(img, "left");
    return;
  }

  const parent = img.parentElement;
  if (!parent) return;
  const parentStyle = parent.getAttribute("style") ?? "";
  const parentAlign =
    parent.getAttribute("data-text-align") ??
    parentStyle.match(/text-align\s*:\s*(left|center|right)/i)?.[1]?.toLowerCase();
  if (parentAlign === "center" || parentAlign === "right" || parentAlign === "left") {
    applyImageAlign(img, parentAlign);
  }
}

/** Sanitize question-bank HTML while preserving safe text alignment and indent. */
export function sanitizeRichHtml(html: string): string {
  registerStyleHook();
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["img", "span", "sup", "sub", "div"],
    ADD_ATTR: [
      "src",
      "alt",
      "title",
      "class",
      "data-latex",
      "data-display",
      "data-math-size",
      "data-math-bold",
      "data-tab",
      "data-align",
      "data-offset",
      "data-offset-ratio",
      "data-width",
      "data-text-align",
      "data-indent",
      "data-font-size",
      "width",
      "height",
      "style",
    ],
  });
  return normalizeRichHtmlLayout(clean);
}

export function prepareRichHtmlForDisplay(html: string): string {
  if (!html?.trim()) return "";
  return sanitizeRichHtml(html);
}

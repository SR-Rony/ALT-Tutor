import DOMPurify from "dompurify";

const TEXT_ALIGN_RE =
  /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*;?/i;

const PADDING_LEFT_RE = /(?:^|;)\s*padding-left\s*:\s*(\d+(?:\.\d+)?)px\s*;?/i;
const MARGIN_LEFT_RE = /(?:^|;)\s*margin-left\s*:\s*(\d+(?:\.\d+)?)px\s*;?/i;

const IMG_BLOCK_STYLE =
  /display\s*:\s*block\s*;?\s*(margin-left\s*:\s*auto\s*;?\s*margin-right\s*:\s*(auto|0)\s*;?)?/i;

const INDENT_STEP_PX = 24;
const MAX_INDENT = 8;

let styleHookRegistered = false;

function registerStyleHook() {
  if (styleHookRegistered || typeof window === "undefined") return;
  styleHookRegistered = true;
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    if (data.attrName !== "style") return;
    const el = node as Element;
    if (el.tagName === "IMG" && IMG_BLOCK_STYLE.test(data.attrValue)) {
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

    const parts: string[] = [];
    const alignMatch = data.attrValue.match(TEXT_ALIGN_RE);
    if (alignMatch) {
      parts.push(`text-align: ${alignMatch[1].toLowerCase()}`);
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

function applyImageAlign(img: Element, align: "left" | "center" | "right") {
  img.classList.remove("qb-img-align-left", "qb-img-align-center", "qb-img-align-right");
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
  const nextStyle = alignMatch
    ? `text-align: ${alignMatch[1].toLowerCase()}; padding-left: ${level * INDENT_STEP_PX}px`
    : `padding-left: ${level * INDENT_STEP_PX}px`;
  el.setAttribute("style", nextStyle);
}

/**
 * Keep saved alignment only — never force center.
 * Parent paragraph text-align is copied onto the image when explicit.
 */
export function normalizeRichHtmlLayout(html: string): string {
  if (typeof window === "undefined") return html;
  if (!html.includes("<img") && !html.includes("data-indent") && !html.includes("qb-indent-") && !html.includes("padding-left")) {
    return html;
  }
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");

    doc.querySelectorAll("p, h2, h3, h1, h4, li").forEach((el) => {
      applyParagraphIndent(el);
    });

    doc.querySelectorAll("img").forEach((img) => {
      const dataAlign = img.getAttribute("data-align");
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
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

/** Sanitize question-bank HTML while preserving safe text alignment and indent. */
export function sanitizeRichHtml(html: string): string {
  registerStyleHook();
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["img", "span", "sup", "sub"],
    ADD_ATTR: [
      "src",
      "alt",
      "title",
      "class",
      "data-latex",
      "data-align",
      "data-text-align",
      "data-indent",
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

import DOMPurify from "dompurify";

const TEXT_ALIGN_RE =
  /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*;?/i;

const IMG_BLOCK_STYLE =
  /display\s*:\s*block\s*;?\s*(margin-left\s*:\s*auto\s*;?\s*margin-right\s*:\s*(auto|0)\s*;?)?/i;

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
    const match = data.attrValue.match(TEXT_ALIGN_RE);
    if (match) {
      data.attrValue = `text-align: ${match[1].toLowerCase()}`;
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

/**
 * Keep saved alignment only — never force center.
 * Parent paragraph text-align is copied onto the image when explicit.
 */
export function normalizeRichHtmlLayout(html: string): string {
  if (typeof window === "undefined" || !html.includes("<img")) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
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
      // No explicit align → leave as-is (default left in CSS)
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

/** Sanitize question-bank HTML while preserving safe text alignment. */
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

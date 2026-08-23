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

function isDiagramStyleImage(img: Element): boolean {
  const parent = img.parentElement;
  if (!parent) return false;
  if (parent.tagName === "P") {
    return img === parent.querySelector("img:only-child");
  }
  const children = [...parent.children];
  const index = children.indexOf(img);
  if (index === -1) return false;
  const hasParagraphBefore = children.slice(0, index).some((node) => node.tagName === "P");
  const hasParagraphAfter = children.slice(index + 1).some((node) => node.tagName === "P");
  return hasParagraphBefore && hasParagraphAfter;
}

/** Copy paragraph / wrapper alignment onto images saved before align classes existed. */
export function normalizeRichHtmlLayout(html: string): string {
  if (typeof window === "undefined" || !html.includes("<img")) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("img").forEach((img) => {
      if (
        img.classList.contains("qb-img-align-right") ||
        img.getAttribute("data-align") === "right"
      ) {
        return;
      }
      if (
        img.classList.contains("qb-img-align-center") ||
        img.getAttribute("data-align") === "center"
      ) {
        return;
      }

      const diagram = isDiagramStyleImage(img);
      if (img.getAttribute("data-align") === "left" && !diagram) return;

      const parent = img.parentElement;
      if (!parent) return;
      const parentStyle = parent.getAttribute("style") ?? "";
      const parentAlign =
        parent.getAttribute("data-text-align") ??
        parentStyle.match(/text-align\s*:\s*(left|center|right)/i)?.[1]?.toLowerCase();
      if (parentAlign === "center" || diagram) {
        applyImageAlign(img, "center");
        return;
      }
      if (parentAlign === "right") {
        applyImageAlign(img, "right");
      }
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

function applyImageAlign(img: Element, align: "center" | "right") {
  img.classList.remove("qb-img-align-left", "qb-img-align-center", "qb-img-align-right");
  img.classList.add(align === "center" ? "qb-img-align-center" : "qb-img-align-right");
  img.setAttribute("data-align", align);
  if (align === "center") {
    img.setAttribute("style", "display: block; margin-left: auto; margin-right: auto;");
  } else {
    img.setAttribute("style", "display: block; margin-left: auto; margin-right: 0;");
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

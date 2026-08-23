import { siteConfig } from "@/config";
import { isRichTextEmpty, looksLikeHtml } from "@/lib/rich-text";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";
import { hydrateKatexHtml } from "@/lib/tiptap-math";

type ExportQuestion = {
  id?: string;
  paper?: string | null;
  prompt: string;
  body?: string | null;
  diagramUrl?: string | null;
  difficulty?: string | null;
  marks?: number | null;
  options?: string[];
  questionType?: string | null;
};

type ExportArgs = {
  title: string;
  subtitle?: string;
  /** Blank ruled lines under each question for handwritten answers (written exams). */
  includeAnswerSpace?: boolean;
  questions: ExportQuestion[];
};

const ANSWER_LINE_COUNT = 3;
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Opens a printable window with a branded question paper (print → Save as PDF). */
export function downloadQuestionPaperPdf({
  title,
  subtitle,
  questions,
  includeAnswerSpace = false,
}: ExportArgs) {
  const origin = typeof window !== "undefined" ? window.location.origin : siteConfig.url;
  const logoUrl = `${origin}${siteConfig.logo.startsWith("/") ? siteConfig.logo : `/${siteConfig.logo}`}`;
  const generatedAt = new Date().toLocaleString();
  const paperLabel = uniquePapersLabel(questions);
  const showPaperMeta = questions.some((q) => Boolean(q.paper));

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(siteConfig.name)} — ${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.css" crossorigin="anonymous" />
  <style>
    :root {
      --ink: #12203a;
      --muted: #5b6b86;
      --line: #d7e3f4;
      --brand: #1877f2;
      --brand-soft: #e8f1fd;
    }

    * { box-sizing: border-box; }

    @page {
      size: A4;
      margin: 16mm 12mm 16mm 12mm;
    }

    html, body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }

    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: var(--ink);
      margin: 0;
      padding: 0;
      background: #fff;
      line-height: 1.5;
      position: relative;
    }

    .sheet {
      max-width: 800px;
      margin: 0 auto;
      padding: 1.25rem 1.5rem 2rem;
      position: relative;
      z-index: 1;
    }

    .watermark {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .watermark img {
      width: min(72vw, 520px);
      height: auto;
      max-height: 55vh;
      object-fit: contain;
      opacity: 0.07;
      filter: grayscale(0.15);
    }

    .brand-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-bottom: 0.95rem;
      border-bottom: 2.5px solid var(--brand);
      margin-bottom: 1.15rem;
    }

    .brand-left {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      min-width: 0;
    }

    .brand-logo-wrap {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 72px;
      width: 72px;
      border-radius: 14px;
      overflow: hidden;
      background: #0a0a0a;
      box-shadow: 0 1px 0 rgba(18, 32, 58, 0.08);
    }

    .brand-logo {
      height: 72px;
      width: 72px;
      object-fit: contain;
      display: block;
    }

    .brand-text { min-width: 0; }

    .brand-name {
      font-size: 1.45rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--ink);
      line-height: 1.1;
    }

    .brand-tagline {
      font-size: 0.78rem;
      color: var(--muted);
      margin-top: 0.2rem;
      font-weight: 500;
    }

    .brand-meta {
      text-align: right;
      font-size: 0.72rem;
      color: var(--muted);
      line-height: 1.45;
      max-width: 16rem;
    }

    .doc-badge {
      display: inline-block;
      margin-top: 0.4rem;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: var(--brand-soft);
      color: var(--brand);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .doc-title {
      font-size: 1.4rem;
      font-weight: 800;
      margin: 0 0 0.35rem;
      letter-spacing: -0.02em;
    }

    .doc-sub {
      color: var(--muted);
      font-size: 0.9rem;
      margin: 0 0 0.85rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.55rem 1rem;
      padding: 0.75rem 0.9rem;
      margin-bottom: 1.35rem;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #f8fbff;
      font-size: 0.78rem;
    }

    .info-grid strong {
      display: block;
      color: var(--muted);
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.1rem;
    }

    .q {
      margin-bottom: 1.5rem;
      padding-bottom: 1.15rem;
      border-bottom: 1px dashed var(--line);
      page-break-inside: auto;
      break-inside: auto;
      position: relative;
      z-index: 1;
    }

    .q:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .q-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.45rem;
      page-break-after: avoid;
      break-after: avoid;
    }

    .q-num {
      font-weight: 800;
      color: var(--brand);
      font-size: 0.98rem;
    }

    .q-chip {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
      white-space: nowrap;
    }

    .rich-text-content {
      font-size: 0.95rem;
      line-height: 1.55;
      color: var(--ink);
    }

    .rich-text-content.prompt {
      margin: 0;
    }

    .rich-text-content.body {
      margin-top: 0.55rem;
      font-size: 0.9rem;
      color: #24324d;
    }

    .rich-text-content p {
      margin: 0.25rem 0;
      line-height: 1.55;
    }

    .rich-text-content p:first-child {
      margin-top: 0;
    }

    .rich-text-content p:last-child {
      margin-bottom: 0;
    }

    .rich-text-content ul,
    .rich-text-content ol {
      margin: 0.5rem 0;
      padding-left: 1.35rem;
    }

    .rich-text-content ul { list-style: disc; }
    .rich-text-content ol { list-style: decimal; }

    .rich-text-content h2 {
      margin: 0.75rem 0 0.35rem;
      font-size: 1rem;
      font-weight: 700;
    }

    .rich-text-content h3 {
      margin: 0.5rem 0 0.25rem;
      font-size: 0.92rem;
      font-weight: 700;
    }

    .rich-text-content strong { font-weight: 600; }

    .rich-text-content sup {
      vertical-align: super;
      font-size: 0.75em;
    }

    .rich-text-content sub {
      vertical-align: sub;
      font-size: 0.75em;
    }

    .rich-text-content img,
    .rich-text-content img.qb-inline-image {
      max-width: 100%;
      width: auto;
      height: auto;
      max-height: 95mm;
      object-fit: contain;
      margin: 0.75rem 0;
      border: 1px solid var(--line);
      border-radius: 8px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .rich-text-content img.qb-img-align-left {
      display: block;
      margin-left: 0;
      margin-right: auto;
    }

    .rich-text-content img.qb-img-align-center {
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .rich-text-content img.qb-img-align-right {
      display: block;
      margin-left: auto;
      margin-right: 0;
    }

    .rich-text-content img[style*="margin-left: auto"][style*="margin-right: auto"] {
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .rich-text-content img[style*="margin-right: 0"] {
      display: block;
      margin-left: auto;
      margin-right: 0;
    }

    .rich-text-content p[style*="text-align: center"] img {
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .rich-text-content p[style*="text-align: right"] img {
      display: block;
      margin-left: auto;
      margin-right: 0;
    }

    .rich-text-content .qb-math {
      display: inline-block;
      vertical-align: middle;
      margin: 0 0.1rem;
    }

    .mcq-options {
      margin: 0.75rem 0 0;
      padding: 0;
      list-style: none;
    }

    .mcq-options li {
      display: flex;
      align-items: flex-start;
      gap: 0.45rem;
      margin-bottom: 0.45rem;
      font-size: 0.9rem;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .mcq-option-label {
      flex-shrink: 0;
      font-weight: 700;
      line-height: 1.55;
    }

    .mcq-options .rich-text-content {
      flex: 1;
      min-width: 0;
      font-size: 0.9rem;
    }

    .mcq-options .rich-text-content--inline,
    .mcq-options .rich-text-content--inline p {
      display: inline;
      margin: 0 !important;
      padding: 0;
      line-height: inherit;
    }

    .mcq-options .rich-text-content p:first-child {
      margin-top: 0;
    }

    .diagram {
      display: block;
      max-width: 100%;
      width: auto;
      height: auto;
      max-height: 95mm;
      object-fit: contain;
      margin: 0.85rem 0 0.25rem;
      border: 1px solid var(--line);
      border-radius: 8px;
      page-break-inside: auto;
      break-inside: auto;
    }

    .answer-space {
      margin-top: 0.75rem;
      padding-top: 0.15rem;
    }

    .answer-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--ink);
      margin-bottom: 0.1rem;
    }

    .answer-line {
      height: 1.45rem;
      border-bottom: 1px dashed #8a9bb3;
    }

    .print-footer {
      display: none;
    }

    @media print {
      .sheet {
        max-width: none;
        padding: 0;
      }

      .watermark {
        position: fixed;
        inset: 0;
      }

      .watermark img {
        width: 280px;
        max-height: 280px;
        opacity: 0.06;
      }

      .print-header {
        position: relative;
        padding: 0 0 0.4rem;
        background: #fff;
        border-bottom: 2.5px solid var(--brand);
        margin-bottom: 0.65rem;
        z-index: 2;
        page-break-after: avoid;
        break-after: avoid;
      }

      .doc-title {
        font-size: 1.15rem;
        margin: 0 0 0.25rem;
        page-break-after: avoid;
        break-after: avoid;
      }

      .doc-sub {
        margin: 0 0 0.5rem;
      }

      .info-grid {
        margin-bottom: 0.75rem;
        padding: 0.5rem 0.7rem;
        page-break-after: avoid;
        break-after: avoid;
      }

      .q {
        page-break-inside: auto;
        break-inside: auto;
      }

      .diagram,
      .rich-text-content img {
        max-height: 90mm;
      }

      .print-header .brand-bar {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0.15rem;
      }

      .print-header .brand-logo-wrap,
      .print-header .brand-logo {
        height: 64px;
        width: 64px;
        border-radius: 12px;
      }

      .print-header .brand-name {
        font-size: 1.25rem;
      }

      .print-header .brand-tagline {
        font-size: 0.7rem;
      }

      .print-header .brand-meta {
        font-size: 0.65rem;
      }

      .print-footer {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding-top: 0.35rem;
        border-top: 1px solid var(--line);
        font-size: 0.65rem;
        color: var(--muted);
        background: #fff;
        z-index: 2;
      }

      .print-footer-inner {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }

      .content {
        position: relative;
        z-index: 1;
        padding-top: 0.25rem;
        padding-bottom: 1.6rem;
      }
    }

    @media screen {
      body { background: #eef3f9; padding: 1.5rem 0 2rem; }
      .sheet {
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 18px 40px -24px rgba(18, 32, 58, 0.35);
        overflow: hidden;
      }
      .watermark {
        position: absolute;
        border-radius: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="watermark" aria-hidden="true">
    <img src="${escapeAttr(logoUrl)}" alt="" />
  </div>

  <div class="sheet">
    <header class="print-header">
      <div class="brand-bar">
        <div class="brand-left">
          <div class="brand-logo-wrap">
            <img class="brand-logo" src="${escapeAttr(logoUrl)}" alt="${escapeAttr(siteConfig.name)}" />
          </div>
          <div class="brand-text">
            <div class="brand-name">${escapeHtml(siteConfig.name)}</div>
            <div class="brand-tagline">${escapeHtml(siteConfig.tagline)}</div>
          </div>
        </div>
        <div class="brand-meta">
          <div>${escapeHtml(siteConfig.description)}</div>
          <div>Support: ${escapeHtml(siteConfig.phone)}</div>
          <div class="doc-badge">Question Paper</div>
        </div>
      </div>
    </header>

    <div class="content">
      <h1 class="doc-title">${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="doc-sub">${escapeHtml(subtitle)}</p>` : ""}

      <div class="info-grid">
        <div>
          <strong>Platform</strong>
          ${escapeHtml(siteConfig.name)} · ${escapeHtml(siteConfig.company)}
        </div>
        <div>
          <strong>Generated</strong>
          ${escapeHtml(generatedAt)}
        </div>
        ${
          showPaperMeta
            ? `<div>
          <strong>Paper set</strong>
          ${escapeHtml(paperLabel)}
        </div>`
            : ""
        }
        <div>
          <strong>Questions</strong>
          ${questions.length}
        </div>
      </div>

      ${questions
        .map((q, index, all) => {
          const serial = showPaperMeta
            ? all.filter(
                (item, i) =>
                  i <= index &&
                  String(item.paper ?? "").toUpperCase() === String(q.paper ?? "").toUpperCase()
              ).length
            : index + 1;
          const chip = showPaperMeta
            ? `Paper ${escapeHtml(String(q.paper ?? "").replace("PAPER_", ""))}${
                q.difficulty ? ` · ${escapeHtml(String(q.difficulty))}` : ""
              }`
            : q.difficulty
              ? escapeHtml(String(q.difficulty))
              : "";
          const answerBlock = includeAnswerSpace
            ? `<div class="answer-space">
          <div class="answer-label">Answer:</div>
          ${Array.from({ length: ANSWER_LINE_COUNT })
            .map(() => `<div class="answer-line"></div>`)
            .join("")}
        </div>`
            : "";
          const promptHtml = renderRichBlock(q.prompt, origin, "prompt");
          const bodyHtml = q.body ? renderRichBlock(q.body, origin, "body") : "";
          const optionsHtml = renderMcqOptions(q, origin);
          const diagramHtml = q.diagramUrl
            ? `<img class="diagram" src="${escapeAttr(absolutizeUrl(q.diagramUrl, origin))}" alt="Diagram for question ${serial}" />`
            : "";
          return `
      <div class="q">
        <div class="q-head">
          <div class="q-num">Question ${serial}</div>
          ${chip ? `<div class="q-chip">${chip}</div>` : ""}
        </div>
        ${promptHtml}
        ${bodyHtml}
        ${diagramHtml}
        ${optionsHtml}
        ${answerBlock}
      </div>`;
        })
        .join("")}
    </div>

    <footer class="print-footer">
      <div class="print-footer-inner">
        <span>${escapeHtml(siteConfig.name)} — ${escapeHtml(siteConfig.tagline)}</span>
        <span>Helpline ${escapeHtml(siteConfig.phone)} · For study use only</span>
      </div>
    </footer>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();

  const waitForImages = () => {
    const images = Array.from(win.document.images);
    return Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
  };

  void waitForImages().then(() => {
    win.focus();
    setTimeout(() => win.print(), 200);
  });
}

function renderRichBlock(html: string, origin: string, className: string): string {
  const content = prepareRichHtml(html, origin);
  if (!content) return "";
  return `<div class="rich-text-content ${className}">${content}</div>`;
}

function prepareRichHtml(html: string, origin: string): string {
  if (!html?.trim()) return "";
  let content: string;
  if (looksLikeHtml(html)) {
    content = sanitizeRichHtml(html);
  } else {
    content = `<p>${escapeHtml(decodeHtmlEntities(html))}</p>`;
  }
  content = hydrateKatexHtml(content);
  return absolutizeHtmlMediaUrls(content, origin);
}

function renderMcqOptions(question: ExportQuestion, origin: string): string {
  const filled = (question.options ?? [])
    .map((opt, index) => ({ opt, index }))
    .filter(({ opt }) => !isRichTextEmpty(opt));
  if (filled.length < 2) return "";
  return `<ul class="mcq-options">${filled
    .map(({ opt, index }) => {
      const letter = OPTION_LETTERS[index] ?? String(index + 1);
      const content = prepareRichHtml(opt, origin);
      return `<li style="display:flex;align-items:baseline;gap:0.45rem;">
        <span class="mcq-option-label">${letter}.</span>
        <span class="rich-text-content rich-text-content--inline">${content}</span>
      </li>`;
    })
    .join("")}</ul>`;
}

function decodeHtmlEntities(text: string): string {
  if (typeof document === "undefined") return text;
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

function absolutizeUrl(url: string, origin: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("//")) return `${window.location.protocol}${trimmed}`;
  if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
  return trimmed;
}

function absolutizeHtmlMediaUrls(html: string, origin: string): string {
  return html.replace(/\ssrc=(["'])([^"']+)\1/gi, (_match, quote, src) => {
    return ` src=${quote}${absolutizeUrl(src, origin)}${quote}`;
  });
}

function uniquePapersLabel(questions: Array<{ paper?: string | null }>) {
  const papers = [
    ...new Set(
      questions
        .map((q) => q.paper)
        .filter((p): p is string => Boolean(p && String(p).trim()))
        .map((p) => String(p).replace("PAPER_", "Paper "))
    ),
  ];
  return papers.length ? papers.join(", ") : "All papers";
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

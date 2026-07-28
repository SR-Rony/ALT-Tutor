import { siteConfig } from "@/config";
import type { QbQuestion } from "@/types/qb.types";

type ExportArgs = {
  title: string;
  subtitle?: string;
  questions: QbQuestion[];
};

/** Opens a printable window with a branded question paper (print → Save as PDF). */
export function downloadQuestionPaperPdf({ title, subtitle, questions }: ExportArgs) {
  const origin = typeof window !== "undefined" ? window.location.origin : siteConfig.url;
  const logoUrl = `${origin}/logo.png`;
  const generatedAt = new Date().toLocaleString();
  const paperLabel = uniquePapersLabel(questions);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(siteConfig.name)} — ${escapeHtml(title)}</title>
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
      margin: 18mm 14mm 18mm 14mm;
    }

    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: var(--ink);
      margin: 0;
      padding: 0;
      background: #fff;
      line-height: 1.5;
    }

    .sheet {
      max-width: 800px;
      margin: 0 auto;
      padding: 1.25rem 1.5rem 2rem;
    }

    .brand-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-bottom: 0.85rem;
      border-bottom: 2px solid var(--brand);
      margin-bottom: 1.1rem;
    }

    .brand-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 0;
    }

    .brand-logo {
      height: 42px;
      width: auto;
      max-width: 180px;
      object-fit: contain;
      object-position: left center;
    }

    .brand-text { min-width: 0; }

    .brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--ink);
      line-height: 1.15;
    }

    .brand-tagline {
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 0.15rem;
    }

    .brand-meta {
      text-align: right;
      font-size: 0.7rem;
      color: var(--muted);
      line-height: 1.45;
      white-space: nowrap;
    }

    .doc-badge {
      display: inline-block;
      margin-top: 0.35rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: var(--brand-soft);
      color: var(--brand);
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .doc-title {
      font-size: 1.35rem;
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
      page-break-inside: avoid;
      break-inside: avoid;
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

    .prompt {
      margin: 0;
      font-size: 0.95rem;
    }

    .body {
      white-space: pre-wrap;
      font-size: 0.9rem;
      margin-top: 0.55rem;
      color: #24324d;
    }

    .diagram {
      max-width: 100%;
      height: auto;
      margin: 0.85rem 0 0.25rem;
      border: 1px solid var(--line);
      border-radius: 8px;
    }

    .print-footer {
      display: none;
    }

    @media print {
      .sheet {
        max-width: none;
        padding: 0;
      }

      .print-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        padding: 0 0 0.45rem;
        background: #fff;
        border-bottom: 1.5px solid var(--brand);
      }

      .print-header .brand-bar {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0.35rem;
      }

      .print-header .brand-logo {
        height: 32px;
        max-width: 140px;
      }

      .print-header .brand-name {
        font-size: 0.95rem;
      }

      .print-header .brand-tagline,
      .print-header .brand-meta {
        font-size: 0.62rem;
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
      }

      .print-footer-inner {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }

      .content {
        padding-top: 4.2rem;
        padding-bottom: 1.6rem;
      }
    }

    @media screen {
      body { background: #eef3f9; padding: 1.5rem 0 2rem; }
      .sheet {
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 18px 40px -24px rgba(18, 32, 58, 0.35);
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="print-header">
      <div class="brand-bar">
        <div class="brand-left">
          <img class="brand-logo" src="${escapeAttr(logoUrl)}" alt="${escapeAttr(siteConfig.name)}" />
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
        <div>
          <strong>Paper set</strong>
          ${escapeHtml(paperLabel)}
        </div>
        <div>
          <strong>Questions</strong>
          ${questions.length}
        </div>
      </div>

      ${questions
        .map((q, index, all) => {
          const paper = String(q.paper).toUpperCase();
          const serial = all.filter(
            (item, i) => i <= index && String(item.paper).toUpperCase() === paper
          ).length;
          return `
      <div class="q">
        <div class="q-head">
          <div class="q-num">Question ${serial}</div>
          <div class="q-chip">Paper ${escapeHtml(String(q.paper).replace("PAPER_", ""))} · ${escapeHtml(String(q.difficulty))}</div>
        </div>
        <p class="prompt">${escapeHtml(q.prompt)}</p>
        ${q.body ? `<div class="body">${escapeHtml(q.body)}</div>` : ""}
        ${
          q.diagramUrl
            ? `<img class="diagram" src="${escapeAttr(q.diagramUrl)}" alt="Diagram for question ${serial}" />`
            : ""
        }
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
  win.focus();
  setTimeout(() => win.print(), 500);
}

function uniquePapersLabel(questions: QbQuestion[]) {
  const papers = [...new Set(questions.map((q) => String(q.paper).replace("PAPER_", "Paper ")))];
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

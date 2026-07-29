import { siteConfig } from "@/config";

type ExportArgs = {
  title: string;
  subtitle?: string;
  questions: Array<{
    id?: string;
    paper?: string | null;
    prompt: string;
    body?: string | null;
    diagramUrl?: string | null;
    difficulty?: string | null;
  }>;
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

    /* Centered brand watermark — prints as page stamp */
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
      page-break-inside: avoid;
      break-inside: avoid;
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

      .watermark {
        position: fixed;
        inset: 0;
      }

      .watermark img {
        width: 420px;
        max-height: 420px;
        opacity: 0.08;
      }

      .print-header {
        position: relative;
        padding: 0 0 0.55rem;
        background: #fff;
        border-bottom: 2.5px solid var(--brand);
        margin-bottom: 1rem;
        z-index: 2;
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

function uniquePapersLabel(
  questions: Array<{ paper?: string | null }>
) {
  const papers = [
    ...new Set(questions.map((q) => String(q.paper ?? "PAPER_1").replace("PAPER_", "Paper "))),
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

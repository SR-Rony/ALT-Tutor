import type { QbQuestion } from "@/types/qb.types";

type ExportArgs = {
  title: string;
  subtitle?: string;
  questions: QbQuestion[];
};

/** Opens a printable window with the full question paper (download via browser print → Save as PDF). */
export function downloadQuestionPaperPdf({ title, subtitle, questions }: ExportArgs) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #1a1a2e; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .sub { color: #555; font-size: 0.9rem; margin-bottom: 2rem; }
    .q { margin-bottom: 2rem; page-break-inside: avoid; }
    .q-num { font-weight: 700; color: #1877f2; margin-bottom: 0.5rem; }
    .prompt { margin-bottom: 0.75rem; line-height: 1.5; }
    .body { white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6; margin-top: 0.5rem; }
    .meta { font-size: 0.75rem; color: #666; margin-top: 0.5rem; }
    img { max-width: 100%; height: auto; margin: 1rem 0; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<p class="sub">${escapeHtml(subtitle)}</p>` : ""}
  ${questions
    .map(
      (q) => `
    <div class="q">
      <div class="q-num">Question ${q.number}</div>
      <div class="prompt">${escapeHtml(q.prompt)}</div>
      ${q.body ? `<div class="body">${escapeHtml(q.body)}</div>` : ""}
      ${q.diagramUrl ? `<img src="${escapeAttr(q.diagramUrl)}" alt="Diagram" />` : ""}
      <div class="meta">Paper ${String(q.paper).replace("PAPER_", "")} · ${String(q.difficulty)}</div>
    </div>`
    )
    .join("")}
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
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

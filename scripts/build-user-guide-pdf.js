'use strict';

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'docs', 'USER_GUIDE_RU.md');
const output = path.join(root, 'AIMETON_AKID_Viewer_User_Guide_RU.pdf');

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function markdownToHtml(md) {
  const out = [];
  let inCode = false;
  let list = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  String(md).split(/\r?\n/).forEach((line) => {
    if (/^```/.test(line)) {
      closeList();
      if (inCode) { out.push('</code></pre>'); inCode = false; }
      else { out.push('<pre><code>'); inCode = true; }
      return;
    }
    if (inCode) { out.push(`${esc(line)}\n`); return; }
    if (!line.trim()) { closeList(); return; }
    if (/^---+$/.test(line.trim())) { closeList(); out.push('<hr>'); return; }
    let m = line.match(/^(#{1,3})\s+(.*)$/);
    if (m) { closeList(); const n = m[1].length; out.push(`<h${n}>${inline(m[2])}</h${n}>`); return; }
    m = line.match(/^>\s?(.*)$/);
    if (m) { closeList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); return; }
    m = line.match(/^[-*]\s+(.*)$/);
    if (m) { if (list !== 'ul') { closeList(); list = 'ul'; out.push('<ul>'); } out.push(`<li>${inline(m[1])}</li>`); return; }
    m = line.match(/^\d+\.\s+(.*)$/);
    if (m) { if (list !== 'ol') { closeList(); list = 'ol'; out.push('<ol>'); } out.push(`<li>${inline(m[1])}</li>`); return; }
    closeList(); out.push(`<p>${inline(line)}</p>`);
  });
  closeList();
  if (inCode) out.push('</code></pre>');
  return out.join('\n');
}

app.whenReady().then(async () => {
  const md = fs.readFileSync(source, 'utf8');
  const body = markdownToHtml(md);
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 15mm 16mm 16mm; }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #172033; font-size: 10.5pt; line-height: 1.48; margin: 0; }
    h1 { color:#087f6b; font-size:22pt; margin:0 0 12pt; border-bottom:2px solid #20b99a; padding-bottom:8pt; }
    h2 { color:#087f6b; font-size:15pt; margin:18pt 0 7pt; break-after:avoid; }
    h3 { color:#145a8d; font-size:12pt; margin:13pt 0 5pt; break-after:avoid; }
    p { margin:0 0 7pt; }
    ul, ol { margin:4pt 0 8pt 20pt; padding:0; }
    li { margin:2pt 0; }
    code { font-family:Consolas, monospace; background:#f2f5f7; padding:1px 4px; border-radius:3px; }
    pre { font-family:Consolas, monospace; white-space:pre-wrap; background:#f4f7f9; border:1px solid #dce4e8; border-radius:6px; padding:9pt; font-size:9pt; break-inside:avoid; }
    pre code { background:none; padding:0; }
    blockquote { margin:8pt 0; padding:7pt 10pt; border-left:3px solid #20b99a; background:#f2faf8; color:#465363; }
    hr { border:0; border-top:1px solid #dfe5e8; margin:12pt 0; }
    strong { color:#0d1724; }
  </style></head><body>${body}</body></html>`;

  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  const pdf = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4', preferCSSPageSize: true });
  fs.writeFileSync(output, pdf);
  console.log(`Generated ${output} (${pdf.length} bytes)`);
  win.destroy();
  app.quit();
}).catch((err) => { console.error(err); app.exit(1); });

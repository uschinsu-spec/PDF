#!/usr/bin/env node
/**
 * Fail-closed privacy policy for the static PDF app.
 * The browser is allowed to fetch code, fonts, WASM and OCR only from this origin.
 * A static GitHub Pages site has no backend for uploading PDF documents.
 */
import fs from 'node:fs';
import path from 'node:path';

const upstream = path.resolve(import.meta.dirname, '..', 'vendor', 'bentopdf');
const dist = path.join(upstream, 'dist');
const required = [
  'index.html',
  'sw.js',
  'wasm/pymupdf/dist/index.js',
  'wasm/ghostscript/assets/gs.js',
  'wasm/cpdf/coherentpdf.browser.min.js',
  'ocr/worker.min.js',
  'ocr/lang/vie.traineddata.gz',
  'ocr/lang/eng.traineddata.gz'
];
for (const entry of required) {
  const full = path.join(dist, entry);
  if (!fs.existsSync(full) || !fs.statSync(full).size) throw new Error('[audit] Missing build asset: ' + entry);
}
const policy = [
  "default-src 'self' data: blob:",
  "base-uri 'self'",
  "connect-src 'self' data: blob:",
  "script-src 'self' blob: 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "frame-src 'self' blob: data:",
  "media-src 'self' data: blob:",
  "manifest-src 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join('; ');

let count = 0;
let externalScripts = 0;
function traverse(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) { traverse(full); continue; }
    if (!item.name.endsWith('.html')) continue;
    let src = fs.readFileSync(full, 'utf8');
    if (!/<head\b[^>]*>/i.test(src)) throw new Error('[audit] HTML has no head: ' + full);
    if (/http-equiv=["']Content-Security-Policy["']/i.test(src)) {
      throw new Error('[audit] Upstream now sets its own CSP. Reconcile policies before deployment: ' + full);
    }
    // No third-party scripts/stylesheets can run, even accidentally.
    externalScripts += [...src.matchAll(/<(?:script|link)\b[^>]*(?:src|href)\s*=\s*["']https?:\/\/[^"']+["']/gi)].length;
    src = src.replace(/<head\b([^>]*)>/i,
      '<head$1><meta http-equiv="Content-Security-Policy" content="' + policy + '">' +
      '<meta name="referrer" content="no-referrer">');
    fs.writeFileSync(full, src);
    count++;
  }
}
traverse(dist);
if (count < 30) throw new Error('[audit] Too few generated pages: ' + count);
if (externalScripts) console.warn('[audit] '+ externalScripts +' remote script/style references will be BLOCKED by CSP');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (!html.includes('Content-Security-Policy') || !html.includes("connect-src 'self'")) throw new Error('[audit] CSP not applied');
console.log('[audit] PASS: ' + count + ' HTML pages with same-origin-only network CSP, offline OCR & WASM assets');
console.log('[audit] PDF documents are processed in browser; static server has no file-upload API.');

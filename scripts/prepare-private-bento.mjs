#!/usr/bin/env node
/**
 * Prepare a private, same-origin BentoPDF build.
 * All downloads occur during build/setup, never while processing user PDFs.
 * Upstream stays in vendor/bentopdf as a pinned AGPL-3.0 Git submodule.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';

const root = path.resolve(import.meta.dirname, '..');
const upstream = path.join(root, 'vendor', 'bentopdf');
const pub = path.join(upstream, 'public');
const base = process.env.BASE_URL || '/PDF/';
const normalizedBase = '/' + base.replace(/^\/+|\/+$/g, '') + '/';
const requireFile = p => { if (!fs.existsSync(p)) throw new Error('Missing ' + p + '. Did you run git submodule update --init and npm ci?'); };
requireFile(path.join(upstream, 'package.json'));
requireFile(path.join(upstream, 'node_modules', 'tesseract.js', 'package.json'));

function run(bin, args, options = {}) {
  const command = process.platform === 'win32' && bin === 'npm' ? 'npm.cmd' : bin;
  const r = spawnSync(command, args, { cwd: upstream, encoding: 'utf8', stdio: 'pipe', shell: process.platform === 'win32' && bin === 'npm', ...options });
  if (r.status !== 0) throw new Error(command + ' ' + args.join(' ') + '\n' + (r.stderr || r.stdout));
  return r.stdout.trim();
}
function extract(tgz, dest) {
  requireFile(tgz);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bento-package-'));
  try {
    run('tar', ['-xzf', tgz, '-C', tmp]);
    const pkg = path.join(tmp, 'package');
    requireFile(pkg);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(pkg, dest, { recursive: true });
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
function patch(file, search, replacement) {
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes(search)) throw new Error('Upstream changed; privacy patch failed: ' + file + ', expected ' + search);
  s = s.replace(search, replacement);
  fs.writeFileSync(file, s);
}

// Bundle the prepackaged PyMuPDF + Ghostscript engines, rather than using a CDN at runtime.
extract(path.join(upstream, 'bentopdf-airgap-bundle', 'bentopdf-pymupdf-wasm-0.11.16.tgz'), path.join(pub, 'wasm', 'pymupdf'));
extract(path.join(upstream, 'bentopdf-airgap-bundle', 'bentopdf-gs-wasm-0.1.1.tgz'), path.join(pub, 'wasm', 'ghostscript'));
requireFile(path.join(pub, 'wasm', 'pymupdf', 'dist', 'index.js'));
requireFile(path.join(pub, 'wasm', 'ghostscript', 'assets', 'gs.js'));

// CoherentPDF package contains additional supporting assets beyond the browser JS entry.
const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bento-cpdf-'));
try {
  const npmFile = run('npm', ['pack', 'coherentpdf@2.5.5', '--pack-destination', packDir, '--silent']).split('\n').pop().trim();
  extract(path.join(packDir, npmFile), path.join(pub, 'wasm', 'cpdf-package'));
  const dist = path.join(pub, 'wasm', 'cpdf-package', 'dist');
  requireFile(path.join(dist, 'coherentpdf.browser.min.js'));
  fs.cpSync(dist, path.join(pub, 'wasm', 'cpdf'), { recursive: true, force: true });
  fs.rmSync(path.join(pub, 'wasm', 'cpdf-package'), { recursive: true, force: true });
} finally { fs.rmSync(packDir, { recursive: true, force: true }); }

// Self-host Tesseract workers and engine, and download only Vietnamese/English language data.
const ocr = path.join(pub, 'ocr');
fs.mkdirSync(path.join(ocr, 'lang'), { recursive: true });
const worker = path.join(upstream, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js');
requireFile(worker);
fs.copyFileSync(worker, path.join(ocr, 'worker.min.js'));
const core = path.join(upstream, 'node_modules', 'tesseract.js-core');
requireFile(core);
fs.cpSync(core, path.join(ocr, 'core'), { recursive: true, force: true });
for (const code of ['vie','eng']) {
  const target = path.join(ocr, 'lang', code + '.traineddata.gz');
  if (fs.existsSync(target) && fs.statSync(target).size > 100000) continue;
  const url = 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/' + code + '.traineddata';
  console.log('[setup] Downloading ' + code + ' OCR dataset during BUILD only...');
  const response = await fetch(url);
  if (!response.ok) throw new Error('OCR download failed (' + code + '): HTTP ' + response.status);
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length < 100000) throw new Error('OCR dataset suspiciously small: ' + code);
  fs.writeFileSync(target, gzipSync(buf));
}

// Embed Noto Sans for OCR text layers (Vietnamese + English) to avoid CDN font requests.
const fonts = path.join(ocr, 'fonts');
fs.mkdirSync(fonts, { recursive: true });
const noto = path.join(fonts, 'NotoSans-Regular.ttf');
if (!fs.existsSync(noto) || fs.statSync(noto).size < 100000) {
  const url = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/ffebf8c1ee449e544955a7e813c54f9b73848eac/hinted/ttf/NotoSans/NotoSans-Regular.ttf';
  console.log('[setup] Downloading Noto Sans during BUILD only...');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Noto Sans download failed: HTTP ' + response.status);
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length < 100000) throw new Error('Noto Sans font suspiciously small');
  fs.writeFileSync(noto, buf);
}

// Refuse user-configured remote WASM overrides, including stale localStorage values.
const provider = path.join(upstream, 'src', 'js', 'utils', 'wasm-provider.ts');
patch(provider,
  'return !!host && this.trustedHosts.has(host);',
  'return !!host && host === location.hostname;'
);
patch(provider,
  'if (!host) {\n      throw new Error(\'Invalid URL\');',
  'if (!host || host !== location.hostname) {\n      throw new Error(\'Only same-origin WASM assets are permitted\');'
);

// Make the previously built-in CDN fallbacks point to the owner's static website.
const replacements = new Map([
  ['https://cdn.jsdelivr.net/npm/@bentopdf/pymupdf-wasm@0.11.16/', normalizedBase + 'wasm/pymupdf/'],
  ['https://cdn.jsdelivr.net/npm/@bentopdf/gs-wasm@0.1.1/assets/', normalizedBase + 'wasm/ghostscript/assets/'],
  ['https://cdn.jsdelivr.net/npm/coherentpdf@2.5.5/dist/', normalizedBase + 'wasm/cpdf/']
]);
for (const [from, to] of replacements) patch(provider, from, to);
console.log('[setup] Private WASM, OCR and same-origin safeguards ready: ' + normalizedBase);

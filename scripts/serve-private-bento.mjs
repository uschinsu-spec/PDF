#!/usr/bin/env node
/** Serve the compiled PDF application ONLY on this PC: http://127.0.0.1:8080/PDF/ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'app', 'dist');
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('Chua co ban build. Hay chay CAI_DAT_VA_CHAY_WINDOWS.bat truoc.');
  process.exit(1);
}
const mount = '/PDF/';
const mime = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.wasm':'application/wasm',
  '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.ico':'image/x-icon',
  '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf',
  '.gz':'application/gzip', '.pdf':'application/pdf', '.map':'application/json',
  '.webmanifest':'application/manifest+json', '.data':'application/octet-stream'
};
const policy = "default-src 'self' data: blob:; base-uri 'self'; connect-src 'self' data: blob:; script-src 'self' blob: 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; worker-src 'self' blob:; frame-src 'self' blob: data:; media-src 'self' data: blob:; manifest-src 'self'; form-action 'self'; object-src 'none'";
const host = '127.0.0.1';
const port = Number(process.env.PDF_PORT || 8080);
const server = http.createServer((req,res)=>{
  res.setHeader('Content-Security-Policy', policy);
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;
  }
  let pathname;
  try {pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400);res.end();return;}
  if (pathname === '/') {res.writeHead(302,{Location:mount});res.end();return;}
  if (!pathname.startsWith(mount)) {res.writeHead(404);res.end();return;}
  const rel = pathname.slice(mount.length);
  const target = path.resolve(root, rel || 'index.html');
  if (target !== root && !target.startsWith(root + path.sep)) {res.writeHead(403);res.end();return;}
  let real = target;
  try { if (fs.statSync(target).isDirectory()) real = path.join(target,'index.html');} catch {res.writeHead(404);res.end();return;}
  try {
    const stat=fs.statSync(real);
    if (!stat.isFile()) throw new Error('not file');
    res.writeHead(200,{
      'Content-Type':mime[path.extname(real).toLowerCase()] || 'application/octet-stream',
      'Content-Length':stat.size
    });
    if(req.method==='HEAD')res.end();else fs.createReadStream(real).pipe(res);
  } catch {res.writeHead(404);res.end();}
});
server.listen(port,host,()=>{
  console.log('PDF ca nhan: http://'+host+':'+port+mount);
  console.log('Chi PC nay truy cap duoc. Khong co API upload hoac proxy BentoPDF.');
});

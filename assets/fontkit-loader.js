// PDF Studio V6.0 - fontkit bootstrap + Unicode font picker
(()=>{
const FONTKIT_URL='https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js';
let promise=null;
window.PDFStudioFontKit={
 load(){if(window.fontkit)return Promise.resolve(window.fontkit);if(promise)return promise;promise=new Promise((ok,bad)=>{const s=document.createElement('script');s.src=FONTKIT_URL;s.onload=()=>window.fontkit?ok(window.fontkit):bad(new Error('fontkit unavailable'));s.onerror=bad;document.head.appendChild(s)});return promise},
 async readFile(file){if(!file)return null;const name=(file.name||'').toLowerCase();if(!/\.(ttf|otf)$/.test(name))throw new Error('Chỉ hỗ trợ TTF/OTF');return{bytes:new Uint8Array(await file.arrayBuffer()),name:file.name}}
};
})();
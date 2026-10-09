import * as pdfjs from 'pdfjs-dist';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import '../utils/setup-pdf-worker.js';

type Box = { x:number;y:number;w:number;h:number };
type Stamp = {id:number;page:number;data:string;x:number;y:number;w:number;h:number;baseW:number;baseH:number;opacity:number;rotation:number;strength:number};
type Cover = {page:number;box:Box};
const el = (id:string) => document.getElementById(id)!;
const canvas=el('canvas') as HTMLCanvasElement;
const ctx=canvas.getContext('2d')!;
let raw:Uint8Array|null=null;
let pdf:pdfjs.PDFDocumentProxy|null=null;
let page=0, selecting=false, dragging=false, start={x:0,y:0}, selection:Box|null=null;
let clip:{data:string;w:number;h:number}|null=null;
let stamps:Stamp[]=[], covers:Cover[]=[], active:number|null=null, serial=0;
let base:HTMLCanvasElement|null=null;
const images=new Map<string,HTMLImageElement>();
const strengthened=new Map<string,string>();
async function applyStrength(data:string,strength:number):Promise<string>{
 if(strength===100)return data;
 const key=strength+':'+data;
 const cached=strengthened.get(key);if(cached)return cached;
 const img=await loadImage(data);
 const off=document.createElement('canvas');off.width=img.naturalWidth;off.height=img.naturalHeight;
 const c=off.getContext('2d')!;c.drawImage(img,0,0);
 const pixels=c.getImageData(0,0,off.width,off.height);
 const factor=strength/100;
 for(let i=0;i<pixels.data.length;i+=4){
  // Keep light document backgrounds intact while darkening grey/text strokes.
  for(let j=0;j<3;j++){
   const channel=pixels.data[i+j];
   pixels.data[i+j]=Math.max(0,Math.min(255,255-(255-channel)*factor));
  }
 }
 c.putImageData(pixels,0,0);
 const result=off.toDataURL('image/png');strengthened.set(key,result);return result;
}

const undoStack:Array<{stamps:Stamp[];covers:Cover[]}>=[]; 
const say=(message:string)=>{el('status').textContent=message};
const snapshot=()=>{undoStack.push({stamps:stamps.map(s=>({...s})),covers:covers.map(c=>({page:c.page,box:{...c.box}}))});if(undoStack.length>50)undoStack.shift()};
const cursor=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const norm=(a:{x:number;y:number},b:{x:number;y:number}):Box=>({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)});
const getActive=()=>stamps.find(s=>s.id===active);
async function loadImage(data:string){let img=images.get(data);if(img)return img;img=new Image();img.src=data;await img.decode();images.set(data,img);return img}
async function draw(){
 if(!base)return;
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(base,0,0);
 for(const c of covers.filter(c=>c.page===page)){ctx.fillStyle='white';ctx.fillRect(c.box.x,c.box.y,c.box.w,c.box.h)}
 for(const s of stamps.filter(s=>s.page===page)){const img=await loadImage(await applyStrength(s.data,s.strength));ctx.save();ctx.translate(s.x+s.w/2,s.y+s.h/2);ctx.rotate(s.rotation*Math.PI/180);ctx.globalAlpha=s.opacity;ctx.drawImage(img,-s.w/2,-s.h/2,s.w,s.h);ctx.restore();if(s.id===active){ctx.save();ctx.translate(s.x+s.w/2,s.y+s.h/2);ctx.rotate(s.rotation*Math.PI/180);ctx.strokeStyle='#236bff';ctx.lineWidth=2;ctx.setLineDash([7,4]);ctx.strokeRect(-s.w/2,-s.h/2,s.w,s.h);ctx.restore()}}
 if(selection){ctx.strokeStyle='#2563eb';ctx.lineWidth=2;ctx.setLineDash([7,4]);ctx.strokeRect(selection.x,selection.y,selection.w,selection.h);ctx.setLineDash([])}
}
async function render(){
 if(!pdf||page<0)return;
 const pg=await pdf.getPage(page+1);const viewport=pg.getViewport({scale:1.5});
 canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
 const off=document.createElement('canvas');off.width=canvas.width;off.height=canvas.height;
 await pg.render({canvas:off,canvasContext:off.getContext('2d')!,viewport}).promise;
 base=off;selection=null;active=null;el('page').textContent='Trang '+(page+1)+'/'+pdf.numPages;
 (el('prev') as HTMLButtonElement).disabled=page===0;(el('next') as HTMLButtonElement).disabled=page===pdf.numPages-1;await draw();
}
el('file').addEventListener('change',async()=>{const f=(el('file') as HTMLInputElement).files?.[0];if(!f)return;try{raw=new Uint8Array(await f.arrayBuffer());pdf=await pdfjs.getDocument({data:raw.slice()}).promise;page=0;stamps=[];covers=[];clip=null;active=null;undoStack.length=0;await render();say('Đã mở '+f.name)}catch(e){say('Không thể đọc PDF: '+String(e))}});
el('prev').onclick=()=>{if(page>0){page--;void render()}};
el('next').onclick=()=>{if(pdf&&page<pdf.numPages-1){page++;void render()}};
el('select').onclick=()=>{active=null;selection=null;void draw();say('Kéo chuột để chọn vùng')};
canvas.addEventListener('pointerdown',e=>{if(!pdf)return;const p=cursor(e);const hit=[...stamps].reverse().find(s=>s.page===page&&Math.abs(p.x-(s.x+s.w/2))<=s.w/2&&Math.abs(p.y-(s.y+s.h/2))<=s.h/2);if(hit){active=hit.id;selection=null;dragging=true;start={x:p.x-hit.x,y:p.y-hit.y};snapshot();sync()}else{active=null;selecting=true;start=p;selection={x:p.x,y:p.y,w:0,h:0}}canvas.setPointerCapture(e.pointerId);void draw()});
canvas.addEventListener('pointermove',e=>{if(!selecting&&!dragging)return;const p=cursor(e);if(selecting)selection=norm(start,p);else{const s=getActive();if(s){s.x=p.x-start.x;s.y=p.y-start.y}}void draw()});
canvas.addEventListener('pointerup',()=>{selecting=false;dragging=false;void draw()});
canvas.addEventListener('pointercancel',()=>{selecting=false;dragging=false});
function region(){if(!selection||selection.w<3||selection.h<3){say('Chọn vùng hình chữ nhật trước.');return null}const b=selection;return{x:clamp(Math.floor(b.x),0,canvas.width),y:clamp(Math.floor(b.y),0,canvas.height),w:clamp(Math.ceil(b.w),0,canvas.width-b.x),h:clamp(Math.ceil(b.h),0,canvas.height-b.y)}}
async function copy(cut:boolean){const b=region();if(!b)return;const kept=selection;selection=null;await draw();const off=document.createElement('canvas');off.width=Math.max(1,Math.floor(b.w));off.height=Math.max(1,Math.floor(b.h));off.getContext('2d')!.drawImage(canvas,b.x,b.y,b.w,b.h,0,0,off.width,off.height);clip={data:off.toDataURL('image/png'),w:b.w,h:b.h};selection=kept;if(cut){snapshot();covers.push({page,box:b});selection=null;await draw()}say(cut?'Đã cắt vùng (phủ trắng nguồn).':'Đã sao chép vùng.');}
el('copy').onclick=()=>void copy(false);el('cut').onclick=()=>void copy(true);
el('paste').onclick=()=>{if(!clip||!pdf){say('Chưa có vùng sao chép.');return}snapshot();const s={id:++serial,page,data:clip.data,x:Math.max(0,(canvas.width-clip.w)/2),y:Math.max(0,(canvas.height-clip.h)/2),w:clip.w,h:clip.h,baseW:clip.w,baseH:clip.h,opacity:1,rotation:0,strength:100};stamps.push(s);active=s.id;selection=null;sync();void draw();say('Đã dán vùng; kéo chuột để di chuyển.')};
el('remove').onclick=()=>{if(active===null)return;snapshot();stamps=stamps.filter(s=>s.id!==active);active=null;void draw()};
function sync(){const s=getActive();if(!s)return;(el('opacity') as HTMLInputElement).value=String(Math.round(s.opacity*100));(el('strength') as HTMLInputElement).value=String(s.strength);(el('size') as HTMLInputElement).value=String(Math.round(s.w/s.baseW*100));(el('rotation') as HTMLInputElement).value=String(s.rotation);labels()}
function labels(){el('ov').textContent=(el('opacity') as HTMLInputElement).value+'%';el('dv').textContent=(el('strength') as HTMLInputElement).value+'%';el('sv').textContent=(el('size') as HTMLInputElement).value+'%';el('rv').textContent=(el('rotation') as HTMLInputElement).value+'°'}
for(const id of ['opacity','strength','size','rotation']){el(id).addEventListener('pointerdown',()=>{if(getActive())snapshot()});el(id).addEventListener('input',()=>{const s=getActive();if(!s)return;const v=Number((el(id) as HTMLInputElement).value);if(id==='opacity')s.opacity=v/100;if(id==='strength')s.strength=v;if(id==='rotation')s.rotation=v;if(id==='size'){s.w=s.baseW*v/100;s.h=s.baseH*v/100}labels();void draw()})}
for(const [id,delta] of [['left',-90],['right',90]] as const)el(id).onclick=()=>{const s=getActive();if(!s)return;snapshot();s.rotation=((s.rotation+delta+180)%360+360)%360-180;sync();void draw()};
el('undo').onclick=()=>{const last=undoStack.pop();if(!last)return;stamps=last.stamps;covers=last.covers;active=null;void draw()};
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement&&e.target.type==='range')return;if((e.ctrlKey||e.metaKey)&&['c','x','v','z'].includes(e.key.toLowerCase())){e.preventDefault();({c:()=>void copy(false),x:()=>void copy(true),v:()=>el('paste').click(),z:()=>el('undo').click()} as Record<string,()=>void>)[e.key.toLowerCase()]()}else if(e.key==='Delete')el('remove').click()});
el('save').onclick=async()=>{if(!raw||!pdf)return;try{say('Đang xuất PDF...');const out=await PDFDocument.load(raw.slice());for(let i=0;i<out.getPageCount();i++){const p=out.getPage(i);const view=await (await pdf.getPage(i+1)).getViewport({scale:1.5});const sx=p.getWidth()/view.width,sy=p.getHeight()/view.height;for(const c of covers.filter(c=>c.page===i))p.drawRectangle({x:c.box.x*sx,y:p.getHeight()-(c.box.y+c.box.h)*sy,width:c.box.w*sx,height:c.box.h*sy,color:rgb(1,1,1)});for(const s of stamps.filter(s=>s.page===i)){const img=await out.embedPng(await applyStrength(s.data,s.strength));const w=s.w*sx,h=s.h*sy,cx=(s.x+s.w/2)*sx,cy=p.getHeight()-(s.y+s.h/2)*sy;const a=s.rotation*Math.PI/180;p.drawImage(img,{x:cx-Math.cos(a)*w/2+Math.sin(a)*h/2,y:cy-Math.sin(a)*w/2-Math.cos(a)*h/2,width:w,height:h,rotate:degrees(s.rotation),opacity:s.opacity})}}const bytes=await out.save();const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='pdf-da-chinh-sua.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);say('Đã xuất PDF.')}catch(e){say('Lỗi xuất PDF: '+String(e))}};

// PDF Studio editor hotfix v5.5.2
(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const V=()=>window.state?.visual || (typeof state!=='undefined'?state.visual:null);
  const toast2=s=>{try{toast(s)}catch{console.log(s)}};
  function setMode(m){const v=V();if(!v)return;v.mode=m;$$('[data-m]').forEach(b=>b.classList.toggle('active',b.dataset.m===m));try{drawOverlay()}catch{}}
  function stagePoint(ev){const st=$('#stage'); if(!st)return {x:0,y:0}; const r=st.getBoundingClientRect(); return {x:ev.clientX-r.left,y:ev.clientY-r.top};}
  function beginRegion(ev){const v=V(),st=$('#stage'); if(!v||!st)return; const s=stagePoint(ev); v.region={page:v.page,x:s.x,y:s.y,w:1,h:1}; const move=e=>{const p=stagePoint(e);v.region={page:v.page,x:Math.min(s.x,p.x),y:Math.min(s.y,p.y),w:Math.abs(p.x-s.x),h:Math.abs(p.y-s.y)};drawOverlay();}; const up=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);drawOverlay();toast2('Đã chọn vùng. Bấm Copy vùng hoặc Cắt vùng.');}; window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true);}
  async function capture(cut=false){const v=V(),r=v?.region,src=$('#mainCanvas'),st=$('#stage'); if(!v||!r||r.page!==v.page||r.w<2||r.h<2||!src||!st)return toast2('Hãy kéo chuột để chọn vùng trước.'); const sw=st.clientWidth,sh=st.clientHeight; const px=src.width/sw,py=src.height/sh; const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(r.w*px)); c.height=Math.max(1,Math.round(r.h*py)); const cx=c.getContext('2d'); cx.drawImage(src,Math.round(r.x*px),Math.round(r.y*py),Math.round(r.w*px),Math.round(r.h*py),0,0,c.width,c.height); v.clipboard={data:c.toDataURL('image/png'),wNorm:r.w/sw,hNorm:r.h/sh,sourcePage:v.page}; if(cut){addAnno({type:'cover',x:r.x,y:r.y,w:r.w,h:r.h});} toast2(cut?'Đã cắt vùng. Bấm Dán vùng.':'Đã copy vùng. Bấm Dán vùng.');}
  function paste(){const v=V(),st=$('#stage'); if(!v||!st||!v.clipboard)return toast2('Chưa có vùng được copy/cắt.'); const sw=st.clientWidth,sh=st.clientHeight,c=v.clipboard; const w=Math.max(8,c.wNorm*sw),h=Math.max(8,c.hNorm*sh); const x=Math.max(0,Math.min(sw-w,(v.region?.page===v.page?v.region.x+16:(sw-w)/2))); const y=Math.max(0,Math.min(sh-h,(v.region?.page===v.page?v.region.y+16:(sh-h)/2))); addAnno({type:'image',x,y,w,h,data:c.data,regionPaste:true}); v.region=null;setMode('select');toast2('Đã dán vùng. Có thể kéo vùng vừa dán rồi Xuất PDF.');}
  function editAt(ev){const v=V(); if(!v)return; const p=stagePoint(ev); let items=v.textItems||[]; let it=items.find(t=>p.x>=t.x-8&&p.x<=t.x+t.w+8&&p.y>=t.y-8&&p.y<=t.y+t.h+8); if(!it&&items.length){it=items.map(t=>({t,d:Math.hypot(p.x-(t.x+t.w/2),p.y-(t.y+t.h/2))})).sort((a,b)=>a.d-b.d)[0];it=it&&it.d<45?it.t:null;} if(!it)return toast2('Không nhận được chữ tại vị trí này. PDF scan/ảnh cần OCR trước.'); const txt=prompt('Sửa nội dung chữ:',it.text); if(txt===null)return; addAnno({type:'existingText',x:it.x,y:it.y,w:Math.max(it.w,30),h:Math.max(it.h*1.2,18),text:txt,orig:{x:it.x,y:it.y,w:it.w,h:it.h},size:Math.max(8,it.h*.82),color:'#111111'}); setMode('select');}
  function install(){const st=$('#stage'); if(!st)return false;
    const copy=$('#copyRegion'),cut=$('#cutRegion'),pasteBtn=$('#pasteRegion');
    if(copy)copy.onclick=e=>{e.preventDefault();e.stopPropagation();capture(false)};
    if(cut)cut.onclick=e=>{e.preventDefault();e.stopPropagation();capture(true)};
    if(pasteBtn)pasteBtn.onclick=e=>{e.preventDefault();e.stopPropagation();paste()};
    $$('[data-m]').forEach(b=>{if(b.dataset.m==='region'||b.dataset.m==='edittext'){b.onclick=e=>{e.preventDefault();setMode(b.dataset.m);toast2(b.dataset.m==='region'?'Kéo chuột trên trang để chọn vùng.':'Bấm trực tiếp lên chữ cần sửa.');};}});
    st.addEventListener('pointerdown',e=>{const v=V();if(!v||e.button===2||e.target.closest('.anno'))return; if(v.mode==='region'){e.preventDefault();e.stopImmediatePropagation();beginRegion(e);} else if(v.mode==='edittext'){e.preventDefault();e.stopImmediatePropagation();editAt(e);} },true);
    st.dataset.hotfix='1'; return true;
  }
  const mo=new MutationObserver(()=>{if($('#stage')&&!$('#stage').dataset.hotfix)install();}); mo.observe(document.documentElement,{childList:true,subtree:true}); if(document.readyState!=='loading')setTimeout(install,100);
})();

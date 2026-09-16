(()=>{
const VERSION='20260916f';
function banner(text,type='warn'){
 let b=document.getElementById('runtimeBanner');
 if(!b){
  b=document.createElement('div');b.id='runtimeBanner';
  b.style.cssText='position:sticky;top:0;z-index:99999;padding:10px 14px;text-align:center;font:600 13px system-ui;border-bottom:1px solid #ddd';
  document.body.prepend(b);
 }
 b.style.background=type==='ok'?'#ecfdf5':'#fff7ed';
 b.style.color=type==='ok'?'#166534':'#9a3412';
 b.textContent=text;
}
window.addEventListener('DOMContentLoaded',async()=>{
 const missing=[];
 if(!window.PDFLib)missing.push('pdf-lib');
 if(!window.pdfjsLib)missing.push('pdf.js');
 if(!window.JSZip)missing.push('JSZip');
 if(!window.Tesseract)missing.push('Tesseract');
 if(missing.length)banner('Một số thư viện chưa tải được: '+missing.join(', ')+'. Hãy kiểm tra mạng rồi tải lại trang.');
 const unsupported=[];
 if(!window.Promise)unsupported.push('Promise');
 if(!window.FileReader)unsupported.push('FileReader');
 if(!window.Blob)unsupported.push('Blob');
 if(!window.URL?.createObjectURL)unsupported.push('Object URL');
 if(unsupported.length)banner('Trình duyệt này thiếu tính năng cần thiết: '+unsupported.join(', ')+'. Nên dùng Chrome, Edge hoặc Safari mới.');
 if('serviceWorker' in navigator){
  try{
   const reg=await navigator.serviceWorker.register('./sw.js?v='+VERSION,{updateViaCache:'none'});
   await reg.update();
   navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(sessionStorage.getItem('pdf-sw-reloaded')===VERSION)return;
    sessionStorage.setItem('pdf-sw-reloaded',VERSION);
    location.reload();
   });
  }catch(e){console.warn('Service worker unavailable',e)}
 }
});
})();
// Delete + insert workflow fix for PDF made by Nghĩa
// Keeps thumbnail deletions in sync with the exported PDF and prevents zero-page output.
(function(){
  const originalSetupControls = setupControls;

  setupControls = function(){
    originalSetupControls();
    if(state.tool === 'delete') enhanceDeleteControls();
  };

  function enhanceDeleteControls(){
    const c = $('#controls');
    const n = state.pdf?.getPageCount?.() || 0;
    if(!c) return;
    c.innerHTML = `
      <label>Trang cần xóa (tùy chọn)
        <input id="pagesRange" value="" placeholder="VD: 2,4-6">
      </label>
      <label>Chèn PDF sau khi xóa
        <input id="deleteInsertFile" type="file" accept="application/pdf">
      </label>
      <label>Chèn sau trang còn lại
        <input id="deleteInsertAfter" type="number" min="0" max="${n}" placeholder="Để trống = cuối PDF">
      </label>
      <label>Trang từ PDF chèn
        <input id="deleteInsertRange" placeholder="VD: 1-3,5 (trống = tất cả)">
      </label>`;
    $('#runBtn').textContent = 'Xóa / Chèn & Xuất PDF';
  }

  async function runDeleteAndInsert(){
    try{
      if(!state.files?.[0]) throw new Error('Chưa chọn tệp PDF');
      progress(5);
      $('#status').textContent = 'Đang xóa và chèn trang…';

      const base = await PDFDocument.load(await state.files[0].arrayBuffer());
      const originalCount = base.getPageCount();

      // state.pages is the authoritative thumbnail order after pressing × / drag-drop.
      let keep = Array.isArray(state.pages) ? [...state.pages] : base.getPageIndices();

      // The text box can additionally remove original page numbers.
      const typed = ($('#pagesRange')?.value || '').trim();
      if(typed){
        const typedDelete = new Set(range(typed, originalCount));
        keep = keep.filter(pageIndex => !typedDelete.has(pageIndex));
      }

      const out = await PDFDocument.create();
      if(keep.length){
        const keptPages = await out.copyPages(base, keep);
        keptPages.forEach(p => out.addPage(p));
      }

      const insertFile = $('#deleteInsertFile')?.files?.[0];
      let insertedCount = 0;
      if(insertFile){
        const src = await PDFDocument.load(await insertFile.arrayBuffer());
        const spec = ($('#deleteInsertRange')?.value || '').trim();
        const ids = spec ? range(spec, src.getPageCount()) : src.getPageIndices();
        if(!ids.length) throw new Error('Không có trang hợp lệ trong PDF cần chèn');

        const copied = await out.copyPages(src, ids);
        const rawAfter = ($('#deleteInsertAfter')?.value || '').trim();
        const after = rawAfter === ''
          ? out.getPageCount()
          : Math.max(0, Math.min(out.getPageCount(), Number(rawAfter) || 0));

        copied.forEach((p, k) => out.insertPage(after + k, p));
        insertedCount = copied.length;
      }

      if(out.getPageCount() === 0){
        throw new Error('Không thể tạo PDF 0 trang. Hãy giữ lại ít nhất 1 trang hoặc chèn một PDF khác.');
      }

      const deletedCount = originalCount - keep.length;
      const name = insertedCount ? 'pdf-da-xoa-va-chen-trang.pdf' : 'pdf-da-xoa-trang.pdf';
      await save(out, name);
      $('#status').textContent = `Hoàn tất • đã xóa ${deletedCount} trang${insertedCount ? ` • chèn ${insertedCount} trang` : ''}`;
    }catch(e){
      console.error(e);
      toast('Có lỗi khi xử lý: ' + e.message);
      $('#status').textContent = 'Có lỗi';
      progress(0, true);
    }
  }

  // Capture the click before the original app.js run handler executes.
  document.addEventListener('click', function(e){
    if(e.target?.id !== 'runBtn' || state.tool !== 'delete') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    runDeleteAndInsert();
  }, true);
})();

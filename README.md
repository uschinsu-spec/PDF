# PDF Studio V5

Static PDF toolkit designed for GitHub Pages. Core document processing is performed in the browser.

## Included
- Visual PDF editor: text, images, highlight, freehand drawing, signature, stamp, resize, rotate, undo/redo, zoom, thumbnails, crop box.
- Page tools: organize by drag/drop, merge, split/extract, delete, rotate.
- Optimization: raster compression with selectable quality/resolution, grayscale.
- Conversion: image to PDF, PDF to JPG ZIP.
- Document tools: watermark, page numbering, metadata, text search, OCR Vietnamese/English.
- Responsive UI, dark mode and installable PWA shell.

## Deploy to GitHub Pages
Upload all files and folders to the repository root. In GitHub: Settings → Pages → Deploy from a branch → `main` / `(root)`.

## Privacy / limitations
The app has no upload backend. PDF processing occurs locally in the browser. Libraries and OCR language assets are loaded from public CDNs when required. Very large PDFs can exceed browser memory. Compression/grayscale rasterizes pages, so selectable text/vector content is flattened in those outputs. Encrypted/password-protected PDF editing is not implemented because pdf-lib does not provide full encryption writing support.

## Libraries
pdf-lib, PDF.js, JSZip, Tesseract.js. Check their licenses before commercial redistribution.


## V5.4
- Sửa cache cũ của Service Worker trên GitHub Pages.
- Copy/Cut/Paste vùng hoạt động theo vùng chọn và dán thành đối tượng kéo được.
- Sửa chữ PDF có text layer: hiện khung nhận diện chữ khi bật Sửa chữ PDF, click trực tiếp để thay nội dung.
- Ctrl/Cmd+C và Ctrl/Cmd+V cho vùng chọn.
- Zoom tối đa 500%.

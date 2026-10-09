# PDF made by Nghĩa — BentoPDF tự lưu trữ (nhánh nâng cấp)

Trang PDF hiện tại (V5.4) vẫn nằm ở thư mục gốc và **không bị xóa**. Bản nâng cấp dùng toàn bộ công cụ của [BentoPDF](https://github.com/alam00000/bentopdf) dưới dạng **Git submodule được khóa phiên bản**, build sang static HTML/CSS/JS rồi chạy độc lập bằng máy cá nhân hoặc GitHub Pages của bạn. Không nhúng iframe hay chuyển hướng tới bentopdf.com.

## Cài trên Windows 11 — dùng riêng, có thể chạy offline

1. Cài [Git](https://git-scm.com/downloads) và [Node.js 22](https://nodejs.org/).
2. Tải/clone **repo này** về Windows (dùng `git clone --recurse-submodules https://github.com/uschinsu-spec/PDF.git` sau khi nhánh nâng cấp được gộp, hoặc checkout nhánh `upgrade/bentopdf-full`).
3. Bấm **`CAI_DAT_VA_CHAY_WINDOWS.bat`** để tải mã nguồn & công cụ xử lý một lần, build, kiểm tra và khởi động.
4. Mở **http://127.0.0.1:8080/PDF/** để sử dụng trên máy này.
5. Những lần sau chỉ cần bấm **`CHAY_PDF_OFFLINE.bat`**; có thể ngắt Internet. Đóng cửa sổ lệnh để dừng server.

Lần cài đầu tiên phải có Internet để lấy thư viện/npm và dữ liệu nhận dạng chữ. Không tải PDF cá nhân lên BentoPDF trong bước này.

## Đưa lên GitHub Pages của bạn

Sau khi PR nâng cấp được kiểm tra và merge vào `main`:

1. Mở **Settings → Pages** của repo `uschinsu-spec/PDF`.
2. Đặt **Build and deployment → Source → GitHub Actions**. Cấu hình cũ **Deploy from a branch** sẽ không chạy bản BentoPDF được build.
3. Chờ workflow **Private BentoPDF - build and deploy** trên tab Actions hoàn tất.
4. Mở **https://uschinsu-spec.github.io/PDF/** (đây là địa chỉ dự kiến sau khi triển khai thành công).

Workflow lấy mã nguồn đã khóa phiên bản ở `vendor/bentopdf`, chạy kiểm thử BentoPDF, đóng gói WASM và OCR **vào website của bạn**, build Vite, áp dụng CSP giới hạn truy cập cùng origin và chỉ triển khai khi các kiểm tra thành công. PR chỉ chạy kiểm tra, **không tự thay website**. Nếu build lỗi, phiên bản cũ vẫn ở `main`.

**Lưu ý:** GitHub Pages mặc định là một trang công khai, không phải website cần đăng nhập. Người khác có thể truy cập công cụ, nhưng dữ liệu PDF họ chọn được xử lý ở trình duyệt phía họ. Nếu cần phần mềm chỉ dành riêng cho mình, dùng chế độ Windows localhost ở trên.

## Quy tắc riêng tư

- **Không dùng bentopdf.com làm nơi chạy, không có backend upload PDF, không có API nhận file PDF.**
- WASM PyMuPDF/Ghostscript/CoherentPDF được đóng gói để tải từ **cùng origin**. OCR Tesseract tiếng Việt và tiếng Anh được tự lưu trữ (file ngôn ngữ trong `ocr/lang/`).
- Chính sách **Content-Security-Policy** trên mỗi trang cho phép script, fetch, worker, font và hình ảnh của app từ chính origin, data/blob cục bộ; cấm kết nối ra CDN, BentoPDF và server thứ ba trong quá trình ứng dụng hoạt động. Server Windows còn áp chính sách này ở HTTP response.
- Trong trường hợp thư viện cố gọi dịch vụ ngoài (VD: một công cụ yêu cầu máy chủ xác thực chữ ký, font bên ngoài), trình duyệt sẽ **chặn**, không tự gửi dữ liệu. Tính năng đó có thể báo lỗi cho đến khi được thay bằng thành phần tự host. Chỉ hỗ trợ OCR `vie`/`eng` trong bản offline mặc định.
- Người dùng vẫn có thể **chủ động bấm liên kết ra website khác**, và nếu dùng GitHub Pages thì GitHub có thể ghi nhận IP hoặc yêu cầu tải asset tĩnh (không phải nội dung PDF). Chúng tôi không thể kiểm soát phần mở rộng trình duyệt, phần mềm bên ngoài hoặc dịch vụ mạng hệ điều hành.
- Các tệp `*.wasm`, JS engine và OCR được tải **trong lúc cài đặt/build**, không phải từ nhà phát triển BentoPDF khi bạn mở tài liệu.

## Nguồn & bản quyền

- Upstream: `alam00000/bentopdf`; commit được khóa bởi `vendor/bentopdf`.
- BentoPDF phát hành mã nguồn theo **AGPL-3.0-only**. Các patch và workflow để tạo bản riêng nằm trong repo này. Khi phân phối bản build, phải tiếp tục tuân thủ AGPL và giấy phép các thư viện thành phần.
- Bản root **PDF Studio V5.4** của bạn được giữ nguyên làm bản dự phòng trong Git. Không xóa dữ liệu hoặc lịch sử commit trước đó.

## Vận hành / bảo trì

- Xem `scripts/prepare-private-bento.mjs` để biết quy trình đóng gói WASM/OCR.
- Xem `scripts/secure-private-build.mjs` để kiểm tra CSP và các asset offline.
- Khi nâng version BentoPDF, chủ động cập nhật Git submodule, kiểm tra tarball PyMuPDF/Ghostscript và sửa patch tương thích rồi chạy lại workflow. **Không tự cập nhật không kiểm soát.**
- Muốn chạy từ terminal: build trước, sau đó `node scripts/serve-private-bento.mjs` từ thư mục gốc repo.

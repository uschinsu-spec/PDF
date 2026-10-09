# PDF cá nhân — chỉ sử dụng BentoPDF

Đây là bản **BentoPDF tự lưu trữ** dành cho repo `uschinsu-spec/PDF`. Chỉ còn một giao diện BentoPDF nền trắng, tối giản, tiếng Việt, sử dụng **Simple Mode**: bỏ phần quảng bá/giới thiệu nhưng **không bỏ công cụ xử lý PDF**.

## Sử dụng website

Địa chỉ: https://uschinsu-spec.github.io/PDF/

- Trong **Settings → Pages**, chọn **Build and deployment → Source → GitHub Actions**.
- Workflow `.github/workflows/private-bentopdf.yml` build BentoPDF đã khóa phiên bản từ `vendor/bentopdf`, áp dụng giao diện từ `customization/bento-light.css`, đóng gói WASM/OCR cục bộ, kiểm thử và triển khai site.
- Không dùng chế độ **Deploy from a branch**: nhánh `main` giờ chỉ chứa mã nguồn và quy trình build, không còn site PDF Studio cũ hoặc `index.html` ở thư mục gốc.

## Windows 11: chạy cá nhân, offline sau lần cài đầu

1. Cài Git và Node.js 22.
2. Clone với submodule: `git clone --recurse-submodules https://github.com/uschinsu-spec/PDF.git`.
3. Chạy `CAI_DAT_VA_CHAY_WINDOWS.bat` để build và mở server cục bộ.
4. Vào http://127.0.0.1:8080/PDF/.
5. Lần sau mở `CHAY_PDF_OFFLINE.bat`. Giai đoạn build đầu tiên cần mạng để tải engine, font và dữ liệu OCR.

## Quy tắc dữ liệu và bảo mật

- Không chuyển hướng, không dùng iframe BentoPDF.com; nội dung PDF được xử lý trên thiết bị người dùng.
- Engine WASM, OCR tiếng Việt và tiếng Anh được đóng gói vào site; script `secure-private-build.mjs` kiểm tra CSP và việc tự host tài nguyên.
- GitHub Pages là dịch vụ **công khai**; muốn sử dụng riêng tư ở mức trang web, dùng localhost hoặc thiết lập kiểm soát truy cập riêng.
- Nên sử dụng thiết bị tin cậy đối với tài liệu nhạy cảm.

## Cấu trúc repo

- `vendor/bentopdf`: BentoPDF mã nguồn (Git submodule khóa commit).
- `customization/bento-light.css`: giao diện sáng cho BentoPDF.
- `scripts/`: đóng gói offline, kiểm tra build và server localhost.
- `.github/workflows/private-bentopdf.yml`: kiểm thử và deploy bằng GitHub Actions.

Toàn bộ `index.html`, JavaScript, CSS, service worker và manifest thuộc **PDF Studio cũ** đã bị loại khỏi nhánh `main`. Lịch sử commit Git vẫn được giữ để truy xuất khi cần.

BentoPDF: https://github.com/alam00000/bentopdf — phát hành dưới giấy phép **AGPL-3.0-only**. Bản tùy biến khi phân phối phải tuân thủ AGPL và giấy phép thành phần đi kèm.

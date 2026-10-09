# PDF made by Nghia - self-hosted independent source

All application source is directly committed under app/ (including src/, public/, package.json and original LICENSE).
There are no Git submodules. GitHub Actions builds from app/ and uses customization/bento-light.css for the personal white interface.

## Windows
Install Node.js 22 and Git; clone this repository normally (no submodule options).
Run CAI_DAT_VA_CHAY_WINDOWS.bat the first time, and CHAY_PDF_OFFLINE.bat subsequently.
Local application: http://127.0.0.1:8080/PDF/

## Privacy and dependencies
Processing user files is browser-local. PDF/OCR/WASM engines are self-hosted with same-origin protections.
Initial installation/build may need third-party packages, OCR data and font downloads; no PDF files are sent to the source author.
The complete source can now be maintained without contacting or fetching the original application repository.

## Copyright and license
This project is based on BentoPDF, AGPL-3.0-only. Original copyright and license notices remain
inside app/. The copy is technically independent of the upstream Git repository; license duties
and third-party open-source licenses continue to apply when distributing modified copies.

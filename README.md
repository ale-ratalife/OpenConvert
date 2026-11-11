# OpenConvert

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-v1.0%2B-orange)](https://claude.ai/code)
[![Version](https://img.shields.io/badge/version-1.0.0-success)](https://github.com/ale-ratalife/OpenConvert)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

100% local, open source file converter supporting images, video, audio, documents, ebooks, and archives. No cloud uploads, no tracking, complete privacy.

## Features

- **Image Conversion**: PNG, JPG, WebP, ICO, TIFF, BMP, GIF
- **Video Conversion**: MP4, MKV, AVI, WebM, MOV, FLV (via FFmpeg)
- **Audio Conversion**: MP3, WAV, FLAC, AAC, OGG, M4A (via FFmpeg)
- **Document Conversion**: PDF to DOCX, DOCX to PDF, text to PDF, PDF to images (via Python sidecar)
- **Ebook Conversion**: EPUB, MOBI, AZW3, PDF (via Calibre)
- **Archive Operations**: Create and extract ZIP archives
- **OCR**: Extract text from images (via Tesseract)
- **API Server**: Local REST API for programmatic access
- **10 Languages**: English, Spanish, Russian, Portuguese, French, Japanese, German, Chinese, Thai, Arabic

## Installation

### Windows
Download the latest installer from [Releases](https://github.com/ale-ratalife/OpenConvert/releases):
- `OpenConvert_1.0.0_x64-setup.exe` (NSIS installer)
- `OpenConvert_1.0.0_x64_en-US.msi` (MSI installer)

### From Source

Prerequisites:
- Node.js 18+
- Rust 1.70+
- Python 3.10+
- FFmpeg (static build)
- Calibre (for ebook conversion)
- Tesseract OCR (for OCR)

```bash
# Clone repository
git clone https://github.com/ale-ratalife/OpenConvert.git
cd OpenConvert

# Install frontend dependencies
npm install

# Build frontend
npm run build

# Build Tauri application
npm run tauri:build
```

The installers will be in `src-tauri/target/release/bundle/`.

## Usage

### Desktop Application
Launch OpenConvert and use the drag-and-drop interface to convert files. Select target formats, batch convert multiple files, and download results.

### API Server
Start the local API server from the API Server tab. It runs on `http://localhost:8080` with API key authentication.

```bash
# Convert document via API
curl -X POST "http://localhost:8080/api/convert" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@/path/to/file.pdf" \
  -F "target_format=docx" \
  --output converted.docx

# Check server status
curl -X GET "http://localhost:8080/api/status" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Endpoints:**
- `POST /api/convert` - Document conversion (PDF, DOCX, TXT, etc.)
- `POST /api/ebook` - Ebook conversion (EPUB, MOBI, etc.)
- `POST /api/ocr` - OCR text extraction from images
- `GET /api/status` - Health check

## Architecture

```
OpenConvert/
├── src/                    # React + TypeScript frontend
│   ├── components/         # UI components (GlassCard, Dropzone, FileList, etc.)
│   ├── views/              # Page views (Converter, APIServer, Settings)
│   └── locales/            # 10 language translations
├── src-tauri/              # Rust + Tauri v2 backend
│   ├── src/
│   │   ├── converters/     # Image, video, audio, archive converters
│   │   ├── sidecar.rs      # Python sidecar management
│   │   └── main.rs         # Tauri commands entry point
│   └── binaries/           # FFmpeg, FFprobe, Python sidecar
├── python-engine/          # FastAPI Python sidecar
│   ├── app.py              # Document, ebook, OCR endpoints
│   ├── requirements.txt    # Python dependencies
│   └── build.py            # PyInstaller build script
└── setup.ps1 / setup.sh    # Platform setup scripts
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, i18next
- **Backend**: Rust, Tauri v2
- **Python Sidecar**: FastAPI, PyMuPDF, pdf2docx, pytesseract, calibre
- **Media Processing**: FFmpeg (video/audio), Image crate (images)
- **Packaging**: NSIS (Windows), MSI (Windows), AppImage (Linux), DMG (macOS)

## Privacy

- 100% offline operation - no data leaves your machine
- No telemetry, analytics, or tracking
- Open source - verify the code yourself
- Local API server requires authentication
- Temporary files auto-cleaned after conversion

## License

MIT License - see [LICENSE](LICENSE) for details.

## Repository

https://github.com/ale-ratalife/OpenConvert
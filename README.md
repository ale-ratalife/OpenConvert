# OpenConvert

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)](#)
[![Rust](https://img.shields.io/badge/rust-1.80%2B-orange.svg)](#)
[![React](https://img.shields.io/badge/react-18-61DAFB.svg)](#)
[![Tauri](https://img.shields.io/badge/tauri-v2-24C8DB.svg)](#)

OpenConvert is a robust, high-performance, open-source file conversion utility designed for versatile format transformations. Engineered with scalability and privacy in mind, it provides both a comprehensive **Graphical User Interface (GUI)** for manual processing and a **built-in REST API Server** for automated workflows. All operations are executed 100% locally, ensuring zero data leakage to third-party cloud services.

## Table of Contents

- [Architecture & Philosophy](#architecture--philosophy)
- [Core Features](#core-features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
  - [Windows (Pre-built Binaries)](#windows-pre-built-binaries)
  - [Linux & macOS (Via GitHub Releases)](#linux--macos-via-github-releases)
  - [From Source](#from-source)
  - [Docker (Planned)](#docker-planned)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
  - [Graphical Interface (GUI)](#graphical-interface-gui)
  - [API Integration](#api-integration)
  - [Command Line (Planned)](#command-line-planned)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Credits & Acknowledgments](#credits--acknowledgments)

## Architecture & Philosophy

OpenConvert is built upon a **modular three-layer architecture** that separates concerns cleanly:

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React 18 + TypeScript + Vite + Tailwind CSS)    │
│  - Glassmorphism UI with i18n (10 languages)               │
│  - Drag & drop, batch queue, progress tracking             │
├─────────────────────────────────────────────────────────────┤
│  Backend (Rust + Tauri v2 + Tokio)                         │
│  - Native format converters (image, video, audio, archive) │
│  - FFmpeg sidecar for multimedia                           │
│  - Python sidecar bridge (FastAPI) for docs/ebooks/OCR     │
├─────────────────────────────────────────────────────────────┤
│  Sidecars (Bundled Binaries)                               │
│  - FFmpeg 7.x (video/audio/frame extraction)               │
│  - Python 3.11 + FastAPI (PDF↔DOCX, ebooks, OCR)          │
│  - Calibre ebook-convert, Tesseract OCR                    │
└─────────────────────────────────────────────────────────────┘
```

This design allows for seamless integration of new format handlers without disrupting existing functionality. The Tauri framework provides a lightweight WebView-based desktop shell with near-native performance and minimal binary size.

## Core Features

* **Extensive Format Support:** Comprehensive conversion across 7 categories — Images (PNG, JPG, WEBP, ICO, TIFF, BMP, GIF, AVIF, HEIC), Video (MP4, WEBM, MOV, AVI, MKV, FLV, M4V, 3GP + audio extraction + frame extraction), Audio (MP3, WAV, FLAC, OGG, AAC, M4A, OPUS, WMA), Documents (PDF ↔ DOCX, TXT → PDF, PDF → Images), Ebooks (EPUB, MOBI, AZW3, PDF, FB2, LIT, LRF, PDB, RB, TCR), Archives (ZIP create/extract), OCR (Image → Text).
* **Local-First Processing:** Absolute data privacy. Files never leave your machine. Zero telemetry, zero tracking, zero network requests for conversions.
* **Asynchronous Batch Operations:** Capable of handling large directories of files concurrently with per-file progress tracking, optimizing CPU utilization via Tokio runtime.
* **Built-in REST API Server:** Start a local server (`http://localhost:8080`) with API Key auth, Swagger UI at `/docs`, and endpoints for document conversion, ebook conversion, and OCR — ideal for automation and integration.
* **Cross-Platform:** Native builds for Windows (NSIS + MSI), Linux (AppImage), macOS (Universal DMG — Intel + Apple Silicon).
* **10-Language Support:** English, Spanish, Russian, Portuguese, French, Japanese, German, Chinese, Thai, Arabic (with RTL support).
* **Extensible Converter System:** Rust-based converter modules (`image.rs`, `video.rs`, `audio.rs`, `archive.rs`) with clean Tauri command interfaces for easy addition of new formats.

## System Requirements

### Runtime (Pre-built Binaries)
| Platform | Minimum |
|----------|---------|
| **Windows** | Windows 10 1903+ (x64) |
| **Linux** | glibc 2.31+, GTK 3.24+, WebKitGTK 2.38+, FUSE (for AppImage) |
| **macOS** | macOS 11+ (Big Sur), Universal (Intel + Apple Silicon) |

### Build from Source
* **Node.js:** v20.x LTS or higher
* **Rust:** 1.80+ (stable toolchain via `rustup`)
* **Python:** 3.11+ (for document/ebook/OCR sidecar)
* **System Dependencies:**
  * `ffmpeg` (bundled in release, required for source build)
  * `libheif` (for HEIC/AVIF support)
  * `tesseract-ocr` (for OCR — bundled in Windows installer)
  * `calibre` (for ebook conversion — `ebook-convert` CLI)

## Installation

### Windows (Pre-built Binaries) — **Ready Now**

| File | Size | Type | Description |
|------|------|------|-------------|
| [`OpenConvert_1.0.0_x64-setup.exe`](src-tauri/target/release/bundle/nsis/OpenConvert_1.0.0_x64-setup.exe) | ~240 MB | **NSIS Installer** | Recommended. Creates Start Menu entry, adds to PATH, includes uninstaller, bundles all sidecars (FFmpeg, Python engine, Tesseract, Calibre). |
| [`OpenConvert_1.0.0_x64_en-US.msi`](src-tauri/target/release/bundle/msi/OpenConvert_1.0.0_x64_en-US.msi) | ~278 MB | **MSI Installer** | Enterprise/GPO deployment. Silent install support: `msiexec /i OpenConvert_1.0.0_x64_en-US.msi /qn` |
| **Portable** | ~12 MB + binaries | **Folder Copy** | Copy entire `src-tauri/target/release/` folder. Run `openconvert.exe`. Requires `binaries/` subfolder with `ffmpeg.exe`, `ffprobe.exe`, `openconvert-engine.exe`. |

> **Note**: Windows installers bundle all sidecars (FFmpeg, Python FastAPI engine, Tesseract OCR, Calibre). No separate installs needed.

### Linux & macOS (Via GitHub Releases)

Builds for Linux (`.AppImage`) and macOS (`.dmg`) are **not built locally** (Tauri compiles only for the current OS). They are generated automatically via **GitHub Actions CI/CD** on every release tag.

→ **Download from:** [GitHub Releases](https://github.com/ale-ratalife/OpenConvert/releases)

| Platform | Artifact | Install |
|----------|----------|---------|
| **Linux (x86_64)** | `OpenConvert_1.0.0_amd64.AppImage` | `chmod +x *.AppImage && ./*.AppImage` (requires `libfuse2`) |
| **macOS (Universal)** | `OpenConvert_1.0.0_universal.dmg` | Open DMG → drag to Applications → right-click → Open (first run) |

### From Source

```bash
# Prerequisites
# - Node.js 20+
# - Rust 1.80+ (rustup default stable)
# - Python 3.11+

# 1. Clone
git clone https://github.com/ale-ratalife/OpenConvert.git
cd OpenConvert

# 2. Frontend dependencies
npm install

# 3. Python sidecar dependencies
python -m venv venv
# Windows:
./venv/Scripts/python.exe -m pip install -r python-engine/requirements.txt
./venv/Scripts/python.exe -m pip install pyinstaller
./venv/Scripts/python.exe python-engine/build.py
# Linux/macOS:
./venv/bin/python -m pip install -r python-engine/requirements.txt
./venv/bin/python -m pip install pyinstaller
./venv/bin/python python-engine/build.py
# → Copies openconvert-engine.exe to src-tauri/binaries/

# 4. Download FFmpeg static binaries to src-tauri/binaries/
# Windows: https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
# Linux/macOS: use package manager (apt install ffmpeg, brew install ffmpeg)

# 5. Development (hot reload)
npm run tauri:dev

# 6. Production build
npm run tauri:build
# Output: src-tauri/target/release/bundle/
```

### Docker (Planned)

```dockerfile
# Planned: Multi-stage build with Tauri, Rust, Python, FFmpeg
# docker build -t openconvert:latest .
# docker run -v /path/to/files:/workspace openconvert:latest
```

## Configuration

Environment variables configure runtime behavior. Create a `.env` file in the project root or set system-wide:

```env
# Logging level (debug, info, warn, error)
OPENCONVERT_LOG_LEVEL=info

# API Server port
OPENCONVERT_API_PORT=8080

# Maximum upload file size (bytes)
OPENCONVERT_MAX_FILE_SIZE=104857600

# Python sidecar auto-start (true/false)
OPENCONVERT_SIDECAR_AUTO_START=true
```

### Tauri Config (`src-tauri/tauri.conf.json`)

```json
{
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi", "dmg", "appimage"],
    "identifier": "com.openconvert.app",
    "icon": ["icons/icon.png"],
    "windows": {
      "nsis": { "installerIcon": "icons/icon.ico" },
      "msi": { "upgradeCode": "{...}" }
    }
  },
  "plugins": {
    "opener": {},
    "fs": { "scope": ["$APPDATA/*", "$TEMP/*"] }
  }
}
```

## Usage Guide

### Graphical Interface (GUI)

1. **Launch** OpenConvert from Start Menu / Applications / terminal.
2. **Converter View** (default):
   - Drag & drop files or click "Select Files"
   - Choose output format per file (dropdown) or use "Convert All" for bulk
   - Click **Convert All** → progress tracked per file
   - Download converted files individually or as ZIP
3. **API Server View**:
   - Click **Start Server** → runs on `http://localhost:8080`
   - Copy **API Key** from UI
   - Open **Swagger UI** at `http://localhost:8080/docs`
4. **Settings View**:
   - Language selector (10 languages, instant switch)
   - Theme preview (Glassmorphism/Rose accent)
   - Clear cache, view privacy policy, about dialog

### API Integration

The built-in REST API enables automation and integration with other tools.

**Base URL:** `http://localhost:8080`  
**Auth:** Header `X-API-Key: <your-key>` (shown in API Server view)  
**Swagger Docs:** `http://localhost:8080/docs`

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Health check, returns `{ "status": "ok", "version": "1.0.0" }` |
| `POST` | `/api/convert` | Document conversion (PDF↔DOCX, TXT→PDF, PDF→Images) |
| `POST` | `/api/ebook` | Ebook conversion (Calibre: EPUB, MOBI, AZW3, etc.) |
| `POST` | `/api/ocr` | OCR — Image → Text (Tesseract) |

#### Example: Convert PDF to DOCX (cURL)

```bash
curl -X POST "http://localhost:8080/api/convert" \
  -H "X-API-Key: your-api-key-here" \
  -F "file=@document.pdf" \
  -F "target_format=docx" \
  --output document.docx
```

#### Example: OCR Image to Text (cURL)

```bash
curl -X POST "http://localhost:8080/api/ocr" \
  -H "X-API-Key: your-api-key-here" \
  -F "file=@scan.png" \
  -F "language=eng+spa"
```

#### Example: JavaScript/Node.js Integration

```javascript
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function convertPdfToDocx(inputPath, outputPath, apiKey) {
  const form = new FormData();
  form.append('file', fs.createReadStream(inputPath));
  form.append('target_format', 'docx');

  const res = await fetch('http://localhost:8080/api/convert', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey, ...form.getHeaders() },
    body: form
  });

  if (!res.ok) throw new Error(`Conversion failed: ${res.statusText}`);
  const dest = fs.createWriteStream(outputPath);
  res.body.pipe(dest);
  return new Promise((resolve, reject) => {
    dest.on('finish', resolve);
    dest.on('error', reject);
  });
}

// Usage
convertPdfToDocx('input.pdf', 'output.docx', 'your-api-key')
  .then(() => console.log('Done!'))
  .catch(console.error);
```

### Command Line (Planned)

Future releases will expose a CLI via Tauri's `cli` plugin:

```bash
# Planned syntax
openconvert process --input file.pdf --format docx --output ./out/
openconvert batch --dir ./images --format webp --threads 4
openconvert api start --port 8080 --api-key "xxx"
```

## Testing

```bash
# Frontend (Vitest + React Testing Library)
npm run test              # Unit tests
npm run test:ui           # UI tests with Vitest UI
npm run test:coverage     # Coverage report

# Rust Backend
cd src-tauri && cargo test           # Unit + integration tests
cd src-tauri && cargo test --doc     # Doc tests

# Python Sidecar
./venv/Scripts/python.exe -m pytest python-engine/ -v

# End-to-End (Playwright - planned)
npm run test:e2e
```

## Contributing

We adhere to a strict code of conduct and branching strategy.

1. **Fork** the repository: https://github.com/ale-ratalife/OpenConvert
2. **Create a feature branch:** `git checkout -b feature/issue-id-description`
3. **Commit** following Conventional Commits: `feat: add HEIC support`, `fix: resolve OCR timeout`
4. **Push:** `git push origin feature/issue-id-description`
5. **Open a Pull Request** detailing changes and linking relevant issues.

### Code Style

| Language | Tools |
|----------|-------|
| **Rust** | `cargo fmt` + `cargo clippy -D warnings` |
| **TypeScript/React** | `npm run lint` (ESLint + Prettier + TypeScript strict) |
| **Python** | `black` + `ruff` + `mypy` |

Please review `CONTRIBUTING.md` for comprehensive guidelines.

## License

This software is distributed under the **MIT License**. See the [`LICENSE`](LICENSE) file for full documentation.

## Credits & Acknowledgments

**Creation and Concept:** OpenConvert was conceptualized, designed, and developed by **[alexyalex.site](https://alexyalex.site)**.  
**Maintainer:** [ale-ratalife](https://github.com/ale-ratalife)

### Core Technologies
- **Tauri v2** — Lightweight, secure desktop app framework (Rust + WebView)
- **React 18 + TypeScript + Vite** — Modern frontend tooling
- **Tailwind CSS** — Utility-first styling with Glassmorphism design system
- **i18next** — Internationalization (10 languages)
- **Phosphor Icons** — Clean, consistent icon set

### Bundled Engines & Libraries
- **FFmpeg 7.x** — Multimedia processing (video, audio, frame extraction)
- **Rust `image` crate** — Native image format support (PNG, JPEG, WEBP, TIFF, BMP, GIF, ICO)
- **Rust `zip` crate** — Archive creation/extraction
- **Python 3.11 + FastAPI** — Document/Ebook/OCR microservice sidecar
- **Pillow** — Image processing for Python sidecar
- **python-docx** — DOCX read/write
- **Calibre (`ebook-convert`)** — Ebook format conversion (20+ formats)
- **Tesseract OCR** — Optical Character Recognition (100+ languages)

### Community
We thank the open-source community for the underlying libraries that make this project possible. Special thanks to the Tauri, FFmpeg, Calibre, and Tesseract teams for their exceptional work.

---

**Made with ❤️ for privacy-first file conversion**  
[Repository](https://github.com/ale-ratalife/OpenConvert) • [Issues](https://github.com/ale-ratalife/OpenConvert/issues) • [Releases](https://github.com/ale-ratalife/OpenConvert/releases)

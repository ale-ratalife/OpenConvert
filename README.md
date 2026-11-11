# OpenConvert

> **Free, open-source, privacy-first file conversion — 100% local, no cloud uploads, no tracking.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)](#)
[![Rust](https://img.shields.io/badge/rust-1.80%2B-orange.svg)](#)
[![React](https://img.shields.io/badge/react-18-61DAFB.svg)](#)
[![Tauri](https://img.shields.io/badge/tauri-v2-24C8DB.svg)](#)

**OpenConvert** is a robust, high-performance, open-source file conversion utility designed for versatile format transformations. Engineered with scalability and privacy in mind, it provides both a comprehensive **Graphical User Interface (GUI)** for manual processing and a **built-in REST API Server** for automated workflows. All operations are executed 100% locally, ensuring zero data leakage to third-party cloud services.

---

## 📑 Table of Contents

- [Architecture & Philosophy](#-architecture--philosophy)
- [Core Features](#-core-features)
- [System Requirements](#-system-requirements)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)
- [Credits & Acknowledgments](#-credits--acknowledgments)

---

## 🏛 Architecture & Philosophy

OpenConvert is built upon a **modular three-layer architecture** that separates concerns cleanly:

```text
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

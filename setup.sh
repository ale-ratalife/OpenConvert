#!/bin/bash
# OpenConvert Development Setup (Linux/macOS)

set -e

SKIP_RUST=false
SKIP_NODE=false
SKIP_PYTHON=false
SKIP_BINARIES=false
SKIP_BUILD=false

for arg in "$@"; do
    case $arg in
        --skip-rust) SKIP_RUST=true ;;
        --skip-node) SKIP_NODE=false ;;
        --skip-python) SKIP_PYTHON=true ;;
        --skip-binaries) SKIP_BINARIES=true ;;
        --skip-build) SKIP_BUILD=true ;;
    esac
done

echo "============================================"
echo "  OpenConvert Development Setup (Unix)"
echo "============================================"
echo ""

check_command() {
    if command -v "$1" &> /dev/null; then
        echo "✓ $2 found"
        return 0
    else
        echo "✗ $2 not found"
        return 1
    fi
}

download_file() {
    local url=$1
    local output=$2
    echo "Downloading $url..."
    if command -v curl &> /dev/null; then
        curl -L -o "$output" "$url"
    elif command -v wget &> /dev/null; then
        wget -O "$output" "$url"
    else
        echo "Error: curl or wget required"
        exit 1
    fi
}

# Check prerequisites
echo "=== Checking Prerequisites ==="

HAS_RUST=$(check_command "rustc" "Rust" && echo 1 || echo 0)
HAS_NODE=$(check_command "node" "Node.js" && echo 1 || echo 0)
HAS_PYTHON=$(check_command "python3" "Python" && echo 1 || echo 0)

if [ "$HAS_RUST" = "0" ] && [ "$SKIP_RUST" = "false" ]; then
    echo "Rust is required. Install from https://rustup.rs/"
    exit 1
fi

if [ "$HAS_NODE" = "0" ] && [ "$SKIP_NODE" = "false" ]; then
    echo "Node.js is required. Install from https://nodejs.org/"
    exit 1
fi

if [ "$HAS_PYTHON" = "0" ] && [ "$SKIP_PYTHON" = "false" ]; then
    echo "Python is required. Install from https://python.org/"
    exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINARIES_DIR="$PROJECT_ROOT/src-tauri/binaries"
PYTHON_ENGINE_DIR="$PROJECT_ROOT/python-engine"
VENV_DIR="$PROJECT_ROOT/venv"

mkdir -p "$BINARIES_DIR"

# Download FFmpeg
if [ "$SKIP_BINARIES" = "false" ]; then
    echo ""
    echo "=== Downloading FFmpeg ==="

    if [ ! -f "$BINARIES_DIR/ffmpeg" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            FFMPEG_URL="https://evermeet.cx/ffmpeg/getrelease/zip"
        else
            FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
        fi

        TEMP_DIR=$(mktemp -d)
        cd "$TEMP_DIR"

        download_file "$FFMPEG_URL" "ffmpeg.archive"

        if [[ "$OSTYPE" == "darwin"* ]]; then
            unzip -q ffmpeg.archive
            cp ffmpeg "$BINARIES_DIR/"
            cp ffprobe "$BINARIES_DIR/"
        else
            tar -xf ffmpeg.archive
            find . -name "ffmpeg" -type f -exec cp {} "$BINARIES_DIR/" \;
            find . -name "ffprobe" -type f -exec cp {} "$BINARIES_DIR/" \;
        fi

        chmod +x "$BINARIES_DIR/ffmpeg" "$BINARIES_DIR/ffprobe"
        echo "✓ FFmpeg binaries copied"
        cd "$PROJECT_ROOT"
        rm -rf "$TEMP_DIR"
    else
        echo "✓ FFmpeg already present"
    fi
fi

# Setup Python virtual environment
if [ "$SKIP_PYTHON" = "false" ]; then
    echo ""
    echo "=== Setting up Python Environment ==="

    if [ ! -d "$VENV_DIR" ]; then
        echo "Creating virtual environment..."
        python3 -m venv "$VENV_DIR"
    fi

    source "$VENV_DIR/bin/activate"
    pip install --upgrade pip setuptools wheel

    echo "Installing Python dependencies..."
    pip install -r "$PYTHON_ENGINE_DIR/requirements.txt"

    echo "Building Python sidecar..."
    pip install pyinstaller
    pyinstaller \
        --onefile \
        --name openconvert-engine \
        --distpath "$PYTHON_ENGINE_DIR/dist" \
        --workpath "$PYTHON_ENGINE_DIR/build" \
        --specpath "$PYTHON_ENGINE_DIR" \
        --clean \
        --noconfirm \
        "$PYTHON_ENGINE_DIR/app.py"

    ENGINE_EXE="$PYTHON_ENGINE_DIR/dist/openconvert-engine"
    if [ -f "$ENGINE_EXE" ]; then
        cp "$ENGINE_EXE" "$BINARIES_DIR/openconvert-engine"
        chmod +x "$BINARIES_DIR/openconvert-engine"
        echo "✓ Python sidecar built and copied to binaries/"
    else
        echo "✗ Python sidecar build failed"
        exit 1
    fi
fi

# Install Node dependencies
if [ "$SKIP_NODE" = "false" ]; then
    echo ""
    echo "=== Installing Node Dependencies ==="
    cd "$PROJECT_ROOT"
    npm install
fi

# Build Rust project
if [ "$SKIP_RUST" = "false" ] && [ "$SKIP_BUILD" = "false" ]; then
    echo ""
    echo "=== Building Rust Project ==="
    cd "$PROJECT_ROOT"
    cargo build --release
fi

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "To start development server:"
echo "  npm run tauri:dev"
echo ""
echo "To build release:"
echo "  npm run tauri:build"
echo ""
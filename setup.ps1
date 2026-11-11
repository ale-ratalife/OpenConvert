<#
.SYNOPSIS
    Setup script for OpenConvert development environment on Windows

.DESCRIPTION
    This script installs all required dependencies and builds the Python sidecar executable.
#>

param(
    [switch]$SkipRust,
    [switch]$SkipNode,
    [switch]$SkipPython,
    [switch]$SkipBinaries,
    [switch]$SkipBuild
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  OpenConvert Development Setup (Windows)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

function Check-Command {
    param($Command, $Name)
    try {
        & $Command --version 2>$null | Out-Null
        Write-Host "✓ $Name found" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ $Name not found" -ForegroundColor Red
        return $false
    }
}

function Download-File {
    param($Url, $OutputPath)
    Write-Host "Downloading $Url..."
    try {
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing
        Write-Host "✓ Downloaded to $OutputPath" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to download: $_" -ForegroundColor Red
        throw $_
    }
}

# Check prerequisites
Write-Host "`n=== Checking Prerequisites ===" -ForegroundColor Yellow

$hasRust = Check-Command "rustc" "Rust"
$hasNode = Check-Command "node" "Node.js"
$hasPython = Check-Command "python" "Python"

if (-not $hasRust -and -not $SkipRust) {
    Write-Host "`nRust is required. Install from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

if (-not $hasNode -and -not $SkipNode) {
    Write-Host "`nNode.js is required. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

if (-not $hasPython -and -not $SkipPython) {
    Write-Host "`nPython is required. Install from https://python.org/" -ForegroundColor Red
    exit 1
}

# Setup directories
$projectRoot = $PSScriptRoot
$binariesDir = Join-Path $projectRoot "src-tauri" "binaries"
$pythonEngineDir = Join-Path $projectRoot "python-engine"
$venvDir = Join-Path $projectRoot "venv"

if (-not (Test-Path $binariesDir)) {
    New-Item -ItemType Directory -Path $binariesDir | Out-Null
}

# Download FFmpeg
if (-not $SkipBinaries) {
    Write-Host "`n=== Downloading FFmpeg ===" -ForegroundColor Yellow

    $ffmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    $ffmpegZip = Join-Path $binariesDir "ffmpeg.zip"

    if (-not (Test-Path (Join-Path $binariesDir "ffmpeg.exe"))) {
        Download-File $ffmpegUrl $ffmpegZip

        Write-Host "Extracting FFmpeg..."
        Expand-Archive -Path $ffmpegZip -DestinationPath $binariesDir -Force

        $extractedDir = Get-ChildItem $binariesDir -Directory | Where-Object { $_.Name -like "ffmpeg-*" } | Select-Object -First 1
        if ($extractedDir) {
            $binDir = Join-Path $extractedDir.FullName "bin"
            Copy-Item (Join-Path $binDir "ffmpeg.exe") $binariesDir -Force
            Copy-Item (Join-Path $binDir "ffprobe.exe") $binariesDir -Force
            Write-Host "✓ FFmpeg binaries copied" -ForegroundColor Green
        }

        Remove-Item $ffmpegZip -Force
        Remove-Item $extractedDir.FullName -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "✓ FFmpeg already present" -ForegroundColor Green
    }
}

# Setup Python virtual environment
if (-not $SkipPython) {
    Write-Host "`n=== Setting up Python Environment ===" -ForegroundColor Yellow

    if (-not (Test-Path $venvDir)) {
        Write-Host "Creating virtual environment..."
        python -m venv $venvDir
    }

    $pip = Join-Path $venvDir "Scripts" "pip.exe"
    & $pip install --upgrade pip setuptools wheel

    Write-Host "Installing Python dependencies..."
    & $pip install -r (Join-Path $pythonEngineDir "requirements.txt")

    Write-Host "Building Python sidecar..."
    & $pip install pyinstaller
    & (Join-Path $venvDir "Scripts" "pyinstaller.exe") `
        --onefile `
        --name openconvert-engine `
        --distpath (Join-Path $pythonEngineDir "dist") `
        --workpath (Join-Path $pythonEngineDir "build") `
        --specpath $pythonEngineDir `
        --clean `
        --noconfirm `
        (Join-Path $pythonEngineDir "app.py")

    $engineExe = Join-Path $pythonEngineDir "dist" "openconvert-engine.exe"
    if (Test-Path $engineExe) {
        Copy-Item $engineExe (Join-Path $binariesDir "openconvert-engine.exe") -Force
        Write-Host "✓ Python sidecar built and copied to binaries/" -ForegroundColor Green
    } else {
        Write-Host "✗ Python sidecar build failed" -ForegroundColor Red
        exit 1
    }
}

# Install Node dependencies
if (-not $SkipNode) {
    Write-Host "`n=== Installing Node Dependencies ===" -ForegroundColor Yellow
    npm install
}

# Build Rust project
if (-not $SkipRust -and -not $SkipBuild) {
    Write-Host "`n=== Building Rust Project ===" -ForegroundColor Yellow
    cd $projectRoot
    cargo build --release
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start development server:" -ForegroundColor Yellow
Write-Host "  npm run tauri:dev"
Write-Host ""
Write-Host "To build release:" -ForegroundColor Yellow
Write-Host "  npm run tauri:build"
Write-Host ""
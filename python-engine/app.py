import os
import sys
import tempfile
import shutil
import uuid
import argparse
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Header
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="OpenConvert Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEYS = set()

def verify_api_key(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid API key")
    key = authorization[7:]
    if key not in API_KEYS:
        raise HTTPException(status_code=403, detail="Invalid API key")

@app.get("/api/status")
async def get_status():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/api/convert")
async def convert_file(
    file: UploadFile = File(...),
    target_format: str = Form(...),
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = Path(tmpdir) / file.filename
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)

        output_filename = f"{uuid.uuid4().hex}.{target_format.lower()}"
        output_path = Path(tmpdir) / output_filename

        try:
            result_path = convert_document(input_path, output_path, target_format)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        return FileResponse(
            result_path,
            media_type="application/octet-stream",
            filename=output_filename
        )

def convert_document(input_path: Path, output_path: Path, target_format: str) -> Path:
    suffix = input_path.suffix.lower()
    target = target_format.lower()

    if suffix == ".pdf" and target == "docx":
        return pdf_to_docx(input_path, output_path)
    elif suffix in [".docx", ".doc"] and target == "pdf":
        return docx_to_pdf(input_path, output_path)
    elif suffix in [".txt", ".md", ".rtf"] and target == "pdf":
        return text_to_pdf(input_path, output_path)
    elif suffix == ".pdf" and target in ["png", "jpg", "jpeg", "webp", "tiff"]:
        return pdf_to_images(input_path, output_path, target)
    else:
        raise ValueError(f"Unsupported conversion: {suffix} -> {target}")

def pdf_to_docx(input_path: Path, output_path: Path) -> Path:
    from pdf2docx import Converter
    cv = Converter(str(input_path))
    cv.convert(str(output_path))
    cv.close()
    return output_path

def docx_to_pdf(input_path: Path, output_path: Path) -> Path:
    try:
        from docx2pdf import convert
        convert(str(input_path), str(output_path))
    except ImportError:
        import subprocess
        subprocess.run([
            "libreoffice", "--headless", "--convert-to", "pdf",
            "--outdir", str(output_path.parent), str(input_path)
        ], check=True)
    return output_path

def text_to_pdf(input_path: Path, output_path: Path) -> Path:
    from fpdf import FPDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)

    with open(input_path, "r", encoding="utf-8") as f:
        for line in f:
            pdf.cell(0, 10, line.rstrip(), new_x="LMARGIN", new_y="NEXT")

    pdf.output(str(output_path))
    return output_path

def pdf_to_images(input_path: Path, output_path: Path, fmt: str) -> Path:
    from pdf2image import convert_from_path
    images = convert_from_path(str(input_path))
    if images:
        images[0].save(str(output_path), format=fmt.upper())
    return output_path

@app.post("/api/ebook")
async def convert_ebook(
    file: UploadFile = File(...),
    target_format: str = Form(...),
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = Path(tmpdir) / file.filename
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)

        output_filename = f"{uuid.uuid4().hex}.{target_format.lower()}"
        output_path = Path(tmpdir) / output_filename

        try:
            result_path = convert_ebook_file(input_path, output_path, target_format)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        return FileResponse(
            result_path,
            media_type="application/octet-stream",
            filename=output_filename
        )

def convert_ebook_file(input_path: Path, output_path: Path, target_format: str) -> Path:
    import subprocess
    result = subprocess.run([
        "ebook-convert", str(input_path), str(output_path)
    ], capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"Calibre error: {result.stderr}")
    return output_path

@app.post("/api/ocr")
async def ocr_image(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = Path(tmpdir) / file.filename
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)

        try:
            text = perform_ocr(input_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        return {"text": text}

def perform_ocr(image_path: Path) -> str:
    import pytesseract
    from PIL import Image
    img = Image.open(image_path)
    return pytesseract.image_to_string(img)

def main():
    parser = argparse.ArgumentParser(description="OpenConvert Python Engine")
    parser.add_argument("--port", type=int, default=8080, help="Port to run the server on")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind to")
    args = parser.parse_args()

    global API_KEYS
    API_KEYS.add(f"oc_{uuid.uuid4().hex}")

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")

if __name__ == "__main__":
    main()
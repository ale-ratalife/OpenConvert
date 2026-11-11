import os
import sys
import subprocess
import shutil
from pathlib import Path

def build_python_engine():
    project_root = Path(__file__).parent.parent
    python_engine_dir = Path(__file__).parent
    dist_dir = python_engine_dir / "dist"
    build_dir = python_engine_dir / "build"

    for d in [dist_dir, build_dir]:
        if d.exists():
            shutil.rmtree(d)

    venv_dir = project_root / "venv"
    if sys.platform == "win32":
        python_exe = venv_dir / "Scripts" / "python.exe"
        pip_exe = venv_dir / "Scripts" / "pip.exe"
    else:
        python_exe = venv_dir / "bin" / "python"
        pip_exe = venv_dir / "bin" / "pip"

    if not python_exe.exists():
        print("Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)

    print("Installing dependencies...")
    subprocess.run([str(pip_exe), "install", "-r", str(python_engine_dir / "requirements.txt")], check=True)

    print("Installing PyInstaller...")
    subprocess.run([str(pip_exe), "install", "pyinstaller"], check=True)

    print("Building executable with PyInstaller...")
    cmd = [
        str(venv_dir / "Scripts" / "pyinstaller.exe" if sys.platform == "win32" else venv_dir / "bin" / "pyinstaller"),
        "--onefile",
        "--name", "openconvert-engine",
        "--distpath", str(dist_dir),
        "--workpath", str(build_dir),
        "--specpath", str(python_engine_dir),
        "--clean",
        "--noconfirm",
        str(python_engine_dir / "app.py"),
    ]

    subprocess.run(cmd, check=True)

    exe_name = "openconvert-engine.exe" if sys.platform == "win32" else "openconvert-engine"
    output_exe = dist_dir / exe_name

    if output_exe.exists():
        print(f"Build successful: {output_exe}")
        print(f"Size: {output_exe.stat().st_size / (1024*1024):.1f} MB")
    else:
        print("Build failed: executable not found")
        sys.exit(1)

if __name__ == "__main__":
    build_python_engine()
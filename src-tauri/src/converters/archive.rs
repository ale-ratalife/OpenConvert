use std::path::{Path, PathBuf};
use std::fs;
use walkdir::WalkDir;
use zip::write::FileOptions;
use zip::CompressionMethod;
use std::io::{Read, Write};

pub async fn create_archive(file_paths: &[String], output_path: &str) -> Result<String, String> {
    let output_path = PathBuf::from(output_path);
    let output_dir = output_path.parent().unwrap();
    fs::create_dir_all(output_dir).map_err(|e| e.to_string())?;

    let file = fs::File::create(&output_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);

    let options = FileOptions::default()
        .compression_method(CompressionMethod::Deflated)
        .unix_permissions(0o755);

    for file_path in file_paths {
        let path = Path::new(file_path);
        if path.is_file() {
            let name = path.file_name().unwrap().to_string_lossy().to_string();
            zip.start_file(&name, options).map_err(|e| e.to_string())?;
            let content = fs::read(path).map_err(|e| e.to_string())?;
            zip.write_all(&content).map_err(|e| e.to_string())?;
        } else if path.is_dir() {
            for entry in WalkDir::new(path) {
                let entry = entry.map_err(|e| e.to_string())?;
                let entry_path = entry.path();
                if entry_path.is_file() {
                    let relative = entry_path.strip_prefix(path).map_err(|e| e.to_string())?;
                    let name = relative.to_string_lossy().to_string();
                    zip.start_file(&name, options).map_err(|e| e.to_string())?;
                    let content = fs::read(entry_path).map_err(|e| e.to_string())?;
                    zip.write_all(&content).map_err(|e| e.to_string())?;
                }
            }
        }
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(output_path.to_string_lossy().to_string())
}

pub async fn extract_archive(file_path: &str, output_dir: &str) -> Result<String, String> {
    let file_path = Path::new(file_path);
    let output_dir = PathBuf::from(output_dir);
    fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;

    let file = fs::File::open(file_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = output_dir.join(file.mangled_name());

        if file.is_dir() {
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
            outfile.write_all(&buffer).map_err(|e| e.to_string())?;
        }
    }

    Ok(output_dir.to_string_lossy().to_string())
}
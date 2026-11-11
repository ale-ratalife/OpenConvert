use std::path::{Path, PathBuf};
use std::process::Command;
use tokio::fs;
use uuid::Uuid;
use tauri::Manager;

async fn get_ffmpeg_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    let ffmpeg_name = "ffmpeg.exe";
    #[cfg(not(target_os = "windows"))]
    let ffmpeg_name = "ffmpeg";

    let ffmpeg_path = resource_dir.join("binaries").join(ffmpeg_name);

    if ffmpeg_path.exists() {
        Ok(ffmpeg_path)
    } else {
        Err("FFmpeg binary not found in resources".to_string())
    }
}

pub async fn convert_video(
    input_path: &Path,
    target_format: &str,
    app_handle: &tauri::AppHandle,
) -> Result<String, String> {
    let ffmpeg_path = get_ffmpeg_path(app_handle).await?;

    let output_dir = std::env::temp_dir().join("openconvert").join("output");
    fs::create_dir_all(&output_dir).await.map_err(|e| e.to_string())?;

    let output_name = format!(
        "{}.{}",
        Uuid::new_v4().simple(),
        target_format.to_lowercase()
    );
    let output_path = output_dir.join(&output_name);

    let codec_args = match target_format.to_lowercase().as_str() {
        "mp4" => vec!["-c:v", "libx264", "-c:a", "aac", "-preset", "medium", "-crf", "23"],
        "webm" => vec!["-c:v", "libvpx-vp9", "-c:a", "libopus", "-crf", "30", "-b:v", "0"],
        "mkv" => vec!["-c:v", "libx264", "-c:a", "copy"],
        "avi" => vec!["-c:v", "libxvid", "-c:a", "libmp3lame", "-q:v", "5"],
        "mov" => vec!["-c:v", "libx264", "-c:a", "aac", "-preset", "medium", "-crf", "23"],
        "flv" => vec!["-c:v", "libx264", "-c:a", "aac", "-preset", "medium", "-crf", "23"],
        _ => return Err(format!("Unsupported video format: {}", target_format)),
    };

    let mut args = vec!["-y", "-i", input_path.to_str().unwrap()];
    args.extend(codec_args);
    args.push(output_path.to_str().unwrap());

    let output = Command::new(&ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg error: {}", error));
    }

    Ok(output_path.to_string_lossy().to_string())
}

pub async fn extract_audio(
    input_path: &Path,
    target_format: &str,
    app_handle: &tauri::AppHandle,
) -> Result<String, String> {
    let ffmpeg_path = get_ffmpeg_path(app_handle).await?;

    let output_dir = std::env::temp_dir().join("openconvert").join("output");
    fs::create_dir_all(&output_dir).await.map_err(|e| e.to_string())?;

    let output_name = format!(
        "{}.{}",
        Uuid::new_v4().simple(),
        target_format.to_lowercase()
    );
    let output_path = output_dir.join(&output_name);

    let codec_args = match target_format.to_lowercase().as_str() {
        "mp3" => vec!["-c:a", "libmp3lame", "-q:a", "2"],
        "wav" => vec!["-c:a", "pcm_s16le"],
        "flac" => vec!["-c:a", "flac"],
        "aac" => vec!["-c:a", "aac", "-b:a", "192k"],
        "ogg" => vec!["-c:a", "libvorbis", "-q:a", "5"],
        "m4a" => vec!["-c:a", "aac", "-b:a", "192k"],
        _ => return Err(format!("Unsupported audio format: {}", target_format)),
    };

    let mut args = vec!["-y", "-i", input_path.to_str().unwrap(), "-vn"];
    args.extend(codec_args);
    args.push(output_path.to_str().unwrap());

    let output = Command::new(&ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg error: {}", error));
    }

    Ok(output_path.to_string_lossy().to_string())
}

pub async fn extract_frame(
    input_path: &Path,
    timestamp: &str,
    app_handle: &tauri::AppHandle,
) -> Result<String, String> {
    let ffmpeg_path = get_ffmpeg_path(app_handle).await?;

    let output_dir = std::env::temp_dir().join("openconvert").join("output");
    fs::create_dir_all(&output_dir).await.map_err(|e| e.to_string())?;

    let output_name = format!("{}.png", Uuid::new_v4().simple());
    let output_path = output_dir.join(&output_name);

    let args = vec![
        "-y", "-ss", timestamp, "-i", input_path.to_str().unwrap(),
        "-vframes", "1", "-q:v", "2",
        output_path.to_str().unwrap()
    ];

    let output = Command::new(&ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg error: {}", error));
    }

    Ok(output_path.to_string_lossy().to_string())
}
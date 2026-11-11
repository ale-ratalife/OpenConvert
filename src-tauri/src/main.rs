#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod converters;
mod sidecar;

use converters::image::convert_image;
use converters::video::convert_video;
use converters::audio::convert_audio;
use converters::archive::{create_archive, extract_archive};
use sidecar::{start_python_server, stop_python_server, get_python_server_status, call_python_api, PythonSidecarState};
use std::path::PathBuf;
use tauri::{State, AppHandle};
use std::sync::Mutex;
use std::process::Command as StdCommand;

#[tauri::command]
async fn convert_file(
    file_path: String,
    target_format: String,
    app_handle: AppHandle,
) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    let extension = path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let mime_type = mime_guess::from_path(&path).first_or_octet_stream();
    let category = mime_type.type_().as_str();

    let output_path = match category {
        "image" => convert_image(&path, &target_format).await?,
        "video" => convert_video(&path, &target_format, &app_handle).await?,
        "audio" => convert_audio(&path, &target_format, &app_handle).await?,
        "application" | "text" => {
            call_python_api("convert_document", serde_json::json!({
                "file_path": file_path,
                "target_format": target_format
            })).await?
        }
        _ => return Err(format!("Unsupported file type: {}", category)),
    };

    Ok(output_path)
}

#[tauri::command]
async fn convert_document(
    file_path: String,
    target_format: String,
) -> Result<String, String> {
    call_python_api("convert_document", serde_json::json!({
        "file_path": file_path,
        "target_format": target_format
    })).await
}

#[tauri::command]
async fn convert_ebook(
    file_path: String,
    target_format: String,
) -> Result<String, String> {
    call_python_api("convert_ebook", serde_json::json!({
        "file_path": file_path,
        "target_format": target_format
    })).await
}

#[tauri::command]
async fn ocr_image(file_path: String) -> Result<String, String> {
    call_python_api("ocr_image", serde_json::json!({
        "file_path": file_path
    })).await
}

#[tauri::command]
async fn create_zip(file_paths: Vec<String>, output_path: String) -> Result<String, String> {
    create_archive(&file_paths, &output_path).await
}

#[tauri::command]
async fn extract_zip(file_path: String, output_dir: String) -> Result<String, String> {
    extract_archive(&file_path, &output_dir).await
}

#[tauri::command]
async fn start_api_server(port: u16, state: State<'_, PythonSidecarState>, app_handle: AppHandle) -> Result<(), String> {
    start_python_server(port, state, app_handle).await
}

#[tauri::command]
async fn stop_api_server(state: State<'_, PythonSidecarState>) -> Result<(), String> {
    stop_python_server(state).await
}

#[tauri::command]
async fn get_api_server_status(state: State<'_, PythonSidecarState>) -> Result<serde_json::Value, String> {
    get_python_server_status(state).await
}

#[tauri::command]
async fn generate_api_key() -> Result<String, String> {
    use uuid::Uuid;
    Ok(format!("oc_{}", Uuid::new_v4().simple()))
}

#[tauri::command]
async fn get_local_ip() -> Result<String, String> {
    let interfaces = if_addrs::get_if_addrs().map_err(|e| e.to_string())?;
    for iface in interfaces {
        if !iface.is_loopback() && iface.ip().is_ipv4() {
            return Ok(iface.ip().to_string());
        }
    }
    Ok("127.0.0.1".to_string())
}

#[tauri::command]
async fn open_path(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        StdCommand::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        StdCommand::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        StdCommand::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn clear_cache() -> Result<(), String> {
    let temp_dir = std::env::temp_dir().join("openconvert");
    if temp_dir.exists() {
        std::fs::remove_dir_all(&temp_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .manage(PythonSidecarState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            convert_file,
            convert_document,
            convert_ebook,
            ocr_image,
            create_zip,
            extract_zip,
            start_api_server,
            stop_api_server,
            get_api_server_status,
            generate_api_key,
            get_local_ip,
            open_path,
            clear_cache,
            get_app_version,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
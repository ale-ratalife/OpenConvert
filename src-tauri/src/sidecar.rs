use tauri::{AppHandle, Manager, State};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;
use std::sync::Mutex;
use std::time::Duration;
use tokio::time::sleep;

pub struct PythonSidecarState(pub Mutex<Option<CommandChild>>);

async fn get_python_executable(app_handle: &AppHandle) -> Result<std::path::PathBuf, String> {
    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    let exe_name = "openconvert-engine.exe";
    #[cfg(not(target_os = "windows"))]
    let exe_name = "openconvert-engine";

    let exe_path = resource_dir.join("binaries").join(exe_name);

    if exe_path.exists() {
        Ok(exe_path)
    } else {
        Err("Python sidecar executable not found".to_string())
    }
}

pub async fn start_python_server(
    port: u16,
    state: State<'_, PythonSidecarState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Check if already running - drop guard before await
    let already_running = {
        let guard = state.0.lock().unwrap();
        guard.is_some()
    };
    if already_running {
        return Err("Server already running".to_string());
    }

    let exe_path = get_python_executable(&app_handle).await?;

    let (_, child) = app_handle
        .shell()
        .sidecar(exe_path)
        .map_err(|e| e.to_string())?
        .args(["--port", &port.to_string()])
        .spawn()
        .map_err(|e| e.to_string())?;

    {
        let mut guard = state.0.lock().unwrap();
        *guard = Some(child);
    }

    sleep(Duration::from_millis(1000)).await;

    Ok(())
}

pub async fn stop_python_server(state: State<'_, PythonSidecarState>) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();
    if let Some(child) = guard.take() {
        child.kill().map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub async fn get_python_server_status(
    state: State<'_, PythonSidecarState>,
) -> Result<serde_json::Value, String> {
    let guard = state.0.lock().unwrap();
    let running = guard.is_some();

    Ok(serde_json::json!({
        "running": running,
        "queue_size": 0
    }))
}

pub async fn call_python_api(endpoint: &str, payload: serde_json::Value) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("http://localhost:8080/api/{}", endpoint);

    let response = client
        .post(&url)
        .json(&payload)
        .timeout(Duration::from_secs(300))
        .send()
        .await
        .map_err(|e| format!("Failed to call Python API: {}", e))?;

    if !response.status().is_success() {
        let error = response.text().await.unwrap_or_default();
        return Err(format!("Python API error: {}", error));
    }

    let result: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;

    result.get("output_path")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "No output path in response".to_string())
}
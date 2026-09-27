// Casca Tauri fina do ChronoKairo Desktop.
// O núcleo de lógica é o crate zero-lib `ckc` (../core), fonte de verdade do código Rust.
// Aqui ficam apenas o bootstrap do Tauri e os comandos que fazem a ponte para o ckc.
//
// NOTE (débito registrado em ADR): o wiring detalhado dos comandos Tauri para as
// funções do ckc (agent, llm, tools, repo, etc.) ainda será conectado incrementalmente.
// Esta casca já compila e sobe a janela; os comandos abaixo demonstram o consumo do núcleo.

// Reexporta o núcleo para uso interno dos comandos.
pub use ckc;

use tauri::Emitter;
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
fn ckc_version() -> String {
    // Exemplo de ponte para o núcleo: identifica o núcleo zero-lib consumido pela casca.
    format!("ckc-core {}", env!("CARGO_PKG_VERSION"))
}

/// Verifica atualizações no endpoint configurado (plugins.updater do tauri.conf).
/// Emite `updater://status` para o frontend e devolve um resumo legível.
#[tauri::command]
async fn check_for_updates(
    app: tauri::AppHandle,
    window: tauri::Window,
) -> Result<String, String> {
    let updater = app
        .updater()
        .map_err(|error| format!("updater plugin indisponível: {error}"))?;
    let update = updater
        .check()
        .await
        .map_err(|error| format!("falha ao checar atualizações: {error}"))?;
    match update {
        None => {
            let _ = window.emit("updater://status", "up-to-date");
            Ok("nenhuma atualização disponível".to_string())
        }
        Some(update) => {
            let summary = format!(
                "atualização disponível: v{} (atual v{})",
                update.version,
                app.package_info().version
            );
            let _ = window.emit("updater://status", "available");
            Ok(summary)
        }
    }
}

/// Baixa e instala a atualização; reinicia a app quando solicitado.
#[tauri::command]
async fn install_update(app: tauri::AppHandle, restart: bool) -> Result<String, String> {
    let updater = app
        .updater()
        .map_err(|error| format!("updater plugin indisponível: {error}"))?;
    let update = updater
        .check()
        .await
        .map_err(|error| format!("falha ao checar atualizações: {error}"))?
        .ok_or_else(|| "nenhuma atualização pendente".to_string())?;
    let version = update.version.clone();
    update
        .download_and_install()
        .await
        .map_err(|error| format!("falha ao instalar atualização: {error}"))?;
    if restart {
        app.restart();
    }
    Ok(format!("atualização v{version} instalada"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            ckc_version,
            check_for_updates,
            install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

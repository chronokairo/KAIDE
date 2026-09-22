// Casca Tauri fina do ChronoKairo Desktop.
// O núcleo de lógica é o crate zero-lib `ckc` (../core), fonte de verdade do código Rust.
// Aqui ficam apenas o bootstrap do Tauri e os comandos que fazem a ponte para o ckc.
//
// NOTE (débito registrado em ADR): o wiring detalhado dos comandos Tauri para as
// funções do ckc (agent, llm, tools, repo, etc.) ainda será conectado incrementalmente.
// Esta casca já compila e sobe a janela; os comandos abaixo demonstram o consumo do núcleo.

// Reexporta o núcleo para uso interno dos comandos.
pub use ckc;

#[tauri::command]
fn ckc_version() -> String {
    // Exemplo de ponte para o núcleo: identifica o núcleo zero-lib consumido pela casca.
    format!("ckc-core {}", env!("CARGO_PKG_VERSION"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![ckc_version])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

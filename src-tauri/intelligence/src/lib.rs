#[cfg(feature = "desktop")]
pub mod commands;
pub mod compressor;
pub mod dossier;
pub mod graph;
pub mod ingest;
pub mod llm;
pub mod mcp;
pub mod models_dev;
pub mod provider_manager;
pub mod providers;
pub mod repo;
pub mod researcher;
pub mod search_harness;
pub mod verify;

#[cfg(feature = "desktop")]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    providers::load_dotenv();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::execute_investigation,
            commands::get_graph_data,
            commands::run_verification,
            commands::generate_dossier_markdown,
            commands::test_nvidia_nim_connection,
            commands::get_provider_env_status,
            commands::get_acp_providers,
            commands::run_acp_agent,
            commands::ask_intelligence_agent,
            commands::get_public_sources_by_category,
            commands::add_public_source,
            commands::remove_public_source,
            commands::get_public_sources_history,
            commands::capture_web_snapshot,
            commands::get_captured_snapshots,
            commands::capture_app_ui_snapshot,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


use crate::llm::client::{ToolDef, ToolFunction};
use serde::Serialize;
use serde_json::Value;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::process::Command;

const KILO_ID: &str = "kilo";
const OPENCODE_ID: &str = "opencode";
const KILO_DEFAULT_MODEL: &str = "kilo/kilo-auto/free";
const OPENCODE_DEFAULT_MODEL: &str = "opencode/nemotron-3-ultra-free";

#[derive(Debug, Clone, Serialize)]
pub struct AcpProviderInfo {
    pub id: String,
    pub display_name: String,
    pub installed: bool,
    pub version: Option<String>,
    pub binary_path: Option<String>,
    pub models: Vec<String>,
    pub model_count: usize,
    pub default_model: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone)]
pub struct AcpToolInfo {
    pub provider_id: String,
    pub name: String,
    pub display_name: String,
    pub binary_path: String,
    launcher: Launcher,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Launcher {
    Direct,
    PowerShell,
    Cmd,
}

struct ProviderSpec {
    id: &'static str,
    display_name: &'static str,
    tool_name: &'static str,
    candidates: &'static [&'static str],
    default_model: &'static str,
}

const PROVIDERS: &[ProviderSpec] = &[
    ProviderSpec {
        id: KILO_ID,
        display_name: "Kilo Code",
        tool_name: "acp_kilo_code_search",
        candidates: &["kilo", "kilo.exe", "kilo-code", "acp-kilo"],
        default_model: KILO_DEFAULT_MODEL,
    },
    ProviderSpec {
        id: OPENCODE_ID,
        display_name: "OpenCode",
        tool_name: "acp_opencode_search",
        candidates: &["opencode", "opencode.cmd", "open-code", "acp-opencode"],
        default_model: OPENCODE_DEFAULT_MODEL,
    },
];

pub fn detect_acp_tools() -> Vec<AcpToolInfo> {
    PROVIDERS.iter().filter_map(detect_provider).collect()
}

pub fn get_acp_provider_statuses() -> Vec<AcpProviderInfo> {
    PROVIDERS
        .iter()
        .map(|spec| match detect_provider(spec) {
            Some(tool) => {
                let version = cli_version(&tool).ok();
                match list_models(&tool) {
                    Ok(models) => AcpProviderInfo {
                        id: spec.id.to_string(),
                        display_name: spec.display_name.to_string(),
                        installed: true,
                        version,
                        binary_path: Some(tool.binary_path),
                        model_count: models.len(),
                        default_model: preferred_model(spec, &models),
                        models,
                        error: None,
                    },
                    Err(error) => AcpProviderInfo {
                        id: spec.id.to_string(),
                        display_name: spec.display_name.to_string(),
                        installed: true,
                        version,
                        binary_path: Some(tool.binary_path),
                        models: Vec::new(),
                        model_count: 0,
                        default_model: None,
                        error: Some(error),
                    },
                }
            }
            None => AcpProviderInfo {
                id: spec.id.to_string(),
                display_name: spec.display_name.to_string(),
                installed: false,
                version: None,
                binary_path: None,
                models: Vec::new(),
                model_count: 0,
                default_model: None,
                error: Some(format!("{} não foi encontrado no PATH.", spec.display_name)),
            },
        })
        .collect()
}

pub fn run_acp_prompt(provider_id: &str, model: &str, prompt: &str) -> Result<String, String> {
    let spec = provider_spec(provider_id)
        .ok_or_else(|| format!("Provedor ACP desconhecido: {provider_id}"))?;
    let tool = detect_provider(spec)
        .ok_or_else(|| format!("{} não foi encontrado no PATH.", spec.display_name))?;
    let prompt = prompt.trim();
    if prompt.is_empty() {
        return Err("O prompt ACP não pode ser vazio.".to_string());
    }

    let models = list_models(&tool)?;
    let selected_model = if model.trim().is_empty() {
        preferred_model(spec, &models)
            .ok_or_else(|| format!("{} não retornou modelos disponíveis.", spec.display_name))?
    } else {
        model.trim().to_string()
    };
    if !models.iter().any(|candidate| candidate == &selected_model) {
        return Err(format!(
            "O modelo '{}' não está na lista atual do {}. Atualize os modelos ACP.",
            selected_model, spec.display_name
        ));
    }

    let workspace = acp_workspace()?;
    let args = ["run", "--pure", "--model", selected_model.as_str(), prompt];
    let output = run_cli(&tool, &args, Some(&workspace))?;
    let cleaned = clean_output(&output);
    if cleaned.is_empty() {
        Ok(format!(
            "[{} · {}] Execução concluída sem saída textual.",
            spec.display_name, selected_model
        ))
    } else {
        Ok(format!(
            "[{} · {}]\n{}",
            spec.display_name, selected_model, cleaned
        ))
    }
}

fn provider_spec(provider_id: &str) -> Option<&'static ProviderSpec> {
    PROVIDERS.iter().find(|spec| spec.id == provider_id)
}

fn detect_provider(spec: &ProviderSpec) -> Option<AcpToolInfo> {
    find_binary(spec.candidates).map(|(binary_path, launcher)| AcpToolInfo {
        provider_id: spec.id.to_string(),
        name: spec.tool_name.to_string(),
        display_name: spec.display_name.to_string(),
        binary_path,
        launcher,
    })
}

fn find_binary(candidates: &[&str]) -> Option<(String, Launcher)> {
    let check_command = if cfg!(windows) { "where.exe" } else { "which" };
    let mut found = Vec::new();
    for candidate in candidates {
        let output = Command::new(check_command).arg(candidate).output().ok()?;
        if !output.status.success() {
            continue;
        }
        for line in String::from_utf8_lossy(&output.stdout).lines() {
            let path = line.trim();
            if path.is_empty() {
                continue;
            }
            found.push(PathBuf::from(path));
            if cfg!(windows) && Path::new(path).extension().is_none() {
                found.push(PathBuf::from(format!("{path}.exe")));
                found.push(PathBuf::from(format!("{path}.ps1")));
                found.push(PathBuf::from(format!("{path}.cmd")));
            }
        }
    }

    found.sort_by_key(|path| launcher_rank(path));
    found.dedup();
    found.into_iter().find_map(|path| {
        if !path.is_file() {
            return None;
        }
        let launcher = launcher_for(&path);
        Some((path.to_string_lossy().to_string(), launcher))
    })
}

fn launcher_rank(path: &Path) -> u8 {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "exe" => 0,
        "ps1" => 1,
        "cmd" | "bat" => 2,
        _ => 3,
    }
}

fn launcher_for(path: &Path) -> Launcher {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "ps1" => Launcher::PowerShell,
        "cmd" | "bat" => Launcher::Cmd,
        _ => Launcher::Direct,
    }
}

fn command_for(tool: &AcpToolInfo, args: &[&str]) -> Command {
    match tool.launcher {
        Launcher::Direct => {
            let mut command = Command::new(&tool.binary_path);
            command.args(args);
            command
        }
        Launcher::PowerShell => {
            let mut command = Command::new("powershell.exe");
            command.args([
                "-NoLogo",
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                &tool.binary_path,
            ]);
            command.args(args);
            command
        }
        Launcher::Cmd => {
            let mut command = Command::new("cmd.exe");
            command.args(["/D", "/S", "/C", &tool.binary_path]);
            command.args(args);
            command
        }
    }
}

fn run_cli(tool: &AcpToolInfo, args: &[&str], cwd: Option<&Path>) -> Result<String, String> {
    let mut command = command_for(tool, args);
    if let Some(cwd) = cwd {
        command.current_dir(cwd);
    }
    let output = command
        .output()
        .map_err(|error| format!("Falha ao iniciar {}: {error}", tool.display_name))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!(
            "{} encerrou com status {}: {}{}",
            tool.display_name,
            output.status,
            clean_output(&stdout),
            clean_output(&stderr)
        ))
    }
}

fn cli_version(tool: &AcpToolInfo) -> Result<String, String> {
    let output = run_cli(tool, &["--version"], None)?;
    clean_output(&output)
        .lines()
        .find(|line| !line.trim().is_empty())
        .map(|line| line.trim().to_string())
        .ok_or_else(|| format!("{} não retornou versão.", tool.display_name))
}

fn list_models(tool: &AcpToolInfo) -> Result<Vec<String>, String> {
    let output = run_cli(tool, &["models"], None)?;
    let mut seen = HashSet::new();
    let models = clean_output(&output)
        .lines()
        .map(str::trim)
        .filter(|line| {
            !line.is_empty()
                && line.contains('/')
                && !line.chars().any(char::is_whitespace)
                && seen.insert((*line).to_string())
        })
        .map(str::to_string)
        .collect::<Vec<_>>();
    if models.is_empty() {
        Err(format!(
            "{} não retornou modelos válidos.",
            tool.display_name
        ))
    } else {
        Ok(models)
    }
}

fn preferred_model(spec: &ProviderSpec, models: &[String]) -> Option<String> {
    if models.iter().any(|model| model == spec.default_model) {
        Some(spec.default_model.to_string())
    } else {
        models.first().cloned()
    }
}

fn acp_workspace() -> Result<PathBuf, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map_err(|_| "Não foi possível localizar o diretório do usuário.".to_string())?;
    let path = PathBuf::from(home).join(".cki").join("acp-workspace");
    std::fs::create_dir_all(&path)
        .map_err(|error| format!("Falha ao criar workspace ACP: {error}"))?;
    Ok(path)
}

fn clean_output(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    let mut chars = value.chars().peekable();
    while let Some(character) = chars.next() {
        if character == '\u{1b}' && chars.peek() == Some(&'[') {
            chars.next();
            for next in chars.by_ref() {
                if ('@'..='~').contains(&next) {
                    break;
                }
            }
        } else {
            output.push(character);
        }
    }
    output.trim().to_string()
}

pub fn get_acp_tool_definitions() -> Vec<ToolDef> {
    detect_acp_tools()
        .into_iter()
        .map(|acp| ToolDef {
            r#type: "function".into(),
            function: ToolFunction {
                name: acp.name,
                description: format!(
                    "Executa pesquisa e análise via agente ACP local {}.",
                    acp.display_name
                ),
                parameters: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Instrução de análise para o agente ACP"
                        }
                    },
                    "required": ["query"],
                    "additionalProperties": false
                }),
            },
        })
        .collect()
}

pub fn execute_acp_tool_call(tool_name: &str, arguments: &Value) -> Result<String, String> {
    let query = arguments
        .get("query")
        .and_then(|value| value.as_str())
        .unwrap_or("")
        .trim();
    let tool = detect_acp_tools()
        .into_iter()
        .find(|tool| tool.name == tool_name)
        .ok_or_else(|| format!("Ferramenta ACP '{tool_name}' não encontrada."))?;
    let spec = provider_spec(&tool.provider_id)
        .ok_or_else(|| format!("Provedor ACP inválido: {}", tool.provider_id))?;
    run_acp_prompt(spec.id, spec.default_model, query)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clean_output_removes_ansi_sequences() {
        assert_eq!(
            clean_output("\u{1b}[31mopencode/model\u{1b}[0m"),
            "opencode/model"
        );
    }

    #[test]
    fn preferred_model_uses_configured_default() {
        let spec = provider_spec(KILO_ID).unwrap();
        let models = vec!["kilo/other".to_string(), KILO_DEFAULT_MODEL.to_string()];
        assert_eq!(
            preferred_model(spec, &models).as_deref(),
            Some(KILO_DEFAULT_MODEL)
        );
    }

    #[test]
    fn provider_specs_are_unique() {
        let ids = PROVIDERS
            .iter()
            .map(|provider| provider.id)
            .collect::<HashSet<_>>();
        assert_eq!(ids.len(), PROVIDERS.len());
    }

    #[test]
    #[ignore = "requer Kilo/OpenCode instalados e credenciais/modelos disponíveis"]
    fn installed_acp_catalogs_and_agents_work() {
        let statuses = get_acp_provider_statuses();
        for (provider_id, model, marker) in [
            (KILO_ID, KILO_DEFAULT_MODEL, "KILO_ACP_OK"),
            (OPENCODE_ID, OPENCODE_DEFAULT_MODEL, "OPENCODE_ACP_OK"),
        ] {
            let status = statuses
                .iter()
                .find(|status| status.id == provider_id)
                .unwrap_or_else(|| panic!("status ausente para {provider_id}"));
            assert!(
                status.installed,
                "{}",
                status.error.as_deref().unwrap_or("não instalado")
            );
            assert!(status.models.iter().any(|candidate| candidate == model));
            let response =
                run_acp_prompt(provider_id, model, &format!("Responda somente: {marker}")).unwrap();
            assert!(response.contains(marker), "resposta inesperada: {response}");
        }
    }
}

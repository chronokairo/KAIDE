use std::path::PathBuf;
use crate::llm::router::DEFAULT_PROVIDER;

#[derive(Debug)]
pub(crate) struct Cli {
    pub(crate) command: Option<Commands>,
    /// Use local GGUF inference instead of Ollama
    pub(crate) local: bool,
    /// OpenCL GPU acceleration (active by default when built with --features gpu)
    pub(crate) gpu: bool,
    /// Disable OpenCL GPU acceleration and force CPU inference
    pub(crate) no_gpu: bool,
    /// Model name (e.g. gemma3:1b) or path to a .gguf file
    pub(crate) model: Option<String>,
    pub(crate) dir: String,
    /// Use a cloud provider (OpenAI-compatible, e.g. NVIDIA NIM) for inference
    pub(crate) cloud: bool,
    /// Cloud provider id (default: nvidia — NVIDIA NIM)
    pub(crate) provider: String,
    /// Cloud model id for inference (overrides planner/coder/summarizer defaults)
    pub(crate) cloud_model: Option<String>,
    /// Resume a previous session (lists saved sessions to pick from)
    pub(crate) resume: bool,
    /// Continue the most recent session for this workspace without prompting
    pub(crate) cont: bool,
    /// Download the default embedding model (Qwen3-Embedding 0.6B Q8) into ~/.chronokairo/models for memory_search
    pub(crate) download_embedding_model: bool,
    pub(crate) task: Option<String>,
}

#[derive(Debug)]
pub(crate) enum Commands {
    Check,
    /// Launch the terminal UI
    Tui,
    Repl,
    /// List locally available models
    Models,
    /// Pull/download a GGUF model from Hugging Face into ~/.chronokairo/models
    Pull {
        /// Model name (e.g. qwen2.5-coder:3b, nemotron-mini:4b) or Hugging Face URL
        model: String,
    },
    /// Remove/delete a local model and its aliases from ~/.chronokairo/models
    Rm {
        model: String,
    },
    /// Show detailed metadata and architecture info for a local GGUF model
    Show {
        model: String,
    },
    /// Copy or create an alias for a local model
    Cp {
        source: String,
        target: String,
    },
    /// Show system hardware, VRAM, and model runtime status
    Ps,
    /// Run direct local inference or interactive chat
    Run {
        model: String,
        prompt: Option<String>,
        no_gpu: bool,
    },
    /// List cloud models discovered from provider APIs
    Cloud {
        /// Filter by name/family/provider (empty = show all)
        query: String,
    },
    /// Configure and manage cloud provider API keys (stored securely at ~/.chronokairo/providers.toml)
    Providers {
        action: ProvidersAction,
    },
    /// Benchmark all local models and show ranking vs hw_recommend predictions
    Bench {
        /// Category to evaluate against (general, coding, reasoning, chat)
        category: String,
        /// Output JSON file for results
        output: String,
        /// Also benchmark cloud models (requires API keys)
        cloud: bool,
    },
    /// Run a coding task headlessly (non-interactive)
    Exec {
        /// Task to execute
        task: String,
        /// Run in plan mode (generate plan first)
        plan: bool,
        /// Output events as JSON Lines
        jsonl: bool,
        /// Auto-approve all approvals (for CI)
        yes: bool,
    },
    /// Run JSON-RPC 2.0 app server over stdio (for IDE integration)
    AppServer,
    /// Run MCP server exposing the harness as tools
    McpServer,
    /// Translate a PDF document in real-time using local Ollama models
    Translate {
        /// Path to the PDF file
        file: PathBuf,
        /// Ollama model to use for translation (default: qwen2.5:7b)
        model: String,
        /// Target language (default: "Português (Brasil)")
        to: String,
        /// GPU device to use ('0' for NVIDIA GTX 1650, '1' for Intel UHD, 'cpu' for CPU only, 'auto')
        gpu: Option<String>,
        /// Output file path (e.g. translated.md)
        out: Option<PathBuf>,
    },
    /// Compile and display curated project context using the Zero-Lib ChronoContext engine
    Context {
        /// Optional task query to filter relevant domain documents
        task: Option<String>,
        /// Character budget limit for the context pack
        budget: usize,
    },
}

/// Sub-actions for `rust-agent providers`
#[derive(Debug)]
pub(crate) enum ProvidersAction {
    /// List all providers from the built-in registry and their configuration status
    List,
    /// Show currently configured providers and their (masked) API keys
    Show,
    /// Set an API key for a provider  (e.g. rust-agent providers set openai sk-...)
    Set {
        /// Provider ID (e.g. openai, anthropic, groq, mistral, nvidia)
        provider: String,
        /// API key — read from stdin if omitted (safer: avoids shell history)
        api_key: Option<String>,
        /// Override the API base URL (optional; uses provider default if not set)
        base: Option<String>,
    },
    /// Remove a provider's API key and config
    Remove { provider: String },
    /// Enable or disable a provider without removing its key
    Enable {
        provider: String,
        enabled: bool,
    },
    /// Test connectivity and API key validity for a provider
    Test { provider: String },
    /// Import API keys from environment variables (reads provider env var names)
    Import,
}


use std::collections::{HashMap, VecDeque};
use std::ffi::OsString;

#[derive(Debug)]
struct ParseError { text: String, code: i32 }
impl ParseError {
    fn invalid(text: impl Into<String>) -> Self { Self { text: text.into(), code: 2 } }
}
type Parsed<T> = std::result::Result<T, ParseError>;
// canonical long name, optional short name, whether a value is required
const ROOT: &[(&str, &str, bool)] = &[
    ("local", "", false), ("gpu", "", false), ("no-gpu", "", false), ("cpu", "", false),
    ("cpu-only", "", false), ("deactive-gpu", "", false), ("deactivate-gpu", "", false), ("disable-gpu", "", false),
    ("model", "", true),
    ("dir", "d", true), ("cloud", "", false), ("provider", "", true),
    ("cloud-model", "", true), ("resume", "", false), ("cont", "", false),
    ("download-embedding-model", "", false),
];
const COMMANDS: &[&str] = &[
    "check", "tui", "repl", "models", "pull", "rm", "remove", "show", "inspect",
    "cp", "copy", "ps", "run", "cloud", "providers", "bench", "exec", "app-server",
    "mcp-server", "translate", "context",
];

#[derive(Default)]
struct Options {
    values: HashMap<String, Option<OsString>>,
    positional: VecDeque<OsString>,
    command: Option<String>,
}
impl Options {
    fn flag(&mut self, name: &str) -> bool { self.values.remove(name).is_some() }
    fn value(&mut self, name: &str) -> Parsed<Option<String>> {
        self.values.remove(name).flatten().map(|v| utf8(v, name)).transpose()
    }
    fn value_or(&mut self, name: &str, fallback: &str) -> Parsed<String> {
        Ok(self.value(name)?.unwrap_or_else(|| fallback.to_owned()))
    }
    fn number<T: std::str::FromStr>(&mut self, name: &str, fallback: &str) -> Parsed<T> {
        self.value_or(name, fallback)?.parse().map_err(|_| ParseError::invalid(format!("invalid value for --{name}")))
    }
    fn required(&mut self, name: &str) -> Parsed<OsString> {
        self.positional.pop_front().ok_or_else(|| ParseError::invalid(format!("missing required argument: {name}")))
    }
    fn text(&mut self, name: &str) -> Parsed<String> { utf8(self.required(name)?, name) }
    fn optional_text(&mut self, name: &str) -> Parsed<Option<String>> {
        self.positional.pop_front().map(|v| utf8(v, name)).transpose()
    }
    fn done(self) -> Parsed<()> {
        // Never echo positional values: these can contain provider secrets.
        if !self.positional.is_empty() { return Err(ParseError::invalid("too many positional arguments")); }
        Ok(())
    }
}
fn utf8(value: OsString, label: &str) -> Parsed<String> {
    value.into_string().map_err(|_| ParseError::invalid(format!("{label} must be UTF-8")))
}
fn help(command: &str) -> String {
    let usage = match command {
        "" => "[OPTIONS] [TASK] [COMMAND]\n\nCommands:\n  check  tui  repl  models  pull  rm  show  cp  ps  run\n  cloud  providers  bench  exec  app-server  mcp-server  translate  context\n\nOptions:\n  --local  --gpu  --cpu-only (alias: --no-gpu, --cpu, --deactive-gpu)  --model <MODEL>  -d, --dir <DIR> [default: .]\n  --cloud  --provider <ID>  --cloud-model <MODEL>\n  --resume  --cont (alias: --continue)  --download-embedding-model",
        "pull" => "<MODEL>\nDownload a model into ~/.chronokairo/models\nExamples:\n  ckc pull qwen2.5-coder:3b\n  ckc pull nemotron-mini:4b\n  ckc pull ministral:3b\n  ckc pull phi-4-mini:3.8b\n  ckc pull https://huggingface.co/.../model.gguf",
        "rm" | "remove" => "<MODEL>\nDelete a local model and its aliases from ~/.chronokairo/models\nExamples:\n  ckc rm qwen2.5-coder:3b",
        "show" | "inspect" => "<MODEL>\nShow detailed metadata for a local GGUF model\nExamples:\n  ckc show qwen2.5-coder:3b",
        "cp" | "copy" => "<SOURCE> <TARGET>\nCreate an alias for a local model\nExamples:\n  ckc cp qwen2.5-coder:3b coder",
        "ps" => "\nShow system hardware, VRAM, and model runtime status",
        "run" => "<MODEL> [PROMPT] [--cpu-only]\nRun direct local inference or interactive chat\nExamples:\n  ckc run qwen2.5-coder:3b \"Write a quicksort in Rust\"\n  ckc run qwen2.5-coder:3b\n  ckc run qwen2.5-coder:3b --cpu-only",
        "cloud" => "[QUERY]",
        "providers" => "<COMMAND>\nCommands: list, show, set, remove, enable, test, import",
        "providers set" => "<PROVIDER> [API_KEY] [--base <URL>]\nReads a hidden key from stdin when API_KEY is omitted.",
        "providers enable" => "<PROVIDER> <true|false>",
        "providers remove" | "providers test" => "<PROVIDER>",
        "bench" => "[-c, --category <CATEGORY>] [-o, --output <FILE>] [--cloud]\nDefaults: coding, bench_results.json",
        "exec" => "<TASK> [--plan] [--jsonl] [--yes]",
        "translate" => "<FILE> [-m, --model <MODEL>] [-t, --to <LANGUAGE>] [-g, --gpu <DEVICE>] [-o, --out <FILE>]\nDefaults: qwen2.5:7b, Português (Brasil)",
        "context" => "[-t, --task <TASK>] [-b, --budget <CHARS>]\nDefault budget: 8000",
        _ => "",
    };
    format!("ChronoKairo CLI (CKC)\n\nUsage: ckc {}{}\n\n  -h, --help  Print help\n", if command.is_empty() { String::new() } else { format!("{command} ") }, usage)
}
fn scan(args: &mut VecDeque<OsString>, specs: &[(&str, &str, bool)], command: &str, root: bool) -> Parsed<Options> {
    let mut parsed = Options::default();
    let mut positional_only = false;
    while let Some(arg) = args.pop_front() {
        let text = arg.to_str().unwrap_or("");
        if !positional_only && text == "--" { positional_only = true; continue; }
        if !positional_only && (text == "--help" || text == "-h") {
            return Err(ParseError { text: help(command), code: 0 });
        }
        if !positional_only && root && parsed.positional.is_empty() && COMMANDS.contains(&text) {
            parsed.command = Some(text.to_owned());
            break;
        }
        if !positional_only && text.starts_with('-') && text != "-" {
            let (name, attached, short) = if let Some(long) = text.strip_prefix("--") {
                let (name, value) = long.split_once('=').map_or((long, None), |(n, v)| (n, Some(v)));
                (if name == "continue" { "cont" } else { name }, value, false)
            } else {
                let tail = &text[1..];
                let end = tail.chars().next().unwrap().len_utf8();
                (&tail[..end], (tail.len() > end).then_some(tail[end..].trim_start_matches('=')), true)
            };
            let Some(&(canonical, _, takes_value)) = specs.iter().find(|&&(long, alias, _)| if short { alias == name && !alias.is_empty() } else { long == name }) else {
                return Err(ParseError::invalid(format!("unknown option: {}{name}", if short { "-" } else { "--" })));
            };
            if parsed.values.contains_key(canonical) { return Err(ParseError::invalid(format!("--{canonical} cannot be repeated"))); }
            let value = if takes_value {
                Some(match attached {
                    Some(value) => OsString::from(value),
                    None => {
                        let next = args.pop_front().ok_or_else(|| ParseError::invalid(format!("--{canonical} requires a value")))?;
                        if next.to_str().is_some_and(|v| v.starts_with('-') && v != "-") { return Err(ParseError::invalid(format!("--{canonical} requires a value"))); }
                        next
                    }
                })
            } else {
                if attached.is_some() { return Err(ParseError::invalid(format!("--{canonical} does not accept a value"))); }
                None
            };
            parsed.values.insert(canonical.to_owned(), value);
        } else { parsed.positional.push_back(arg); }
    }
    Ok(parsed)
}

impl Cli {
    pub fn parse() -> Self {
        match Self::try_parse(std::env::args_os().skip(1)) {
            Ok(cli) => cli,
            Err(err) => {
                let out = if err.code == 0 { &mut std::io::stdout() as &mut dyn std::io::Write } else { &mut std::io::stderr() };
                let _ = writeln!(out, "{}", err.text);
                std::process::exit(err.code);
            }
        }
    }
    fn try_parse(args: impl IntoIterator<Item = OsString>) -> Parsed<Self> {
        let mut args: VecDeque<_> = args.into_iter().collect();
        if args.front().is_some_and(|v| v == "help") {
            args.pop_front();
            let command = args.iter().map(|s| s.to_string_lossy()).collect::<Vec<_>>().join(" ");
            if !command.is_empty() && !COMMANDS.contains(&command.split(' ').next().unwrap_or("")) { return Err(ParseError::invalid("unknown help command")); }
            return Err(ParseError { text: help(&command), code: 0 });
        }
        let mut root = scan(&mut args, ROOT, "", true)?;
        let command = root.command.take().map(|command| parse_command(&command, &mut args)).transpose()?;
        let no_gpu = root.flag("no-gpu")
            || root.flag("cpu")
            || root.flag("cpu-only")
            || root.flag("deactive-gpu")
            || root.flag("deactivate-gpu")
            || root.flag("disable-gpu");
        let gpu = if no_gpu {
            false
        } else if root.flag("gpu") {
            true
        } else {
            cfg!(feature = "gpu")
        };
        let cli = Self {
            command, local: root.flag("local"), gpu, no_gpu, model: root.value("model")?,
            dir: root.value_or("dir", ".")?, cloud: root.flag("cloud"), provider: root.value_or("provider", DEFAULT_PROVIDER)?,
            cloud_model: root.value("cloud-model")?, resume: root.flag("resume"), cont: root.flag("cont"),
            download_embedding_model: root.flag("download-embedding-model"), task: root.optional_text("TASK")?,
        };
        root.done()?;
        Ok(cli)
    }
}
fn parse_command(command: &str, args: &mut VecDeque<OsString>) -> Parsed<Commands> {
    if command == "providers" { return Ok(Commands::Providers { action: parse_provider(args)? }); }
    let specs: &[(&str, &str, bool)] = match command {
        "bench" => &[("category", "c", true), ("output", "o", true), ("cloud", "", false)],
        "exec" => &[("plan", "", false), ("jsonl", "", false), ("yes", "", false)],
        "translate" => &[("model", "m", true), ("to", "t", true), ("gpu", "g", true), ("out", "o", true)],
        "context" => &[("task", "t", true), ("budget", "b", true)],
        "run" => &[
            ("cpu-only", "", false),
            ("no-gpu", "", false),
            ("cpu", "", false),
            ("deactive-gpu", "", false),
            ("deactivate-gpu", "", false),
            ("disable-gpu", "", false),
        ],
        _ => &[],
    };
    let mut o = scan(args, specs, command, false)?;
    let parsed = match command {
        "check" => Commands::Check, "tui" => Commands::Tui, "repl" => Commands::Repl,
        "models" => Commands::Models, "pull" => Commands::Pull { model: o.text("MODEL")? },
        "rm" | "remove" => Commands::Rm { model: o.text("MODEL")? },
        "show" | "inspect" => Commands::Show { model: o.text("MODEL")? },
        "cp" | "copy" => Commands::Cp { source: o.text("SOURCE")?, target: o.text("TARGET")? },
        "ps" => Commands::Ps,
        "run" => {
            let model = o.text("MODEL")?;
            let no_gpu = o.flag("cpu-only")
                || o.flag("no-gpu")
                || o.flag("cpu")
                || o.flag("deactive-gpu")
                || o.flag("deactivate-gpu")
                || o.flag("disable-gpu");
            let mut words = Vec::new();
            while let Some(w) = o.optional_text("PROMPT")? {
                words.push(w);
            }
            let prompt = if words.is_empty() { None } else { Some(words.join(" ")) };
            Commands::Run { model, prompt, no_gpu }
        }
        "app-server" => Commands::AppServer, "mcp-server" => Commands::McpServer,
        "cloud" => Commands::Cloud { query: o.optional_text("QUERY")?.unwrap_or_default() },
        "bench" => Commands::Bench { category: o.value_or("category", "coding")?, output: o.value_or("output", "bench_results.json")?, cloud: o.flag("cloud") },
        "exec" => Commands::Exec { task: o.text("TASK")?, plan: o.flag("plan"), jsonl: o.flag("jsonl"), yes: o.flag("yes") },
        "translate" => Commands::Translate { file: o.required("FILE")?.into(), model: o.value_or("model", "qwen2.5:7b")?, to: o.value_or("to", "Português (Brasil)")?, gpu: o.value("gpu")?, out: o.values.remove("out").flatten().map(PathBuf::from) },
        "context" => Commands::Context { task: o.value("task")?, budget: o.number("budget", "8000")? },
        _ => return Err(ParseError::invalid("unknown command")),
    };
    o.done()?;
    Ok(parsed)
}
fn parse_provider(args: &mut VecDeque<OsString>) -> Parsed<ProvidersAction> {
    let action = args.pop_front().ok_or_else(|| ParseError::invalid("providers requires a command"))?;
    let action = utf8(action, "COMMAND")?;
    if action == "--help" || action == "-h" { return Err(ParseError { text: help("providers"), code: 0 }); }
    let specs: &[(&str, &str, bool)] = if action == "set" { &[("base", "", true)] } else { &[] };
    let mut o = scan(args, specs, &format!("providers {action}"), false)?;
    let parsed = match action.as_str() {
        "list" => ProvidersAction::List, "show" => ProvidersAction::Show, "import" => ProvidersAction::Import,
        "set" => ProvidersAction::Set { provider: o.text("PROVIDER")?, api_key: o.optional_text("API_KEY")?, base: o.value("base")? },
        "remove" => ProvidersAction::Remove { provider: o.text("PROVIDER")? },
        "test" => ProvidersAction::Test { provider: o.text("PROVIDER")? },
        "enable" => ProvidersAction::Enable { provider: o.text("PROVIDER")?, enabled: o.text("ENABLED")?.parse().map_err(|_| ParseError::invalid("ENABLED must be true or false"))? },
        _ => return Err(ParseError::invalid("unknown providers command")),
    };
    o.done()?;
    Ok(parsed)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn parse(args: &[&str]) -> Parsed<Cli> { Cli::try_parse(args.iter().map(OsString::from)) }
    #[test]
    fn root_defaults_and_aliases() {
        let c = parse(&[]).unwrap();
        assert_eq!(c.dir, "."); assert_eq!(c.provider, DEFAULT_PROVIDER); assert!(c.command.is_none());
        let c = parse(&["--continue", "-dproject", "--model=local", "do work"]).unwrap();
        assert!(c.cont); assert_eq!(c.dir, "project"); assert_eq!(c.task.as_deref(), Some("do work"));
    }
    #[test]
    fn every_command_parses() {
        for args in [
            &["check"][..], &["tui"], &["repl"], &["models"], &["pull", "qwen2.5-coder:3b"],
            &["rm", "qwen2.5-coder:3b"], &["remove", "m"], &["show", "qwen2.5-coder:3b"],
            &["inspect", "m"], &["cp", "a", "b"], &["copy", "a", "b"], &["ps"],
            &["run", "m"], &["run", "m", "hello", "world"],
            &["cloud"], &["bench"], &["exec", "task"], &["app-server"], &["mcp-server"],
            &["translate", "a.pdf"], &["context"], &["providers", "list"], &["providers", "show"],
            &["providers", "import"], &["providers", "remove", "id"], &["providers", "test", "id"],
            &["providers", "set", "id"], &["providers", "enable", "id", "false"]
        ] {
            assert!(parse(args).is_ok(), "{args:?}");
        }
    }
    #[test]
    fn command_options_and_literal_tasks() {
        let c = parse(&["--cloud", "exec", "--plan", "--jsonl", "--yes", "--", "--literal-task"]).unwrap();
        assert!(matches!(c.command, Some(Commands::Exec { task, plan: true, jsonl: true, yes: true }) if task == "--literal-task"));
        assert!(matches!(parse(&["translate", "a.pdf", "-mfoo", "-t", "English", "-oout.md"]).unwrap().command, Some(Commands::Translate { model, to, out: Some(out), .. }) if model == "foo" && to == "English" && out == PathBuf::from("out.md")));
    }
    #[test]
    fn rejects_malformed_invocations_without_exposing_values() {
        for args in [&["--unknown"][..], &["--model"], &["--local=true"], &["--local", "--local"], &["exec"], &["exec", "one", "two"], &["providers", "enable", "id", "yes"], &["check", "--cloud"], &["context", "--budget=-1"]] {
            assert_eq!(parse(args).unwrap_err().code, 2, "{args:?}");
        }
        assert!(!parse(&["providers", "set", "id", "secret", "other-secret"]).unwrap_err().text.contains("secret"));
    }
    #[test]
    fn help_is_successful_without_required_arguments() {
        for args in [&["--help"][..], &["help", "exec"], &["exec", "-h"], &["providers", "set", "--help"]] {
            assert_eq!(parse(args).unwrap_err().code, 0);
        }
    }
}
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicSource {
    pub name: String,
    pub category: String,
    pub description: String,
    pub url: String,
    pub lgpd_basis: String,
    pub evidence_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryPublicSources {
    pub category: String,
    pub category_label: String,
    pub sources: Vec<PublicSource>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceHistoryLog {
    pub id: String,
    pub timestamp_utc: String,
    pub action: String, // "ADD" or "REMOVE"
    pub source_name: String,
    pub category: String,
    pub url: String,
    pub origin_agent: String,
    pub hash_sha256: String,
}

pub fn get_cki_dir() -> PathBuf {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    let cki = PathBuf::from(home).join(".cki");
    let _ = fs::create_dir_all(&cki);
    cki
}

pub fn get_sources_file_path() -> PathBuf {
    get_cki_dir().join("public_sources.json")
}

pub fn get_history_file_path() -> PathBuf {
    get_cki_dir().join("public_sources_history.json")
}

pub fn load_public_sources_from_cki() -> Vec<CategoryPublicSources> {
    let path = get_sources_file_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(sources) = serde_json::from_str::<Vec<CategoryPublicSources>>(&content) {
                return sources;
            }
        }
    }
    
    let seed = get_all_default_public_sources();
    let _ = save_public_sources_to_cki(&seed);
    seed
}

pub fn save_public_sources_to_cki(sources: &[CategoryPublicSources]) -> anyhow::Result<()> {
    let path = get_sources_file_path();
    let json = serde_json::to_string_pretty(sources)?;
    fs::write(path, json)?;
    Ok(())
}

pub fn load_history_logs_from_cki() -> Vec<SourceHistoryLog> {
    let path = get_history_file_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(logs) = serde_json::from_str::<Vec<SourceHistoryLog>>(&content) {
                return logs;
            }
        }
    }
    vec![]
}

pub fn append_history_log(
    action: &str,
    source_name: &str,
    category: &str,
    url: &str,
    origin_agent: &str,
) {
    let path = get_history_file_path();
    let mut logs = load_history_logs_from_cki();
    
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(format!("{}:{}:{}:{}", action, source_name, category, url).as_bytes());
    let hash = format!("{:x}", hasher.finalize());

    let log_entry = SourceHistoryLog {
        id: format!("LOG-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase()),
        timestamp_utc: chrono::Utc::now().to_rfc3339(),
        action: action.to_string(),
        source_name: source_name.to_string(),
        category: category.to_string(),
        url: url.to_string(),
        origin_agent: origin_agent.to_string(),
        hash_sha256: hash,
    };

    logs.insert(0, log_entry);
    if let Ok(json) = serde_json::to_string_pretty(&logs) {
        let _ = fs::write(path, json);
    }
}

pub fn add_source_to_cki(new_source: PublicSource, agent_name: &str) -> Vec<CategoryPublicSources> {
    let mut categories = load_public_sources_from_cki();
    let cat_key = new_source.category.clone();
    
    let mut found_cat = false;
    for cat in &mut categories {
        if cat.category == cat_key {
            cat.sources.retain(|s| s.name != new_source.name);
            cat.sources.push(new_source.clone());
            found_cat = true;
            break;
        }
    }

    if !found_cat {
        categories.push(CategoryPublicSources {
            category: cat_key.clone(),
            category_label: format!("Categoria {}", cat_key),
            sources: vec![new_source.clone()],
        });
    }

    let _ = save_public_sources_to_cki(&categories);
    append_history_log("ADD", &new_source.name, &cat_key, &new_source.url, agent_name);

    categories
}

pub fn remove_source_from_cki(source_name: &str, agent_name: &str) -> Vec<CategoryPublicSources> {
    let mut categories = load_public_sources_from_cki();
    let mut removed_category = "desconhecido".to_string();
    let mut removed_url = "".to_string();

    for cat in &mut categories {
        if let Some(s) = cat.sources.iter().find(|s| s.name == source_name) {
            removed_category = cat.category.clone();
            removed_url = s.url.clone();
        }
        cat.sources.retain(|s| s.name != source_name);
    }

    let _ = save_public_sources_to_cki(&categories);
    append_history_log("REMOVE", source_name, &removed_category, &removed_url, agent_name);

    categories
}

pub fn get_all_default_public_sources() -> Vec<CategoryPublicSources> {
    vec![
        CategoryPublicSources {
            category: "societario".to_string(),
            category_label: "Societário, QSA & Registro de Empresas".to_string(),
            sources: vec![
                PublicSource {
                    name: "Receita Federal (CNPJ / QSA)".to_string(),
                    category: "societario".to_string(),
                    description: "Consulta pública cadastral de Quadro de Sócios e Administradores, capital social e situação tributária.".to_string(),
                    url: "https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD (Legítimo Interesse)".to_string(),
                    evidence_type: "Cadastral / QSA".to_string(),
                },
                PublicSource {
                    name: "Juntas Comerciais Estaduais (JUCESP, JUCEA, JUCERJA)".to_string(),
                    category: "societario".to_string(),
                    description: "Fichas cadastrais completas, certidões simplificadas e histórico de alterações de contrato social.".to_string(),
                    url: "https://www.jucesp.sp.gov.br".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Registro Empresarial".to_string(),
                },
                PublicSource {
                    name: "Comissão de Valores Mobiliários (CVM)".to_string(),
                    category: "societario".to_string(),
                    description: "Registros de companhias abertas, diretores, administradores de fundos e fatos relevantes.".to_string(),
                    url: "https://www.gov.br/cvm".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Mercado de Capitais".to_string(),
                },
            ],
        },
        CategoryPublicSources {
            category: "processual".to_string(),
            category_label: "Tribunais de Justiça & Diários Oficiais".to_string(),
            sources: vec![
                PublicSource {
                    name: "Tribunais de Justiça Estaduais & Federais (TJSP, TJAM, TRF1-6)".to_string(),
                    category: "processual".to_string(),
                    description: "Consulta pública unificada de processos cíveis, execuções fiscais, trabalhistas e criminais (e-SAJ, PJe).".to_string(),
                    url: "https://www.tjsp.jus.br".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Processual / Contingência".to_string(),
                },
                PublicSource {
                    name: "Diários Oficiais da União e dos Estados (DOU / DOE)".to_string(),
                    category: "processual".to_string(),
                    description: "Publicações oficiais de intimações judiciais, citações, atos de órgãos públicos e licitações.".to_string(),
                    url: "https://www.in.gov.br".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Publicação Oficial".to_string(),
                },
                PublicSource {
                    name: "Superior Tribunal de Justiça & STF".to_string(),
                    category: "processual".to_string(),
                    description: "Jurisprudência, recursos especiais e ações de competência originária.".to_string(),
                    url: "https://www.stj.jus.br".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Jurisprudencial".to_string(),
                },
            ],
        },
        CategoryPublicSources {
            category: "compliance_pep".to_string(),
            category_label: "Compliance, PEP & Listas de Sanções".to_string(),
            sources: vec![
                PublicSource {
                    name: "Portal da Transparência & CGU (PEP, CEIS, CNEP, CEPIM)".to_string(),
                    category: "compliance_pep".to_string(),
                    description: "Cadastro de Pessoas Politicamente Expostas e sanções por inidoneidade ou improbidade administrativa.".to_string(),
                    url: "https://portaldatransparencia.gov.br".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Sanções Governamentais".to_string(),
                },
                PublicSource {
                    name: "OFAC SDN & Listas Internacionais (Interpol / ONU)".to_string(),
                    category: "compliance_pep".to_string(),
                    description: "Verificação de sanções financeiras globais e restrições patrimoniais internacionais.".to_string(),
                    url: "https://sanctionssearch.ofac.treas.gov".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Sanções Internacionais".to_string(),
                },
            ],
        },
        CategoryPublicSources {
            category: "patrimonial".to_string(),
            category_label: "Registros Imobiliários & Patrimônio público".to_string(),
            sources: vec![
                PublicSource {
                    name: "Operador Nacional do Sistema de Registro Eletrônico de Imóveis (ONR/SREI)".to_string(),
                    category: "patrimonial".to_string(),
                    description: "Pesquisa de propriedade imobiliária nacional e certidões de bens.".to_string(),
                    url: "https://onr.org.br".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Matrícula Imobiliária".to_string(),
                },
                PublicSource {
                    name: "Registro Aeronáutico Brasileiro (RAB / ANAC)".to_string(),
                    category: "patrimonial".to_string(),
                    description: "Consulta pública de propriedade e gravames sobre aeronaves.".to_string(),
                    url: "https://www.gov.br/anac".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Aeronaves".to_string(),
                },
            ],
        },
        CategoryPublicSources {
            category: "web_osint".to_string(),
            category_label: "Provedores de Pesquisa Web OSINT".to_string(),
            sources: vec![
                PublicSource {
                    name: "Tavily OSINT API".to_string(),
                    category: "web_osint".to_string(),
                    description: "Motor especializado em extração estruturada de contexto investigativo na web.".to_string(),
                    url: "https://tavily.com".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Web Crawling OSINT".to_string(),
                },
                PublicSource {
                    name: "SerpAPI & Google Custom Search".to_string(),
                    category: "web_osint".to_string(),
                    description: "Pesquisa indexada no Google com operadores avançados de busca.".to_string(),
                    url: "https://serpapi.com".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Search Index".to_string(),
                },
                PublicSource {
                    name: "Perplexity AI & Exa.ai Neural Search".to_string(),
                    category: "web_osint".to_string(),
                    description: "Busca semântica neural para encontrar notícias do setor e registros corporativos.".to_string(),
                    url: "https://perplexity.ai".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Neural Search".to_string(),
                },
                PublicSource {
                    name: "Brave Search API & Bing Web Search".to_string(),
                    category: "web_osint".to_string(),
                    description: "Pesquisa independente indexada no Brave e Microsoft Bing.".to_string(),
                    url: "https://api.search.brave.com".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Search Index".to_string(),
                },
            ],
        },
        CategoryPublicSources {
            category: "acp_local".to_string(),
            category_label: "Ferramentas ACP (Kilo Code & OpenCode)".to_string(),
            sources: vec![
                PublicSource {
                    name: "ACP Kilo Code Protocol".to_string(),
                    category: "acp_local".to_string(),
                    description: "Ferramenta local de execução autônoma multi-agente para varredura e correlação de arquivos.".to_string(),
                    url: "file://local/kilo".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Local ACP Worker".to_string(),
                },
                PublicSource {
                    name: "ACP OpenCode Agent".to_string(),
                    category: "acp_local".to_string(),
                    description: "Agente local de análise de código e processamento estruturado.".to_string(),
                    url: "file://local/opencode".to_string(),
                    lgpd_basis: "Art. 7º, IX da LGPD".to_string(),
                    evidence_type: "Local ACP Agent".to_string(),
                },
            ],
        },
    ]
}

pub fn get_tool_calling_definition() -> serde_json::Value {
    serde_json::json!({
        "type": "function",
        "function": {
            "name": "manage_public_sources",
            "description": "Permite à IA consultar, adicionar ou remover fontes públicas da lista persistente em ~/.cki/ e registrar no histórico de auditoria SHA-256.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "Ação a ser executada (list | add | remove)",
                        "enum": ["list", "add", "remove"]
                    },
                    "category": {
                        "type": "string",
                        "description": "Categoria da fonte (societario | processual | compliance_pep | patrimonial | web_osint | acp_local)"
                    },
                    "source_name": {
                        "type": "string",
                        "description": "Nome da fonte pública"
                    },
                    "url": {
                        "type": "string",
                        "description": "URL oficial ou caminho da fonte"
                    },
                    "description": {
                        "type": "string",
                        "description": "Descrição investigativa da fonte encontrada"
                    }
                },
                "required": ["action"]
            }
        }
    })
}

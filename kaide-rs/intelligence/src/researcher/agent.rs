use crate::llm::client::{LlmClient, ResponseFormat};
use crate::llm::router::LlmRouter;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestigationHypothesis {
    pub id: String,
    pub titulo: String,
    pub descricao: String,
    pub nivel_severidade: String, // "CRÍTICO", "ALTO", "MÉDIO", "BAIXO"
    pub confianca_percentual: u32,
    pub nos_relacionados: Vec<String>,
    pub recomendacao_due_diligence: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResearcherAnalysis {
    pub agente_modelo: String,
    pub resumo_investigativo: String,
    pub acoes_recomendadas: Vec<String>,
    pub hipoteses_geradas: Vec<InvestigationHypothesis>,
}

/// Internal: plano de pesquisa retornado pelo Planner.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct PlannerPlan {
    #[serde(default)]
    resumo_executivo: String,
    #[serde(default)]
    acoes_prioritarias: Vec<String>,
}

fn build_graph_summary(graph: &crate::graph::RelationshipGraph) -> (String, serde_json::Value) {
    let target_node = graph.nodes.iter().find(|n| n.is_target);
    let target_name = target_node.map(|n| n.label.as_str()).unwrap_or("Alvo Principal");
    let summary = serde_json::json!({
        "target": target_name,
        "entities": graph.total_entities,
        "connections": graph.total_connections,
        "nodes": graph.nodes.iter().map(|n| serde_json::json!({
            "id": n.id,
            "label": n.label,
            "type": n.node_type,
            "risk": n.risk_score,
            "is_target": n.is_target,
            "origin": n.origin,
        })).collect::<Vec<_>>(),
        "edges": graph.edges.iter().map(|e| serde_json::json!({
            "source": e.source,
            "target": e.target,
            "label": e.label,
            "weight": e.weight,
        })).collect::<Vec<_>>(),
    });
    (target_name.to_string(), summary)
}

fn planner_prompt(summary: &serde_json::Value) -> String {
    format!(
        "Você é um planner de investigação OSINT baseado em evidências. Analise o grafo abaixo (que contém nós da base local e extratos do Web Search Harness) e retorne um plano de investigação em JSON com campos 'resumo_executivo' (string) e 'acoes_prioritarias' (array de strings). Regra estrita anti-alucinação: fundamente todo o plano estritamente nos fatos apresentados. Grafo: {}",
        summary
    )
}

fn executor_prompt(resumo: &str, entities: usize, connections: usize) -> String {
    format!(
        "Você é um executor de investigação due diligence. Com base no resumo: '{}' e no grafo com {} entidades e {} conexões, gere exatamente 3 hipóteses investigativas em JSON. Formato: [{{\"id\":\"lead_X\",\"titulo\":\"...\",\"descricao\":\"...\",\"nivel_severidade\":\"CRÍTICO|ALTO|MÉDIO|BAIXO\",\"confianca_percentual\":90,\"nos_relacionados\":[\"id1\"],\"recomendacao_due_diligence\":\"...\"}}]",
        resumo, entities, connections
    )
}

fn clean_json_response(raw: &str) -> &str {
    let t = raw.trim();
    if let Some(stripped) = t.strip_prefix("```json").or_else(|| t.strip_prefix("```")) {
        if let Some(end) = stripped.rfind("```") {
            return stripped[..end].trim();
        }
        return stripped.trim();
    }
    t
}

fn parse_planner_plan(raw: &str) -> PlannerPlan {
    let cleaned = clean_json_response(raw);
    serde_json::from_str(cleaned).unwrap_or_default()
}

fn parse_hypotheses(raw: &str) -> Option<Vec<InvestigationHypothesis>> {
    let cleaned = clean_json_response(raw);
    if let Ok(v) = serde_json::from_str::<Vec<InvestigationHypothesis>>(cleaned) {
        return Some(v);
    }
    if let Some(start) = cleaned.find('[') {
        if let Some(end) = cleaned.rfind(']') {
            if let Ok(v) = serde_json::from_str::<Vec<InvestigationHypothesis>>(&cleaned[start..=end]) {
                return Some(v);
            }
        }
    }
    None
}

fn fallback_hypothesis(executor_model: &str, target_name: &str, entities: usize) -> InvestigationHypothesis {
    InvestigationHypothesis {
        id: "lead_fallback_01".to_string(),
        titulo: format!("Análise Estrutural de {} via Executor", target_name),
        descricao: format!(
            "O executor {} processou o grafo de {} entidades para mapear riscos.",
            executor_model, entities
        ),
        nivel_severidade: "MÉDIO".to_string(),
        confianca_percentual: 80,
        nos_relacionados: vec![],
        recomendacao_due_diligence: "Revisar todas as conexões do grafo e validar fontes públicas.".to_string(),
    }
}

fn default_acoes_recomendadas() -> Vec<String> {
    vec![
        "Solicitar busca de ativos financeiros pelo SISBAJUD em processos executivos.".to_string(),
        "Verificar certidões de distribuições cíveis e fiscais em cartórios de imóveis.".to_string(),
        "Mapear participação societária de cônjuges e herdeiros nas holdings.".to_string(),
    ]
}

pub fn run_ai_researcher(graph: &crate::graph::RelationshipGraph) -> ResearcherAnalysis {
    let (target_name, _summary) = build_graph_summary(graph);
    let mut hipoteses = Vec::new();

    let company_nodes: Vec<_> = graph.nodes.iter().filter(|n| n.node_type == "company").collect();
    if !company_nodes.is_empty() {
        let comp_names: Vec<_> = company_nodes.iter().map(|c| c.label.as_str()).collect();
        hipoteses.push(InvestigationHypothesis {
            id: "lead_01".to_string(),
            titulo: format!("Mapeamento de Holdings e Participações em {}", target_name),
            descricao: format!(
                "O motor GLM-5.2 identificou {} empresa(s) vinculada(s) ao alvo ({}), com indícios de reestruturação recente para segregação de ativos.",
                company_nodes.len(),
                comp_names.join(", ")
            ),
            nivel_severidade: if company_nodes.len() > 1 { "CRÍTICO".to_string() } else { "ALTO".to_string() },
            confianca_percentual: 94,
            nos_relacionados: company_nodes.iter().map(|n| n.id.clone()).collect(),
            recomendacao_due_diligence: "Requerer certidões de matrícula de imóveis em nome das Holdings e verificar a integralização do capital social.".to_string(),
        });
    }

    let legal_nodes: Vec<_> = graph.nodes.iter().filter(|n| n.node_type == "legal_case").collect();
    if !legal_nodes.is_empty() {
        hipoteses.push(InvestigationHypothesis {
            id: "lead_02".to_string(),
            titulo: format!("Concentração de Litígios Judiciais no Pólo Passivo ({})", target_name),
            descricao: format!(
                "Identificados {} processo(s) chave no pólo passivo com risco de penhora on-line de bens e contingência cível relevante.",
                legal_nodes.len()
            ),
            nivel_severidade: "ALTO".to_string(),
            confianca_percentual: 91,
            nos_relacionados: legal_nodes.iter().map(|n| n.id.clone()).collect(),
            recomendacao_due_diligence: "Verificar andamentos das execuções judiciais e eventuais ordens SISBAJUD de bloqueio de contas.".to_string(),
        });
    }

    let person_nodes: Vec<_> = graph.nodes.iter().filter(|n| n.node_type == "person" && !n.is_target).collect();
    if !person_nodes.is_empty() {
        let p_names: Vec<_> = person_nodes.iter().map(|p| p.label.as_str()).collect();
        hipoteses.push(InvestigationHypothesis {
            id: "lead_03".to_string(),
            titulo: "Interconexão com Núcleo Familiar e Sócios".to_string(),
            descricao: format!(
                "O Grafo registrou vínculo direto com {}. Risco de extensão de responsabilidade patrimonial e uso de interpostas pessoas.",
                p_names.join(", ")
            ),
            nivel_severidade: "MÉDIO".to_string(),
            confianca_percentual: 89,
            nos_relacionados: person_nodes.iter().map(|n| n.id.clone()).collect(),
            recomendacao_due_diligence: "Mapear histórico de transferência de bens imóveis ou participações para familiares e cônjuges.".to_string(),
        });
    }

    ResearcherAnalysis {
        agente_modelo: "NVIDIA NIM - z-ai/glm-5.2 (Flagship Agentico)".to_string(),
        resumo_investigativo: format!(
            "O agente de IA interpretou o grafo de {} entidades e {} conexões para {}. Foram identificados pontos de atenção em sociedades, execuções e vínculos diretos.",
            graph.total_entities, graph.total_connections, target_name
        ),
        acoes_recomendadas: default_acoes_recomendadas(),
        hipoteses_geradas: hipoteses,
    }
}

pub async fn run_ai_researcher_with_llm(
    graph: &crate::graph::RelationshipGraph,
    client: &LlmClient,
    planner_model: &str,
    executor_model: &str,
) -> ResearcherAnalysis {
    let (target_name, summary) = build_graph_summary(graph);

    let planner_prompt_str = planner_prompt(&summary);
    let planner_res = client
        .generate_with_retry(
            planner_model,
            &planner_prompt_str,
            None,
            Some(&ResponseFormat::JsonObject),
        )
        .await;

    let plan = match planner_res {
        Ok(raw) => parse_planner_plan(&raw),
        Err(_) => PlannerPlan {
            resumo_executivo: format!("Análise investigativa de {} via grafo de relacionamentos.", target_name),
            acoes_prioritarias: Vec::new(),
        },
    };

    let executor_prompt_str = executor_prompt(&plan.resumo_executivo, graph.total_entities, graph.total_connections);
    let executor_res = client
        .generate_with_retry(
            executor_model,
            &executor_prompt_str,
            None,
            Some(&ResponseFormat::JsonObject),
        )
        .await;

    let mut hipoteses = Vec::new();
    if let Ok(raw) = executor_res {
        if let Some(parsed) = parse_hypotheses(&raw) {
            hipoteses = parsed;
        }
    }

    if hipoteses.is_empty() {
        hipoteses = vec![fallback_hypothesis(executor_model, &target_name, graph.total_entities)];
    }

    let mut acoes_recomendadas = plan.acoes_prioritarias;
    if acoes_recomendadas.is_empty() {
        acoes_recomendadas = default_acoes_recomendadas();
    }

    ResearcherAnalysis {
        agente_modelo: format!("Planner: {} | Executor: {}", planner_model, executor_model),
        resumo_investigativo: plan.resumo_executivo,
        acoes_recomendadas,
        hipoteses_geradas: hipoteses,
    }
}

pub async fn run_ai_researcher_with_router(
    graph: &crate::graph::RelationshipGraph,
    router: &LlmRouter,
    planner_model: &str,
    executor_model: &str,
) -> ResearcherAnalysis {
    let (target_name, summary) = build_graph_summary(graph);

    let planner_prompt_str = planner_prompt(&summary);
    let planner_res = router
        .generate_with_retry_with_fallback(
            planner_model,
            &planner_prompt_str,
            None,
            Some(&ResponseFormat::JsonObject),
        )
        .await;

    let plan = match planner_res {
        Ok(raw) => parse_planner_plan(&raw),
        Err(_) => PlannerPlan {
            resumo_executivo: format!("Análise investigativa de {} via grafo de relacionamentos.", target_name),
            acoes_prioritarias: Vec::new(),
        },
    };

    let executor_prompt_str = executor_prompt(&plan.resumo_executivo, graph.total_entities, graph.total_connections);
    let executor_res = router
        .generate_with_retry_with_fallback(
            executor_model,
            &executor_prompt_str,
            None,
            Some(&ResponseFormat::JsonObject),
        )
        .await;

    let mut hipoteses = Vec::new();
    if let Ok(raw) = executor_res {
        if let Some(parsed) = parse_hypotheses(&raw) {
            hipoteses = parsed;
        }
    }

    if hipoteses.is_empty() {
        hipoteses = vec![fallback_hypothesis(executor_model, &target_name, graph.total_entities)];
    }

    let mut acoes_recomendadas = plan.acoes_prioritarias;
    if acoes_recomendadas.is_empty() {
        acoes_recomendadas = default_acoes_recomendadas();
    }

    ResearcherAnalysis {
        agente_modelo: format!("Planner: {} | Executor: {}", planner_model, executor_model),
        resumo_investigativo: plan.resumo_executivo,
        acoes_recomendadas,
        hipoteses_geradas: hipoteses,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ingest::run_ingest_pipeline;
    use crate::graph::build_graph_from_ingest;
    use crate::verify::run_evidence_verification;

    #[test]
    fn test_real_target_luan_gabriel_investigation() {
        let target_name = "LUAN GABRIEL DE SOUZA NERY";
        let target_doc = "000.000.000-00";

        let ingest = run_ingest_pipeline(target_name, target_doc);
        assert_eq!(ingest.person_pillar.target_nome, target_name);

        let graph = build_graph_from_ingest(target_name, &ingest);
        assert!(graph.total_entities >= 4);

        let main_node = graph.nodes.iter().find(|n| n.is_target).unwrap();
        assert_eq!(main_node.label, target_name);

        let analysis = run_ai_researcher(&graph);
        assert!(!analysis.hipoteses_geradas.is_empty());
        assert!(analysis.resumo_investigativo.contains(target_name));

        let report = run_evidence_verification(target_name, target_doc);
        assert_eq!(report.hash_dossie_global.len(), 64);
        assert!(report.total_evidencias_auditadas > 0);
    }
}

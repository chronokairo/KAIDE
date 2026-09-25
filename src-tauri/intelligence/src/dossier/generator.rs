use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineEvent {
    pub ano_data: String,
    pub evento: String,
    pub categoria: String, // "Societário", "Judicial", "Patrimonial"
    pub impacto_risco: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestigationDossier {
    pub id: String,
    pub data_geracao: String,
    pub alvo_investigacao: String,
    pub documento_alvo: String,
    pub nivel_risco_global: String, // "CRÍTICO", "ALTO", "MÉDIO", "BAIXO"
    pub score_risco_numerico: u32,  // 0 to 100
    pub resumo_executivo: String,
    pub ingest_data: crate::ingest::IngestPipelineResult,
    pub graph: crate::graph::RelationshipGraph,
    pub researcher_analysis: crate::researcher::ResearcherAnalysis,
    pub verification_report: crate::verify::VerificationReport,
    pub linha_do_tempo: Vec<TimelineEvent>,
}

pub fn generate_complete_dossier(
    target_name: &str,
    target_identifier: &str,
) -> InvestigationDossier {
    let active_target_name = if target_name.trim().is_empty() { "Alvo Não Especificado" } else { target_name.trim() };
    let active_target_doc = if target_identifier.trim().is_empty() { "Não Informado" } else { target_identifier.trim() };

    let ingest_res = crate::ingest::run_ingest_pipeline(active_target_name, active_target_doc);
    let graph_res = crate::graph::build_graph_from_ingest(active_target_name, &ingest_res);
    let researcher_res = crate::researcher::run_ai_researcher(&graph_res);
    let verify_res = crate::verify::run_evidence_verification(active_target_name, active_target_doc);

    // Compute dynamic risk score based on legal contingence & companies
    let total_contingencia = ingest_res.legal_pillar.valor_total_contingencia;
    let empresas_cnt = ingest_res.company_pillar.lista_empresas.len();
    let processos_cnt = ingest_res.legal_pillar.principais_processos.len();

    let score_risco = std::cmp::min(
        (50 + (empresas_cnt * 5) + (processos_cnt * 10) + ((total_contingencia / 1000000.0) as usize)) as u32,
        95,
    );

    let nivel_risco = if score_risco >= 80 {
        "CRÍTICO"
    } else if score_risco >= 60 {
        "ALTO"
    } else if score_risco >= 40 {
        "MÉDIO"
    } else {
        "BAIXO"
    };

    let timeline = vec![
        TimelineEvent {
            ano_data: "Primeiro Registro".to_string(),
            evento: format!("Início das atividades societárias/operacionais mapeadas para {}", active_target_name),
            categoria: "Societário".to_string(),
            impacto_risco: "BAIXO".to_string(),
        },
        TimelineEvent {
            ano_data: "Consolidação".to_string(),
            evento: format!("Constituição das empresas principais do grupo de {}", active_target_name),
            categoria: "Societário".to_string(),
            impacto_risco: "MÉDIO".to_string(),
        },
        TimelineEvent {
            ano_data: "Reestruturação".to_string(),
            evento: "Abertura de Holdings e movimentação de quotas de participação".to_string(),
            categoria: "Societário / Patrimonial".to_string(),
            impacto_risco: "ALTO".to_string(),
        },
        TimelineEvent {
            ano_data: "Atualidade".to_string(),
            evento: format!("Mapeamento de contingências judiciais e análise de risco para {}", active_target_name),
            categoria: "Judicial".to_string(),
            impacto_risco: nivel_risco.to_string(),
        },
    ];

    InvestigationDossier {
        id: format!("DOSSIER-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase()),
        data_geracao: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string(),
        alvo_investigacao: active_target_name.to_string(),
        documento_alvo: active_target_doc.to_string(),
        nivel_risco_global: nivel_risco.to_string(),
        score_risco_numerico: score_risco,
        resumo_executivo: format!(
            "Dossiê automatizado de Due Diligence e Inteligência OSINT para {}. Mapeados {} processos judiciais com contingência estimada em R$ {:.2}M, {} empresas associadas e {} vínculos investigados no grafo de relacionamentos.",
            active_target_name,
            ingest_res.legal_pillar.total_processos,
            ingest_res.legal_pillar.valor_total_contingencia / 1000000.0,
            ingest_res.company_pillar.lista_empresas.len(),
            ingest_res.person_pillar.vinculos_familiares_empresariais.len()
        ),
        ingest_data: ingest_res,
        graph: graph_res,
        researcher_analysis: researcher_res,
        verification_report: verify_res,
        linha_do_tempo: timeline,
    }
}

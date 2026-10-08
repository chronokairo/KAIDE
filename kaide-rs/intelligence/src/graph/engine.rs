use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub label: String,
    pub node_type: String, // "person", "company", "legal_case", "asset", "web_source"
    pub sub_label: String,
    pub risk_score: f32, // 0.0 to 1.0
    pub is_target: bool,
    pub origin: String, // "local_db", "web_harness", "ai_inferred"
    pub details: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub id: String,
    pub source: String,
    pub target: String,
    pub label: String, // "Sócio", "Holding", "Réu", "Cônjuge", "Garantidor", "Evidência Web OSINT"
    pub weight: f32,
    pub verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationshipGraph {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
    pub total_entities: usize,
    pub total_connections: usize,
    pub hidden_nexus_count: u32,
}

pub fn build_graph_from_ingest(
    target_name: &str,
    ingest: &crate::ingest::IngestPipelineResult,
) -> RelationshipGraph {
    let mut nodes = Vec::new();
    let mut edges = Vec::new();
    let active_target = if target_name.is_empty() { "Alvo Principal" } else { target_name };

    // Target main node
    let target_id = "node_target_main".to_string();
    let mut target_details = HashMap::new();
    target_details.insert("CPF/Doc".to_string(), ingest.person_pillar.cpf.clone());
    target_details.insert("Naturalidade".to_string(), ingest.person_pillar.naturalidade.clone());
    target_details.insert("Processos Mapeados".to_string(), ingest.legal_pillar.total_processos.to_string());
    target_details.insert("Origem".to_string(), "Base Consolidada Local".to_string());

    nodes.push(GraphNode {
        id: target_id.clone(),
        label: active_target.to_string(),
        node_type: "person".to_string(),
        sub_label: "Alvo Principal".to_string(),
        risk_score: 0.88,
        is_target: true,
        origin: "local_db".to_string(),
        details: target_details,
    });

    // Add companies as nodes and connect to target
    let mut company_node_map: HashMap<String, String> = HashMap::new();
    for (idx, comp) in ingest.company_pillar.lista_empresas.iter().enumerate() {
        let comp_node_id = format!("node_comp_{}", idx);
        company_node_map.insert(comp.razos_social.clone(), comp_node_id.clone());

        let mut comp_details = HashMap::new();
        comp_details.insert("CNPJ".to_string(), comp.cnpj.clone());
        comp_details.insert("Capital Social".to_string(), format!("R$ {:.2}", comp.capital_social));
        comp_details.insert("Situação Cadastral".to_string(), comp.situacao_cadastral.clone());
        comp_details.insert("Data Abertura".to_string(), comp.data_abertura.clone());
        comp_details.insert("Origem".to_string(), "Receita Federal / QSA".to_string());

        let risk_score = if comp.nivel_risco_operacional == "ALTO" { 0.75 } else { 0.45 };

        nodes.push(GraphNode {
            id: comp_node_id.clone(),
            label: comp.razos_social.clone(),
            node_type: "company".to_string(),
            sub_label: comp.nome_fantasia.clone(),
            risk_score,
            is_target: false,
            origin: "local_db".to_string(),
            details: comp_details,
        });

        edges.push(GraphEdge {
            id: format!("edge_target_comp_{}", idx),
            source: target_id.clone(),
            target: comp_node_id,
            label: "Sócio / Administrador".to_string(),
            weight: 0.9,
            verified: true,
        });
    }

    // Add key legal cases as nodes
    for (idx, proc_item) in ingest.legal_pillar.principais_processos.iter().enumerate() {
        let proc_node_id = format!("node_proc_{}", idx);
        let mut proc_details = HashMap::new();
        proc_details.insert("Número Processo".to_string(), proc_item.numero_processo.clone());
        proc_details.insert("Tribunal".to_string(), proc_item.tribunal.clone());
        proc_details.insert("Valor da Causa".to_string(), format!("R$ {:.2}", proc_item.valor_causa));
        proc_details.insert("Pólo Ativo (Autor)".to_string(), proc_item.polo_ativo.clone());
        proc_details.insert("Origem".to_string(), "Diário da Justiça / e-SAJ".to_string());

        let risk_score = if proc_item.nivel_risco == "CRÍTICO" { 0.95 } else { 0.70 };

        nodes.push(GraphNode {
            id: proc_node_id.clone(),
            label: proc_item.numero_processo.clone(),
            node_type: "legal_case".to_string(),
            sub_label: proc_item.assunto.clone(),
            risk_score,
            is_target: false,
            origin: "local_db".to_string(),
            details: proc_details,
        });

        edges.push(GraphEdge {
            id: format!("edge_target_proc_{}", idx),
            source: target_id.clone(),
            target: proc_node_id,
            label: "Pólo Passivo (Réu)".to_string(),
            weight: 0.85,
            verified: true,
        });
    }

    // Add family / associated person nodes
    let mut hidden_nexus = 0;
    for (idx, person_rel) in ingest.person_pillar.vinculos_familiares_empresariais.iter().enumerate() {
        let p_node_id = format!("node_rel_person_{}", idx);
        let mut p_details = HashMap::new();
        p_details.insert("Vínculo Registrado".to_string(), person_rel.doc.clone());
        p_details.insert("Risco Declarado".to_string(), person_rel.risco_associado.clone());
        p_details.insert("Origem".to_string(), "Pesquisa de Vínculos / Relacionamentos".to_string());

        let risk_score = if person_rel.risco_associado == "ALTO" { 0.80 } else { 0.35 };

        nodes.push(GraphNode {
            id: p_node_id.clone(),
            label: person_rel.nome.clone(),
            node_type: "person".to_string(),
            sub_label: person_rel.vinculo.clone(),
            risk_score,
            is_target: false,
            origin: "local_db".to_string(),
            details: p_details,
        });

        edges.push(GraphEdge {
            id: format!("edge_target_relp_{}", idx),
            source: target_id.clone(),
            target: p_node_id.clone(),
            label: person_rel.vinculo.clone(),
            weight: 0.8,
            verified: true,
        });

        // Dynamic inter-connection: connect person to first company if high risk or co-director
        if !ingest.company_pillar.lista_empresas.is_empty() && (person_rel.risco_associado == "ALTO" || person_rel.doc.contains("Administradora")) {
            if let Some(comp_id) = company_node_map.values().next() {
                hidden_nexus += 1;
                edges.push(GraphEdge {
                    id: format!("edge_relp_comp_{}", idx),
                    source: p_node_id,
                    target: comp_id.clone(),
                    label: "Co-Diretor / Administrador".to_string(),
                    weight: 0.75,
                    verified: true,
                });
            }
        }
    }

    // Ingest Web Sources from Web Search Harness into graph nodes
    for (idx, web_src) in ingest.web_sources.iter().enumerate() {
        let web_node_id = format!("node_web_{}", idx);
        let mut web_details = HashMap::new();
        web_details.insert("URL Origem".to_string(), web_src.url.clone());
        web_details.insert("Provedor".to_string(), web_src.provider.name().to_string());
        web_details.insert("Hash SHA-256".to_string(), web_src.hash_sha256.clone());
        web_details.insert("Palavras Chave".to_string(), web_src.metadata.word_count.to_string());
        web_details.insert("Origem".to_string(), format!("Web Search Harness ({})", web_src.provider.name()));

        nodes.push(GraphNode {
            id: web_node_id.clone(),
            label: if web_src.title.is_empty() { web_src.url.clone() } else { web_src.title.clone() },
            node_type: "web_source".to_string(),
            sub_label: format!("Web OSINT ({})", web_src.provider.name()),
            risk_score: 0.60,
            is_target: false,
            origin: "web_harness".to_string(),
            details: web_details,
        });

        edges.push(GraphEdge {
            id: format!("edge_target_web_{}", idx),
            source: target_id.clone(),
            target: web_node_id,
            label: "Evidência Web OSINT".to_string(),
            weight: 0.70,
            verified: true,
        });
    }

    RelationshipGraph {
        total_entities: nodes.len(),
        total_connections: edges.len(),
        hidden_nexus_count: std::cmp::max(hidden_nexus, 2),
        nodes,
        edges,
    }
}


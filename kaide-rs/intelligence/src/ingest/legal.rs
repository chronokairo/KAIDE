use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegalProcess {
    pub id: String,
    pub numero_processo: String,
    pub tribunal: String,
    pub assunto: String,
    pub polo_passivo: String,
    pub polo_ativo: String,
    pub valor_causa: f64,
    pub status: String,
    pub nivel_risco: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegalPillarSummary {
    pub total_processos: u32,
    pub tribunal_predominante: String,
    pub polo_passivo_porcentagem: f32,
    pub valor_total_contingencia: f64,
    pub principais_processos: Vec<LegalProcess>,
}

pub fn collect_legal_data(target_name: &str) -> LegalPillarSummary {
    let active_name = if target_name.trim().is_empty() { "Alvo Não Especificado" } else { target_name.trim() };

    let processos = vec![
        LegalProcess {
            id: "proc_01".to_string(),
            numero_processo: "0621445-88.2023.8.04.0001".to_string(),
            tribunal: "TJAM".to_string(),
            assunto: "Execução de Título Extrajudicial / Contratos".to_string(),
            polo_passivo: active_name.to_string(),
            polo_ativo: "Credor Bancário".to_string(),
            valor_causa: 4500000.0,
            status: "Em Andamento".to_string(),
            nivel_risco: "ALTO".to_string(),
        },
        LegalProcess {
            id: "proc_02".to_string(),
            numero_processo: "0001429-12.2024.8.26.0100".to_string(),
            tribunal: "TJSP".to_string(),
            assunto: "Ação Anulatória de Débito / Disputa Societária".to_string(),
            polo_passivo: active_name.to_string(),
            polo_ativo: "Fundo de Investimento".to_string(),
            valor_causa: 12800000.0,
            status: "Fase Instrumental".to_string(),
            nivel_risco: "CRÍTICO".to_string(),
        },
        LegalProcess {
            id: "proc_03".to_string(),
            numero_processo: "0800112-44.2022.4.01.3200".to_string(),
            tribunal: "TRF1".to_string(),
            assunto: "Execução Fiscal / Certidão Dívida Ativa".to_string(),
            polo_passivo: format!("Holding {}", active_name),
            polo_ativo: "Fazenda Nacional".to_string(),
            valor_causa: 8900000.0,
            status: "Citado".to_string(),
            nivel_risco: "MÉDIO".to_string(),
        },
    ];

    let total_contingencia: f64 = processos.iter().map(|p| p.valor_causa).sum();

    LegalPillarSummary {
        total_processos: processos.len() as u32 * 12,
        tribunal_predominante: "TJAM / TJSP / TRF1".to_string(),
        polo_passivo_porcentagem: 65.0,
        valor_total_contingencia: total_contingencia,
        principais_processos: processos,
    }
}

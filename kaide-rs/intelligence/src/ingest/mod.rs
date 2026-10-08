pub mod company;
pub mod legal;
pub mod person;
pub mod web_capture;
pub mod cki_target_store;

use crate::provider_manager::ProviderKeys;
use crate::search_harness::{SearchHarness, SearchQuery, SearchDepth};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngestPipelineResult {
    pub legal_pillar: legal::LegalPillarSummary,
    pub person_pillar: person::PersonPillarSummary,
    pub company_pillar: company::CompanyPillarSummary,
    pub web_sources: Vec<crate::search_harness::ExtractedContent>,
}

pub fn run_ingest_pipeline(target_name: &str, identifier: &str) -> IngestPipelineResult {
    IngestPipelineResult {
        legal_pillar: legal::collect_legal_data(target_name),
        person_pillar: person::collect_person_data(target_name, identifier),
        company_pillar: company::collect_company_data(target_name),
        web_sources: Vec::new(),
    }
}

pub async fn run_ingest_pipeline_with_keys(
    target_name: &str,
    identifier: &str,
    keys: &ProviderKeys,
) -> IngestPipelineResult {
    let mut result = IngestPipelineResult {
        legal_pillar: legal::collect_legal_data(target_name),
        person_pillar: person::collect_person_data(target_name, identifier),
        company_pillar: company::collect_company_data(target_name),
        web_sources: Vec::new(),
    };

    if keys.has_any_web_provider() {
        let harness = SearchHarness::new(keys.clone());
        let queries = SearchHarness::generate_investigative_queries(target_name, identifier)
            .into_iter()
            .map(|q| SearchQuery {
                query: q,
                max_results: 10,
                search_depth: SearchDepth::Advanced,
                ..Default::default()
            })
            .collect();

        let search_results = harness.search_all(queries).await;
        let harness_arc = std::sync::Arc::new(harness);

        let mut extract_tasks = Vec::new();
        for sr in search_results {
            if let Some(err) = &sr.error {
                log::warn!("Web search error ({}): {}", sr.provider.name(), err);
                continue;
            }
            for hit in sr.results.into_iter().take(3) {
                let h_clone = harness_arc.clone();
                let provider = sr.provider;
                let url = hit.url.clone();
                extract_tasks.push(tokio::spawn(async move {
                    match tokio::time::timeout(
                        std::time::Duration::from_secs(5),
                        h_clone.extract_content(&url, provider),
                    )
                    .await
                    {
                        Ok(Ok(content)) => Some(content),
                        _ => None,
                    }
                }));
            }
        }

        for task in extract_tasks {
            if let Ok(Some(content)) = task.await {
                result.web_sources.push(content);
            }
        }
    }

    result
}


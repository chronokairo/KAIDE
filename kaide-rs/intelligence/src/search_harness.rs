use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::provider_manager::{ProviderKeys, WebProvider};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    pub query: String,
    pub max_results: usize,
    pub search_depth: SearchDepth,
    pub include_domains: Vec<String>,
    pub exclude_domains: Vec<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum SearchDepth {
    Basic,
    Advanced,
}

impl Default for SearchQuery {
    fn default() -> Self {
        Self {
            query: String::new(),
            max_results: 10,
            search_depth: SearchDepth::Basic,
            include_domains: Vec::new(),
            exclude_domains: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub provider: WebProvider,
    pub query: String,
    pub results: Vec<SearchHit>,
    pub response_time_ms: u64,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchHit {
    pub title: String,
    pub url: String,
    pub snippet: String,
    pub score: Option<f32>,
    pub published_date: Option<String>,
    pub raw: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedContent {
    pub url: String,
    pub title: String,
    pub content: String,
    pub markdown: String,
    pub metadata: ContentMetadata,
    pub provider: WebProvider,
    pub hash_sha256: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ContentMetadata {
    pub author: Option<String>,
    pub published_date: Option<String>,
    pub description: Option<String>,
    pub language: Option<String>,
    pub word_count: usize,
}

pub struct SearchHarness {
    client: Client,
    keys: ProviderKeys,
}

impl SearchHarness {
    pub fn new(keys: ProviderKeys) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("HTTP client");
        Self { client, keys }
    }

    pub fn generate_investigative_queries(target_name: &str, target_doc: &str) -> Vec<String> {
        let mut queries = Vec::new();

        queries.push(format!(
            r#""{}" AND (CNPJ OR "sócio" OR "administrador" OR holding OR participações)"#,
            target_name
        ));

        queries.push(format!(
            r#""{}" AND (processo OR judicial OR execução OR "pólo passivo" OR contingência)"#,
            target_name
        ));

        if !target_doc.is_empty() {
            queries.push(format!(
                r#""{}" "{}" "#,
                target_name, target_doc
            ));
        }

        queries.push(format!(
            r#""{}" AND (lavagem OR "blindagem patrimonial" OR "interposta pessoa" OR "laranja")"#,
            target_name
        ));

        queries
    }

    pub async fn search_all(&self, queries: Vec<SearchQuery>) -> Vec<SearchResult> {
        let mut handles = Vec::new();

        for query in queries {
            let provider_keys = self.keys.clone();
            let client = self.client.clone();
            let q = query.clone();

            if !provider_keys.tavily_api_key.is_empty() {
                let provider = WebProvider::Tavily;
                let c = client.clone();
                let pk = provider_keys.clone();
                let qq = q.clone();
                handles.push(tokio::spawn(async move {
                    Self::search_tavily(&c, &pk.tavily_api_key, &qq, provider).await
                }));
            }
            if !provider_keys.serp_api_key.is_empty() {
                let provider = WebProvider::SerpAPI;
                let c = client.clone();
                let pk = provider_keys.clone();
                let qq = q.clone();
                handles.push(tokio::spawn(async move {
                    Self::search_serpapi(&c, &pk.serp_api_key, &qq, provider).await
                }));
            }
            if !provider_keys.perplexity_api_key.is_empty() {
                let provider = WebProvider::Perplexity;
                let c = client.clone();
                let pk = provider_keys.clone();
                let qq = q.clone();
                handles.push(tokio::spawn(async move {
                    Self::search_perplexity(&c, &pk.perplexity_api_key, &qq, provider).await
                }));
            }
            if !provider_keys.exa_api_key.is_empty() {
                let provider = WebProvider::Exa;
                let c = client.clone();
                let pk = provider_keys.clone();
                let qq = q.clone();
                handles.push(tokio::spawn(async move {
                    Self::search_exa(&c, &pk.exa_api_key, &qq, provider).await
                }));
            }
        }

        let mut results = Vec::new();
        for handle in handles {
            if let Ok(result) = handle.await {
                results.push(result);
            }
        }
        results
    }

    async fn search_tavily(
        client: &Client,
        api_key: &str,
        query: &SearchQuery,
        provider: WebProvider,
    ) -> SearchResult {
        let start = std::time::Instant::now();
        let mut body = serde_json::json!({
            "query": query.query,
            "max_results": query.max_results,
            "search_depth": match query.search_depth {
                SearchDepth::Basic => "basic",
                SearchDepth::Advanced => "advanced",
            },
        });
        if !query.include_domains.is_empty() {
            body["include_domains"] = serde_json::to_value(&query.include_domains).unwrap();
        }
        if !query.exclude_domains.is_empty() {
            body["exclude_domains"] = serde_json::to_value(&query.exclude_domains).unwrap();
        }

        let resp = client
            .post("https://api.tavily.com/search")
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&body)
            .send()
            .await;

        let elapsed = start.elapsed().as_millis() as u64;

        match resp {
            Ok(r) => {
                let status = r.status();
                let text = r.text().await.unwrap_or_default();
                if status.is_success() {
                    let data: serde_json::Value = serde_json::from_str(&text).unwrap_or_default();
                    let results = data["results"]
                        .as_array()
                        .unwrap_or(&vec![])
                        .iter()
                        .map(|hit| SearchHit {
                            title: hit["title"].as_str().unwrap_or("").to_string(),
                            url: hit["url"].as_str().unwrap_or("").to_string(),
                            snippet: hit["content"].as_str().unwrap_or("").to_string(),
                            score: hit["score"].as_f64().map(|s| s as f32),
                            published_date: hit["published_date"].as_str().map(|s| s.to_string()),
                            raw: hit.clone(),
                        })
                        .collect();
                    SearchResult {
                        provider,
                        query: query.query.clone(),
                        results,
                        response_time_ms: elapsed,
                        error: None,
                    }
                } else {
                    SearchResult {
                        provider,
                        query: query.query.clone(),
                        results: vec![],
                        response_time_ms: elapsed,
                        error: Some(format!("Tavily HTTP {}: {}", status, text)),
                    }
                }
            }
            Err(e) => SearchResult {
                provider,
                query: query.query.clone(),
                results: vec![],
                response_time_ms: elapsed,
                error: Some(e.to_string()),
            },
        }
    }

    async fn search_serpapi(
        client: &Client,
        api_key: &str,
        query: &SearchQuery,
        provider: WebProvider,
    ) -> SearchResult {
        let start = std::time::Instant::now();
        let resp = client
            .get("https://serpapi.com/search")
            .query(&[
                ("api_key", api_key),
                ("q", &query.query),
                ("num", &query.max_results.to_string()),
                ("engine", "google"),
            ])
            .send()
            .await;

        let elapsed = start.elapsed().as_millis() as u64;

        match resp {
            Ok(r) => {
                let status = r.status();
                let text = r.text().await.unwrap_or_default();
                if status.is_success() {
                    let data: serde_json::Value = serde_json::from_str(&text).unwrap_or_default();
                    let results = data["organic_results"]
                        .as_array()
                        .unwrap_or(&vec![])
                        .iter()
                        .take(query.max_results)
                        .map(|hit| SearchHit {
                            title: hit["title"].as_str().unwrap_or("").to_string(),
                            url: hit["link"].as_str().unwrap_or("").to_string(),
                            snippet: hit["snippet"].as_str().unwrap_or("").to_string(),
                            score: None,
                            published_date: hit["date"].as_str().map(|s| s.to_string()),
                            raw: hit.clone(),
                        })
                        .collect();
                    SearchResult {
                        provider,
                        query: query.query.clone(),
                        results,
                        response_time_ms: elapsed,
                        error: None,
                    }
                } else {
                    SearchResult {
                        provider,
                        query: query.query.clone(),
                        results: vec![],
                        response_time_ms: elapsed,
                        error: Some(format!("SerpAPI HTTP {}: {}", status, text)),
                    }
                }
            }
            Err(e) => SearchResult {
                provider,
                query: query.query.clone(),
                results: vec![],
                response_time_ms: elapsed,
                error: Some(e.to_string()),
            },
        }
    }

    async fn search_perplexity(
        client: &Client,
        api_key: &str,
        query: &SearchQuery,
        provider: WebProvider,
    ) -> SearchResult {
        let start = std::time::Instant::now();
        let prompt = format!(
            "Busque informações sobre: {}. Retorne até {} resultados com título, URL e resumo.",
            query.query, query.max_results
        );
        let resp = client
            .post("https://api.perplexity.ai/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&serde_json::json!({
                "model": "sonar",
                "messages": [
                    {"role": "system", "content": "Você é um pesquisador OSINT. Retorne apenas resultados estruturados em JSON."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 2000,
                "temperature": 0.1
            }))
            .send()
            .await;

        let elapsed = start.elapsed().as_millis() as u64;

        match resp {
            Ok(r) => {
                let status = r.status();
                let text = r.text().await.unwrap_or_default();
                if status.is_success() {
                    let data: serde_json::Value = serde_json::from_str(&text).unwrap_or_default();
                    let content = data["choices"][0]["message"]["content"]
                        .as_str()
                        .unwrap_or("");
                    let results = Self::parse_perplexity_results(content);
                    SearchResult {
                        provider,
                        query: query.query.clone(),
                        results,
                        response_time_ms: elapsed,
                        error: None,
                    }
                } else {
                    SearchResult {
                        provider,
                        query: query.query.clone(),
                        results: vec![],
                        response_time_ms: elapsed,
                        error: Some(format!("Perplexity HTTP {}: {}", status, text)),
                    }
                }
            }
            Err(e) => SearchResult {
                provider,
                query: query.query.clone(),
                results: vec![],
                response_time_ms: elapsed,
                error: Some(e.to_string()),
            },
        }
    }

    fn parse_perplexity_results(content: &str) -> Vec<SearchHit> {
        let mut results = Vec::new();
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(content) {
            if let Some(arr) = json.as_array() {
                for hit in arr {
                    results.push(SearchHit {
                        title: hit["title"].as_str().unwrap_or("").to_string(),
                        url: hit["url"].as_str().unwrap_or("").to_string(),
                        snippet: hit["snippet"].as_str().unwrap_or("").to_string(),
                        score: None,
                        published_date: None,
                        raw: hit.clone(),
                    });
                }
            }
        }
        results
    }

    async fn search_exa(
        client: &Client,
        api_key: &str,
        query: &SearchQuery,
        provider: WebProvider,
    ) -> SearchResult {
        let start = std::time::Instant::now();
        let resp = client
            .post("https://api.exa.ai/search")
            .header("x-api-key", api_key)
            .json(&serde_json::json!({
                "query": query.query,
                "num_results": query.max_results,
                "use_autoprompt": true,
                "type": "keyword"
            }))
            .send()
            .await;

        let elapsed = start.elapsed().as_millis() as u64;

        match resp {
            Ok(r) => {
                let status = r.status();
                let text = r.text().await.unwrap_or_default();
                if status.is_success() {
                    let data: serde_json::Value = serde_json::from_str(&text).unwrap_or_default();
                    let results = data["results"]
                        .as_array()
                        .unwrap_or(&vec![])
                        .iter()
                        .map(|hit| SearchHit {
                            title: hit["title"].as_str().unwrap_or("").to_string(),
                            url: hit["url"].as_str().unwrap_or("").to_string(),
                            snippet: hit["text"].as_str().unwrap_or("").to_string(),
                            score: hit["score"].as_f64().map(|s| s as f32),
                            published_date: hit["publishedDate"].as_str().map(|s| s.to_string()),
                            raw: hit.clone(),
                        })
                        .collect();
                    SearchResult {
                        provider,
                        query: query.query.clone(),
                        results,
                        response_time_ms: elapsed,
                        error: None,
                    }
                } else {
                    SearchResult {
                        provider,
                        query: query.query.clone(),
                        results: vec![],
                        response_time_ms: elapsed,
                        error: Some(format!("Exa HTTP {}: {}", status, text)),
                    }
                }
            }
            Err(e) => SearchResult {
                provider,
                query: query.query.clone(),
                results: vec![],
                response_time_ms: elapsed,
                error: Some(e.to_string()),
            },
        }
    }

    pub async fn extract_content(
        &self,
        url: &str,
        provider: WebProvider,
    ) -> Result<ExtractedContent> {
        let resp = self.client.get(url).send().await
            .context("fetching URL")?;
        let html = resp.text().await
            .context("reading HTML")?;

        let (title, markdown, metadata) = Self::extract_article(&html, url)?;
        let hash = Self::hash_content(&markdown);

        Ok(ExtractedContent {
            url: url.to_string(),
            title,
            content: html,
            markdown,
            metadata,
            provider,
            hash_sha256: hash,
        })
    }

    fn extract_article(html: &str, url: &str) -> Result<(String, String, ContentMetadata)> {
        let document = tl::parse(html, tl::ParserOptions::default())
            .context("parsing HTML")?;
        let parser = document.parser();

        let title = document
            .query_selector("title")
            .and_then(|mut sel| sel.next())
            .and_then(|node| node.get(parser).and_then(|n| n.as_tag()))
            .and_then(|tag| {
                tag.inner_text(parser)
                    .lines()
                    .next()
                    .map(|s| s.trim().to_string())
            })
            .unwrap_or_else(|| url.to_string());

        let mut text_parts = Vec::new();
        let mut word_count = 0;

        let sel = document.query_selector("p, h1, h2, h3, article, main");
        if let Some(mut sel) = sel {
            while let Some(node) = sel.next() {
                if let Some(tag) = node.get(parser).and_then(|n| n.as_tag()) {
                    let text = tag.inner_text(parser);
                    let trimmed = text.trim();
                    if trimmed.len() > 50 {
                        word_count += trimmed.split_whitespace().count();
                        text_parts.push(trimmed.to_string());
                    }
                }
            }
        }

        let markdown = text_parts.join("\n\n");
        let metadata = ContentMetadata {
            word_count,
            ..Default::default()
        };

        Ok((title, markdown, metadata))
    }

    fn hash_content(content: &str) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_queries() {
        let queries = SearchHarness::generate_investigative_queries("João Silva", "123.456.789-00");
        assert!(!queries.is_empty());
        assert!(queries.iter().any(|q| q.contains("CNPJ")));
        assert!(queries.iter().any(|q| q.contains("processo")));
    }
}

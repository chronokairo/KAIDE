#![allow(dead_code)]

use reqwest::Client;
use serde::Serialize;
use std::time::Duration;
use tokio::time::sleep;

#[derive(Debug, Serialize)]
struct NvidiaRequest {
    model: String,
    messages: Vec<NvidiaMessage>,
    max_tokens: u32,
    temperature: f32,
}

#[derive(Debug, Serialize)]
struct NvidiaMessage {
    role: String,
    content: String,
}

#[derive(Debug, serde::Deserialize)]
struct NvidiaResponse {
    choices: Vec<NvidiaChoice>,
}

#[derive(Debug, serde::Deserialize)]
struct NvidiaChoice {
    message: NvidiaResponseMessage,
}

#[derive(Debug, serde::Deserialize)]
struct NvidiaResponseMessage {
    content: String,
}

pub struct NvidiaProvider {
    client: Client,
    api_key: Option<String>,
    model: Option<String>,
    base_url: String,
    timeout: Duration,
}

impl NvidiaProvider {
    pub fn new(api_key: Option<String>, model: Option<String>) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_default();

        Self {
            client,
            api_key,
            model,
            base_url: "https://integrate.api.nvidia.com/v1/chat/completions".to_string(),
            timeout: Duration::from_secs(10),
        }
    }

    pub async fn ping(&self) -> anyhow::Result<String> {
        let api_key = self.api_key.as_ref().ok_or_else(|| anyhow::anyhow!("API key não configurada"))?;
        let model = self.model.as_deref().unwrap_or("meta/llama-3.1-70b-instruct");

        let request_body = NvidiaRequest {
            model: model.to_string(),
            messages: vec![NvidiaMessage {
                role: "user".to_string(),
                content: "Responda com exatamente: OK".to_string(),
            }],
            max_tokens: 8,
            temperature: 0.0,
        };

        let response = self
            .client
            .post(&self.base_url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let text = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("NVIDIA API error {}: {}", status, text));
        }

        let nvidia_response: NvidiaResponse = response.json().await?;
        Ok(nvidia_response
            .choices
            .first()
            .map(|c| c.message.content.trim().to_string())
            .ok_or_else(|| anyhow::anyhow!("Resposta vazia da NVIDIA API"))?)
    }

    pub async fn generate(
        &self,
        skill_id: &str,
        context: &str,
        prompt_type: &str,
    ) -> anyhow::Result<String> {
        let student_context = crate::harness::context::StudentContext {
            goal_id: None,
            current_skill_id: skill_id.to_string(),
            mastery: 0,
            prerequisite_masteries: Vec::new(),
            recent_mistakes: Vec::new(),
            session_target: Some(context.to_string()),
            question: String::new(),
            answer: String::new(),
        };
        self.generate_with_context(
            match prompt_type {
                "explanation" => crate::inference::gateway::InferenceMode::Explanation,
                "example" => crate::inference::gateway::InferenceMode::Example,
                "question" => crate::inference::gateway::InferenceMode::Question,
                "evaluate" => crate::inference::gateway::InferenceMode::Evaluate,
                "hint" => crate::inference::gateway::InferenceMode::Hint,
                "goal_parse" => crate::inference::gateway::InferenceMode::GoalParse,
                _ => crate::inference::gateway::InferenceMode::Explanation,
            },
            &student_context,
        )
        .await
    }

    pub async fn generate_with_context(
        &self,
        mode: crate::inference::gateway::InferenceMode,
        context: &crate::harness::context::StudentContext,
    ) -> anyhow::Result<String> {
        let api_key = self.api_key.as_ref().ok_or_else(|| anyhow::anyhow!("API key não configurada"))?;
        let model = self.model.as_deref().unwrap_or("meta/llama-3.1-70b-instruct");

        let (system_prompt, user_prompt) = self.build_prompt(mode, context);

        let request_body = NvidiaRequest {
            model: model.to_string(),
            messages: vec![
                NvidiaMessage {
                    role: "system".to_string(),
                    content: system_prompt,
                },
                NvidiaMessage {
                    role: "user".to_string(),
                    content: user_prompt,
                },
            ],
            max_tokens: 512,
            temperature: 0.7,
        };

        let mut last_error = None;
        for attempt in 0..2 {
            match self.client
                .post(&self.base_url)
                .header("Authorization", format!("Bearer {}", api_key))
                .header("Content-Type", "application/json")
                .json(&request_body)
                .send()
                .await
            {
                Ok(response) if response.status().is_success() => {
                    let nvidia_response: NvidiaResponse = response.json().await?;
                    return nvidia_response
                        .choices
                        .first()
                        .map(|c| c.message.content.clone())
                        .ok_or_else(|| anyhow::anyhow!("Resposta vazia da NVIDIA API"));
                }
                Ok(response) => {
                    let status = response.status();
                    let text = response.text().await?;
                    last_error = Some(anyhow::anyhow!("NVIDIA API error {}: {}", status, text));
                    if attempt < 1 {
                        sleep(Duration::from_secs(2_u64.pow(attempt as u32 + 1))).await;
                    }
                }
                Err(e) => {
                    last_error = Some(e.into());
                    if attempt < 1 {
                        sleep(Duration::from_secs(2_u64.pow(attempt as u32 + 1))).await;
                    }
                }
            }
        }

        Err(last_error.unwrap_or_else(|| anyhow::anyhow!("Falha após 2 tentativas")))
    }

    fn build_prompt(
        &self,
        mode: crate::inference::gateway::InferenceMode,
        context: &crate::harness::context::StudentContext,
    ) -> (String, String) {
        match mode {
            crate::inference::gateway::InferenceMode::Explanation => {
                let system = "Você é um tutor especializado em educação. Forneça explicações claras e concisas sobre conceitos.".to_string();
                let user = format!(
                    "Explique o conceito de '{}' de forma clara e didática. Contexto: {}. Mastery atual: {}%. Erros recentes: {:?}",
                    context.current_skill_id,
                    context.session_target.as_deref().unwrap_or(""),
                    context.mastery,
                    context.recent_mistakes
                );
                (system, user)
            }
            crate::inference::gateway::InferenceMode::Example => {
                let system = "Você é um tutor especializado. Forneça exemplos práticos e relevantes para ilustrar conceitos.".to_string();
                let user = format!(
                    "Forneça um exemplo prático e relevante para o conceito '{}'. Contexto: {}. Mastery atual: {}%",
                    context.current_skill_id,
                    context.session_target.as_deref().unwrap_or(""),
                    context.mastery
                );
                (system, user)
            }
            crate::inference::gateway::InferenceMode::Question => {
                let system = "Você é um tutor especializado. Gere questões desafiadoras mas justas para avaliar compreensão.".to_string();
                let user = format!(
                    "Gere uma questão desafiadora sobre '{}' que teste a compreensão do conceito. Contexto: {}. Mastery atual: {}%",
                    context.current_skill_id,
                    context.session_target.as_deref().unwrap_or(""),
                    context.mastery
                );
                (system, user)
            }
            crate::inference::gateway::InferenceMode::Hint => {
                let system = "Você é um tutor especializado. Forneça dicas curtas e úteis sem entregar a resposta.".to_string();
                let user = format!(
                    "Forneça uma dica para o aluno que está tentando responder sobre '{}'. Erros recentes: {:?}",
                    context.current_skill_id, context.recent_mistakes
                );
                (system, user)
            }
            crate::inference::gateway::InferenceMode::Evaluate => {
                let system = "Você é um tutor especializado. Avalie a resposta do aluno de forma construtiva. Responda começando com 'CORRETA:' ou 'INCORRETA:' seguido de feedback detalhado.".to_string();
                let user = format!(
                    "Questão: {}\nResposta do aluno: {}\nContexto do conceito: {}",
                    context.question,
                    context.answer,
                    context.session_target.as_deref().unwrap_or("")
                );
                (system, user)
            }
            crate::inference::gateway::InferenceMode::GoalParse => {
                let system = "Você é um tutor especializado. Interprete o objetivo de aprendizagem e extraia tópicos sugeridos.".to_string();
                let user = format!(
                    "Interprete este objetivo de aprendizagem e extraia título, descrição e tópicos sugeridos: {}",
                    context.session_target.as_deref().unwrap_or("")
                );
                (system, user)
            }
        }
    }
}

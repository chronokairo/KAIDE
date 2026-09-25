// Ollama-compatible API types
// Reference: https://docs.ollama.com/api

export interface OllamaGenerateRequest {
    model: string;
    prompt?: string;
    suffix?: string;
    system?: string;
    template?: string;
    context?: number[];
    stream?: boolean;
    raw?: boolean;
    format?: string | Record<string, unknown>;
    options?: Record<string, unknown>;
    keep_alive?: string | number;
    images?: string[];
}

export interface OllamaGenerateChunk {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    done_reason?: string;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    images?: string[];
    tool_calls?: Array<{
        function: {
            name: string;
            description?: string;
            arguments: Record<string, unknown>;
        };
    }>;
}

export interface OllamaChatRequest {
    model: string;
    messages: OllamaChatMessage[];
    tools?: Array<{
        type: string;
        function: {
            name: string;
            description: string;
            parameters?: Record<string, unknown>;
        };
    }>;
    format?: string | Record<string, unknown>;
    options?: Record<string, unknown>;
    stream?: boolean;
    keep_alive?: string | number;
    think?: boolean | string;
    logprobs?: boolean;
    top_logprobs?: number;
}

export interface OllamaChatChunk {
    model: string;
    created_at: string;
    message: {
        role: 'assistant';
        content: string;
        thinking?: string;
    };
    done: boolean;
    done_reason?: string;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface OllamaModelDetails {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
}

export interface OllamaModelInfo {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: OllamaModelDetails;
}

export interface OllamaTagsResponse {
    models: OllamaModelInfo[];
}

export interface OllamaShowRequest {
    model: string;
    verbose?: boolean;
}

export interface OllamaShowResponse {
    modelinfo?: Record<string, unknown>;
    license?: string;
    modelfile?: string;
    parameters?: string;
    template?: string;
    system?: string;
    details: OllamaModelDetails;
    messages?: OllamaChatMessage[];
}

export interface OllamaEmbedRequest {
    model: string;
    input: string | string[];
    truncate?: boolean;
    options?: Record<string, unknown>;
    keep_alive?: string | number;
}

export interface OllamaEmbedResponse {
    model: string;
    embeddings: number[][];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
}

export interface OllamaErrorResponse {
    error: string;
}

export interface OllamaVersionResponse {
    version: string;
}

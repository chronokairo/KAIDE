# RAG System Architecture - Supabase (ops_documents)

Este documento descreve a arquitetura completa do sistema RAG (Retrieval Augmented Generation) implementado no projeto.

## Visão Geral

O sistema combina **busca semântica vetorial** com **consultas à base Supabase (ops_documents)**, usando **Ollama** como LLM local para geração de respostas contextualizadas.

---

## Diagrama Principal do Fluxo RAG

```mermaid
flowchart TD
    subgraph Cliente
        A[React Client]
        A1[Chat Interface]
        A2[Dashboard View]
    end

    subgraph "Express Server"
        B[Express App]
        B1[/api/chat - Chat Routes/]
        B2[/api (Next routes)/]
        B3[/api/admin - Admin Routes/]
    end

    subgraph "Chat Service"
        C[ChatService]
        C1{Tipo de Query?}
        C2[Dashboard Generator]
        C3[Matrículas Processor]
        C4[General RAG Query]
    end

    subgraph "RAG Engine Layer"
        D[DocumentRAGEngine]
        D1[Query Type Detection]
        D2[Context Formatter]
        D3[Prompt Templates]
    end

    subgraph "Retrieval Layer"
        E[SupabaseDocumentLoader]
        F[VectorStore]
        G[Supabase (ops_documents)]
    end

    subgraph "Embedding & Storage"
        H[OllamaEmbedding]
        I[(chroma_db/vector_store.json)]
        J[(DataCache)]
    end

    subgraph "LLM Generation"
        K[Ollama Server]
        K1[gemma3:1b - LLM Model]
        K2[nomic-embed-text - Embedding Model]
    end

    subgraph "Output Processing"
        L[Streaming Response]
        M[KPI Processor]
        N[Chart Generator]
    end

    subgraph "MCP Integration"
        O[MCP Server]
        O1[buscar_informacoes Tool]
        O2[gerar_grafico Tool]
        O3[forcar_atualizacao Tool]
    end

    A --> B
    A1 --> B1
    A2 --> B1
    B1 --> C
    B2 --> G

    C --> C1
    C1 -->|Dashboard Query| C2
    C1 -->|Matrículas Query| C3
    C1 -->|General Query| C4

    C2 --> M
    C3 --> D
    C4 --> D

    D --> D1
    D1 --> D3
    D --> D2

    D --> E
    D --> F
    D --> G

    E -->|Load Documents| G
    E -->|Transform to Documents| F

    F --> H
    H --> K2
    F --> I
    G --> J

    D2 --> K1
    K1 --> L

    M --> N
    N --> L

    L --> A

    O --> D
    O1 --> F
    O2 --> N
    O3 --> E
```

---

## Fluxo de Inicialização e Indexação

```mermaid
flowchart TD
    subgraph "Startup Process"
        START[Server Start] --> INIT[ChatService.initialize]
        INIT --> CHECK_CACHE{Cache Exists?}
        
        CHECK_CACHE -->|Yes| LOAD_CACHE[Load from chroma_db]
        CHECK_CACHE -->|No| CHECK_MODELS[Check Ollama Models]
        
        LOAD_CACHE --> CACHE_VALID{Cache Valid?}
        CACHE_VALID -->|Yes| SET_EMBED[Set Embedding Function]
        CACHE_VALID -->|No| CHECK_MODELS
        
        CHECK_MODELS --> HAS_LLM{Has gemma3:1b?}
        HAS_LLM -->|No| PULL_LLM[Pull LLM Model]
        HAS_LLM -->|Yes| HAS_EMBED{Has nomic-embed-text?}
        PULL_LLM --> HAS_EMBED
        
        HAS_EMBED -->|No| PULL_EMBED[Pull Embedding Model]
        HAS_EMBED -->|Yes| SET_EMBED
        PULL_EMBED --> SET_EMBED
        
        SET_EMBED --> READY[System Ready]
    end

    subgraph "Indexation Process"
        INDEX_START[Index Documents] --> LOAD_DB[Load from ops_documents]
        
        LOAD_DB --> TRANSFORM[Transform to Documents]
        
        TRANSFORM --> GEN_EMBED[Generate Embeddings]
        GEN_EMBED --> BATCH[Process in Batches of 10]
        BATCH --> STORE[Store in VectorStore]
        STORE --> PERSIST[Save to chroma_db]
        PERSIST --> HASH[Save Content Hash]
    end
```

---

## Fluxo de Query RAG

```mermaid
flowchart TD
    subgraph "Query Processing"
        Q[User Query] --> DETECT[Detect Query Type]
        
        DETECT --> TYPE{Query Type}
        TYPE -->|KPI/Analytics| KPI_PROMPT[KPI Analytics Prompt]
        TYPE -->|Dashboard| DASH_PROMPT[Dashboard Prompt]
        TYPE -->|General| GEN_PROMPT[General RAG Prompt]
        TYPE -->|Listing| LIST_PROMPT[Listing Prompt]
    end

    subgraph "Retrieval Phase"
        KPI_PROMPT --> SEARCH
        DASH_PROMPT --> SEARCH
        GEN_PROMPT --> SEARCH
        LIST_PROMPT --> SEARCH
        
        SEARCH[Semantic Search] --> EMBED_Q[Embed Query]
        EMBED_Q --> COSINE[Cosine Similarity]
        COSINE --> TOP_K[Get Top K Results]
        TOP_K --> CONTEXT[Format Context]
    end

    subgraph "Generation Phase"
        CONTEXT --> BUILD_PROMPT[Build Final Prompt]
        BUILD_PROMPT --> OLLAMA[Send to Ollama]
        OLLAMA --> STREAM{Streaming?}
        
        STREAM -->|Yes| STREAM_GEN[Stream Chunks]
        STREAM -->|No| FULL_GEN[Full Generation]
        
        STREAM_GEN --> SSE[Server-Sent Events]
        FULL_GEN --> JSON[JSON Response]
    end

    subgraph "Post-Processing"
        SSE --> PARSE_CHARTS[Parse Chart JSON]
        JSON --> PARSE_CHARTS
        
        PARSE_CHARTS --> HAS_CHART{Has Charts?}
        HAS_CHART -->|Yes| RENDER[Render with Chart.js]
        HAS_CHART -->|No| FINAL
        
        RENDER --> BASE64[Convert to Base64]
        BASE64 --> FINAL[Final Response]
    end
```

---

## Componentes Detalhados

### 1. Document Loader (SupabaseDocumentLoader)

```mermaid
flowchart LR
    subgraph "Supabase prod"
        API1[E.AREAS]
        API2[E.OFERTAS]
        API3[E.NIVEIS]
        API4[E.RANKCURSO]
        API5[E.ATENDENTE]
        API6[E.HISTATEND]
    end

    subgraph "Document Transformation"
        T1[transformAreas]
        T2[transformOfertas]
        T3[transformNiveis]
        T4[transformRanking]
        T5[transformAtendentes]
        T6[transformHistorico]
    end

    subgraph "Document Schema"
        DOC[Document]
        DOC --> CONTENT[content: string]
        DOC --> META[metadata]
        META --> SOURCE[source]
        META --> TITLE[title]
        META --> PATH[relativePath]
    end

    API1 --> T1 --> DOC
    API2 --> T2 --> DOC
    API3 --> T3 --> DOC
    API4 --> T4 --> DOC
    API5 --> T5 --> DOC
    API6 --> T6 --> DOC
```

### 2. Vector Store

```mermaid
flowchart TD
    subgraph "VectorStore Operations"
        ADD[addDocuments]
        SEARCH[search]
        SAVE[saveToDisk]
        LOAD[loadFromDisk]
    end

    subgraph "Storage"
        DOCS[(documents Map)]
        EMBEDS[(embeddings Map)]
        FILE[(vector_store.json)]
    end

    subgraph "Search Algorithm"
        S1[Embed Query]
        S2[Calculate Cosine Distance]
        S3[Sort by Distance]
        S4[Return Top K]
    end

    ADD --> DOCS
    ADD --> EMBEDS
    SAVE --> FILE
    LOAD --> FILE

    SEARCH --> S1
    S1 --> S2
    S2 --> S3
    S3 --> S4
    S4 --> DOCS
```

### 3. Prompt System

```mermaid
flowchart TD
    subgraph "Query Type Detection"
        Q[Query Input]
        Q --> REGEX{Regex Patterns}
        
        REGEX -->|kpi|analytics|métricas| KPI[KPI_ANALYTICS]
        REGEX -->|dashboard|painel| DASH[DASHBOARD]
        REGEX -->|quem são|liste|todos| LIST[LISTING]
        REGEX -->|default| GEN[GENERAL]
    end

    subgraph "Prompt Templates"
        KPI --> KPI_TPL["KPI_ANALYTICS_PROMPT_TEMPLATE
        - Calcular métricas
        - Identificar padrões
        - Gerar insights"]
        
        DASH --> DASH_TPL["DASHBOARD_PROMPT_TEMPLATE
        - Estrutura para dashboards
        - Métricas principais
        - Dados para gráficos"]
        
        LIST --> LIST_TPL["LISTING_PROMPT_TEMPLATE
        - Apresentar TODOS os itens
        - Formato de lista
        - Dados completos"]
        
        GEN --> GEN_TPL["RAG_PROMPT_TEMPLATE
        - Resposta estruturada
        - Usar contexto
        - Gerar gráficos quando apropriado"]
    end
```

### 4. MCP Server Tools

```mermaid
flowchart TD
    subgraph "MCP Protocol"
        CLIENT[AI Assistant]
        STDIO[Stdio Transport]
        SERVER[MCP Server]
    end

    subgraph "Available Tools"
        T1[buscar_informacoes]
        T2[forcar_atualizacao]
        T3[status_sistema]
        T4[gerar_grafico]
        T5[listar_atendentes]
        T6[dashboard_atendente]
    end

    subgraph "Tool Handlers"
        H1[RAG Semantic Search]
        H2[Re-index Documents]
        H3[Get System Stats]
        H4[Chart.js Render]
        H5[Query Atendentes]
        H6[Generate Dashboard]
    end

    CLIENT --> STDIO
    STDIO --> SERVER
    
    SERVER --> T1 --> H1
    SERVER --> T2 --> H2
    SERVER --> T3 --> H3
    SERVER --> T4 --> H4
    SERVER --> T5 --> H5
    SERVER --> T6 --> H6
```

---

## Fluxo de Dados Completo

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Express
    participant ChatService
    participant RAGEngine
    participant VectorStore
    participant Supabase
    participant Ollama

    User->>Client: Envia pergunta
    Client->>Express: POST /api/chat/stream
    Express->>ChatService: processMessageStream()
    
    ChatService->>ChatService: Detecta tipo de query
    
    alt Query de Dashboard
        ChatService->>Supabase: support_tickets/employees
        ChatService->>Supabase: ops_documents
        ChatService->>ChatService: generateDashboard()
        ChatService->>ChatService: extractKPIs()
        ChatService->>ChatService: generateCharts()
    else Query Geral
        ChatService->>RAGEngine: queryStream()
        RAGEngine->>VectorStore: search(query, topK)
        VectorStore->>Ollama: embeddings(query)
        Ollama-->>VectorStore: query_embedding
        VectorStore->>VectorStore: cosineDistance()
        VectorStore-->>RAGEngine: relevant_documents
        RAGEngine->>RAGEngine: formatContext()
        RAGEngine->>RAGEngine: formatPrompt()
        RAGEngine->>Ollama: generate(prompt, stream)
        
        loop Streaming
            Ollama-->>RAGEngine: chunk
            RAGEngine-->>ChatService: chunk
            ChatService-->>Express: SSE chunk
            Express-->>Client: data: chunk
        end
    end
    
    Client-->>User: Resposta renderizada
```

---

## Configurações do Sistema

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `LLM_MODEL` | `gemma3:1b` | Modelo de geração de texto |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Modelo de embeddings |
| `OLLAMA_HOST` | `http://localhost:11434` | URL do servidor Ollama |
| `TOP_K_RESULTS` | `5` | Documentos retornados na busca |
| `CHROMA_PERSIST_DIR` | `./chroma_db` | Diretório de persistência |
| `CACHE_MAX_AGE_HOURS` | `1` | TTL do cache em horas |

---

## Estrutura de Arquivos RAG

```
server/features/
├── rag/
│   ├── engine.ts           # RAGEngine básico (API-based)
│   ├── document-engine.ts  # DocumentRAGEngine (Vector-based)
│   ├── prompt.ts           # Templates de prompts
│   ├── kpi-processor.ts    # Extração de KPIs
│   └── types.ts            # Tipos TypeScript
├── documents/
│   ├── vector-store.ts     # VectorStore com embeddings
│   ├── supabase-loader.ts  # Loader de documentos Supabase (ops_documents)
│   ├── persistence.ts      # Persistência em disco
│   └── types.ts            # Tipos de documentos
├── chat/
│   ├── service.ts          # ChatService principal
│   ├── routes.ts           # Rotas HTTP
│   └── types.ts            # Tipos de chat
├── api-client/
│   ├── client.ts           # APIClient genérico + Supabase
│   └── types.ts            # Tipos de API
└── mcp/
    ├── server.ts           # Servidor MCP
    └── chart-utils.ts      # Utilitários de gráficos
```

---

## Fluxo de Geração de Gráficos

```mermaid
flowchart TD
    subgraph "Chart Detection"
        RESP[LLM Response]
        PARSE[Parse CHART: JSON]
        DETECT{Contains Chart?}
    end

    subgraph "Chart Generation"
        CONFIG[Build Chart Config]
        CHARTJS[ChartJSNodeCanvas]
        RENDER[renderToBuffer]
        BASE64[Convert to Base64]
    end

    subgraph "Chart Types"
        BAR[Bar Chart]
        LINE[Line Chart]
        PIE[Pie Chart]
        DOUGHNUT[Doughnut Chart]
    end

    RESP --> PARSE
    PARSE --> DETECT
    
    DETECT -->|Yes| CONFIG
    DETECT -->|No| OUTPUT
    
    CONFIG --> CHARTJS
    
    CHARTJS --> BAR
    CHARTJS --> LINE
    CHARTJS --> PIE
    CHARTJS --> DOUGHNUT
    
    BAR --> RENDER
    LINE --> RENDER
    PIE --> RENDER
    DOUGHNUT --> RENDER
    
    RENDER --> BASE64
    BASE64 --> OUTPUT[Final Response with Image]
```
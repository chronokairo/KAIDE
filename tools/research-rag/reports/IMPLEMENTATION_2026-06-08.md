# Relatório de Implementação - RAG Market Analysis
Data: 08/06/2026

## Implementações Realizadas

### 1. Qualidade do RAG (Gaps Críticos)
- **Busca Híbrida (BM25 + Vetorial):** 
    - Implementado o método `keywordSearch` no `VectorStore` para busca por palavras-chave com pesos diferenciados (título vs. conteúdo).
    - Implementado o método `hybridSearch` utilizando a técnica **RRF (Reciprocal Rank Fusion)** para combinar resultados vetoriais e de texto.
- **Reranking:**
    - Criado um sistema de reranking (`HeuristicReranker`) que refina os documentos recuperados com base na densidade de termos e relevância textual antes de enviá-los ao LLM.
    - Atualizado o `DocumentRAGEngine` para utilizar o pipeline completo: **Híbrido + Reranking**.
- **Avaliação de Respostas (Feedback):**
    - Adicionado suporte a feedback (positivo/negativo) no banco de dados (`lowdb`).
    - Criado endpoint de API (`PATCH /api/messages/[id]`) para registrar o feedback.
    - Adicionados botões de **Thumbs Up/Down** no componente `MessageBubble` da interface.

### 2. Ingestão de Documentos
- **Upload via UI (PDF, DOCX, TXT, MD):**
    - Criada API de upload (`POST /api/documents/upload`) que salva arquivos na vault do sistema.
    - Instaladas e integradas bibliotecas `pdf-parse` e `mammoth` para extração de texto de arquivos PDF e DOCX.
    - Atualizado o `DocumentLoader` para processar esses novos formatos automaticamente.
    - Adicionada seção de **Upload de Documentos** na aba de Configurações, com suporte a múltiplos arquivos e feedback de progresso.

### 3. Melhorias de Produto & Configuração
- **Troca de Modelo na UI:**
    - Implementado sistema de persistência de configurações no banco de dados.
    - Criada API para listar modelos disponíveis no Ollama e trocar o modelo ativo.
    - Adicionado seletor de modelos na interface (`SettingsTab`), permitindo trocar entre `gemma3`, `llama3`, `mistral`, etc., sem redeploy.
- **Prompt Templates Editáveis:**
    - Adicionado suporte para armazenamento de templates de prompt customizados.
    - Atualizada a lógica de geração de prompts para priorizar os templates definidos pelo usuário.
    - Adicionada interface de edição do **Prompt System (Geral)** na aba de Configurações.

# Sistema RAG - Documentação

## Introdução

Este é um sistema de Retrieval Augmented Generation (RAG) que permite fazer perguntas sobre documentos usando inteligência artificial local.

## Funcionalidades Principais

### 1. Processamento de Documentos
- Suporta arquivos Markdown (.md)
- Suporta arquivos de texto (.txt)
- Processamento de PDFs (planejado)
- Arquivos Office (planejado)

### 2. Busca Semântica
O sistema usa embeddings para encontrar os documentos mais relevantes para sua pergunta, não apenas por palavras-chave, mas por significado semântico.

### 3. Geração de Respostas
Usa o modelo Gemma 3 (1B parâmetros) rodando localmente via Ollama para gerar respostas contextualizadas baseadas nos documentos encontrados.

## Tecnologias Utilizadas

- **Ollama**: Servidor local de LLMs
- **Nomic Embed Text**: Modelo de embeddings
- **ChromaDB**: Banco de dados vetorial
- **TypeScript**: Linguagem principal
- **Express**: Framework web

## Como Usar

1. Adicione seus documentos na pasta `documents/`
2. Execute o servidor
3. Acesse a interface web
4. Faça perguntas sobre os documentos

## Configuração

Veja o arquivo `.env` para configurar:
- Caminho dos documentos
- Modelos de IA
- Porta do servidor
- Outros parâmetros

## Privacidade

Todo o processamento é feito localmente. Nenhum dado é enviado para servidores externos.

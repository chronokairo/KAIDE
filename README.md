# Athena - Assistente IA

Sistema de chat inteligente com **RAG (Retrieval Augmented Generation)** que consulta APIs TOTVS para responder perguntas usando LLM local via Ollama.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=flat&logo=ollama&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## 🚀 Funcionalidades

- **💬 Chat com IA**: Pergunte sobre cursos, ofertas, grade curricular e mais
- **🔗 Integração TOTVS**: Consulta automática às APIs do sistema acadêmico
- **🧠 LLM Local**: Processamento 100% local via Ollama (privacidade total)
- **🔍 Busca Semântica**: Encontre documentos relevantes sem usar o LLM
- **⚙️ Indexação**: Gerencie e reconstrua o índice de documentos
- **📊 Monitoramento**: Dashboard com gráficos de uso do sistema (CPU, memória, GPU)
- **🎨 Interface Moderna**: Frontend React com TailwindCSS e Chart.js
- **📡 Streaming**: Respostas em tempo real com Server-Sent Events (SSE)
- **🔐 Autenticação**: Sistema de sessão e CSRF protection

## 🏗️ Arquitetura

O projeto segue o padrão **Feature-Sliced Design (FSD)** para organização do código:

```
ai/
├── frontend/                    # Aplicação React + Vite
│   ├── src/
│   │   ├── App.tsx             # Componente principal com abas
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Estilos TailwindCSS
│   ├── index.html
│   └── tailwind.config.js
│
├── server/                      # Backend Node.js + Express
│   ├── main.ts                 # Entry point do servidor
│   ├── app/                    # Bootstrap e configuração
│   │   ├── create-app.ts       # Criação do app Express
│   │   ├── routes.ts           # Registro de rotas
│   │   ├── middlewares.ts      # Middlewares globais
│   │   └── static.ts           # Arquivos estáticos
│   │
│   ├── features/               # Funcionalidades de negócio
│   │   ├── rag/                # Motor RAG
│   │   │   ├── engine.ts       # Pipeline RAG completo
│   │   │   ├── prompt.ts       # Formatação de prompts
│   │   │   └── types.ts        # Tipos TypeScript
│   │   │
│   │   ├── chat/               # Serviço de chat
│   │   │   ├── service.ts      # ChatService com streaming
│   │   │   ├── routes.ts       # Rotas /api/chat/*
│   │   │   └── types.ts        # Tipos de mensagens
│   │   │
│   │   ├── totvs/              # Integração TOTVS
│   │   │   ├── proxy.ts        # Proxy para APIs
│   │   │   ├── routes.ts       # Rotas /api/totvs/*
│   │   │   └── api/            # Clientes das APIs
│   │   │       ├── ofertas.ts
│   │   │       ├── areas.ts
│   │   │       ├── niveis.ts
│   │   │       ├── grade.ts
│   │   │       ├── pessoa.ts
│   │   │       └── atendentes.ts
│   │   │
│   │   ├── api-client/         # Cliente unificado de APIs
│   │   ├── auth/               # Autenticação e CSRF
│   │   ├── documents/          # Processamento de documentos
│   │   ├── health/             # Health checks
│   │   └── admin/              # Administração
│   │
│   ├── entities/               # Modelos de domínio
│   │   └── atendente/          # Entidade Atendente
│   │
│   └── shared/                 # Código compartilhado
│       ├── config/             # Configurações
│       │   ├── environment.ts  # Variáveis de ambiente
│       │   ├── cors.ts         # Configuração CORS
│       │   ├── rate-limit.ts   # Rate limiting
│       │   └── security.ts     # Configurações de segurança
│       └── lib/                # Utilitários
│
├── package.json                # Dependências frontend
├── vite.config.ts              # Configuração Vite
├── requirements.txt            # Dependências Python (opcional)
└── README.md
```

## 📦 Dependências

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização utilitária
- **Chart.js + React-Chartjs-2** - Gráficos e visualizações
- **Lucide React** - Ícones
- **React Markdown** - Renderização de Markdown

### Backend
- **Node.js + TypeScript** - Runtime e tipagem
- **Express.js** - Framework web
- **Ollama** - LLM local
- **SystemInformation** - Monitoramento do sistema
- **SOAP + HTTP clients** - Integração com APIs TOTVS

### Infraestrutura
- **Vite** - Build tool e dev server
- **ESBuild** - Compilador rápido
- **PNPM** - Gerenciador de pacotes

### Chat e RAG
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/chat` | POST | Enviar mensagem e receber resposta |
| `/api/chat/stream` | POST | Chat com streaming (SSE) |
| `/api/search` | POST | Busca semântica nos documentos |
| `/api/status` | GET | Status do sistema |
| `/api/stats` | GET | Estatísticas do índice |

### TOTVS (Proxy)
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/totvs/ofertas` | GET | Ofertas de cursos |
| `/api/totvs/areas` | GET | Áreas de ensino |
| `/api/totvs/niveis` | GET | Níveis de ensino |
| `/api/totvs/grade-curricular` | GET | Grade curricular |
| `/api/totvs/atendentes` | GET | Lista de atendentes |
| `/api/totvs/pessoa/cpf/:cpf` | GET | Consulta pessoa por CPF |

## 🔧 Instalação

### Pré-requisitos

- **Node.js** 18+ (recomendado: 20+)
- **pnpm** (gerenciador de pacotes)
- **Ollama** (para LLM local)

### 1. Clone o repositório

```bash
git clone https://github.com/chronokairo/ai.git
cd ai
```

### 2. Instale as dependências

```bash
# Frontend (raiz do projeto)
pnpm install

# Backend
cd server
pnpm install
cd ..
```

### 3. Configure o Ollama

```bash
# Instale o Ollama (https://ollama.ai)
# Inicie o servidor Ollama
ollama serve

# Baixe o modelo LLM (em outro terminal)
ollama pull gemma3:1b
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na pasta `server/`:

```env
# Servidor
PORT=8000
NODE_ENV=development

# TOTVS API
TOTVS_BASE_URL=http://ws.seculomanaus.com.br:8051
TOTVS_USERNAME=portal
TOTVS_PASSWORD=sua_senha
TOTVS_BASIC_AUTH=base64_encoded_credentials

# Ollama
OLLAMA_HOST=http://localhost:11434
LLM_MODEL=gemma3:1b
TOP_K_RESULTS=5

# Admin (opcional)
ADMIN_API_KEY=sua_api_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=sua_senha

# Segurança
SESSION_SECRET=sua_chave_secreta_aqui
```

## ▶️ Executando o Projeto

### Desenvolvimento

```bash
# Terminal 1: Backend
cd server
pnpm dev

# Terminal 2: Frontend (na raiz)
pnpm dev
```

O frontend estará em `http://localhost:80` (com proxy para o backend em `http://localhost:8000`).

### Produção

```bash
# Build do frontend + iniciar servidor
pnpm start

# Ou separadamente:
pnpm build          # Build do frontend
cd server && pnpm start  # Iniciar servidor
```

O servidor servirá o frontend buildado em `http://localhost:80` (ou porta configurada).

### 🐳 Docker

#### Com Docker Compose (recomendado)

```bash
# Inicie a aplicação com docker-compose
docker-compose up -d

# Visualize os logs
docker-compose logs -f
```

#### Com Docker run

```bash
# Build da imagem
docker build -t chronokairo-rag .

# Executar o container
# IMPORTANTE: --add-host é necessário para acessar o Ollama no host
docker run -d \
  --name chronokairo-rag \
  -p 80:80 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  -e TOTVS_BASIC_AUTH=seu_token_base64 \
  -v ./documents:/app/documents:ro \
  -v ./server/chroma_db:/app/server/chroma_db \
  chronokairo-rag
```

#### Troubleshooting Docker + Ollama

Se você encontrar o erro `getaddrinfo ENOTFOUND host.docker.internal`:

1. **Linux**: Certifique-se de usar `--add-host=host.docker.internal:host-gateway`
2. **Docker Desktop (Win/Mac)**: Verifique se a opção "Allow Docker to access host services" está habilitada
3. **Alternativa**: Configure o Ollama para escutar em todas as interfaces:
   ```bash
   # No host, antes de iniciar o Ollama
   export OLLAMA_HOST=0.0.0.0:11434
   ollama serve
   ```
   E use o IP do host ao invés de `host.docker.internal`

## 🖥️ Interface do Usuário

A interface possui 4 abas principais:

### 💬 Chat
- Conversação com o assistente IA
- Respostas em streaming em tempo real
- Exibição das fontes consultadas
- Sugestões de perguntas iniciais

### 🔍 Buscar
- Busca semântica direta (sem usar LLM)
- Resultados com score de relevância
- Mais rápido para consultas simples

### ⚙️ Indexar
- Reconstruir índice de documentos
- Escolha entre apenas .md/.txt ou todos os formatos
- Barra de progresso e logs em tempo real
- Estatísticas do índice

### ℹ️ Sobre
- Informações sobre o sistema
- Formatos de arquivo suportados
- Informações de privacidade

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - Biblioteca UI
- **Vite 5** - Build tool e dev server
- **TailwindCSS** - Estilização utility-first
- **React Markdown** - Renderização de Markdown
- **Lucide React** - Ícones

### Backend
- **Node.js** - Runtime JavaScript
- **Express 4** - Framework web
- **TypeScript** - Tipagem estática
- **Ollama SDK** - Integração com LLM local
- **tsx** - Execução direta de TypeScript

### Segurança
- **Helmet** - Headers de segurança
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - Proteção contra abuse
- **CSRF Protection** - Proteção contra CSRF

## 🔒 Privacidade

- ✅ **100% Local** - Todos os dados processados no seu computador
- ✅ **Sem Cloud** - Nenhum dado enviado para servidores externos (exceto APIs TOTVS)
- ✅ **Offline Capable** - Funciona sem internet (com cache)
- ✅ **Código Aberto** - Transparência total

## 📝 Scripts Disponíveis

### Raiz do projeto (Frontend)
| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia o dev server Vite |
| `pnpm build` | Build de produção |
| `pnpm preview` | Preview do build |
| `pnpm start` | Build + inicia servidor |

### Pasta server (Backend)
| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Dev server com hot reload |
| `pnpm start` | Inicia servidor de produção |
| `pnpm build` | Compila TypeScript |

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com ❤️ para uso local e privado

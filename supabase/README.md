# Supabase no KAIDE — Setup Local & Self-Hosted

O KAIDE utiliza o Supabase para autenticação, persistência relacional do **Control Plane** (`cp_jobs`, `cp_job_events`, `cp_approvals`) e armazenamento vetorial via `pgvector`.

Você pode rodar o Supabase de duas formas:
1. **Via CLI oficial do Supabase** (Recomendado para desenvolvimento local rápido).
2. **Via Docker Compose Self-Hosted** (Recomendado para produção privada, VPS ou servidores próprios).

---

## Opção 1: Desenvolvimento com Supabase CLI

### Pré-requisitos
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado (`npm install -g supabase` ou `scoop bucket add supabase; scoop install supabase`).
- Docker Desktop rodando.

### Iniciar o ambiente
```bash
# Na raiz do repositório KAIDE:
supabase start
```

As migrations em `supabase/migrations/` serão aplicadas automaticamente.

### Obter credenciais locais
```bash
supabase status
```
Copie a `API URL`, `anon key` e `service_role key` para o seu `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key>
```

---

## Opção 2: Deploy Self-Hosted com Docker Compose

Ideal para rodar sua própria infraestrutura em VPS, cloud privada ou on-premises.

### 1. Configurar variáveis de ambiente
```bash
cd supabase/self-hosted
cp .env.example .env
```
Edite o arquivo `.env` e defina suas senhas seguras e chaves JWT.

### 2. Iniciar os serviços
```bash
docker compose up -d
```

### Serviços expostos:
- **API Gateway (Kong):** `http://localhost:8000` (Endpoints `/rest/v1`, `/auth/v1`, `/realtime/v1`)
- **Supabase Studio (Dashboard Web):** `http://localhost:3001`
- **PostgreSQL 15+ com pgvector:** `localhost:5432`

### Conectar o KAIDE ao Self-Hosted:
No arquivo `.env` do KAIDE (`apps/web` ou raiz):
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key-definida-no-env>
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key-definida-no-env>
```

---

## Migrations do Control Plane

A estrutura de tabelas do Control Plane de agentes está versionada em:
- `supabase/migrations/20261003151824_control_plane.sql`

Ela cria e gerencia:
- `cp_jobs`: Fila de tarefas executadas por agentes (Coder, QA, DevOps, Comercial, Finance, etc.).
- `cp_job_events`: Trilha imutável de eventos e evidências de execução.
- `cp_approvals`: Gates de aprovação humana (*AI -> AI -> AI -> HUMAN*).

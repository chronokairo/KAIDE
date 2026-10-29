# Supabase no KAIDE — Setup Local & Self-Hosted

O KAIDE utiliza o Supabase para autenticação, persistência relacional do **Control Plane** (`cp_jobs`, `cp_job_events`, `cp_approvals`) e armazenamento vetorial via `pgvector`.

Você pode rodar o Supabase de duas formas:
1. **Via CLI oficial do Supabase** (Recomendado para desenvolvimento local rápido).
2. **Via Docker Compose Self-Hosted** (baseline local/privada; não é uma implantação de produção homologada).

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

O stack incluído é uma baseline para desenvolvimento local/privado. Para produção, use o [stack oficial mantido pelo Supabase](https://supabase.com/docs/guides/self-hosting/docker), com HTTPS, restrição de rede, backups e revisão de acesso.

### 1. Configurar variáveis de ambiente
```bash
cd supabase/self-hosted
python configure.py
python configure.py --check
```
O comando gera senhas aleatórias e JWTs distintos para `anon` e `service_role` assinados pelo mesmo segredo. Não exibe credenciais e nunca sobrescreve um `.env` existente. O arquivo real é ignorado pelo Git; mantenha suas permissões restritas. O exemplo contém campos vazios, e o Compose rejeita credenciais ausentes.

### 2. Iniciar os serviços
```bash
docker compose up -d
```

### Serviços disponíveis somente em loopback:
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


## Credenciais e resposta a exposição

Uma chave `service_role` é administrativa e ignora RLS. Remover uma chave do
arquivo atual não a revoga nem a remove dos commits antigos. Não cole valores
em issues, logs, chats, screenshots ou comandos registrados no histórico.

### Supabase Cloud

1. Identifique o projeto e a chave indicados no alerta, sem divulgar seu valor.
2. Em **Settings → API Keys**, crie uma secret key para o backend e uma publishable
   key para os clientes. Atualize os consumidores pelo gerenciador de segredos.
   O app aceita a secret key em `SUPABASE_SERVICE_ROLE_KEY` e a publishable key em
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`; preserve a primeira exclusivamente no backend.
3. Após migrar e verificar os consumidores, desative as chaves legacy para
   invalidar o JWT administrativo antigo. Se for uma secret key moderna exposta,
   revogue essa chave específica após substituí-la. Uma nova chave, sozinha,
   não invalida a anterior. Revise os logs e os consumidores durante a janela.
4. Rotacione senha do banco, signing keys ou outros segredos somente quando
   estiverem envolvidos na exposição. Alterar signing keys pode afetar sessões.
   Confirme a rejeição da credencial antiga sem consultar dados de clientes.

Siga os procedimentos atuais de [API keys](https://supabase.com/docs/guides/getting-started/api-keys)
e [migração de chaves](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).

### Instâncias existentes do stack incluído

Os ajustes de Compose só passam a valer após recriar os containers; editar o
repositório não fecha portas de uma instância já em execução. Restrinja primeiro
as portas administrativas no firewall do host. Não publique Studio ou Postgres
na internet. Acesso remoto administrativo deve usar túnel autenticado.

- Faça backup e inventário dos consumidores antes de alterar credenciais.
- Novos valores de `JWT_SECRET` exigem regenerar `ANON_KEY` e `SERVICE_ROLE_KEY`
  com o mesmo segredo e atualizar/recriar os serviços consumidores. Planeje a
  invalidação dos tokens antigos. `configure.py` inicializa apenas instalações
  novas: ele não é uma ferramenta de rotação de produção.
- Alterar `POSTGRES_PASSWORD` no `.env` não altera senhas num volume já existente.
  Atualize explicitamente os usuários do banco via canal administrativo seguro
  (por exemplo, o comando interativo `\password` do psql) e sincronize os serviços.
- O script de inicialização não é reaplicado sobre um volume existente. Revise
  `self-hosted/repair-privileges.sql` e execute-o explicitamente como `postgres`
  apenas nas instâncias criadas por este stack. Ele remove a associação
  administrativa do `authenticator` e os grants padrão excessivos; não apaga dados
  e não rotaciona senhas. Grants e policies de objetos existentes precisam de
  inventário e revisão próprios para preservar os acessos legítimos da aplicação.
- Nunca use `docker compose down -v` como procedimento de rotação.

A CI examina o histórico com saída redigida. Achados antigos continuam visíveis
até a remediação do histórico/alerta; não suprima a regra para ocultar um vazamento.
Uma reescrita de histórico exige coordenação de branches, tags, clones e forges e
não substitui a revogação da credencial.

### Verificação local

```bash
python -m pip install PyYAML==6.0.3
python -m unittest discover -s supabase/self-hosted/tests -v
```

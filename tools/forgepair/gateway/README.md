# Claude Code Multi-Agent Gateway

Gateway local que permite ao **Claude Code** usar os modelos do **Kilo Code** e do **OpenCode** como se fossem modelos Anthropic.

```
Claude Code → ANTHROPIC_BASE_URL=:8787 → gateway → kilo serve (:4096) / opencode serve (:4097)
```

## Como funciona

1. O Claude Code envia requests no formato Anthropic Messages API para o gateway.
2. O gateway roteia pelo prefixo do modelo:
   - `kilo/<modelo>` → servidor do Kilo Code (`kilo serve`)
   - `opencode/<modelo>` → servidor do OpenCode (`opencode serve`)
   - modelo desconhecido/nativo claude-* → modelo padrão do upstream default (`kilo`)
3. Cada request cria uma sessão efêmera no upstream, injeta o system prompt + definição das tools como protocolo de texto (`<tool_call>{json}</tool_call>`), desativa as tools nativas do CLI e traduz a resposta de volta para o formato Anthropic (blocos `text` e `tool_use`, streaming SSE com deltas reais).
4. A lista `/v1/models` é construída dinamicamente consultando os providers configurados nos dois CLIs.

## Requisitos

- Node 18+
- [Kilo Code CLI](https://kilo.ai/cli): `npm install -g @kilocode/cli`
- [OpenCode CLI](https://opencode.ai): `npm install -g opencode`
- Dependência: `npm install` neste diretório (usa `@opencode-ai/sdk`)

## Uso

```bash
npm install   # neste diretorio (uma vez)
```

Comando global `claudefree` (shim ja instalado em `%APPDATA%\npm\claudefree.cmd`):

```bash
# interativo: sobe a pilha, lista os modelos disponiveis e deixa escolher
claudefree

# headless: usa o ultimo modelo escolhido (ou o padrao na 1a vez)
claudefree -p "explique este codigo"

# modelo explicito via flag normal do claude
claudefree --model opencode/big-pickle -p "..."

# equivalente manual
pwsh -File gateway\claude-gw.ps1 -p "..."
```

O script `claude-gw.ps1`:
1. Sobe `kilo serve`, `opencode serve` e o gateway se alguma porta estiver livre
2. Espera o `/health`
3. Se nenhum modelo foi definido (`CLAUDEGW_MODEL` ou `--model`), abre o **seletor interativo**: filtre por texto (ex.: `free`, `sonnet`), escolha pelo numero ou digite o id exato; paginacao com Enter
4. A escolha fica salva em `%TEMP%\claudefree-lastmodel.txt` e vira o default das proximas execucoes

Variaveis opcionais: `CLAUDEGW_MODEL`, `CLAUDEGW_KILO_PORT` (4096), `CLAUDEGW_OPENCODE_PORT` (4097), `CLAUDEGW_GATEWAY_PORT` (8787).

Configurar o Claude Code manualmente:

```bash
ANTHROPIC_BASE_URL=http://localhost:8787 ANTHROPIC_AUTH_TOKEN=x claude --model kilo/kilo-auto/free
```

## Variáveis de ambiente

| Variável | Default | Descrição |
|----------|---------|-----------|
| `PORT` | `8787` | Porta do gateway |
| `KILO_PORT` | `4096` | Porta do `kilo serve` |
| `OPENCODE_PORT` | `4097` | Porta do `opencode serve` |
| `GATEWAY_DEFAULT_UPSTREAM` | `kilo` | Upstream usado quando o modelo não tem prefixo |

## Endpoints

- `POST /v1/messages` — Messages API (streaming e não-streaming, tool calling)
- `POST /v1/messages/count_tokens` — estimativa aproximada
- `GET /v1/models` — catálogo dinâmico dos dois upstreams
- `GET /health`

## Modelos free úteis

- `kilo/kilo-auto/free` — roteador automático de modelos gratuitos da Kilo (padrão)
- `kilo/openrouter/free`
- `opencode/big-pickle`, `opencode/nvidia/z-ai/glm-5.2`

## Limitações conhecidas

- O tool calling é por protocolo de texto; modelos fracos podem formatar errado (o parser aceita JSON e variações XML, mas não é infalível).
- Imagens anexadas viram placeholder `[image attached]`.
- `max_tokens`/`temperature` são ignorados pelo upstream.
- Contagem de tokens é estimativa (~chars/4) exceto no uso final reportado pelo upstream.

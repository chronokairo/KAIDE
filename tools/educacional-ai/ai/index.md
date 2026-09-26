# src/ai/

Camada exclusiva da Anna — tudo relacionado à IA fica aqui.

Nenhuma outra camada deve conter lógica de LLM, prompts ou tool calling.

## Subpastas

| Pasta | Papel |
|---|---|
| `anna/` | Constantes da persona (greeting, source) e configuração de modelo |
| `bi/` | BI generativo: `BiChartCard` + tipos `ChartSpec` |
| `persona/` | Definição da persona Anna, seeds e voz |
| `router/` | Roteamento de intenção (frontend e backend) |
| `tools/` | Catálogo MCP de tools disponíveis para a Anna |

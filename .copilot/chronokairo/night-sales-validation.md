# Fundamentação e validação do turno comercial

Consultado em 05/10/2026. Pesquisa sustenta os padrões operacionais; não existe certificação externa nem evidência de conversão dos agentes Chronokairo. Dados e resultados locais precisam de verificação própria.

## Fontes primárias

- [Salesforce Architects — Agentic Patterns](https://architect.salesforce.com/docs/architect/fundamentals/guide/agentic-patterns): agentes compostos com responsabilidades, pesquisa empresarial, sinais, qualificação e registro de atividades.
- [Anthropic — Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents): decomposição em etapas, gates, avaliação e condições de parada; preferir complexidade proporcional à necessidade.

Os horários e lotes são escolhas operacionais Chronokairo, não recomendações ou resultados publicados pelas fontes.

| Papel | Entrada | Critério de aceite | Rejeitar |
|---|---|---|---|
| ck-demand-scout | ICP e fontes públicas | Pedido explícito de serviço, empresa, URL, publicação <=30 dias e prazo válido | Vaga de funcionário apresentada como contratação de agência; fonte inacessível; pedido vencido |
| ck-lead-discovery | ICP e domínios existentes | Até 2 novos domínios e fontes identificáveis | Clientes existentes, parceiros, duplicatas ou contato inventado |
| ck-lead-enrichment | Candidatos | Empresa/canal oficial confirmados; fatos separados de hipóteses | Inferir orçamento, necessidade ou consentimento só por haver e-mail |
| ck-qualification | Fontes anteriores | Score com critérios; adequação separada de intenção | “Interessado” sem resposta real; qualificação sem fonte |
| ck-sdr | Qualificados | Mensagem no idioma do prospect, contexto verificável, uma pergunta/CTA e rascunho não enviado | Métrica ou case inventado; envio externo; promessa de funcionalidade não implantada |
| ck-pipeline-auditor | Registros e comprovantes | Fontes conferidas, bloqueios e estágios corretos | Contar pesquisa como resposta, contrato ou receita |
| ck-control-auditor | Jobs e runtime | Status, duração e lacunas confrontados com evidência | Converter completed em aceite comercial |
| ck-morning-brief | Snapshot e duas auditorias | Até 5 ações com fonte, canal, rascunho, incertezas e próximo responsável | Recomendar abordagem de registros reprovados; esconder falhas; inventar candidatos |

## Agenda e dependências

01h: demanda e auditoria. 02h: descoberta e contexto. 03h: qualificação e rascunhos. 05h30: duas auditorias e resumo da manhã. America/Caracas. São quatro jobs limitados, não uma sessão contínua até amanhecer. Cada etapa lê o funil compartilhado e retoma trabalho anterior. A agenda não prova que a etapa anterior terminou: conferir suas evidências antes de usar a saída.

Total alvo noturno: até 3 demandas + 2 empresas novas, sujeito a fontes, quota e bloqueios. Rotinas diurnas preservadas, consultando o mesmo funil para evitar duplicação. Sem fonte, nenhum registro ou chamada extra é necessário para “atingir meta”. Não há envio externo, compra de base, contratação de ferramenta ou upgrade automático. Limites de modelos/hospedagem ainda se aplicam; não prometer custo zero se terceiros alterarem cotas.

Testes locais verificam rotas/modelos, horários, critérios presentes, resultado vazio sem inventar empresas e exclusão de registros terminados/opt-out. A instalação usa backup SQLite, transação, integridade e readback no Copilot App. Resultado comercial será avaliado depois por respostas/reuniões/vendas reais, não pelo número de rotinas criadas.

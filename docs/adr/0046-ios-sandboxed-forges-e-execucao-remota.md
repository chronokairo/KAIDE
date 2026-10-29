# ADR-0046 — iOS sandboxed, forges e execução remota

- **Data:** 2026-10-29
- **Status:** Aceito como direção arquitetural; implementação incremental em andamento.
- **Rastreabilidade:** ADR-0028, ADR-0038, ADR-0042; migração de `apps/ios`.

## Contexto

O Kaide para iPhone deve funcionar sem jailbreak. O aplicativo legado usa
`LocalShell`, ferramentas de terminal e caminhos `/var/jb`, incompatíveis com
esse objetivo. A migração inclui GitHub, GitLab, NVIDIA NIM, ChatGPT e um
endpoint genérico compatível com OpenAI.

## Decisão

1. O app opera no sandbox normal do iOS. Arquivos locais são manipulados por
   APIs nativas, respeitando os acessos concedidos pelo usuário. Shell local,
   jailbreak e TrollStore deixam de ser requisitos do fluxo alvo.
2. GitHub e GitLab são acessados por adapters HTTPS sobre portas de aplicação.
   Validar uma conta não equivale a implementar checkout, publicação ou PR/MR.
   GitHub permanece o forge canônico deste repositório (ADR-0041).
3. Comandos, instalação de dependências, testes e builds são delegados a workers
   remotos isolados pelo Control Plane. Cada execução registra um Job com
   contexto, ferramentas, alterações, evidências, custo, duração e status.
   CI dos forges pode fornecer verificações. O terminal do app apresenta os logs
   da execução remota; não executa comandos no iPhone.
4. O domínio e os casos de uso dependem de portas para repositório, workspace,
   execução e chat. Rede, armazenamento e autenticação ficam nos adapters.
   A migração do Core legado é progressiva, sem reescrita geral.
5. NVIDIA NIM, ChatGPT e OpenAI-compatible genérico são providers distintos no
   desenho alvo. Compartilham contratos de chat, preservando suas capacidades
   e autenticação específicas. A existência de código OAuth não comprova suporte
   oficial a clientes de terceiros nem autenticação validada em dispositivo.
   Credenciais corporativas de providers permanecem no backend; tokens pessoais
   necessários ao cliente usam armazenamento seguro, nunca o bundle ou logs.
6. Escritas remotas usam ferramentas tipadas, autenticação, tenant validado,
   RBAC, validação de entrada, idempotência e auditoria no backend. Publicação,
   merge, deploy e operações destrutivas passam por aprovação humana explícita
   vinculada à proposta e revisão correspondente.

## Experiência proposta e ordem de entrega

Priorizar jobs persistentes, recuperação de eventos após reconexão, diff legível
no celular e caixa de aprovações. Depois, notificações, contexto de issue/branch,
preview com evidências e continuidade com desktop. Voz, screenshots, catálogo de
capacidades e orçamento por tarefa são propostas de evolução, sem implementação
ou escopo de entrega automático por esta ADR.

Fluxo alvo: issue → plano → execução → verificação → evidências → aprovação
→ PR/MR → revisão e autorização de merge/deploy.

## Modelo local no iPhone X

Inferência local é um experimento opcional, não requisito da migração. Avaliar
um modelo pequeno quantizado integrado como biblioteca, sem processo shell.
Faixa inicial de investigação: 135M–500M parâmetros, 4 bits e contexto curto.
Esses valores não representam benchmark ou garantia de compatibilidade.
Medir memória, latência, qualidade, aquecimento e compatibilidade de runtime/iOS
no aparelho antes de adotar. Coding complexo permanece nos providers remotos.

## Estado e critérios de conclusão

A árvore atual contém contratos e adapters iniciais, mas ainda usa LocalShell
em terminal, tools e worktrees; mantém código legado paralelo aos novos adapters
e ainda não separa completamente NIM do provider genérico. Esta ADR não declara
a migração concluída nem comprova operação dos providers.

Concluir exige build para iOS e teste em aparelho sem jailbreak, ausência de
dependência de shell no fluxo alvo, operações reais de forge, isolamento e
autorização dos jobs, recuperação de eventos e validação dos providers. Um IPA
assinado ad-hoc é artefato intermediário: instalação em iPhone sem jailbreak
exige assinatura e provisionamento válidos pelo método de distribuição adotado.

## Evidência desta etapa

- `python apps/ios/Tests/test_kaide.py`: 9 testes de contrato passaram; não substituem testes funcionais em aparelho.
- `git diff --cached --check`: sem erros de whitespace.
- Consolidadas as declarações duplicadas de `ForgeProvider` e `CodexError`.
- Renomeado o arquivo legado para `LegacyLLMProvider.swift`, evitando colisão de objetos Swift com `Domain/LLM/LLMProvider.swift`.
- Build via SwiftPM/WSL, SDK Darwin e sysroot explícito de iPhoneOS: bloqueado por `unable to load standard library for target arm64-apple-ios15.0`. Build e instalação em aparelho permanecem pendentes; nenhum artefato novo foi validado nesta etapa.

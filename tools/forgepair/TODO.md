# Próximos passos do Forgepair

## Objetivo

O projeto preserva a regra **zero-lib**: nenhuma dependência de Quicklisp, npm ou
Python no runtime final. SBCL, curl, Git, Bubblewrap e ferramentas POSIX formam
a plataforma.

## Trabalho planejado

- [x] Remover turnos fixos (`--turns`, `:turns`, contador `[N/D]`) em favor de
      sessão contínua com limite de segurança interno (ADR-0003/0008).
- [x] Implementar multi-tool calling (`shell`/`read`/`list`, cadeia até `done`)
      para executor e improver (ADR-0008).
- [x] Unificar o chat: session-port do Telegram recebe os mesmos eventos do
      output-port (voce, pares, ferramentas, planner) no mesmo chat (ADR-0006/0008).
- [x] Validação por evidência real (`git diff`, transcript de ferramentas) via
      decider local opcional, substituindo o placeholder de saída não-vazia
      (ADR-0010, `docs/decider.md`).
- [ ] Adicionar testes de contrato para cada adapter de provider.
- [ ] Adicionar descoberta opcional de modelos AWS Bedrock.
- [ ] Melhorar a validação de comandos antes da execução no sandbox.
- [ ] Atualizar a documentação quando novos adapters forem adicionados.
- [ ] Ajustar `decider-candidate-prob` (`src/adapters.lisp`) se os nomes de
      campo do `/completion` da sua build do llama.cpp diferirem dos
      testados (ver `docs/decider.md`).

## Regras para os agentes

1. Migrar uma capacidade pequena e verificável por vez.
2. Demonstrar mudanças com teste ou exemplo reproduzível.
3. Não introduzir bibliotecas externas no núcleo Lisp.
4. Manter credenciais fora do Git e dos terminais sandbox.

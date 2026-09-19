# Missão: migrar o protótipo legado para Common Lisp

Este repositório contém um protótipo anterior baseado em JavaScript e arquivos de
integração para Claude, Kilo e OpenCode. Ele deve permanecer versionado como
referência funcional enquanto suas ideias são absorvidas pelo Forgepair.

## Objetivo

Transformar progressivamente o protótipo antigo em Common Lisp, preservando a
regra **zero-lib**: nenhuma dependência de Quicklisp, npm ou Python no runtime
final. SBCL, curl, Git, Bubblewrap e ferramentas POSIX fazem parte da plataforma.

## Material legado

- `gateway/`: gateway JavaScript e configuração npm;
- `agents/`: descrições dos agentes Kilo e OpenCode;
- `hooks/`: hooks do protótipo;
- `skills/`: instruções de integração e configuração de provedores;
- `settings.json`: configuração original do Claude Code.

`gateway/node_modules/` não é versionado. O `package-lock.json` permanece somente
para documentar e reproduzir o comportamento do protótipo durante a migração.

## Trabalho planejado

- [ ] Documentar o protocolo HTTP e as rotas implementadas por `gateway/gateway.js`.
- [ ] Criar equivalentes zero-lib em Common Lisp para cada rota necessária.
- [ ] Substituir integrações específicas de Kilo/OpenCode por agentes configuráveis.
- [ ] Representar hooks e skills como dados Lisp simples quando fizer sentido.
- [ ] Adicionar testes de compatibilidade antes de remover qualquer implementação.
- [ ] Remover a dependência npm somente quando o gateway Lisp cobrir o comportamento usado.
- [ ] Atualizar o README a cada parte migrada.

## Regras para os agentes

1. Não apagar o legado apenas por estar em outra linguagem.
2. Migrar uma capacidade pequena e verificável por vez.
3. Demonstrar equivalência com teste ou exemplo reproduzível.
4. Não introduzir bibliotecas externas no núcleo Lisp.
5. Manter credenciais fora do Git e dos terminais sandbox.

# Próximos passos do Forgepair

## Objetivo

O projeto preserva a regra **zero-lib**: nenhuma dependência de Quicklisp, npm ou
Python no runtime final. SBCL, curl, Git, Bubblewrap e ferramentas POSIX formam
a plataforma.

## Trabalho planejado

- [ ] Adicionar testes de contrato para cada adapter de provider.
- [ ] Adicionar descoberta opcional de modelos AWS Bedrock.
- [ ] Melhorar a validação de comandos antes da execução no sandbox.
- [ ] Atualizar a documentação quando novos adapters forem adicionados.

## Regras para os agentes

1. Migrar uma capacidade pequena e verificável por vez.
2. Demonstrar mudanças com teste ou exemplo reproduzível.
3. Não introduzir bibliotecas externas no núcleo Lisp.
4. Manter credenciais fora do Git e dos terminais sandbox.

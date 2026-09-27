# Política de Segurança — ChronoKairo

## Reportando uma vulnerabilidade

**Não abra issue, MR ou discussão pública.** Isso vale inclusive para
vulnerabilidades internas e para achados em código de terceiros já absorvido.

Canais privados, em ordem de preferência:

1. **GitLab Security Advisory** deste projeto, em
   `https://gitlab.com/chronokairo/<repo>/-/security/report_finding`
2. E-mail privado para o time de segurança da ChronoKairo.

Inclua sempre:

- repositório e componente afetados
- descrição do problema e do impacto (o que um atacante ganha)
- passos para reproduzir ou prova de conceito mínima
- versões afetadas e já corrigidas, se souber
- o que você já tentou

## O que torna um relatório útil

**Descrição clara**, **impacto**, **reprodução**, **proposta de correção** e
aviso de divulgação pretendida. Achado sem impacto demonstrado vira backlog,
não incidente.

## Prazo de resposta

| Etapa | Alvo |
| :--- | :--- |
| Confirmação de recebimento | 3 dias úteis |
| Triagem e classificação | 7 dias úteis |
| Correção ou mitigação | acordado por severidade |

Classificação segue impacto e exposição. Achados confirmados e reportados de
boa-fé entram no agradecimento, e a correção é registrada no
[`CHANGELOG.md`](CHANGELOG.md).

## Versões suportadas

O grupo **não publica versões estáveis** neste momento. Todo commit na branch
padrão é considerado suportado, e correções de segurança são aplicadas ali.
Quando existir a primeira tag de release, a tabela de suporte passa a ser
mantida aqui.

## Responsabilidades de quem reporta

- Ser específico e objetivo, sem exfiltrar dados de terceiros.
- Dar prazo razoável antes de divulgar publicamente (mínimo 90 dias).
- Não testar contra infraestrutura de terceiros nem tentar acesso indevido.
- Manter o relatório em sigilo até a correção ser publicada.

## Uso interno

Exercícios internos de segurança, trilhas de auditoria e material de
treinamento não são vulnerabilidades, desde que não exponham dados de
clientes. Dúvida: pergunte antes.

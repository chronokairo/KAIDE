# ADR-0004 — Renomear pacote `chronokairo-desktop` → `@chronokairo/ai`

- **Data:** 2026-09-23
- **Status:** Aceito

## Contexto

O pacote publicado via `github:chronokairo/ai` era nomeado `chronokairo-desktop`, nome herdado da época em que o repositório continha apenas o app Tauri/desktop. Com a centralização de toda a IA do ecossistema neste repo (ADR-0002, ADR-0003), o nome `chronokairo-desktop` tornou-se impreciso e inconsistente com o escopo `@chronokairo/` adotado pelos demais pacotes do ecossistema (`@chronokairo/platform`, etc.).

## Decisão

Renomear o campo `"name"` do [`package.json`](../../package.json) de `chronokairo-desktop` para `@chronokairo/ai`.

Consumidores devem atualizar a chave de dependência de `chronokairo-desktop` para `@chronokairo/ai` mantendo o mesmo source ref (`github:chronokairo/ai#main`).

## Consequências

- **Positivo:** Nome reflete o propósito real do pacote; consistência de escopo npm com o restante do ecossistema.
- **Neutro:** Consumidores precisam renomear a chave no `package.json` — sem mudança de código de importação se os paths de subpath export (`./froia`, `./data-screens`) forem mantidos.
- **Atenção:** `npm install` em repos consumidores precisa ser re-executado após a mudança para que o `package-lock.json` seja atualizado com o novo nome.

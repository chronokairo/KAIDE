# ADR 0020 — Remoção do `por.traineddata` vestigial em `src/modules/ocr`

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time ChronoKairo
- **Tags:** `ocr`, `tesseract`, `deduplicacao`, `glm-ocr`, `consolidacao`

---

## Contexto

A absorção do `operations` (commit `901e476 feat(ocr): absorb OCR model and LLM proxy
servers from operations`) depositou `por.traineddata` (2,4 MB) em
`src/modules/ocr/` deste repositório. O arquivo veio por arrasto: a implementação real
de OCR do ChronoKairo **não usa Tesseract**.

O OCR daqui é `src/modules/ocr/ollama-ocr.ts` (281 linhas), que fala com um **LLM de
visão** — `glm-ocr` — via Ollama em `http://localhost:11434`, com pull do modelo em
background e reindexação do calendário. Não existe `tesseract.js` no `ai`.

A auditoria de referências deu **zero resultados** para `traineddata` e `tesseract` em
todo o repositório (fora `.git` e `node_modules`).

## Estado encontrado: 3 cópias, 2 mortas

| Local | Sha256 (prefixo) | Status |
|---|---|---|
| `chronokairo-ai/src/modules/ocr/por.traineddata` | `42fab1f017aedab69b92bdec` | **morta** — zero referências |
| `chronokairo-legal/src/modules/ged/por.traineddata` | `42fab1f017aedab69b92bdec` | **morta** — cópia gêmea |
| `chronokairo-legal/src/modules/ged/web/por.traineddata` | `42fab1f017aedab69b92bdec` | **viva** — ver abaixo |

São o **mesmo blob** (sha256 idêntico, 2.424.444 bytes) em três lugares: 7,2 MB pelo
mesmo conteúdo.

A cópia viva é a de `legal/src/modules/ged/web/`, porque
`src/modules/ged/web/src/lib/ocr.ts:8` define
`const LANG_PATH = path.resolve(process.cwd(), ".")` e passa esse valor como
`langPath` ao `createWorker("por", 1, { langPath: LANG_PATH })` (linha 57). O
`package.json` com `next dev` vive em `ged/web/`, então o `cwd` do processo é
`ged/web/`.

## Decisão

1. Remover `chronokairo-ai/src/modules/ocr/por.traineddata` — o OCR daqui é visão, e o
   arquivo não é lido por nada.
2. Remover `chronokairo-legal/src/modules/ged/por.traineddata` — cópia gêmea não
   alcançada pelo `LANG_PATH`.
3. Manter exatamente uma cópia, em `chronokairo-legal/src/modules/ged/web/por.traineddata`,
   que é a que o Tesseract realmente carrega.

**Resultado: 7,2 MB → 2,4 MB, uma única cópia viva.**

## Deduplicação entre repositórios é impossível por merge

Vale registrar por que a cópia não pode simplesmente ser removida de todos os lugares
"em favor" do `ai`: `langPath` é um caminho em **disco local do processo**. Um arquivo
em outro repositório não é resolvível em runtime. Deduplicar entre repositórios exigiria
download em setup/build, CDN, ou empacotamento — custo de infraestrutura que não se
justifica para um único arquivo de 2,4 MB. A decisão é manter a cópia local, única, e
garantida por teste.

## Consequências

- 4,8 MB removidos; um arquivo de 2,4 MB a menos por repositório.
- O `ai` deixa de sugerir que depende de Tesseract. Se um dia precisar, é
  `tesseract.js` + download do `traineddata`, não este binário.
- Nenhuma mudança de runtime: o caminho de leitura (`LANG_PATH` → `cwd`) não foi tocado.

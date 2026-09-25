# Function Calling

Esta feature representa o uso da Anna com chamadas de ferramentas.

Implementacao atual:

- `frontend.ts`: `createAnnaFrontendRouter`, decide endpoint e corpo da requisicao a partir de mensagem + arquivo no cliente.
- `backend.ts`: `createAnnaBackendRouter`, decide a intencao e a tool no backend a partir de metadados do arquivo.

Aplicacoes comuns:

- consulta a APIs internas;
- acesso a ERP, CRM e banco de dados;
- automacoes orientadas por pergunta do usuario.
# ADR 0004 — Dados estruturados e limpeza verificada do Drive

- Data: 2026-10-07, America/Manaus.
- Estado: aplicada e verificada.

## Contexto

Após a carga da ADR 0003, o dono autorizou apagar do Drive tudo que já estiver importado e transformar o conteúdo do Storage em dados para os aplicativos.

## Decisão

Recuperar cada original do Storage privado, conferir SHA-256 de cada parte e do arquivo reconstruído. Materializar CSVs completos em registros NDJSON; planilhas em linhas com aba, posição e fórmulas preservadas; documentos em seções e linhas de tabelas; mídia em descritores sem alegar OCR ou transcrição. O inventário existente registra a área, campos, quantidade e manifest dos datasets. Os objetos estruturados são conferidos por download e ficam no mesmo bucket privado. Nenhuma chave de serviço vai ao frontend.

Cadastrar leads ausentes na tabela nativa do CRM, usando CNPJ/nome para deduplicar, valores aceitos pelo schema e fonte original nas notas. Preservar status e campos dos registros existentes. Cadastrar contas e projetos explicitamente identificados na carteira de clientes e ausentes do banco. Informações financeiras e de pessoas sem requisitos completos permanecem como dados estruturados para revisão: não criar faturamento, pagamentos, vínculos empregatícios ou contratos fictícios.

Separar carteiras de leads por `notes.person_type` (PF/PJ) e `notes.market` (B2C/B2B), sem alterar o schema existente. Leads PF das listas de turmas permanecem com company nulo e fontes por arquivo/aba/linha; os decisores de empresas continuam B2B. Nome normalizado agrupa inscrições repetidas e conserva todas as fontes, sem fabricar CPF ou dados de contato ausentes. Registros de teste e cabeçalhos são excluídos. Nenhum contato externo é disparado. O agente comercial recebe essa regra nas instruções ativas.

A remoção é uma etapa explícita, com `cleanup_imported_drive.ps1 -Apply`. O script confina os caminhos ao Drive autorizado, bloqueia diretórios protegidos e reparse points, confere tamanho e SHA-256 novamente e remove apenas arquivos individuais cuja cópia integral foi recuperada. Cópias redigidas, fontes modificadas e os nove atalhos Google não importados ficam preservados. Os diretórios não são removidos recursivamente. A autorização é específica desta sessão; o materializador não apaga automaticamente.

## Consequências

Os aplicativos existentes recebem registros nativos quando há campos inequívocos. Outros dados ficam acessíveis por leitor de backend com escopo de organização, `read_application_data.py`, sem exigir schema paralelo. Isso não equivale a adicionar telas novas ou implementar importação clínica/educacional nos produtos de clientes. Os originais permanecem recuperáveis no Storage após a limpeza do Drive. Relatórios de conversão e exclusão ficam fora do Git para preservar informações de clientes.

## Resultado verificado

402 conjuntos no inventário, 1.599.724 registros estruturados e aproximadamente 1,27 GB de NDJSON privado. Por área: CRM 54, engenharia 35, financeiro 43, marketing 111, operações 100, pessoas 26 e projetos 33. Os dois CSVs grandes foram convertidos integralmente; falhas de conexão foram repetidas com verificação dos objetos por download.

CRM: 22 novos leads empresariais e 460 PF únicos, provenientes de 575 inscrições de cursos; 149 PF com e-mail. Carteiras finais: 79 B2B e 460 B2C, sem registros sem classificação. Campos anteriores dos 57 leads preexistentes foram conferidos como preservados, exceto notas de classificação e timestamp de atualização. Duas contas de clientes e seus dois projetos foram cadastrados com fonte e readback.

398 arquivos individuais removidos do Drive depois de recuperar a cópia integral e conferir novamente o hash local; ausência posterior conferida. Quatro originais cuja cópia foi redigida e nove arquivos virtuais Google permanecem no Drive. Pastas protegidas e itens fora da carga não foram removidos. 24 testes do recorte passaram, além de leitura real do consumidor para pessoas e CRM/B2C e auditoria de inventário/CRM/exclusão. O Copilot App segue exibindo somente comercial, security e payment.

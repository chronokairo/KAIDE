# ADR 0003 — Preservar conhecimento do vault no Supabase

- Data: 2026-10-07, America/Manaus.
- Estado: carga inicial aplicada; nove arquivos nativos Google pendentes de acesso/exportação.

## Contexto

O dono pediu enviar os dados do Desktop ao Supabase para uso posterior e identificou a origem como `H:\Meu Drive`. O diretório contém o vault empresarial, dados externos, documentos oficiais, pessoas e clientes. Seu agents.md exclui senhas, credenciais e contratos assinados de indexação. A Platform já possui ops_documents com organização e políticas de leitura administrativa.

## Decisão

Usar ops_documents como índice de conteúdo e metadados, sem criar schema paralelo. Preservar originais e conjuntos grandes no bucket privado chronokairo-knowledge. Separar dados por organization_id, com IDs estáveis derivados do caminho. Conservar os documentos preexistentes e a fonte no Drive. Importar sem editar, mover ou apagar os arquivos de origem.

Extrair notas, documentos, PDFs e planilhas para consulta posterior. PDFs sem texto e mídia ficam como arquivos originais sem alegação de OCR/transcrição. Preservar arquivos CSV completos em partes de 5 MiB e fornecer prévia no banco. Manifest permite reconstrução byte a byte e conferência de SHA-256. Redigir credenciais detectadas antes de indexar e não enviar o original correspondente. Não indexar pastas proibidas, código, logs ou arquivos compactados.

Credencial de serviço é consumida exclusivamente do ambiente existente da máquina, com verificação do projeto de destino, sem copiá-la para banco, Storage, relatórios ou Git. Bucket permanece privado; não há URLs públicas. Consulta posterior requer ferramentas autorizadas e escopo da organização. Não criar um quarto agente ou automação diurna para esta carga.

## Resultado e limites

402 arquivos importados, aproximadamente 490 MB preservados no Storage, com readback dos registros e verificação de tamanhos/checksums dos objetos. Nove arquivos Google Sheets/Forms são virtuais e exigem conexão Google Drive/exportação; a carga não está completa para esses dados. Onze PDFs sem camada de texto não passaram por OCR. Um DOCX era vazio na origem. Três XLS que eram HTML foram recuperados. Os dois CSVs maiores foram preservados integralmente em partes.

Exceções e paths confidenciais ficam no relatório local, fora do repositório. O código do importador e testes são reproduzíveis. A sincronização é explícita e idempotente; não há remoção automática de dados remotos.

# Conhecimento no Supabase

Fonte importada: vault `H:\Meu Drive`. Destino: projeto Supabase da Chronokairo, organização com slug `chronokairo`.

O conteúdo consultável está em `public.ops_documents`, com IDs `drive/<organization_id>/<hash_do_caminho>`. Cada registro contém caminho relativo, extensão, tamanho, estado da extração, hash da origem, manifest dos objetos privados e texto extraído. Notas, PDFs com texto, documentos Word, tabelas HTML e planilhas são extraídos sem alterar a fonte. Fórmulas de XLSX são preservadas em texto; não foram recalculadas.

Os arquivos ficam no bucket **privado** `chronokairo-knowledge`. Arquivos grandes são divididos em partes de até 5 MiB, com SHA-256 por parte, hash do conjunto e ordem no manifest. Para reconstruir, baixar as partes em ordem e concatenar os bytes; conferir `stored_sha256`. Quando houver segredo detectado, só a cópia redigida é enviada, explicitamente marcada como tal. CSVs grandes têm uma prévia no banco e o arquivo completo em partes no Storage.

```sql
select d.id, d.title, d.content, d.content_sha256
from public.ops_documents d
join public.organizations o on o.id = d.organization_id
where o.slug = 'chronokairo'
  and d.id like 'drive/%'
order by d.title;
```

Usar acesso autorizado da organização e ferramentas do produto/Platform. Nunca expor service role no frontend, criar URL pública para o bucket ou usar dados de outros tenants. Os agentes devem consultar apenas os documentos relevantes ao seu papel, preservar fontes/datas e distinguir relato histórico de estado atual.

## Estado da carga inicial — 2026-10-07

- 402 arquivos importados e conferidos por readback; aproximadamente 490 MB no Storage privado.
- 9 atalhos nativos Google Sheets/Forms pendentes de conexão Google Drive/exportação; arquivos virtuais não podem ser abertos pelo filesystem do Windows. Não afirmar que os dados das planilhas/formulários foram importados.
- 11 PDFs sem camada de texto foram preservados como originais; não houve OCR. Imagens e vídeos foram preservados sem OCR/transcrição. Um DOCX estava vazio na origem e foi identificado como tal.
- 2 CSVs grandes têm prévia no banco e conteúdo completo no Storage. Três arquivos `.xls` eram tabelas HTML e tiveram extração recuperada.
- Diretórios de segredos, credenciais e contratos assinados foram excluídos conforme agents.md do vault. Arquivos de código, logs e arquivos compactados não integram este importador de conhecimento.
- A carga inicial preservou os arquivos do Drive. A ADR 0004 autoriza uma limpeza posterior explícita, somente após recuperar e conferir a cópia integral. Documentos preexistentes no banco foram preservados.

O relatório detalhado, com paths e exceções, é operacional e fica fora do Git em `~/.copilot/knowledge-import/import-report.json`. Não publicar manifests com dados de clientes.

## Repetir a sincronização

```powershell
python .copilot/minimal-team/sync_knowledge.py --root 'H:\Meu Drive' --env-file ../ai/.env.local --project-ref <ref-confirmado> --output ../../knowledge-import/import-report.json --apply
```

Sem `--apply`, gera somente inventário. `--retry-failed` reprocessa falhas do relatório anterior; `--retry-extraction` reprocessa arquivos preservados cuja extração falhou. O upsert é estável por organização/caminho, sem duplicar registros. O importador não apaga documentos ou objetos antigos e não cria agendamento extra. PDF/DOCX/XLSX usam as bibliotecas do runtime; XLS binário requer xlrd, que pode ser fornecido por `--extra-libraries`.

Verificação: `python -m unittest discover -s .copilot/minimal-team -p test_sync_knowledge.py` e conferência de IDs/hashes no Supabase. Arquivos virtuais do Google Drive só entram após acesso ao conteúdo real; um atalho não é uma exportação de dados.

## Dados para aplicativos — ADR 0004

`materialize_knowledge.py` recupera os originais do Storage e transforma CSVs completos, linhas de planilhas, tabelas e seções de documentos em NDJSON privado. `data_inventory.purpose` contém um descritor JSON com organization_id, application, source_document_id, formato, contagem e manifest. `data_types` lista os campos. As áreas são crm, finance, projects, people, marketing, engineering e operations.

O leitor de backend `read_application_data.iter_application_records(backend, organization_id, application)` filtra a organização e área, valida o escopo dos objetos e SHA-256, e retorna registros estruturados com a origem. A aplicação precisa de autorização própria antes de invocar esse leitor; a chave de serviço nunca entra no cliente. Dados clínicos/educacionais de clientes permanecem fontes identificadas, sem importação automática em prontuários ou cadastros de alunos de outro tenant.

Leads ausentes são inseridos diretamente no CRM, deduplicados por CNPJ/nome. Clientes/projetos explicitamente presentes na carteira são cadastrados sem fabricar receita ou contratos. As demais fontes estruturadas exigem revisão antes de gerar lançamentos financeiros ou vínculos de pessoas. As fórmulas não são recalculadas; imagens/vídeos/PDFs sem texto conservam descritores e originais, sem conteúdo inventado.

Na carga de 2026-10-07, as listas de cursos produziram 460 leads PF/B2C únicos a partir de 575 inscrições (149 com e-mail). A carteira empresarial contém 79 leads PJ/B2B, incluindo 22 novos. A separação está em `leads.notes` como JSON com `person_type` e `market`; PF mantém `company` nulo. O leitor `iter_crm_leads` e o CLI com `--application crm-b2b` ou `crm-b2c` retornam as carteiras separadas. Isso não implementa novas abas na UI do CRM. Foram cadastradas também duas contas de clientes e dois projetos ausentes.

`cleanup_imported_drive.ps1` usa um manifest operacional com prova de recuperação, confere novamente o hash do arquivo local e confina caminhos à raiz autorizada. Sem `-Apply`, apenas confere; com `-Apply`, apaga os arquivos elegíveis individualmente. Quatro cópias redigidas e nove arquivos Google pendentes não autorizam remoção do original. Nenhum diretório protegido é lido ou removido. Manifests, caches e relatórios ficam fora do Git.

Resultado conferido: 402 conjuntos com 1.599.724 registros estruturados; 398 arquivos removidos e ausência conferida, mantendo as cópias originais recuperáveis no Storage. Foram preservados os quatro originais redigidos, os nove arquivos Google pendentes e os itens fora do inventário autorizado. Os 57 leads anteriores mantiveram seus campos e estados, recebendo apenas notas de classificação. 24 testes do recorte passaram. Os relatórios finais ficam em `~/.copilot/knowledge-import/materialized/`.

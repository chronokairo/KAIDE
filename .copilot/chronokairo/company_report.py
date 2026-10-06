#!/usr/bin/env python3
"""Consolida evidências locais de agentes sem confundir execução com entrega."""
import datetime as dt
import importlib.util
import json
import sqlite3
import sales
from pathlib import Path
from zoneinfo import ZoneInfo

BASE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('company', BASE / 'company.py')
company = importlib.util.module_from_spec(spec)
spec.loader.exec_module(company)


def main():
    now = dt.datetime.now(ZoneInfo('America/Caracas'))
    day = now.date().isoformat()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(dt.timezone.utc)
    end = (start + dt.timedelta(days=1)).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    start = start.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    app = sqlite3.connect('file:' + str(Path.home() / '.copilot/data.db') + '?mode=ro', uri=True)
    runs = app.execute("select w.name,r.status,r.started_at,r.completed_at,r.error_message from workflow_runs r join workflows w on w.id=r.task_id where w.agent like 'ck-%' and r.started_at>=? and r.started_at<? order by r.started_at", (start, end)).fetchall()
    app.close()
    reports = sqlite3.connect('file:' + str(BASE / 'reporting.db') + '?mode=ro', uri=True)
    entries = reports.execute("select created,agent,job,message from reports where day=? and kind='daily' and job not like 'company-summary-%' order by created", (day,)).fetchall()
    blockers = reports.execute("select created,agent,job,message from reports where kind='blocker' and resolved=0 order by created").fetchall()
    reports.close()
    counts = {status: sum(r[1] == status for r in runs) for status in ['completed', 'failed', 'running', 'pending']}
    body = f'# Relatório da Chronokairo — {day}\n\nGerado às {now:%H:%M}, America/Caracas.\n\n'
    body += '## Operação das automações\n\n' + ', '.join(f'{n} {status}' for status, n in counts.items()) + '.\n\nStatus do runtime não comprova implementação, merge, deploy ou receita.\n'
    for name, status, started, ended, error in runs:
        body += f'\n- {name}: {status}; início {started}; fim {ended or "não informado"}.'
        if error:
            body += ' Erro: ' + company.redact(error).replace('\n', ' ')[:600]
    commercial=sales.report()
    body += '\n\n## Aquisição comercial\n\n'
    body += f'Empresas novas registradas no funil: {commercial["companies"]}. Etapas com comprovantes (acumulado): {json.dumps(commercial["evidence_counts"],ensure_ascii=False)}. Recebimentos registrados neste funil: {commercial["paid_cents"]} centavos. Audiomed excluída da aquisição. Candidatos não comprovam interesse; valores não representam toda a contabilidade da empresa.\n\nDocumento comercial: {commercial["document"]}. Envios automáticos desabilitados; respostas exigem evidência operacional.\n'
    body += '\n\n## Entregas reportadas pelos agentes\n'
    receipt = company.DESKTOP / 'Audiomed-Workmed-Migracao-2026-10-05.json'
    if receipt.is_file():
        migration = json.loads(receipt.read_text())
        body += '\nOs relatos abaixo preservam o estado informado no momento da execução. O backlog Audiomed foi migrado posteriormente; usar os destinos atuais desta tabela. Patches arquivados não equivalem a features aplicadas.\n\n| Origem histórica | Destino atual |\n|---|---|\n'
        for entry in migration.get('issues', []) + migration.get('pullRequests', []):
            source, destination = entry.get('source', ''), entry.get('destination', '')
            if source.startswith('https://github.com/chronokairo/audiomed/') and destination.startswith('https://gitlab.com/chronokairo/workmed/'):
                body += f'| {source} | {destination} |\n'
    if not entries:
        body += '\nNenhuma entrega reportada hoje.\n'
    for created, agent, job, message in entries:
        body += f'\n### {agent} — {job}\n\n{company.redact(message)}\n'
    body += '\n## Dependências registradas\n\nRegistros ainda não resolvidos; alertas de timeout podem ser históricos e precisam ser confrontados com o estado atual acima.\n'
    for created, agent, job, message in blockers:
        body += f'\n### {agent} — {created} — {job}\n\n{company.redact(message)}\n'
    body += '\n## Financeiro e consumo\n\nReceita recebida, despesas, tokens e custo: não disponíveis nas fontes consultadas. Contratos, preços de planos e propostas não equivalem a dinheiro recebido.\n'
    generated = {f'Relatorio-{day}.md', f'Relatorio-Empresa-{day}.md', 'PENDENCIAS.md'}
    assisted = sorted(f.name for f in company.DESKTOP.glob(f'*{day}*.md') if f.name not in generated)
    body += '\n## Entregas assistidas e próximos passos\n\n'
    body += ('Documentos do dia nesta pasta, para trabalhos realizados diretamente com o dono; não atribuir essas entregas às automações: ' + ', '.join(assisted) + '.\n') if assisted else 'Nenhum documento de entrega assistida hoje.\n'
    try:
        priorities = json.loads((BASE / 'priorities.json').read_text())['priorities']
        body += '\nPrioridades vigentes (priorities.json):\n' + ''.join(f"\n{p['rank']}. {p['summary']}" for p in priorities) + '\n'
    except (OSError, ValueError, KeyError):
        body += '\nPrioridades indisponíveis: priorities.json ausente ou inválido.\n'
    path = company.DESKTOP / f'Relatorio-Empresa-{day}.md'
    company.atomic(path, body)
    result = company.report('ck-control-auditor', 'company-summary-' + day, 'daily', f'Relatório consolidado: {path}\nExecuções de hoje: {counts}. Entregas reportadas: {len(entries)}. Dependências registradas: {len(blockers)}. Execução concluída não foi presumida como entrega de negócio.')
    print(path)
    print(result['document'])


if __name__ == '__main__':
    main()

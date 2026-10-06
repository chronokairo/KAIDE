#!/usr/bin/env python3
"""Envia registros operacionais locais ao Supabase (ops_*), para consulta pelo ERP.

Fontes: reporting.db (relatos e pendências dos agentes), workflow_runs do Copilot App
(rotinas ck-*) e documentos do Desktop/Chronokairo em lista permitida. Arquivos de senha,
backups e SQL nunca são enviados; todo texto passa por company.redact. Idempotente (upsert).
"""
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import urllib.request
import company
import provision_users

BASE = Path(__file__).resolve().parent
APP_DB = Path.home() / '.copilot/data.db'
DESKTOP = Path.home() / 'Desktop/Chronokairo'
ORG_SLUG = 'chronokairo'
ALLOWED = [('Registro-Dia-*.md', 'registro'), ('PENDENCIAS.md', 'pendencias'), ('Relatorio-Empresa-*.md', 'relatorio'),
           ('Relatorio-Executivo-*.md', 'relatorio'), ('Relatorio-2*.md', 'relatorio'), ('Comercial-*.md', 'comercial')]
DENY = re.compile(r'acesso|senha|password|backup|\.sql$', re.I)


def rest(key, method, path, body=None, prefer=None):
    headers = {'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'User-Agent': 'chronokairo-ops-sync'}
    if prefer:
        headers['Prefer'] = prefer
    req = urllib.request.Request(provision_users.SUPABASE_URL + '/rest/v1/' + path, method=method, headers=headers,
                                 data=None if body is None else json.dumps(body).encode())
    with urllib.request.urlopen(req, timeout=60) as response:
        raw = response.read()
        return json.loads(raw) if raw else None


def upsert(key, table, rows, chunk=200):
    for i in range(0, len(rows), chunk):
        rest(key, 'POST', f'{table}?on_conflict=id', rows[i:i + chunk], 'resolution=merge-duplicates')
    return len(rows)


def reports(org):
    with sqlite3.connect(f'file:{BASE / "reporting.db"}?mode=ro', uri=True) as c:
        rows = c.execute('select id,day,created,agent,job,kind,message,resolved,resolution,resolved_at from reports').fetchall()
    return [{'id': r[0], 'organization_id': org, 'day': r[1], 'created_at': r[2], 'agent': r[3], 'job': r[4], 'kind': r[5],
             'message': company.redact(r[6]), 'resolved': bool(r[7]), 'resolution': company.redact(r[8]) if r[8] else None,
             'resolved_at': r[9]} for r in rows]


def runs(org):
    with sqlite3.connect(f'file:{APP_DB}?mode=ro', uri=True) as c:
        rows = c.execute("select r.id,w.name,w.agent,r.status,r.trigger,r.started_at,r.completed_at,r.error_message from workflow_runs r join workflows w on w.id=r.task_id where w.agent like 'ck-%'").fetchall()
    out = []
    for rid, name, agent, status, trigger, start, end, error in rows:
        seconds = None
        if start and end:
            seconds = int((dt.datetime.fromisoformat(end.replace('Z', '+00:00')) - dt.datetime.fromisoformat(start.replace('Z', '+00:00'))).total_seconds())
        out.append({'id': rid, 'organization_id': org, 'automation': name, 'agent': agent, 'status': status, 'trigger': trigger,
                    'started_at': start, 'completed_at': end, 'duration_seconds': seconds, 'error_message': company.redact(error) if error else None})
    return out


def documents(org):
    out, seen = [], set()
    for pattern, category in ALLOWED:
        for f in sorted(DESKTOP.glob(pattern)):
            if f.name in seen or DENY.search(f.name) or not f.is_file():
                continue
            seen.add(f.name)
            text = company.redact(f.read_text(errors='replace'))
            day = re.search(r'(\d{4}-\d{2}-\d{2})', f.name)
            out.append({'id': 'desktop/' + f.name, 'organization_id': org, 'title': f.stem, 'category': category, 'content': text,
                        'content_sha256': hashlib.sha256(text.encode()).hexdigest(), 'document_date': day.group(1) if day else None})
    return out


def main():
    key = provision_users.service_key()
    orgs = rest(key, 'GET', f'organizations?select=id&slug=eq.{ORG_SLUG}')
    if len(orgs) != 1:
        raise SystemExit('Organização chronokairo não encontrada')
    org = orgs[0]['id']
    result = {'ops_agent_reports': upsert(key, 'ops_agent_reports', reports(org)),
              'ops_automation_runs': upsert(key, 'ops_automation_runs', runs(org)),
              'ops_documents': upsert(key, 'ops_documents', documents(org))}
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()

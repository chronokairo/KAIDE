#!/usr/bin/env python3
"""Leitura do Mail para os agentes: cache no Supabase (preenchido pelo Worker mail-sync).

Entra como o robô agent@chronokairo.com.br (role agent, sob RLS): lê todas as caixas e
registra classificações (lead, cliente, fatura...). Nunca chama a API do Resend nem usa
service role. Credenciais em ~/.config/chronokairo/mail-agent.env (0600).
"""
import argparse
import json
from pathlib import Path
import urllib.parse
import urllib.request

CREDENTIALS = Path.home() / '.config/chronokairo/mail-agent.env'
KINDS = ['lead', 'customer', 'invoice', 'payment', 'supplier', 'support', 'spam', 'other']
_session = {}


def settings():
    values = {}
    if CREDENTIALS.is_file():
        for line in CREDENTIALS.read_text().splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                k, v = line.split('=', 1)
                values[k.strip()] = v.strip()
    missing = [k for k in ['CK_SUPABASE_URL', 'CK_SUPABASE_ANON_KEY', 'CK_MAIL_AGENT_EMAIL', 'CK_MAIL_AGENT_PASSWORD'] if not values.get(k)]
    if missing:
        raise SystemExit('Mail do agente não configurado: faltam ' + ', '.join(missing) + ' em ' + str(CREDENTIALS))
    return values


def _call(method, url, headers, body=None):
    req = urllib.request.Request(url, method=method, data=None if body is None else json.dumps(body).encode(),
                                 headers={**headers, 'Content-Type': 'application/json', 'User-Agent': 'chronokairo-mail-reader'})
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read()
        return json.loads(raw) if raw else None


def session():
    if not _session:
        s = settings()
        auth = _call('POST', s['CK_SUPABASE_URL'] + '/auth/v1/token?grant_type=password', {'apikey': s['CK_SUPABASE_ANON_KEY']},
                     {'email': s['CK_MAIL_AGENT_EMAIL'], 'password': s['CK_MAIL_AGENT_PASSWORD']})
        _session.update(url=s['CK_SUPABASE_URL'], headers={'apikey': s['CK_SUPABASE_ANON_KEY'], 'Authorization': 'Bearer ' + auth['access_token']})
    return _session


def rest(method, path, body=None, prefer=None):
    s = session()
    headers = dict(s['headers'])
    if prefer:
        headers['Prefer'] = prefer
    return _call(method, s['url'] + '/rest/v1/' + path, headers, body)


def list_messages(since=None, direction=None, mailbox=None, limit=50, unclassified=False):
    q = {'select': 'id,direction,mailboxes,from_address,to_addresses,subject,provider_created_at,body_status',
         'order': 'provider_created_at.desc', 'limit': str(min(max(limit, 1), 200))}
    if since:
        q['provider_created_at'] = 'gte.' + since
    if direction:
        q['direction'] = 'eq.' + direction
    if mailbox:
        q['mailboxes'] = 'cs.{' + mailbox + '}'
    rows = rest('GET', 'mail_messages?' + urllib.parse.urlencode(q))
    if unclassified and rows:
        ids = ','.join(r['id'] for r in rows)
        done = {c['message_id'] for c in rest('GET', 'mail_classifications?select=message_id&message_id=in.(' + ids + ')')}
        rows = [r for r in rows if r['id'] not in done]
    return rows


def show(message_id):
    rows = rest('GET', 'mail_messages?' + urllib.parse.urlencode({'select': '*', 'id': 'eq.' + message_id}))
    if not rows:
        raise SystemExit('Mensagem não encontrada ou fora do alcance da RLS')
    msg = rows[0]
    msg.pop('html_body', None)  # agentes leem texto; HTML de terceiros não entra no contexto
    msg['text_body'] = (msg.get('text_body') or '')[:20000]
    return msg


def classify(message_id, kind, confidence, evidence, agent, domain=None):
    if kind not in KINDS:
        raise SystemExit('kind deve ser um de: ' + ', '.join(KINDS))
    if not 0 <= confidence <= 1:
        raise SystemExit('confidence entre 0 e 1')
    if not evidence.strip():
        raise SystemExit('evidence obrigatória')
    rest('POST', 'mail_classifications?on_conflict=message_id,kind,agent',
         [{'message_id': message_id, 'kind': kind, 'confidence': round(confidence, 2), 'evidence': evidence[:2000], 'agent': agent, 'domain': domain}],
         prefer='resolution=ignore-duplicates')
    return {'message_id': message_id, 'kind': kind, 'agent': agent}


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest='cmd', required=True)
    ls = sub.add_parser('list')
    ls.add_argument('--since'); ls.add_argument('--direction', choices=['received', 'sent']); ls.add_argument('--mailbox')
    ls.add_argument('--limit', type=int, default=50); ls.add_argument('--unclassified', action='store_true')
    sh = sub.add_parser('show'); sh.add_argument('id')
    c = sub.add_parser('classify'); c.add_argument('id'); c.add_argument('--kind', required=True); c.add_argument('--confidence', type=float, required=True)
    c.add_argument('--evidence', required=True); c.add_argument('--agent', required=True); c.add_argument('--domain')
    a = p.parse_args()
    if a.cmd == 'list':
        out = list_messages(a.since, a.direction, a.mailbox, a.limit, a.unclassified)
    elif a.cmd == 'show':
        out = show(a.id)
    else:
        out = classify(a.id, a.kind, a.confidence, a.evidence, a.agent, a.domain)
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

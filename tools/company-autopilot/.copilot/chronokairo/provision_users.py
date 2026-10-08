#!/usr/bin/env python3
"""Identifica as caixas @chronokairo.com.br no Resend e cria logins no Supabase Auth.

discover: só lista endereços, por padrão do cache mail_messages no Supabase (Worker mail-sync),
          ou do Resend com --source resend; mais os usuários já existentes no Auth.
create:   cria os usuários aprovados com senha forte e grava as senhas apenas em um .md
          local (chmod 600, fora do Git). Nenhuma chave ou senha é impressa.
"""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import secrets
import string
import subprocess
import time
import urllib.parse
import urllib.request

DOMAIN = 'chronokairo.com.br'
PROJECT_REF = 'your-project-ref'
SUPABASE_URL = f'https://{PROJECT_REF}.supabase.co'
ENV_FILE = Path.home() / 'Documents/GitHub/env/.env'
DESKTOP = Path.home() / 'Desktop/Chronokairo'
ADDRESS = re.compile(r'[A-Za-z0-9._%+-]+@' + re.escape(DOMAIN), re.I)


def resend_key():
    key = os.environ.get('RESEND_API_KEY')
    if not key and ENV_FILE.is_file():
        for line in ENV_FILE.read_text().splitlines():
            if line.strip().startswith('RESEND_API_KEY='):
                key = line.split('=', 1)[1].strip().strip('"\'')
    if not key:
        raise SystemExit('RESEND_API_KEY não encontrada no ambiente nem em ' + str(ENV_FILE))
    return key


def service_key():
    out = subprocess.run(['supabase', 'projects', 'api-keys', '--project-ref', PROJECT_REF, '-o', 'json'],
                         capture_output=True, text=True, timeout=60)
    if out.returncode:
        raise SystemExit('supabase projects api-keys falhou; confira o login do CLI')
    for item in json.loads(out.stdout):
        if item.get('name') == 'service_role' or item.get('id') == 'service_role':
            return item['api_key']
    raise SystemExit('Chave service_role não retornada pelo CLI')


def call(url, headers, method='GET', body=None):
    req = urllib.request.Request(url, method=method, headers={**headers, 'Content-Type': 'application/json', 'User-Agent': 'chronokairo-provision'},
                                 data=None if body is None else json.dumps(body).encode())
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read() or b'{}')


def resend_addresses(pages):
    """Percorre recebidos e enviados com no máximo `pages` páginas cada, 0,6 s entre chamadas."""
    headers = {'Authorization': 'Bearer ' + resend_key()}
    seen = {}
    for path in ['/emails/receiving', '/emails']:
        after = None
        for _ in range(pages):
            q = {'limit': '100', **({'after': after} if after else {})}
            data = call('https://api.resend.com' + path + '?' + urllib.parse.urlencode(q), headers)
            items = data.get('data') or []
            for item in items:
                for field in ['from', 'to', 'cc', 'bcc', 'reply_to']:
                    values = item.get(field) or []
                    for value in ([values] if isinstance(values, str) else values):
                        for address in ADDRESS.findall(str(value)):
                            seen[address.lower()] = seen.get(address.lower(), 0) + 1
            time.sleep(0.6)
            if not data.get('has_more') or not items:
                break
            after = items[-1].get('id')
    return seen


def auth_users(key):
    headers = {'apikey': key, 'Authorization': 'Bearer ' + key}
    users, page = {}, 1
    while True:
        data = call(f'{SUPABASE_URL}/auth/v1/admin/users?page={page}&per_page=200', headers)
        batch = data.get('users') or []
        for u in batch:
            if u.get('email'):
                users[u['email'].lower()] = u['id']
        if len(batch) < 200:
            return users
        page += 1


def cache_addresses(key):
    """Endereços a partir do cache mail_messages (preenchido pelo Worker mail-sync); sem chave do Resend local."""
    headers = {'apikey': key, 'Authorization': 'Bearer ' + key}
    seen, offset = {}, 0
    while True:
        rows = call(f'{SUPABASE_URL}/rest/v1/mail_messages?select=from_address,to_addresses,cc_addresses&limit=1000&offset={offset}', headers)
        for r in rows:
            for value in [r.get('from_address') or '', *(r.get('to_addresses') or []), *(r.get('cc_addresses') or [])]:
                for address in ADDRESS.findall(str(value)):
                    seen[address.lower()] = seen.get(address.lower(), 0) + 1
        if len(rows) < 1000:
            return seen
        offset += 1000


def discover(pages, source):
    key = service_key()
    seen = cache_addresses(key) if source == 'cache' else resend_addresses(pages)
    existing = auth_users(key)
    rows = sorted(set(seen) | {e for e in existing if e.endswith('@' + DOMAIN)})
    return [{'email': e, 'mensagens_no_resend': seen.get(e, 0), 'ja_tem_login': e in existing} for e in rows]


def password(length=20):
    alphabet = string.ascii_letters + string.digits + '-_.!@#'
    while True:
        p = ''.join(secrets.choice(alphabet) for _ in range(length))
        if any(c.islower() for c in p) and any(c.isupper() for c in p) and any(c.isdigit() for c in p):
            return p


def _password_file():
    DESKTOP.mkdir(parents=True, exist_ok=True)
    path = DESKTOP / f'Acessos-Iniciais-{dt.date.today().isoformat()}.md'
    new_file = not path.exists()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_APPEND | os.O_NOFOLLOW, 0o600)
    os.fchmod(fd, 0o600)
    f = os.fdopen(fd, 'a')
    if new_file:
        f.write('# Acessos iniciais — Chronokairo\n\nEntregar individualmente a cada pessoa e apagar este arquivo após a entrega.\n'
                'Cada pessoa deve trocar a senha no primeiro acesso. Não enviar por e-mail nem salvar no Git.\n\n'
                '| Login (e-mail) | Apelido | Senha inicial |\n|---|---|---|\n')
    return path, f


def create(emails):
    wanted = [e.strip().lower() for e in emails]
    invalid = [e for e in wanted if not re.fullmatch(r'[a-z0-9._-]{1,64}@' + re.escape(DOMAIN), e)]
    if invalid:
        raise SystemExit('Endereços inválidos (somente nome@' + DOMAIN + '): ' + ', '.join(invalid))
    key = service_key()
    headers = {'apikey': key, 'Authorization': 'Bearer ' + key}
    existing = auth_users(key)
    created, skipped, path, f = [], [], None, None
    try:
        for email in wanted:
            if email in existing:
                skipped.append(email)
                continue
            secret = password()
            nickname = email.split('@')[0]
            call(f'{SUPABASE_URL}/auth/v1/admin/users', headers, 'POST',
                 {'email': email, 'password': secret, 'email_confirm': True,
                  'user_metadata': {'nickname': nickname, 'provisioned_by': 'provision_users.py'}})
            if f is None:
                path, f = _password_file()
            # Grava logo após criar: uma falha no lote não deixa senha perdida.
            f.write(f'| {email} | {nickname} | `{secret}` |\n')
            f.flush()
            created.append(email)
    finally:
        if f:
            f.close()
    return {'criados': created, 'ja_existiam': skipped, 'arquivo_senhas': str(path) if path else None}


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest='cmd', required=True)
    d = sub.add_parser('discover'); d.add_argument('--pages', type=int, default=5); d.add_argument('--source', choices=['cache', 'resend'], default='cache')
    c = sub.add_parser('create'); c.add_argument('emails', nargs='+')
    a = p.parse_args()
    print(json.dumps(discover(a.pages, a.source) if a.cmd == 'discover' else create(a.emails), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

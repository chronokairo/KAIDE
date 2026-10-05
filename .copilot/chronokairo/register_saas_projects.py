"""Register authorized SaaS checkouts without modifying workflows or provider credentials."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import uuid

ROOT = Path(__file__).resolve().parent
NAMESPACE = uuid.UUID('37a4dbb0-8ebc-4733-9391-e3fb5e4457a8')

def register(apply=False):
    context = json.loads((ROOT / 'company-context.json').read_text())
    entries = []
    for name in ['workmed', 'agroflow']:
        expected = f'https://gitlab.com/chronokairo/{name}'
        if context['projects'][name]['repository'] != expected:
            raise RuntimeError('Unexpected organization/repository')
        path = Path.home() / 'Documents/GitLab' / name
        remote = subprocess.run(['git','-C',str(path),'remote','get-url','origin'], capture_output=True,text=True,check=True).stdout.strip()
        if remote.rstrip('/').removesuffix('.git') != expected:
            raise RuntimeError('Checkout remote does not match authorized repository')
        head = subprocess.run(['git','-C',str(path),'symbolic-ref','refs/remotes/origin/HEAD'],capture_output=True,text=True,check=True).stdout.strip()
        default_branch = head.removeprefix('refs/remotes/origin/')
        if not re.fullmatch(r'[A-Za-z0-9_./-]+',default_branch): raise RuntimeError('Invalid default branch')
        entries.append((name,str(path),default_branch))
    database = Path.home() / '.copilot/data.db'
    result = {'applied':apply,'projects':[{'name':n,'path':p,'default_branch':b} for n,p,b in entries]}
    if not apply: return result
    with sqlite3.connect(database,timeout=20) as connection:
        backup_dir = database.parent / 'backups' / ('saas-' + dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
        backup_dir.mkdir(mode=0o700,parents=True)
        with sqlite3.connect(backup_dir / 'data.db') as backup: connection.backup(backup)
        os.chmod(backup_dir / 'data.db',0o600)
        connection.execute('PRAGMA foreign_keys=ON')
        connection.execute('BEGIN IMMEDIATE')
        for name,path,branch in entries:
            existing=connection.execute('SELECT id FROM projects WHERE main_repo_path=?',(path,)).fetchone()
            if not existing:
                identity=str(uuid.uuid5(NAMESPACE,'project:'+name))
                connection.execute('INSERT INTO projects(id,name,main_repo_path,default_branch,container_kind) VALUES(?,?,?,?,?)',
                    (identity,'Chronokairo '+name,path,branch,'repository'))
            else:
                connection.execute('UPDATE projects SET default_branch=? WHERE id=?',(branch,existing[0]))
            connection.execute('UPDATE projects SET github_owner=NULL,github_repo=NULL,provider_pr_binding_revision=provider_pr_binding_revision+1 WHERE main_repo_path=? AND (github_owner IS NOT NULL OR github_repo IS NOT NULL)',(path,))
        if connection.execute('PRAGMA integrity_check').fetchone()[0] != 'ok' or connection.execute('PRAGMA foreign_key_check').fetchall():
            raise RuntimeError('Database integrity failed')
        result['backup']=str(backup_dir)
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--apply',action='store_true')
    print(json.dumps(register(parser.parse_args().apply),ensure_ascii=False,indent=2))

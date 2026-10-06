#!/usr/bin/env python3
"""Scoped prompt/profile upgrade. Preserve schedules, models, providers and history."""
import argparse
import datetime as dt
import json
from pathlib import Path
import sqlite3
import configure
import company

ROOT=Path(__file__).resolve().parent
HOME=Path.home()/'.copilot'
MARKER='\n<!-- reliability-contract-v1 -->\n'

def install(apply=False):
    registry=json.loads((ROOT/'registry.json').read_text())
    profiles={p['id']:p for p in registry['agents']}
    c=sqlite3.connect(HOME/'data.db',timeout=20);c.row_factory=sqlite3.Row
    before=[]
    try:
        updates=[]
        for route in registry['routes']:
            row=c.execute('select id,prompt from workflows where id=?',[configure.ident('workflow:'+route['key'])]).fetchone()
            if not row:raise ValueError('Missing installed workflow '+route['key'])
            for worker in route['workers']:
                provider,model=profiles[worker]['model_selection_id'].split('/',1)
                if not c.execute('select 1 from provider_models where provider_id=? and model_id=?',[provider,model]).fetchone():raise ValueError('Unregistered worker model '+worker)
            # Retain other sessions' contracts and customization, replace only our block.
            prompt=row['prompt'].split(MARKER)[0]+MARKER+configure.execution_contract([w.removeprefix('ck-') for w in route['workers']])
            if route['key']=='night-discovery':prompt+='\nPrioridade atual: pedidos de fornecedor, indicações e problemas documentados. Vaga full-time isolada sem abertura a fornecedor não deve consumir a cota noturna.\n'
            updates.append((prompt,row['id']))
        if not apply:return {'preview':True,'workflow_prompts':len(updates),'preserved':'models, schedules, provider credentials, run history'}
        backup=HOME/'backups'/('reliability-'+dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'));backup.mkdir(parents=True,mode=0o700)
        with sqlite3.connect(backup/'data.db') as saved:c.backup(saved)
        (backup/'data.db').chmod(0o600)
        c.execute('BEGIN IMMEDIATE')
        # Current profile model/preferences remain untouched; refresh only the two text contracts.
        replacements=[('Prefira sinais verificáveis: vagas para automação/integração/desenvolvedor, crescimento recente, processo manual documentado no site, stack legado.',
                       'Priorize solicitações explícitas de fornecedor, indicações, projetos freelance e processos manuais documentados; vagas full-time isoladas são employment_only, não prova de compra de consultoria.'),
                      ('endereço físico quando legal_basis exigir.',
                       'endereço físico somente quando fonte normativa aplicável ao país/canal fundamentar a exigência. Link de agenda é opcional; uma pergunta de interesse basta. Não atribua regras genéricas à LGPD e não bloqueie a preparação do rascunho por pressupostos. Nunca envie sem autorização.')]
        for origin in [HOME/'agents',ROOT.parent/'agents']:
            for name in ['ck-lead-discovery','ck-sdr']:
                path=origin/(name+'.agent.md');old=path.read_text();new=old
                for a,b in replacements:new=new.replace(a,b)
                if new!=old:
                    before.append((path,old));company.atomic(backup/(('live-' if origin==HOME/'agents' else 'source-')+path.name),old);company.atomic(path,new)
        for prompt,wid in updates:c.execute("update workflows set prompt=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') where id=?",[prompt,wid])
        if c.execute('pragma integrity_check').fetchone()[0]!='ok' or c.execute('pragma foreign_key_check').fetchall():raise ValueError('Database integrity failed')
        if any(c.execute('select prompt from workflows where id=?',[wid]).fetchone()[0]!=prompt for prompt,wid in updates):raise ValueError('Prompt readback failed')
        c.commit()
        return {'updated_workflows':len(updates),'updated_profile_files':len(before),'backup':str(backup),'integrity':'ok'}
    except BaseException:
        c.rollback()
        for path,old in before:company.atomic(path,old)
        raise
    finally:c.close()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');args=p.parse_args()
    print(json.dumps(install(args.apply),ensure_ascii=False))

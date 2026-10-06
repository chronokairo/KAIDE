#!/usr/bin/env python3
"""Upgrade commercial profiles/routes only; never reconfigure model providers."""
import datetime as dt
import json
import os
from pathlib import Path
import sqlite3
import configure
import sales_profiles

ROOT=Path(__file__).resolve().parent
HOME=Path.home()/'.copilot'
def install():
    c=sqlite3.connect(HOME/'data.db',timeout=20);c.row_factory=sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    providers=c.execute("SELECT id FROM model_providers WHERE name='Nvidia'").fetchall()
    if len(providers)!=1:raise ValueError('Expected existing Nvidia provider')
    provider=providers[0]['id']
    models={r[0] for r in c.execute('SELECT model_id FROM provider_models WHERE provider_id=?',[provider])}
    profiles=[p for p in configure.build(provider) if p['domain']=='revenue']
    if not all(p['model'] in models for p in profiles):raise ValueError('Unregistered commercial model')
    stamp=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup=HOME/'backups'/('sales-'+stamp);backup.mkdir(parents=True,exist_ok=False)
    with sqlite3.connect(backup/'data.db') as b:c.backup(b)
    os.chmod(backup/'data.db',0o600)
    registry_path=ROOT/'registry.json';registry=json.loads(registry_path.read_text())
    (backup/'registry.json').write_bytes(registry_path.read_bytes());os.chmod(backup/'registry.json',0o600)
    before=[]
    try:
        c.execute('BEGIN IMMEDIATE')
        for key in ['lead-pipeline','proposal','new-business','company-cycle','daily-report']:
            row=c.execute('SELECT prompt FROM workflows WHERE id=?',[configure.ident('workflow:'+key)]).fetchone()
            if not row:raise ValueError('Missing installed route '+key)
            prompt=row['prompt'].split('\n<!-- sales-contract-v1 -->')[0]
            if key=='lead-pipeline':prompt=prompt.replace('ck-lead-discovery → ck-lead-enrichment → ck-qualification.','ck-lead-discovery → ck-lead-enrichment → ck-qualification → ck-sdr → ck-pipeline-auditor.')
            if key=='proposal':prompt=prompt.replace('ck-proposal → ck-followup.','ck-proposal → ck-followup → ck-pipeline-auditor.')
            prompt+='\n<!-- sales-contract-v1 -->'+sales_profiles.route_instruction(key)
            c.execute("UPDATE workflows SET prompt=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",[prompt,configure.ident('workflow:'+key)])
        if c.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise ValueError('Integrity failure')
        if c.execute('PRAGMA foreign_key_check').fetchall():raise ValueError('Foreign key failure')
        for p in profiles:
            for dest in [HOME/'agents'/(p['id']+'.agent.md'),ROOT.parent/'agents'/(p['id']+'.agent.md')]:
                dest.parent.mkdir(parents=True,exist_ok=True)
                old=dest.read_bytes() if dest.exists() else None;before.append((dest,old))
                if old is not None:
                    saved=backup/(('live-' if dest.parent==HOME/'agents' else 'source-')+dest.name);saved.write_bytes(old);os.chmod(saved,0o600)
                temp=dest.with_suffix('.tmp');temp.write_text(p['content']);os.chmod(temp,0o600);temp.replace(dest)
        ids={p['id'] for p in profiles}
        registry['agents']=[p for p in registry['agents'] if p['id'] not in ids]+[dict({k:v for k,v in p.items() if k!='content'},model_selection_id=provider+'/'+p['model']) for p in profiles]
        for route in registry['routes']:
            flow=next((f for f in configure.FLOWS if f[0]==route['key']),None)
            if flow and route['key'] in {'lead-pipeline','proposal'}:route['workers']=['ck-'+s for s in flow[3]]
        registry['commercial']={'playbook':'sales-playbook.md','configuration':'sales-config.json','ledger':'sales.db','outbound_enabled':False}
        temp=registry_path.with_suffix('.tmp');temp.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n');temp.replace(registry_path)
        c.commit()
    except BaseException:
        c.rollback();registry_path.write_bytes((backup/'registry.json').read_bytes())
        for dest,old in reversed(before):
            if old is None:dest.unlink(missing_ok=True)
            else:dest.write_bytes(old)
        raise
    finally:c.close()
    return {'commercial_profiles':len(profiles),'all_agents':len(registry['agents']),'routes_updated':5,'backup':str(backup),'outbound_enabled':False}
if __name__=='__main__':print(json.dumps(install(),ensure_ascii=False))

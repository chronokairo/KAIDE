#!/usr/bin/env python3
"""Upgrade commercial profiles/routes only; never reconfigure model providers."""
import datetime as dt
import json
import os
from pathlib import Path
import sqlite3
import configure
import sales_profiles
import night_sales

ROOT=Path(__file__).resolve().parent
HOME=Path.home()/'.copilot'
NEW_ROUTES={'demand-pipeline','replies','referrals'}|night_sales.KEYS
def install(night_only=False):
    c=sqlite3.connect(HOME/'data.db',timeout=20);c.row_factory=sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    providers=c.execute("SELECT id FROM model_providers WHERE name='Nvidia'").fetchall()
    if len(providers)!=1:raise ValueError('Expected existing Nvidia provider')
    provider=providers[0]['id']
    models={r[0] for r in c.execute('SELECT model_id FROM provider_models WHERE provider_id=?',[provider])}
    profiles=[p for p in configure.build(provider) if p['domain']=='revenue' or p['id'] in {'ck-orchestrator','ck-control-auditor'}]
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
        for key in ([] if night_only else ['lead-pipeline','proposal','new-business','company-cycle','daily-report']):
            row=c.execute('SELECT prompt FROM workflows WHERE id=?',[configure.ident('workflow:'+key)]).fetchone()
            if not row:raise ValueError('Missing installed route '+key)
            prompt=row['prompt'].split('\n<!-- sales-contract-v1 -->')[0]
            if key=='lead-pipeline':prompt=prompt.replace('ck-lead-discovery → ck-lead-enrichment → ck-qualification.','ck-lead-discovery → ck-lead-enrichment → ck-qualification → ck-sdr → ck-pipeline-auditor.')
            if key=='proposal':prompt=prompt.replace('ck-proposal → ck-followup.','ck-proposal → ck-followup → ck-pipeline-auditor.')
            prompt+='\n<!-- sales-contract-v1 -->'+sales_profiles.route_instruction(key)
            c.execute("UPDATE workflows SET prompt=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",[prompt,configure.ident('workflow:'+key)])
        base=c.execute('SELECT project_id,model FROM workflows WHERE id=?',[configure.ident('workflow:lead-pipeline')]).fetchone()
        created=[]
        for key,name,domain,steps,interval,hour,day,project in configure.FLOWS:
            if key not in (night_sales.KEYS if night_only else NEW_ROUTES):continue
            prompt,root_agent=configure.route_prompt(key,domain,steps,project)
            minute=configure.MINUTES.get(key,0)
            row=dict(id=configure.ident('workflow:'+key),name=name,prompt=prompt,model=base['model'],project_id=base['project_id'],interval=interval,schedule_hour=hour,schedule_day=day,
                     enabled=1,mode='autopilot',schedule_minute=minute,workspace_type='worktree',next_run_at=configure.next_run(interval,hour,day,minute),agent=root_agent,agent_scope='global')
            if c.execute('SELECT 1 FROM workflows WHERE id=?',[row['id']]).fetchone():
                c.execute('UPDATE workflows SET '+','.join(k+'=?' for k in row if k!='id')+",updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",[v for k,v in row.items() if k!='id']+[row['id']])
            else:
                c.execute('INSERT INTO workflows('+','.join(row)+') VALUES('+','.join('?' for _ in row)+')',list(row.values()));created.append(key)
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
        known={r['key'] for r in registry['routes']}
        for f in configure.FLOWS:
            if f[0] in (night_sales.KEYS if night_only else NEW_ROUTES) and f[0] not in known:
                registry['routes'].append(dict(key=f[0],name=f[1],domain=f[2],workers=['ck-'+w for w in f[3]],interval=f[4],hour=f[5],minute=configure.MINUTES.get(f[0],0),weekday=f[6],project=f[7]))
        registry.setdefault('commercial',{}).update({'playbook':'sales-playbook.md','configuration':'sales-config.json','ledger':'sales.db','outbound_enabled':False,
          'night_validation':'night-sales-validation.md','night_routes':sorted(night_sales.KEYS)})
        temp=registry_path.with_suffix('.tmp');temp.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n');temp.replace(registry_path)
        c.commit()
    except BaseException:
        c.rollback();registry_path.write_bytes((backup/'registry.json').read_bytes())
        for dest,old in reversed(before):
            if old is None:dest.unlink(missing_ok=True)
            else:dest.write_bytes(old)
        raise
    finally:c.close()
    return {'commercial_profiles':len(profiles),'all_agents':len(registry['agents']),'routes_created':created,'backup':str(backup),'outbound_enabled':False,'night_only':night_only}
if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--night-only',action='store_true');args=parser.parse_args()
    print(json.dumps(install(night_only=args.night_only),ensure_ascii=False))

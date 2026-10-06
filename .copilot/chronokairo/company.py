#!/usr/bin/env python3
"""Typed company utilities: scoped inventory, private project creation and Desktop reports."""
import argparse
from contextlib import closing
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import uuid
import sqlite3
import subprocess
import time
from urllib.parse import quote
from zoneinfo import ZoneInfo

BASE = Path.home()/'.copilot/chronokairo'
DESKTOP = Path.home()/'Desktop/Chronokairo'
ZONE = ZoneInfo('America/Caracas')

def safe_id(value):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,119}',value) or '..' in value:
        raise ValueError('Use an alphanumeric ID without path separators or ..')
    return value

def scoped(value):
    if not re.fullmatch(r'chronokairo/[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*',value) or any(x in ['.','..'] for x in value.split('/')):
        raise ValueError('Project must be inside the chronokairo namespace')
    return value

def redact(text):
    text=re.sub(r'(?i)(bearer\s+)[\w.=-]+',r'\1[REDACTED]',text)
    text=re.sub(r'\b(?:gh[pousr]_|glpat-|nvapi-|sk-)[A-Za-z0-9_-]{8,}', '[REDACTED]',text)
    text=re.sub(r'(?i)((?:api[_-]?key|access[_-]?token|token|password|secret)\s*[:=]\s*)[^\s,;]+',r'\1[REDACTED]',text)
    return text[:12000]

def atomic(path, content):
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_name(path.name+'.'+str(os.getpid())+'.tmp')
    temp.write_text(content);temp.chmod(0o600);temp.replace(path)

def api(forge, endpoint, fields=None, absent_ok=False):
    cmd=['gh' if forge=='github' else 'glab','api',endpoint]
    if forge=='github':cmd+=['--hostname','github.com']
    else:cmd+=['--hostname','gitlab.com']
    if fields:
        cmd+=['--method','POST']
        for key,value in fields.items():
            cmd+=['--field' if isinstance(value,(int,bool)) else '--raw-field',
                  key+'='+('true' if value is True else 'false' if value is False else str(value))]
    result=subprocess.run(cmd,capture_output=True,text=True,timeout=45)
    if result.returncode:
        if absent_ok and '404' in result.stderr+result.stdout:return None
        raise RuntimeError(f'{forge} API failed: '+redact(result.stderr[:800]))
    return json.loads(result.stdout)

def inventory():
    rows=[]
    for forge in ['github','gitlab']:
        for page in range(1,101):
            endpoint=(f'orgs/chronokairo/repos?per_page=100&page={page}' if forge=='github'
                      else f'groups/chronokairo/projects?include_subgroups=true&per_page=100&page={page}')
            data=api(forge,endpoint)
            for p in data:
                namespace=p['full_name'] if forge=='github' else p['path_with_namespace']
                scoped(namespace)
                rows.append({'forge':forge,'namespace':namespace,'url':p['html_url'] if forge=='github' else p['web_url'],
                             'default_branch':p.get('default_branch'),'archived':p.get('archived',False),
                             'private':p.get('private',p.get('visibility')=='private'),'id':p['id']})
            if len(data)<100:break
        else:raise RuntimeError('Inventory pagination limit reached')
    result={'updated_at':dt.datetime.now(dt.timezone.utc).isoformat(),'repositories':rows}
    atomic(BASE/'repositories.json',json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    return {'github':sum(r['forge']=='github' for r in rows),'gitlab':sum(r['forge']=='gitlab' for r in rows)}

def create_project(args):
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{1,62}',args.slug):raise ValueError('Use a lowercase slug of 2–63 characters')
    if len(args.business_case.strip())<30:raise ValueError('Provide a concrete business case with at least 30 characters')
    ns=scoped('chronokairo/'+args.slug)
    results=[]
    for forge in (['github','gitlab'] if args.forge=='both' else [args.forge]):
        endpoint='repos/'+ns if forge=='github' else 'projects/'+quote(ns,safe='')
        current=api(forge,endpoint,absent_ok=True)
        if current:
            results.append({'forge':forge,'namespace':ns,'created':False})
            continue
        description=redact(args.business_case).replace('\n',' ')[:250]
        if forge=='github':
            created=api(forge,'orgs/chronokairo/repos',{'name':args.slug,'description':description,'private':True,'auto_init':True})
            assert created['full_name'].lower()==ns
        else:
            group=api(forge,'groups/chronokairo')
            assert group['full_path']=='chronokairo'
            created=api(forge,'projects',{'namespace_id':group['id'],'name':args.slug,'path':args.slug,'description':description,'visibility':'private','initialize_with_readme':True})
            assert created['path_with_namespace']==ns
        results.append({'forge':forge,'namespace':ns,'created':True})
    report('ck-project-bootstrap',safe_id(args.job),'daily',f'Projeto {ns}: '+json.dumps(results,ensure_ascii=False)+'\nCaso de negócio: '+args.business_case,event_id='project-'+args.job)
    inventory()
    return results

def clone(args):
    ns=scoped(args.project)
    current=api(args.forge,'repos/'+ns if args.forge=='github' else 'projects/'+quote(ns,safe=''))
    if current.get('archived'):raise ValueError('Archived projects are excluded from autonomous work')
    base=Path.home()/'Documents/Chronokairo/repos'
    dest=base/(args.forge+'--'+ns.replace('/','--'))
    base.mkdir(parents=True,exist_ok=True)
    if not dest.exists():
        url=f'https://{"github.com" if args.forge=="github" else "gitlab.com"}/{ns}.git'
        subprocess.run(['git','clone','--',url,str(dest)],check=True,timeout=120)
    result=subprocess.run(['git','-C',str(dest),'remote','get-url','origin'],capture_output=True,text=True,check=True)
    origin=result.stdout.strip().removesuffix('.git')
    expected=f'https://{"github.com" if args.forge=="github" else "gitlab.com"}/{ns}'
    if origin!=expected:raise ValueError('Existing clone origin does not match the requested company project')
    return {'path':str(dest),'namespace':ns,'forge':args.forge}

def report(agent,job,kind,message,event_id=None):
    safe_id(agent);safe_id(job)
    BASE.mkdir(parents=True,exist_ok=True);DESKTOP.mkdir(parents=True,exist_ok=True)
    now=dt.datetime.now(ZONE)
    eid=event_id or hashlib.sha256((agent+'\0'+job+'\0'+kind+'\0'+message).encode()).hexdigest()
    with (BASE/'report.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        c=sqlite3.connect(BASE/'reporting.db')
        c.execute('create table if not exists reports(id text primary key,day text,created text,agent text,job text,kind text,message text,resolved integer default 0)')
        with c:
            c.execute('insert or ignore into reports(id,day,created,agent,job,kind,message) values(?,?,?,?,?,?,?)',
                      (eid,now.date().isoformat(),now.isoformat(timespec='seconds'),agent,job,kind,redact(message)))
        entries=c.execute('select id,created,agent,job,kind,message from reports where day=? order by created',(now.date().isoformat(),)).fetchall()
        daily='# Chronokairo — '+now.date().isoformat()+'\n\nHorário: America/Caracas. Somente atividades efetivamente reportadas; não é uma estimativa de receita.\n'
        for _,created,a,j,k,m in entries:daily+=f'\n## {created[11:19]} — {a} — {k}\n\nJob: `{j}`\n\n{m}\n'
        atomic(DESKTOP/('Relatorio-'+now.date().isoformat()+'.md'),daily)
        pending=c.execute("select id,created,agent,job,message from reports where kind='blocker' and resolved=0 order by created").fetchall()
        body='# Chronokairo — pendências para o dono\n\n'+('Nenhuma pendência registrada.\n' if not pending else 'Pendências registradas abaixo. Ausência de resposta não autoriza execução.\n')
        for pending_id,created,a,j,m in pending:body+=f'\n## {a} — {created}\n\nID: `{pending_id}` · Job: `{j}`\n\n{m}\n'
        atomic(DESKTOP/'PENDENCIAS.md',body)
        c.close()
        (BASE/'reporting.db').chmod(0o600)
    atomic(BASE/'jobs'/job/'report.json',json.dumps({'agent':agent,'job':job,'kind':kind,'message':redact(message),'at':now.isoformat()},ensure_ascii=False,indent=2)+'\n')
    return {'document':str(DESKTOP/'PENDENCIAS.md' if kind=='blocker' else DESKTOP/('Relatorio-'+now.date().isoformat()+'.md')),'event_id':eid}

def resolve_report(event_id, reason, evidence):
    if not reason.strip() or not Path(evidence).is_file():
        raise ValueError('Resolution requires a reason and an existing evidence file')
    with (BASE/'report.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        with sqlite3.connect(BASE/'reporting.db') as c:
            columns={r[1] for r in c.execute('pragma table_info(reports)')}
            if 'resolution' not in columns:c.execute('alter table reports add column resolution text')
            if 'resolved_at' not in columns:c.execute('alter table reports add column resolved_at text')
            row=c.execute('select kind,resolved from reports where id=?',(event_id,)).fetchone()
            if not row or row[0]!='blocker':raise ValueError('Only an existing blocker can be resolved')
            if not row[1]:
                c.execute('update reports set resolved=1,resolution=?,resolved_at=? where id=?',
                          (redact(reason)+'\nEvidence: '+str(Path(evidence).resolve()),dt.datetime.now(ZONE).isoformat(timespec='seconds'),event_id))
    return {'event_id':event_id,'resolved':True}

def claim(args,release=False):
    project=scoped(args.project);job=safe_id(args.job)
    folder=BASE/'locks';folder.mkdir(parents=True,exist_ok=True)
    path=folder/(hashlib.sha256(project.lower().encode()).hexdigest()+'.json')
    with path.open('a+') as f:
        fcntl.flock(f,fcntl.LOCK_EX);f.seek(0)
        old=json.loads(f.read() or '{}')
        if release:
            if old.get('job') not in [None,job]:raise RuntimeError('Lock belongs to another job')
            data={}
        else:
            if old.get('expires',0)>time.time() and old.get('job')!=job:raise RuntimeError('Project already claimed by '+old['job'])
            data={'project':project,'job':job,'expires':time.time()+7200}
        f.seek(0);f.truncate();json.dump(data,f);f.flush();os.fsync(f.fileno())
    return {'project':project,'job':job,'released':release}

def runtime_binding(route, run_id=None):
    """Resolve the app's immutable start time, never a worker supplied timestamp."""
    db=Path.home()/'.copilot/data.db'
    if not db.exists():
        if run_id:raise ValueError('Runtime database unavailable')
        return None
    workflow=str(uuid.uuid5(uuid.UUID('37a4dbb0-8ebc-4733-9391-e3fb5e4457a8'),'workflow:'+route))
    with closing(sqlite3.connect('file:'+str(db)+'?mode=ro',uri=True)) as c:
        rows=c.execute("select id,started_at,status,session_id from workflow_runs where task_id=? and "+('id=?' if run_id else "status='running'"),[workflow,run_id] if run_id else [workflow]).fetchall()
    if len(rows)>1:raise ValueError('Ambiguous runtime; provide --workflow-run')
    if not rows:
        if run_id:raise ValueError('Workflow run does not belong to route')
        return None
    rid,started,status,sid=rows[0]
    if not started:raise ValueError('Runtime start unavailable')
    return {'workflow_run_id':rid,'session_id':sid,'deadline_epoch':dt.datetime.fromisoformat(started.replace('Z','+00:00')).timestamp()+900,'runtime_status':status}

def verify_worker_model(state,worker):
    """Accept runtime evidence, never an agent's assertion about its own model."""
    sid=state.get('session_id')
    if not sid:raise ValueError('Worker acceptance requires runtime session evidence')
    safe_id(sid)
    registry=json.loads((BASE/'registry.json').read_text())
    profile=next(p for p in registry['agents'] if p['id']==worker)
    expected=profile['model_selection_id']
    observed=[];failed=[]
    path=Path.home()/'.copilot/session-state'/sid/'events.jsonl'
    for line in path.read_text().splitlines():
        try:event=json.loads(line)
        except ValueError:continue
        data=event.get('data',{})
        if data.get('agentName',data.get('agentType'))!=worker:continue
        if event.get('type')=='subagent.failed':failed.append(str(data).lower())
        if event.get('type')=='subagent.completed':observed.append(data.get('model'))
    if not observed:raise ValueError('No completed worker runtime evidence: '+worker)
    actual=observed[-1]
    fallback=expected.split('/')[0]+'/z-ai/glm-5.3'
    allowed_fallback=actual==fallback and any('timeout' in e or '504' in e for e in failed) and not any('429' in e or 'credential' in e for e in failed)
    if actual!=expected and not allowed_fallback:raise ValueError('Worker model mismatch: '+worker+' expected '+expected+' observed '+str(actual))
    return {'requested_model':expected,'observed_model':actual,'fallback':actual!=expected}


def node_executable():
    config=json.loads((BASE/'backends.json').read_text())
    search=config.get('path_prefix','')+os.pathsep+os.environ.get('PATH','')
    node=shutil.which('node',path=search)
    if not node:raise OSError('Node unavailable in configured backend PATH')
    return node

def stop_run(run,sid):
    safe_id(sid)
    result=subprocess.run([node_executable(),str(BASE/'abort_workflow_session.mjs'),sid],timeout=10,capture_output=True,text=True)
    # A successful RPC is insufficient: check the actual workflow status.
    if not stopped(run):raise ValueError('Run still running after abort (exit '+str(result.returncode)+')')


def job(args):
    safe_id(args.job)
    routes=json.loads((BASE/'registry.json').read_text())['routes']
    route=next((r for r in routes if r['key']==args.route),None)
    if not route: raise ValueError('Unknown route')
    path=BASE/'jobs'/args.job/'control.json'
    path.parent.mkdir(parents=True,exist_ok=True)
    with (path.parent/'control.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        now=time.time()
        state=json.loads(path.read_text()) if path.exists() else {'job_id':args.job,'route':args.route,'started_epoch':now,'steps':{},'status':'running'}
        if state['route']!=args.route: raise ValueError('Job belongs to a different route')
        if state['status']=='completed': raise ValueError('Completed job cannot be rerun')
        binding=runtime_binding(args.route,state.get('workflow_run_id') or getattr(args,'workflow_run',None))
        if binding:state.update(binding)
        state['deadline_epoch']=min(state.get('deadline_epoch',state['started_epoch']+900),state['started_epoch']+900)
        if now>=state['deadline_epoch'] or (binding and binding['runtime_status']!='running'):
            state['status']='blocked';state['deadline_exceeded']=now>=state['deadline_epoch']
            state['heartbeat_epoch']=now
            atomic(path,json.dumps(state,ensure_ascii=False,indent=2)+'\n')
            if args.status in {'running','completed'}:raise ValueError('Workflow deadline exceeded or runtime stopped; resume only in a new scheduled run')
        if not state['steps'] and args.status=='running' and args.route=='night-drafts':
            import night_sales
            gate=night_sales.preflight(args.route)
            state['input_gate']=gate
            if gate['status']!='ready':
                state['status']='blocked' if gate['status']=='blocked' else 'completed'
                state['no_work']=gate['status']=='empty';state['heartbeat_epoch']=now
                evidence=path.parent/'input-gate.json';atomic(evidence,json.dumps(gate,ensure_ascii=False,indent=2)+'\n')
                state['evidence']=str(evidence)
                atomic(path,json.dumps(state,ensure_ascii=False,indent=2)+'\n')
                return state
        if args.step:
            if args.step not in route['workers']: raise ValueError('Worker is outside route')
            previous=route['workers'][:route['workers'].index(args.step)]
            if any(state['steps'].get(p,{}).get('status')!='completed' for p in previous): raise ValueError('Previous stages must be accepted first')
        if args.status=='completed':
            if not args.accepted or not args.evidence or not Path(args.evidence).is_file(): raise ValueError('Completion requires verified acceptance and an existing evidence file')
            if not args.step and any(state['steps'].get(p,{}).get('status')!='completed' for p in route['workers']): raise ValueError('All stages must complete before the job')
        model_evidence={}
        if args.status=='completed' and args.step and state.get('workflow_run_id'):
            acp_job=getattr(args,'acp_job',None)
            if acp_job:
                safe_id(acp_job)
                proof=json.loads((BASE/'jobs'/acp_job/'acp-result.json').read_text())
                profile=next(p for p in json.loads((BASE/'registry.json').read_text())['agents'] if p['id']==args.step)
                if proof.get('worker_id')!=args.step or proof.get('parent_job')!=args.job or proof.get('workflow_run_id')!=state['workflow_run_id'] or proof.get('result',{}).get('stopReason')!='end_turn':raise ValueError('ACP evidence does not belong to this completed step')
                if not set(proof.get('allowed_tools',[]))<=set(profile['tools']):raise ValueError('ACP tools exceed worker permissions')
                model_evidence={'backend':proof['engine'],'acp_job':acp_job,'observed_model':'unknown; external backend','coordinator_accepted':True}
            else:model_evidence=verify_worker_model(state,args.step)
        entry={'status':args.status,'heartbeat_epoch':now,'result':redact(args.result or ''),'evidence':args.evidence,'accepted':bool(args.accepted)}
        entry.update(model_evidence)
        if args.step:state['steps'][args.step]=entry
        else:state['status']=args.status
        state['heartbeat_epoch']=now
        atomic(path,json.dumps(state,ensure_ascii=False,indent=2)+'\n')
    return state

def stopped(run,attempts=15):
    for _ in range(attempts):
        with sqlite3.connect('file:'+str(Path.home()/'.copilot/data.db')+'?mode=ro',uri=True) as c:
            row=c.execute('select status from workflow_runs where id=?',(run,)).fetchone()
        if not row or row[0]!='running':return True
        time.sleep(1)
    return False

def reconcile_controls(now=None):
    """Marca como blocked jobs controlados sem heartbeat após o deadline, preservando etapas e evidências."""
    now=now or time.time();changed=[]
    for path in (BASE/'jobs').glob('*/control.json'):
        with (path.parent/'control.lock').open('a') as lock:
            fcntl.flock(lock,fcntl.LOCK_EX)
            try:state=json.loads(path.read_text())
            except (ValueError,OSError):continue
            if state.get('status')!='running' or now-state.get('heartbeat_epoch',0)<900 or now-state.get('started_epoch',0)<900:continue
            for step in state['steps'].values():
                if step.get('status')=='running':step['status']='blocked';step['result']=(step.get('result') or '')+' [reconciliado: sem heartbeat após deadline]'
            state['status']='blocked';state['reconciled_epoch']=now
            atomic(path,json.dumps(state,ensure_ascii=False,indent=2)+'\n')
            changed.append(state['job_id'])
    return changed

def watchdog(stop_overdue=False):
    c=sqlite3.connect('file:'+str(Path.home()/'.copilot/data.db')+'?mode=ro',uri=True)
    rows=c.execute("select r.id,w.name,r.error_message,r.started_at from workflow_runs r join workflows w on w.id=r.task_id where w.agent like 'ck-%' and r.status='failed'").fetchall()
    for run,name,error,started in rows:
        report('ck-control-auditor','failed-'+safe_id(run),'blocker',
               f'Automação falhou: {name}\nInício: {started}\nErro informado pelo app: {redact(error or "sem detalhe")}\nPróximo passo: conferir modelo NVIDIA, sessão e logs do app; corrigir a causa e repetir a execução. Nenhum resultado de negócio foi presumido.',event_id='failed-'+run)
    for run,name,sid in c.execute("select r.id,w.name,r.session_id from workflow_runs r join workflows w on w.id=r.task_id where w.agent like 'ck-%' and r.status='running' and r.session_id is not null"):
        started=c.execute('select started_at from workflow_runs where id=?',(run,)).fetchone()[0]
        if started and (dt.datetime.now(dt.timezone.utc)-dt.datetime.fromisoformat(started.replace('Z','+00:00'))).total_seconds()>900:
            report('ck-control-auditor','deadline-'+safe_id(run),'blocker',
                   f'Limite de 15 minutos excedido: {name}. A sessão ainda está running no app. Verifique evidências e finalize/retome somente a etapa pendente. O watchdog solicita interrupção quando --stop-overdue está ativo; não presume conclusão do trabalho.',event_id='deadline-'+run)
            if stop_overdue:
                try:
                    stop_run(run,sid)
                    report('ck-control-auditor','stop-'+safe_id(run),'daily',f'Interrupção solicitada ao aplicativo para {name}: limite de 15 minutos excedido. Evidências preservadas. Conferir status final no runtime; não foi presumida conclusão do trabalho.',event_id='stop-'+run)
                except (OSError,subprocess.SubprocessError,ValueError):
                    report('ck-control-auditor','stop-'+safe_id(run),'blocker',f'Não foi possível solicitar interrupção de {name}. Verifique o aplicativo e a sessão; não encerrar processos de outras rotinas.',event_id='stop-error-'+run)
        try:
            safe_id(sid)
            path=Path.home()/'.copilot/session-state'/sid/'events.jsonl'
            with path.open('rb') as f:
                size=path.stat().st_size
                if size>1000000:f.seek(size-1000000);f.readline()
                lines=f.read().decode(errors='replace').splitlines()
            failures=[]
            for line in lines:
                try:event=json.loads(line)
                except ValueError:continue
                if event.get('type') in ['session.error','subagent.failed']:
                    data=event.get('data',{})
                    failures.append({'model':data.get('model'),'error':redact(data.get('error') or data.get('message') or 'sem detalhe')})
            if failures:
                report('ck-control-auditor','runtime-'+safe_id(run),'blocker',
                       f'A execução {name} registrou falha de modelo ou subagente. A sessão pode ainda estar ativa; isto não significa que o job inteiro falhou.\n'
                       +json.dumps(failures[-3:],ensure_ascii=False,indent=2)+'\nPróximo passo: verificar o ID completo do modelo NVIDIA e repetir só a etapa afetada depois da correção. Não há resultado de negócio confirmado.',event_id='runtime-'+run)
        except (OSError,ValueError):pass
    now=dt.datetime.now(dt.timezone.utc)
    for wid,name,due in c.execute("select id,name,next_run_at from workflows where agent like 'ck-%' and enabled=1 and interval!='manual' and next_run_at is not null"):
        try:when=dt.datetime.fromisoformat(due.replace('Z','+00:00'))
        except ValueError:continue
        if (now-when).total_seconds()>1800:
            report('ck-control-auditor','overdue-'+safe_id(wid),'blocker',f'Agenda atrasada: {name}\nHorário previsto UTC: {due}\nO scheduler ainda não avançou a agenda após 30 minutos. Verifique se o Copilot App está aberto e o computador acordado.',event_id='overdue-'+wid+'-'+now.date().isoformat())
    c.close()
    return {'failed_runs_checked':len(rows),'reconciled_jobs':reconcile_controls()}

def metrics(app_db=None):
    database=Path(app_db) if app_db else Path.home()/'.copilot/data.db'
    c=sqlite3.connect('file:'+str(database)+'?mode=ro',uri=True)
    rows=c.execute("select r.status,r.started_at,r.completed_at from workflow_runs r join workflows w on w.id=r.task_id where w.agent like 'ck-%'").fetchall()
    c.close()
    durations=[];overdue=0;counts={}
    now=dt.datetime.now(dt.timezone.utc)
    for status,start,end in rows:
        counts[status]=counts.get(status,0)+1
        if not start:continue
        started=dt.datetime.fromisoformat(start.replace('Z','+00:00'))
        if end:durations.append(round((dt.datetime.fromisoformat(end.replace('Z','+00:00'))-started).total_seconds(),2))
        elif status=='running' and (now-started).total_seconds()>900:overdue+=1
    controls=[]
    for path in (BASE/'jobs').glob('*/control.json'):
        try:controls.append(json.loads(path.read_text()))
        except (ValueError,OSError):continue
    return {'scope':'all retained managed runs','runtime_status_counts':counts,'finished_run_seconds':durations,
            'running_over_15_minutes':overdue,'accepted_jobs':sum(x.get('status')=='completed' and not x.get('no_work') for x in controls),'empty_jobs':sum(bool(x.get('no_work')) for x in controls),
            'controlled_jobs':len(controls),'cost':'unknown','tokens':'unknown',
            'note':'Runtime completed is not business acceptance; historical jobs without control.json are excluded from accepted_jobs.'}

def main():
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='command',required=True)
    sub.add_parser('inventory');sub.add_parser('watchdog').add_argument('--stop-overdue',action='store_true')
    r=sub.add_parser('report');r.add_argument('--agent',required=True);r.add_argument('--job',required=True);r.add_argument('--kind',choices=['daily','blocker'],required=True);r.add_argument('--message',required=True)
    r=sub.add_parser('resolve-report');r.add_argument('--event-id',required=True);r.add_argument('--reason',required=True);r.add_argument('--evidence',required=True)
    j=sub.add_parser('job');j.add_argument('--job',required=True);j.add_argument('--route',required=True);j.add_argument('--step');j.add_argument('--status',choices=['running','completed','blocked','needs_approval'],required=True);j.add_argument('--evidence');j.add_argument('--accepted',action='store_true');j.add_argument('--result');j.add_argument('--workflow-run');j.add_argument('--acp-job')
    sub.add_parser('metrics')
    for name in ['claim','release']:
        q=sub.add_parser(name);q.add_argument('project');q.add_argument('--job',required=True)
    q=sub.add_parser('create-project');q.add_argument('slug');q.add_argument('--forge',choices=['github','gitlab','both'],default='both');q.add_argument('--business-case',required=True);q.add_argument('--job',required=True)
    q=sub.add_parser('clone');q.add_argument('project');q.add_argument('--forge',choices=['github','gitlab'],required=True)
    args=p.parse_args()
    try:
        if args.command=='inventory':result=inventory()
        elif args.command=='watchdog':result=watchdog(args.stop_overdue)
        elif args.command=='report':result=report(args.agent,args.job,args.kind,args.message)
        elif args.command=='resolve-report':result=resolve_report(args.event_id,args.reason,args.evidence)
        elif args.command=='create-project':result=create_project(args)
        elif args.command=='clone':result=clone(args)
        elif args.command=='job':result=job(args)
        elif args.command=='metrics':result=metrics()
        else:result=claim(args,args.command=='release')
        print(json.dumps(result,ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'error':redact(str(e))},ensure_ascii=False));raise SystemExit(2)

if __name__=='__main__':main()

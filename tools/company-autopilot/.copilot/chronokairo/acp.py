#!/usr/bin/env python3
"""Bounded stdio ACP delegation for Chronokairo worktrees."""
import argparse
import json
import os
from pathlib import Path
import queue
import re
import signal
import subprocess
import sys
import threading
import time
import uuid
import company

BASE=company.BASE

def permission_allowed(call, role, allowed_tools, cwd):
    """Authorize structured ACP requests; opaque requests fail closed."""
    kind = {'read': 'read', 'search': 'search', 'edit': 'edit', 'execute': 'execute'}.get(call.get('kind'))
    if kind not in allowed_tools or (role in ['reviewer', 'analyst'] and kind not in ['read', 'search']):
        return False
    locations = call.get('locations', [])
    if kind in ['read', 'edit'] and not locations:
        return False
    for location in locations:
        path = location.get('path')
        if not isinstance(path, str): return False
        target = (Path(cwd) / path).resolve()
        if not target.is_relative_to(Path(cwd).resolve()) or re.search(r'(?i)(?:^|/)(?:\.env(?:\..*)?|[^/]*(?:credential|secret|adminsdk)[^/]*)$', str(target)):
            return False
        if role == 'qa' and kind == 'edit' and not re.search(r'(?:^|/)(?:tests?|__tests__)/|\.(?:test|spec)\.', path):
            return False
    if kind == 'execute':
        # Shell is not a sandbox. Only explicit local verification commands are approved.
        import shlex
        raw = call.get('rawInput', {})
        command = raw.get('command') if isinstance(raw, dict) else None
        if not isinstance(command, str) or re.search(r'[;&|`\n<>]|\$\(', command): return False
        try: words = shlex.split(command)
        except ValueError: return False
        if words[:2] in [['npm', 'test'], ['npm', 'run']]:
            return words[:2] == ['npm', 'test'] or (len(words) >= 3 and words[2] in ['test', 'lint', 'typecheck', 'build'])
        return len(words) >= 2 and words[0] == 'git' and words[1] in ['status', 'diff', 'show', 'log'] and not any(w.startswith('--output') for w in words)
    return kind in ['read', 'search', 'edit']

def sanitize(value):
    if isinstance(value,dict):
        return {k:('[REDACTED]' if re.fullmatch(r'(?i)(?:access[_-]?token|refresh[_-]?token|auth[_-]?token|token|secret|password|api[_-]?key|authorization)',k) else sanitize(v)) for k,v in value.items()}
    if isinstance(value,list):return [sanitize(v) for v in value]
    return company.redact(value) if isinstance(value,str) else value

def namespace(cwd):
    r=subprocess.run(['git','-C',str(cwd),'remote','get-url','origin'],capture_output=True,text=True,check=True,timeout=10)
    origin=r.stdout.strip()
    match=re.fullmatch(r'(?:https://(?:github|gitlab)\.com/|git@(?:github|gitlab)\.com:)(chronokairo/[A-Za-z0-9_./-]+?)(?:\.git)?',origin)
    if not match:raise ValueError('ACP working directory must have a verified Chronokairo GitHub/GitLab origin')
    return company.scoped(match[1])

class Connection:
    def __init__(self,cmd,cwd,role='analyst',allowed_tools=None):
        self.cwd=Path(cwd).resolve();self.role=role;self.allowed_tools=set(allowed_tools or ['read','search'])
        self.permission_count=0;self.deadline=time.monotonic()+900
        env=dict(os.environ)
        config=json.loads((BASE/'backends.json').read_text())
        env['PATH']=config['path_prefix']+os.pathsep+env.get('PATH','')
        self.p=subprocess.Popen(cmd,cwd=cwd,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True,bufsize=1)
        self.incoming=queue.Queue();self.next_id=0;self.events=[];self.stderr=[]
        def read():
            for line in self.p.stdout:
                try:self.incoming.put(json.loads(line))
                except ValueError:pass
            self.incoming.put(None)
        def errors():
            for line in self.p.stderr:
                self.stderr.append(company.redact(line));self.stderr=self.stderr[-100:]
        self.reader=threading.Thread(target=read,daemon=True);self.error_reader=threading.Thread(target=errors,daemon=True)
        self.reader.start();self.error_reader.start()

    def write(self,message):
        self.p.stdin.write(json.dumps(message)+'\n');self.p.stdin.flush()

    def request(self,method,params,timeout=45):
        self.next_id+=1;rid=self.next_id
        self.write({'jsonrpc':'2.0','id':rid,'method':method,'params':params})
        end=min(time.monotonic()+timeout,self.deadline)
        while time.monotonic()<end:
            try:message=self.incoming.get(timeout=max(.1,end-time.monotonic()))
            except queue.Empty:raise TimeoutError(method+' timed out')
            if message is None:raise RuntimeError('ACP exited: '+''.join(self.stderr)[-1500:])
            if message.get('id')==rid and 'method' not in message:
                if 'error' in message:raise RuntimeError(str(message['error']))
                return message.get('result',{})
            if 'method' in message and 'id' in message:
                if message['method']=='session/request_permission':
                    p=message.get('params',{});self.permission_count+=1
                    allowed=self.permission_count<=12 and permission_allowed(p.get('toolCall',{}),self.role,self.allowed_tools,self.cwd)
                    kind='allow_once' if allowed else 'reject_once'
                    option=next((o for o in p.get('options',[]) if o.get('kind')==kind),None)
                    result={'outcome':{'outcome':'selected','optionId':option['optionId']}} if option else {'outcome':{'outcome':'cancelled'}}
                    self.write({'jsonrpc':'2.0','id':message['id'],'result':result})
                else:
                    self.write({'jsonrpc':'2.0','id':message['id'],'error':{'code':-32601,'message':'Host capability not enabled'}})
            else:
                self.events.append(message)
                if len(self.events)>5000:self.events=self.events[-5000:]
        raise TimeoutError(method+' timed out')

    def close(self):
        if self.p.poll() is None:
            os.killpg(self.p.pid,signal.SIGTERM)
            try:self.p.wait(timeout=5)
            except subprocess.TimeoutExpired:os.killpg(self.p.pid,signal.SIGKILL);self.p.wait()
        self.reader.join(timeout=1);self.error_reader.join(timeout=1)
        for stream in [self.p.stdin,self.p.stdout,self.p.stderr]:stream.close()

def initialize(conn):
    return conn.request('initialize',{'protocolVersion':1,'clientCapabilities':{'fs':{'readTextFile':False,'writeTextFile':False},'terminal':False},'clientInfo':{'name':'chronokairo','version':'1.0.0'}},timeout=45)

def run(args):
    company.safe_id(args.job)
    cwd=Path(args.cwd).resolve();project=namespace(cwd)
    task=json.loads(Path(args.task_file).read_text())
    for field in ['objective','scope','sources','acceptance','allowed_tools','parent_job','worker_id']:
        if not task.get(field):raise ValueError('Missing handoff field: '+field)
    control=BASE/'jobs'/task.get('parent_job',args.job)/'control.json'
    company.safe_id(task.get('parent_job',args.job))
    deadline=time.time()+900
    parent_state={}
    if control.exists():
        state=json.loads(control.read_text());parent_state=state
        if task.get('workflow_run_id') and task['workflow_run_id']!=state.get('workflow_run_id'):raise ValueError('Workflow run differs from parent')
        binding=company.runtime_binding(state['route'],state.get('workflow_run_id'))
        deadline=min(deadline,(binding or state).get('deadline_epoch',state['started_epoch']+900))
        if state.get('status')!='running' or (binding and binding['runtime_status']!='running'):raise ValueError('Parent job is not running')
    elif task.get('parent_job'):raise ValueError('Parent control file missing')
    # Persist standalone deadline too: retrying this job cannot reset its budget.
    budget_path=BASE/'jobs'/args.job/'acp-budget.json'
    if budget_path.exists():deadline=min(deadline,json.loads(budget_path.read_text())['deadline_epoch'])
    if deadline<=time.time():raise ValueError('ACP parent/session deadline exceeded')
    company.atomic(budget_path,json.dumps({'deadline_epoch':deadline}))
    config=json.loads((BASE/'backends.json').read_text());backend=config['engines'][args.engine]
    profile=next((p for p in json.loads((BASE/'registry.json').read_text())['agents'] if p['id']==task['worker_id']),None)
    if not profile or not isinstance(task['allowed_tools'],list) or not set(task['allowed_tools'])<=set(profile['tools']):raise ValueError('ACP worker or tools differ from registered profile')
    role=task.get('role','coder')
    if role not in ['coder','reviewer','qa','analyst']:raise ValueError('Unsupported role')
    class Lock:pass
    lock=Lock();lock.project=project;lock.job=args.job
    company.claim(lock)
    conn=None
    try:
        # Keep external changes out of the human's branch; review inputs belong in task.sources.
        wt=BASE/'acp-worktrees'/args.job
        if not wt.exists():
            wt.parent.mkdir(parents=True,exist_ok=True)
            subprocess.run(['git','-C',str(cwd),'worktree','add','-b','ck/'+args.job,str(wt),'HEAD'],check=True,capture_output=True,text=True,timeout=30)
        if namespace(wt)!=project:raise ValueError('Existing ACP worktree has a different origin')
        if not isinstance(task['allowed_tools'],list) or not set(task['allowed_tools']) <= {'read','search','edit','execute'}:
            raise ValueError('allowed_tools must be a list of read/search/edit/execute')
        started=time.monotonic();conn=Connection(backend['command'],wt,role,task['allowed_tools'])
        conn.deadline=min(conn.deadline,time.monotonic()+max(0,deadline-time.time()))
        info=initialize(conn)
        created=conn.request('session/new',{'cwd':str(wt),'mcpServers':[]})
        sid=created['sessionId']
        if role in ['reviewer','analyst']:
            modes=created.get('modes',{}).get('availableModes',[])
            preferred=next((m['id'] for m in modes if m['id'] in ['read-only','plan']),None)
            if preferred:conn.request('session/set_mode',{'sessionId':sid,'modeId':preferred})
        policy=json.loads((BASE/'registry.json').read_text())
        prompt=('Você recebeu uma delegação da Chronokairo via ACP. Respeite AGENTS.md, limite-se ao namespace '+project+'. '
                'Trabalhe só nesta worktree. Não altere main/master, faça merge/deploy, envie mensagens externas, gaste dinheiro, execute pagamentos, negocie ativos ou use mainnet. '
                'Não delegue novamente para outros agentes. Não amplie as ferramentas previstas no handoff. '
                'Se reviewer/analyst, somente leia e entregue achados. Se precisar do dono, descreva a dependência no resultado; o coordenador registrará no Desktop. '
                'Retorne arquivos alterados, testes reais, evidências, riscos, modelo e uso quando disponíveis. Critério de conclusão é o aceite abaixo. '
                'Não publique nada antes de o coordenador verificar o diff. Orçamento: 15 minutos e uma tentativa por backend.\n'+json.dumps(task,ensure_ascii=False))
        result=conn.request('session/prompt',{'sessionId':sid,'prompt':[{'type':'text','text':prompt}]},timeout=900)
        evidence={'engine':args.engine,'transport':backend['transport'],'project':project,'cwd':str(wt),
                  'worker_id':task.get('worker_id'),'parent_job':task.get('parent_job'),'workflow_run_id':parent_state.get('workflow_run_id'),'role':role,'allowed_tools':task['allowed_tools'],
                  'session_id':sid,'elapsed_seconds':round(time.monotonic()-started,2),'result':result,'agent_info':info.get('agentInfo'),
                  'permission_requests':conn.permission_count,
                  'events':sanitize(conn.events) if len(json.dumps(conn.events))<12000 else None}
        # Full events are separately redacted line by line to avoid cutting JSON in half.
        company.atomic(BASE/'jobs'/args.job/'acp-events.jsonl',''.join(json.dumps(sanitize(e),ensure_ascii=False)+'\n' for e in conn.events))
        company.atomic(BASE/'jobs'/args.job/'acp-result.json',json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
        if result.get('stopReason')!='end_turn':raise RuntimeError('ACP did not complete: '+str(result.get('stopReason')))
        company.report('ck-'+role,args.job,'daily',f'Delegação {args.engine} via {backend["transport"]} concluída. Projeto: {project}. Worktree: {wt}. Evidências: {BASE}/jobs/{args.job}/acp-result.json. O coordenador ainda precisa verificar diff e aceite; isto não comprova receita ou aprovação de produção.')
        return {k:v for k,v in evidence.items() if k!='events'}
    except Exception as e:
        company.report('ck-control-auditor',args.job,'blocker',f'Delegação {args.engine} bloqueada: {company.redact(str(e))}\nProjeto: {project}. Próximo passo: verificar autenticação/capacidade do runtime e retomar a etapa, sem repetir modelos arbitrários.')
        raise
    finally:
        if conn:conn.close()
        company.claim(lock,release=True)

def diagnose():
    config=json.loads((BASE/'backends.json').read_text());results={}
    for name,backend in config['engines'].items():
        conn=None
        try:
            conn=Connection(backend['command'],BASE)
            info=initialize(conn)
            results[name]={'status':'initialize_ok','transport':backend['transport'],'agent':info.get('agentInfo'),'protocol_version':info.get('protocolVersion')}
        except Exception as e:results[name]={'status':'blocked','error':company.redact(str(e))}
        finally:
            if conn:conn.close()
    company.atomic(BASE/'acp-diagnostics.json',json.dumps(results,ensure_ascii=False,indent=2)+'\n')
    return results

def main():
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='command',required=True);sub.add_parser('diagnose')
    q=sub.add_parser('run');q.add_argument('--engine',choices=['codex','claude','opencode','agy'],required=True);q.add_argument('--cwd',required=True);q.add_argument('--job',required=True);q.add_argument('--task-file',required=True)
    args=p.parse_args()
    try:print(json.dumps(diagnose() if args.command=='diagnose' else run(args),ensure_ascii=False,indent=2))
    except Exception as e:print(json.dumps({'error':company.redact(str(e))}));raise SystemExit(2)

if __name__=='__main__':main()

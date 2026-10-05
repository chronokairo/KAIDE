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
    def __init__(self,cmd,cwd):
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
        end=time.monotonic()+timeout
        while time.monotonic()<end:
            try:message=self.incoming.get(timeout=max(.1,end-time.monotonic()))
            except queue.Empty:raise TimeoutError(method+' timed out')
            if message is None:raise RuntimeError('ACP exited: '+''.join(self.stderr)[-1500:])
            if message.get('id')==rid and 'method' not in message:
                if 'error' in message:raise RuntimeError(str(message['error']))
                return message.get('result',{})
            if 'method' in message and 'id' in message:
                if message['method']=='session/request_permission':
                    p=message.get('params',{});title=json.dumps(p.get('toolCall',{}),ensure_ascii=False)
                    denied=bool(re.search(r'(?i)\b(sudo|mainnet|force.push|git push[^\n]*(?: main\b| master\b)|repo delete|payment.execute|transfer.funds)\b',title))
                    kind='reject_once' if denied else 'allow_once'
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
    for field in ['objective','scope','sources','acceptance','allowed_tools']:
        if not task.get(field):raise ValueError('Missing handoff field: '+field)
    config=json.loads((BASE/'backends.json').read_text());backend=config['engines'][args.engine]
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
        started=time.monotonic();conn=Connection(backend['command'],wt)
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
                  'session_id':sid,'elapsed_seconds':round(time.monotonic()-started,2),'result':result,'agent_info':info.get('agentInfo'),
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

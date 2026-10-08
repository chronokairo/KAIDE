#!/usr/bin/env python3
"""Local minimal ACP v1 adapter for the installed agy print CLI."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import threading
import uuid
from acp import namespace

sessions={};processes={};out_lock=threading.Lock()

def emit(message):
    with out_lock:print(json.dumps(message,ensure_ascii=False),flush=True)

def result(rid,data):emit({'jsonrpc':'2.0','id':rid,'result':data})
def error(rid,text):emit({'jsonrpc':'2.0','id':rid,'error':{'code':-32000,'message':text}})

def prompt(message):
    rid=message['id'];params=message['params'];sid=params['sessionId']
    try:
        cwd=sessions[sid];text='\n'.join(x['text'] for x in params['prompt'] if x.get('type')=='text')
        # Sandbox and accept-edits use the installed runtime's existing credentials/model configuration.
        cmd=['/home/deck/.local/bin/agy','--print','--output-format','json','--print-timeout','900s','--mode','accept-edits','--sandbox',text]
        p=subprocess.Popen(cmd,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True)
        processes[sid]=p
        stdout,stderr=p.communicate(timeout=900)
        if p.returncode:raise RuntimeError(stderr[-1000:] or 'agy exited with code '+str(p.returncode))
        try:
            data=json.loads(stdout);content=data.get('result') or data.get('response') or json.dumps(data,ensure_ascii=False)
        except ValueError:content=stdout
        emit({'jsonrpc':'2.0','method':'session/update','params':{'sessionId':sid,'update':{'sessionUpdate':'agent_message_chunk','content':{'type':'text','text':str(content)}}}})
        result(rid,{'stopReason':'end_turn'})
    except Exception as e:error(rid,str(e))
    finally:
        p=processes.pop(sid,None)
        if p and p.poll() is None:os.killpg(p.pid,signal.SIGTERM)

for line in sys.stdin:
    try:
        m=json.loads(line);method=m.get('method');rid=m.get('id');p=m.get('params',{})
        if method=='initialize':result(rid,{'protocolVersion':1,'agentInfo':{'name':'chronokairo-agy-cli-bridge','version':'1.0.0'},'agentCapabilities':{'loadSession':False}})
        elif method=='session/new':
            cwd=Path(p['cwd']).resolve();namespace(cwd);sid=str(uuid.uuid4());sessions[sid]=cwd;result(rid,{'sessionId':sid})
        elif method=='session/prompt':threading.Thread(target=prompt,args=(m,),daemon=True).start()
        elif method=='session/cancel':
            process=processes.get(p.get('sessionId'))
            if process and process.poll() is None:os.killpg(process.pid,signal.SIGTERM)
        elif rid is not None:emit({'jsonrpc':'2.0','id':rid,'error':{'code':-32601,'message':'Method not supported by agy CLI bridge'}})
    except Exception as e:
        if 'rid' in locals() and rid is not None:error(rid,str(e))
for process in processes.values():
    if process.poll() is None:os.killpg(process.pid,signal.SIGTERM)

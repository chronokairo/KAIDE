#!/usr/bin/env python3
"""Ponte entre o canal comercial do Chronokairo Chat e o funil. Nunca envia nada a prospects."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import urllib.parse
import urllib.request
import company

BASE=Path(__file__).resolve().parent
CREDENTIALS=Path.home()/'.config/chronokairo/chat.env'
BOT_ID='00000000-0000-4000-8000-00000000c4a7'
BOT_NAME='Chronokairo Agents'
HOST=r'((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24})'
EXPLICIT=re.compile(r'^\s*(?:lead|dom[ií]nio|domain)\s*:\s*(?:https?://)?(?:www\.)?'+HOST,re.I|re.M)
EMAIL=re.compile(r'[\w.+-]+@'+HOST,re.I)
BARE=re.compile(r'(?<![\w.@-])(?:https?://)?(?:www\.)?'+HOST+r'(?![\w-])',re.I)

def prospect_domain(text):
    for pattern in [EXPLICIT,EMAIL,BARE]:
        match=pattern.search(text)
        if match:return match[1].lower()
    return None

def settings():
    config=json.loads((BASE/'sales-config.json').read_text()).get('chat',{})
    values={}
    if CREDENTIALS.is_file():
        for line in CREDENTIALS.read_text().splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                key,value=line.split('=',1);values[key.strip()]=value.strip().strip('"\'')
    url=os.environ.get('CK_CHAT_SUPABASE_URL') or values.get('CK_CHAT_SUPABASE_URL')
    key=os.environ.get('CK_CHAT_SUPABASE_KEY') or values.get('CK_CHAT_SUPABASE_KEY')
    if not url or not key:
        raise RuntimeError(f'Chronokairo Chat não configurado: defina CK_CHAT_SUPABASE_URL e CK_CHAT_SUPABASE_KEY em {CREDENTIALS}')
    if urllib.parse.urlparse(url).scheme!='https':raise RuntimeError('CK_CHAT_SUPABASE_URL deve usar https')
    return url.rstrip('/'),key,config

def request(method,path,body=None):
    url,key,_=settings()
    data=None if body is None else json.dumps(body).encode()
    req=urllib.request.Request(url+'/rest/v1/'+path,data=data,method=method,headers={
        'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json','Prefer':'return=representation'})
    with urllib.request.urlopen(req,timeout=20) as response:
        return json.loads(response.read() or b'[]')

def channel_id():
    _,_,config=settings()
    q=urllib.parse.urlencode({'select':'id','name':'eq.'+config.get('channel','comercial-leads'),'workspace_id':'eq.'+config['workspace_id']})
    rows=request('GET','channels?'+q)
    if len(rows)!=1:raise RuntimeError('Canal comercial não encontrado ou ambíguo no Chronokairo Chat')
    return rows[0]['id']

def blocked(domain):
    config=json.loads((BASE/'sales-config.json').read_text())
    return any(domain==d or domain.endswith('.'+d) for d in config.get('blocked_domains',[]))

def pull():
    """Salva mensagens novas do dono como evidência local; respostas do bot e threads são ignoradas."""
    folder=BASE/'replies';folder.mkdir(mode=0o700,exist_ok=True)
    cursor_path=folder/'cursor.json'
    cursor=json.loads(cursor_path.read_text()) if cursor_path.is_file() else {'created_at':'1970-01-01T00:00:00Z'}
    q=urllib.parse.urlencode({'select':'id,user_id,user_name,content,created_at,reply_to_id','channel_id':'eq.'+channel_id(),
                              'created_at':'gt.'+cursor['created_at'],'reply_to_id':'is.null','order':'created_at.asc','limit':'50'})
    saved=[]
    for message in request('GET','messages?'+q):
        cursor['created_at']=message['created_at']
        if message['user_id']==BOT_ID:continue
        domain=prospect_domain(message['content'])
        if not domain:
            saved.append({'message_id':message['id'],'status':'needs_domain'});continue
        if blocked(domain):
            saved.append({'message_id':message['id'],'domain':domain,'status':'blocked_party'});continue
        path=folder/f"{message['created_at'][:19].replace(':','')}-{domain}-{message['id'][:8]}.txt"
        if not path.exists():
            path.write_text(f"Fonte: Chronokairo Chat #comercial-leads, mensagem {message['id']} de {message['user_name']} em {message['created_at']}\n\n{message['content']}\n")
            os.chmod(path,0o600)
        saved.append({'message_id':message['id'],'domain':domain,'evidence':str(path),'status':'saved'})
    cursor_path.write_text(json.dumps(cursor)+'\n');os.chmod(cursor_path,0o600)
    return saved

def post(content,reply_to=None):
    """Publica triagem e rascunhos no canal interno; não é envio ao prospect."""
    body={'channel_id':channel_id(),'user_id':BOT_ID,'user_name':BOT_NAME,'content':company.redact(content)[:8000]}
    if reply_to:
        if not re.fullmatch(r'[0-9a-f-]{36}',reply_to):raise ValueError('reply_to must be a message UUID')
        body['reply_to_id']=reply_to
    return {'message_id':request('POST','messages',body)[0]['id']}

def main():
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='action',required=True)
    sub.add_parser('pull');sub.add_parser('check')
    a=sub.add_parser('post');a.add_argument('--file',required=True);a.add_argument('--reply-to')
    args=p.parse_args()
    if args.action=='check':result={'channel_id':channel_id(),'checked_at':dt.datetime.now(dt.timezone.utc).isoformat()}
    elif args.action=='pull':result=pull()
    else:result=post(Path(args.file).read_text(),args.reply_to)
    print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':main()

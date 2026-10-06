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
BOT_NAME='Chronokairo Agents'
HOST=r'((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24})'
EXPLICIT=re.compile(r'^\s*(?:lead|dom[ií]nio|domain)\s*:\s*(?:https?://)?(?:www\.)?'+HOST,re.I|re.M)
EMAIL=re.compile(r'[\w.+-]+@'+HOST,re.I)
BARE=re.compile(r'(?<![\w.@-])(?:https?://)?(?:www\.)?'+HOST+r'(?![\w-])',re.I)
_session={}

def prospect_domain(text):
    for pattern in [EXPLICIT,EMAIL,BARE]:
        match=pattern.search(text)
        if match:return match[1].lower()
    return None

def settings():
    """Usuário-robô do Chat com RLS; a service role do banco único da empresa não é aceita."""
    config=json.loads((BASE/'sales-config.json').read_text()).get('chat',{})
    values={}
    if CREDENTIALS.is_file():
        for line in CREDENTIALS.read_text().splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                key,value=line.split('=',1);values[key.strip()]=value.strip().strip('"\'')
    get=lambda name:os.environ.get(name) or values.get(name)
    url=get('CK_CHAT_SUPABASE_URL') or config.get('supabase_url')
    needed={'CK_CHAT_SUPABASE_ANON_KEY':get('CK_CHAT_SUPABASE_ANON_KEY'),'CK_CHAT_BOT_EMAIL':get('CK_CHAT_BOT_EMAIL'),'CK_CHAT_BOT_PASSWORD':get('CK_CHAT_BOT_PASSWORD')}
    missing=[k for k,v in needed.items() if not v]
    if missing or not url:
        raise RuntimeError(f'Chronokairo Chat não configurado: defina {", ".join(missing) or "CK_CHAT_SUPABASE_URL"} em {CREDENTIALS}')
    if get('CK_CHAT_SUPABASE_KEY') or get('SUPABASE_SERVICE_ROLE_KEY'):
        raise RuntimeError('Service role não é aceita: o banco é único da empresa; use o usuário-robô do Chat')
    if urllib.parse.urlparse(url).scheme!='https':raise RuntimeError('CK_CHAT_SUPABASE_URL deve usar https')
    return url.rstrip('/'),needed,config

def _call(method,url,anon,token,body=None):
    data=None if body is None else json.dumps(body).encode()
    req=urllib.request.Request(url,data=data,method=method,headers={
        'apikey':anon,'Authorization':'Bearer '+token,'Content-Type':'application/json','Prefer':'return=representation'})
    with urllib.request.urlopen(req,timeout=20) as response:
        return json.loads(response.read() or b'[]')

def session():
    if not _session:
        url,needed,_=settings();anon=needed['CK_CHAT_SUPABASE_ANON_KEY']
        auth=_call('POST',url+'/auth/v1/token?grant_type=password',anon,anon,{'email':needed['CK_CHAT_BOT_EMAIL'],'password':needed['CK_CHAT_BOT_PASSWORD']})
        _session.update(url=url,anon=anon,token=auth['access_token'],user_id=auth['user']['id'])
    return _session

def request(method,path,body=None):
    s=session()
    return _call(method,s['url']+'/rest/v1/'+path,s['anon'],s['token'],body)

def channel_id():
    _,_,config=settings()
    workspaces=request('GET','workspaces?'+urllib.parse.urlencode({'select':'id','slug':'eq.'+config.get('workspace_slug','chronokairo-hq')}))
    if len(workspaces)!=1:raise RuntimeError('Workspace do Chat não encontrado; o robô precisa ser membro')
    q=urllib.parse.urlencode({'select':'id','name':'eq.'+config.get('channel','comercial-leads'),'workspace_id':'eq.'+workspaces[0]['id']})
    rows=request('GET','channels?'+q)
    if len(rows)!=1:raise RuntimeError('Canal comercial não encontrado ou ambíguo no Chronokairo Chat')
    return rows[0]['id']

def blocked(domain):
    config=json.loads((BASE/'sales-config.json').read_text())
    return any(domain==d or domain.endswith('.'+d) for d in config.get('blocked_domains',[]))

FALLBACK=Path.home()/'Desktop/Chronokairo/Respostas'

def pull_desktop():
    """Entrada provisória até o Chat entrar em produção: arquivos .txt salvos pelo dono."""
    folder=BASE/'replies';folder.mkdir(mode=0o700,exist_ok=True)
    done=FALLBACK/'processadas';done.mkdir(parents=True,exist_ok=True)
    saved=[]
    for source in sorted(FALLBACK.glob('*.txt')):
        text=source.read_text(errors='replace');domain=prospect_domain(source.stem+'\n'+text)
        if not domain:saved.append({'file':source.name,'status':'needs_domain'});continue
        if blocked(domain):saved.append({'file':source.name,'domain':domain,'status':'blocked_party'});source.replace(done/source.name);continue
        path=folder/f"desktop-{source.stem}.txt"
        path.write_text(f'Fonte: Desktop/Chronokairo/Respostas/{source.name}\n\n{text}\n');os.chmod(path,0o600)
        source.replace(done/source.name)
        saved.append({'file':source.name,'domain':domain,'evidence':str(path),'status':'saved','source':'desktop'})
    return saved

def pull():
    try:settings()
    except RuntimeError:return pull_desktop()
    return pull_chat()

def pull_chat():
    """Salva mensagens novas do dono como evidência local; respostas do bot e threads são ignoradas."""
    folder=BASE/'replies';folder.mkdir(mode=0o700,exist_ok=True)
    cursor_path=folder/'cursor.json'
    cursor=json.loads(cursor_path.read_text()) if cursor_path.is_file() else {'created_at':'1970-01-01T00:00:00Z'}
    q=urllib.parse.urlencode({'select':'id,user_id,user_name,content,created_at,reply_to_id','channel_id':'eq.'+channel_id(),
                              'created_at':'gt.'+cursor['created_at'],'reply_to_id':'is.null','order':'created_at.asc','limit':'50'})
    saved=[]
    for message in request('GET','messages?'+q):
        cursor['created_at']=message['created_at']
        if message['user_id']==session()['user_id']:continue
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
    body={'channel_id':channel_id(),'user_id':session()['user_id'],'user_name':BOT_NAME,'content':company.redact(content)[:8000]}
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

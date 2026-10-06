"""Idempotent GitHub→GitLab backlog migration, retaining PR patches for a Next port."""
import argparse,base64,hashlib,json,re,subprocess
from pathlib import Path

SOURCE='repos/chronokairo/audiomed'
TARGET='projects/chronokairo%2Fworkmed'

def api(forge,path,method='GET',body=None,raw=False):
    cmd=['gh' if forge=='github' else 'glab','api',path,'--method',method]
    if body is not None:cmd+=['--input','-','-H','Content-Type: application/json']
    p=subprocess.run(cmd,input=json.dumps(body) if body is not None else None,capture_output=True,text=True,timeout=90)
    if p.returncode:raise RuntimeError(f'{forge} {method} failed for {path.split("?")[0]}')
    return p.stdout if raw else json.loads(p.stdout or '{}')

def pages(forge,path):
    rows=[]
    for page in range(1,101):
        batch=api(forge,path+('&' if '?' in path else '?')+f'per_page=100&page={page}')
        rows+=batch
        if len(batch)<100:return rows
    raise RuntimeError('Incomplete pagination')

def safe_content(text):
    if re.search(r'(?:gh[pousr]_|glpat-|nvapi-|sk-)[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',text):
        raise RuntimeError('Potential private credential in migration input; needs redaction before publication')
    return text

def qualify(text):
    return re.sub(r'(?<![\w/#])#(\d+)\b',r'https://github.com/chronokairo/audiomed/issues/\1',text)

def checkpoint(result):
    path=Path.home()/'Desktop/Chronokairo/Audiomed-Workmed-Migracao-2026-10-05.json'
    old=json.loads(path.read_text()) if path.exists() else {'issues':[],'pullRequests':[]}
    for kind in ['issues','pullRequests']:
        merged={r['source']:r for r in old[kind]}
        merged.update({r['source']:r for r in result[kind]})
        result[kind]=list(merged.values())
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');path.chmod(0o600)

def migrate(apply=False):
    project=api('gitlab',TARGET)
    if project['path_with_namespace']!='chronokairo/workmed':raise RuntimeError('Unexpected destination')
    issues=[x for x in pages('github',SOURCE+'/issues?state=open') if 'pull_request' not in x]
    pulls=pages('github',SOURCE+'/pulls?state=open')
    targets=pages('gitlab',TARGET+'/issues?state=all')
    mrs=pages('gitlab',TARGET+'/merge_requests?state=all')
    result={'source':'https://github.com/chronokairo/audiomed','destination':project['web_url'],'issues':[],'pullRequests':[],'applied':apply}
    for issue in issues:
        marker=f'<!-- migrated-audiomed-issue:{issue["number"]} -->'
        existing=next((x for x in targets if marker in (x.get('description') or '')),None)
        comments=pages('github',SOURCE+f'/issues/{issue["number"]}/comments')
        description=marker+'\n## Origem\n'+issue['html_url']+'\n\nMigrado para Workmed por orientação do proprietário em 05/10/2026. Não representa implementação concluída. Referências a Firebase/Vite ou ao cliente Audiomed devem ser adaptadas ao SaaS Next/TypeScript e ao tenant apropriado.\n\n## Demanda original\n'+(issue.get('body') or '')
        for comment in comments:description+='\n\n### Histórico — '+comment['created_at']+'\n'+comment['html_url']+'\n'+comment['body']
        description=safe_content(qualify(description))
        if apply and not existing:
            existing=api('gitlab',TARGET+'/issues','POST',{'title':issue['title'],'description':description})
            targets.append(existing)
        if apply:
            verified=api('gitlab',TARGET+f'/issues/{existing["iid"]}')
            if marker not in verified['description']:raise RuntimeError('Destination verification failed')
            message='Migrado para Workmed: '+existing['web_url']+'. Histórico e escopo preservados no destino; este encerramento não indica implementação concluída.'
            if not any(existing['web_url'] in c['body'] for c in comments):api('github',SOURCE+f'/issues/{issue["number"]}/comments','POST',{'body':message})
            api('github',SOURCE+f'/issues/{issue["number"]}','PATCH',{'state':'closed','state_reason':'not_planned'})
        result['issues'].append({'source':issue['html_url'],'number':issue['number'],'destination':existing['web_url'] if existing else None})
        if apply:checkpoint(result)
    for pull in pulls:
        number=pull['number'];marker=f'<!-- migrated-audiomed-pr:{number} -->'
        existing=next((x for x in mrs if marker in (x.get('description') or '')),None)
        # Request patch via authenticated CLI, without exposing its contents to logs.
        p=subprocess.run(['gh','pr','diff',str(number),'--repo','chronokairo/audiomed','--patch'],capture_output=True,text=True,timeout=90)
        if p.returncode:raise RuntimeError('Could not read source patch')
        patch=safe_content(p.stdout)
        description=safe_content(qualify(marker+'\nOrigem: '+pull['html_url']+'\n\n'+(pull.get('body') or '')+'\n\n## Migração para Workmed\nPatch original preservado em docs/migrations/audiomed/pr-'+str(number)+'.patch. Este MR registra a transferência do trabalho pendente; não aplica código Vite no Next. Portar por features hexagonais, UI Atomic Design e CSS/SVG internos. Configurações e regras comerciais Audiomed ficam limitadas ao tenant Audiomed. PR de dependência de ícones não autoriza adicionar lucide ao Workmed.\n\nRevisar e portar a implementação antes de considerar a demanda entregue.'))
        branch=f'migration/audiomed-pr-{number}'
        if apply and not existing:
            branches=pages('gitlab',TARGET+'/repository/branches')
            if not any(b['name']==branch for b in branches):api('gitlab',TARGET+'/repository/branches','POST',{'branch':branch,'ref':project['default_branch']})
            filename=f'docs/migrations/audiomed/pr-{number}.patch'
            tree=pages('gitlab',TARGET+f'/repository/tree?ref={branch}&recursive=true')
            if not any(t['path']==filename for t in tree):
                metadata={'source':pull['html_url'],'head':pull['head']['sha'],'base':pull['base']['sha'],'sha256':hashlib.sha256(patch.encode()).hexdigest(),'status':'pending_next_port'}
                api('gitlab',TARGET+'/repository/commits','POST',{'branch':branch,'commit_message':f'chore(migration): preserve Audiomed PR #{number} for Workmed port','actions':[{'action':'create','file_path':filename,'content':base64.b64encode(patch.encode()).decode(),'encoding':'base64'},{'action':'create','file_path':f'docs/migrations/audiomed/pr-{number}.json','content':json.dumps(metadata,indent=2)+'\n'}]})
            existing=api('gitlab',TARGET+'/merge_requests','POST',{'source_branch':branch,'target_branch':project['default_branch'],'title':'Draft: [Audiomed] '+pull['title'],'description':description})
            mrs.append(existing)
        if apply:
            verified=api('gitlab',TARGET+f'/merge_requests/{existing["iid"]}')
            if marker not in verified['description']:raise RuntimeError('MR destination verification failed')
            comments=pages('github',SOURCE+f'/issues/{number}/comments')
            if not any(existing['web_url'] in c['body'] for c in comments):api('github',SOURCE+f'/issues/{number}/comments','POST',{'body':'Trabalho pendente migrado para Workmed: '+existing['web_url']+'. Patch original preservado; adaptação Next/TypeScript permanece pendente no destino. Este PR é encerrado sem merge.'})
            api('github',SOURCE+f'/pulls/{number}','PATCH',{'state':'closed'})
        result['pullRequests'].append({'source':pull['html_url'],'number':number,'destination':existing['web_url'] if existing else None,'head':pull['head']['sha']})
        if apply:checkpoint(result)
    if apply:
        checkpoint(result)
    print(json.dumps({'issues':len(issues),'pullRequests':len(pulls),'applied':apply,'mappings':result},ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true')
    migrate(parser.parse_args().apply)

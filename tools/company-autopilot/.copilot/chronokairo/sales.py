#!/usr/bin/env python3
"""Dedicated prospect ledger. Never sends messages or treats drafts as revenue."""
import argparse
import csv
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import sqlite3
from urllib.parse import quote, urlparse
import re
from zoneinfo import ZoneInfo
import company

BASE=Path(__file__).resolve().parent
DESKTOP=Path.home()/'Desktop/Chronokairo'
NEXT={'draft_ready':'sent','sent':'replied','replied':'meeting','meeting':'won','won':'paid'}
SOURCES={'referral','partner','demand','outbound','inbound'}
FUNNEL=['qualified','sent','replied','meeting','won','paid']
TYPES={'sent':'send_receipt','replied':'prospect_reply','meeting':'meeting_confirmation','won':'contract_acceptance','paid':'payment_receipt','rejected':'rejection','opt_out':'opt_out'}
def website(value):
    parsed=urlparse(value)
    if parsed.scheme not in {'http','https'} or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('Expected public http(s) business URL')
    host=parsed.hostname.lower().removeprefix('www.')
    if host in {'localhost','127.0.0.1','::1'}:raise ValueError('Public business URL required')
    return host

def connect():
    BASE.mkdir(parents=True,exist_ok=True)
    c=sqlite3.connect(BASE/'sales.db',timeout=20)
    c.row_factory=sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    c.executescript('''CREATE TABLE IF NOT EXISTS leads(
       domain TEXT PRIMARY KEY, company TEXT NOT NULL, stage TEXT NOT NULL,
       details TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
       CREATE TABLE IF NOT EXISTS events(
       id TEXT PRIMARY KEY, domain TEXT NOT NULL REFERENCES leads(domain), stage TEXT NOT NULL,
       evidence_path TEXT NOT NULL, evidence_sha256 TEXT NOT NULL, evidence_kind TEXT NOT NULL,
       amount_cents INTEGER, created_at TEXT NOT NULL);''')
    os.chmod(BASE/'sales.db',0o600)
    return c

PHONE=re.compile(r'\+[1-9]\d{9,14}')
MAIL=re.compile(r'[^@\s]+@[^@\s]+\.[a-z]{2,24}',re.I)

def contact(row):
    """Contato comercial publicado pela empresa; campo vazio é preferível a contato pessoal ou inferido."""
    for field in ['contact_name','whatsapp','email','product']:
        if field in row and row[field] is not None and not isinstance(row[field],str):raise ValueError('Invalid '+field)
    if row.get('whatsapp'):
        digits='+'+re.sub(r'\D','',row['whatsapp'])
        if not PHONE.fullmatch(digits):raise ValueError('WhatsApp must be E.164, e.g. +5592999999999')
        row['whatsapp']=digits
    if row.get('email') and not MAIL.fullmatch(row['email'].strip()):raise ValueError('Invalid email')
    if (row.get('whatsapp') or row.get('email') or row.get('contact_name')):
        source=row.get('contact_source')
        if not isinstance(source,str):raise ValueError('contact_source URL required for published contact data')
        website(source)
    products=json.loads((BASE/'sales-config.json').read_text()).get('products',{})
    if row.get('product') and products and row['product'] not in products:raise ValueError('Unknown product; use sales-config.json products')

def campaign_ready(row):
    d=row['details']
    return row['stage'] in {'qualified','draft_ready'} and all(d.get(k) for k in ['contact_name','whatsapp','email','product'])

def campaign(start,per_day):
    """Agenda envios 1 a 1 a partir de start; o dono envia cada mensagem pelo link wa.me."""
    config=json.loads((BASE/'sales-config.json').read_text());products=config.get('products',{})
    rows=sorted([r for r in records() if campaign_ready(r)],key=lambda r:(-r['details'].get('fit_score',0),r['domain']))
    day=dt.date.fromisoformat(start);out=[]
    for i,r in enumerate(rows):
        d=r['details'];when=day+dt.timedelta(days=i//per_day)
        text=d.get('draft') or ''
        out.append({'send_on':when.isoformat(),'company':r['company'],'contact_name':d['contact_name'],'whatsapp':d['whatsapp'],'email':d['email'],
                    'product':d['product'],'product_name':products.get(d['product'],{}).get('name',d['product']),'domain':r['domain'],
                    'wa_link':'https://wa.me/'+d['whatsapp'].lstrip('+')+('?text='+quote(text) if text else ''),'message':text,'contact_source':d.get('contact_source','')})
    missing=[{'company':r['company'],'domain':r['domain'],'missing':[k for k in ['contact_name','whatsapp','email','product'] if not r['details'].get(k)]}
             for r in records() if r['stage'] in {'qualified','draft_ready'} and not campaign_ready(r)]
    DESKTOP.mkdir(parents=True,exist_ok=True);path=DESKTOP/f'WhatsApp-Campanha-{start}.csv'
    with path.open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=['send_on','company','contact_name','whatsapp','email','product','product_name','domain','wa_link','message','contact_source']);w.writeheader();w.writerows(out)
    os.chmod(path,0o600)
    return {'file':str(path),'ready':len(out),'per_day':per_day,'last_day':out[-1]['send_on'] if out else None,'incomplete':missing}

def ingest(records):
    config=json.loads((BASE/'sales-config.json').read_text())
    if not isinstance(records,list) or len(records)>config['daily_candidate_limit']:raise ValueError('Batch exceeds configured candidate limit')
    prepared=[]
    for row in records:
        for field in ['company','website','segment','city','business_contact_url','demand_signal','offer','next_action']:
            if not isinstance(row.get(field),str) or not row[field].strip():raise ValueError('Missing '+field)
        domain=website(row['website']);website(row['business_contact_url'])
        if any(domain==d or domain.endswith('.'+d) for d in config['existing_customer_domains']) or row['company'].strip().casefold() in config['existing_customer_names']:
            raise ValueError('Existing customer is not acquisition')
        contact(row)
        company=row['company'].strip().casefold()
        if any(domain==d or domain.endswith('.'+d) for d in config.get('blocked_domains',[])) or any(n in company for n in config.get('blocked_names',[])):
            raise ValueError('Blocked party: owner-reported default, do not prospect')
        sources=row.get('sources')
        if not isinstance(sources,list) or not sources:raise ValueError('Source evidence required')
        for source in sources:
            website(source['url'])
            date=dt.date.fromisoformat(source['checked_at'])
            if date>dt.datetime.now(ZoneInfo('America/Caracas')).date():raise ValueError('Future source date')
            if not source.get('fact'):raise ValueError('Source fact required')
        row.setdefault('source_type','outbound');row.setdefault('language','en')
        if row['source_type'] not in SOURCES:raise ValueError('source_type must be referral, partner, demand, outbound or inbound')
        if row['source_type']=='referral' and not str(row.get('referred_by','')).strip():raise ValueError('Referral needs referred_by')
        if not isinstance(row['language'],str) or not 2<=len(row['language'])<=5:raise ValueError('Invalid language code')
        if row['source_type']=='demand':
            demand=row.get('service_request',{})
            if not isinstance(demand,dict) or demand.get('kind') not in {'rfp','freelance','contractor','vendor_request'}:raise ValueError('Demand requires explicit service/vendor request, not employment_only')
            if not isinstance(demand.get('excerpt'),str) or not demand['excerpt'].strip():raise ValueError('Demand requires source excerpt')
            if demand.get('url') not in [src['url'] for src in sources]:raise ValueError('Request must reference a recorded source')
            published=dt.date.fromisoformat(demand.get('published_at',''))
            age=(dt.datetime.now(ZoneInfo('America/Caracas')).date()-published).days
            if not 0<=age<=30:raise ValueError('Service request must be within 30 days')
        score=row.get('fit_score',0)
        if type(score) is not int or not 0<=score<=4:raise ValueError('Invalid fit score')
        criteria=row.get('fit_criteria',[])
        if (not isinstance(criteria,list) or len(criteria)!=score or any(not isinstance(x,dict) or not x.get('criterion') or not x.get('evidence') or x.get('source_url') not in [src['url'] for src in sources] for x in criteria)):
            raise ValueError('Each fit point requires criterion, evidence and recorded source_url')
        if len({x['criterion'] for x in criteria})!=len(criteria):raise ValueError('Duplicate fit criteria')
        qualified=score>=config['qualification_min_fit_score']
        stage='draft_ready' if qualified and isinstance(row.get('draft'),str) and row['draft'].strip() else 'qualified' if qualified else 'candidate'
        prepared.append((domain,row,stage))
    now=dt.datetime.now(dt.timezone.utc).isoformat()
    c=connect()
    try:
        with c:
            c.execute('BEGIN IMMEDIATE')
            today=dt.datetime.now(ZoneInfo('America/Caracas')).date()
            existing={r['domain'] for r in c.execute('SELECT domain FROM leads')}
            added_today=sum(dt.datetime.fromisoformat(r['created_at']).astimezone(ZoneInfo('America/Caracas')).date()==today for r in c.execute('SELECT created_at FROM leads'))
            if added_today+len({d for d,_,_ in prepared}-existing)>config['daily_candidate_limit']:raise ValueError('Daily candidate limit exceeded across batches')
            for domain,row,stage in prepared:
                old=c.execute('SELECT stage,details FROM leads WHERE domain=?',[domain]).fetchone()
                if old:
                    previous=json.loads(old['details'])
                    if previous.get('source_type','outbound')!=row['source_type']:raise ValueError('Acquisition source is immutable; use a reviewed correction')
                    row={**previous,**row}
                    if previous.get('draft') and not row.get('draft'):row['draft']=previous['draft']
                    # Operational stages are never changed by research or a new draft.
                    if old['stage'] not in {'candidate','qualified','draft_ready'}:stage=old['stage']
                    elif old['stage']=='draft_ready' and stage=='qualified':stage='draft_ready'
                    c.execute('UPDATE leads SET company=?,stage=?,details=?,updated_at=? WHERE domain=?',(row['company'],stage,json.dumps(row,ensure_ascii=False),now,domain))
                else:c.execute('INSERT INTO leads VALUES(?,?,?,?,?,?)',(domain,row['company'],stage,json.dumps(row,ensure_ascii=False),now,now))
        return {'candidates_processed':len(prepared),'new_customers_confirmed':0}
    finally:c.close()

def event(domain,stage,path,kind,amount=None):
    if TYPES.get(stage)!=kind:raise ValueError('Evidence kind must correspond to stage')
    evidence=Path(path).resolve()
    if not evidence.is_file() or evidence.stat().st_size==0:raise ValueError('Existing nonempty evidence file required')
    if evidence.is_relative_to((BASE/'evidence'/'attested').resolve()) or evidence.read_bytes().startswith('Registro não verificado do operador'.encode()):raise ValueError('Operator notes are not external receipts')
    if stage=='paid' and (type(amount) is not int or amount<=0):raise ValueError('Payment needs positive integer amount_cents')
    if stage!='paid' and amount is not None:raise ValueError('Amounts belong only to payment receipts')
    digest=hashlib.sha256(evidence.read_bytes()).hexdigest()
    event_id=hashlib.sha256((domain+'|'+stage+'|'+digest).encode()).hexdigest()
    c=connect()
    try:
        with c:
            if c.execute('SELECT id FROM events WHERE id=?',[event_id]).fetchone():return {'event_id':event_id,'duplicate':True}
            lead=c.execute('SELECT stage FROM leads WHERE domain=?',[domain]).fetchone()
            if not lead:raise ValueError('Unknown prospect')
            if lead['stage'] in {'rejected','opt_out','paid'}:raise ValueError('Terminal stage')
            if stage not in {'rejected','opt_out'} and NEXT.get(lead['stage'])!=stage:raise ValueError('Cannot skip stages')
            if c.execute('SELECT 1 FROM events WHERE evidence_sha256=? AND NOT (domain=? AND stage=?)',[digest,domain,stage]).fetchone():raise ValueError('Evidence already used for another stage or prospect')
            now=dt.datetime.now(dt.timezone.utc).isoformat()
            c.execute('INSERT INTO events VALUES(?,?,?,?,?,?,?,?)',(event_id,domain,stage,str(evidence),digest,kind,amount,now))
            c.execute('UPDATE leads SET stage=?,updated_at=? WHERE domain=?',(stage,now,domain))
        return {'event_id':event_id,'duplicate':False}
    finally:c.close()

ATTESTABLE={'sent':'send_receipt','meeting':'meeting_confirmation','rejected':'rejection','opt_out':'opt_out'}

def attest(domain,stage,channel,note):
    """Unverified operator note: never represents authenticated owner confirmation."""
    if stage not in ATTESTABLE:raise ValueError('Owner attestation only covers sent, meeting, rejected and opt_out')
    if not channel.strip():raise ValueError('Channel required')
    now=dt.datetime.now(ZoneInfo('America/Caracas'))
    folder=BASE/'evidence'/'attested';folder.mkdir(parents=True,exist_ok=True)
    path=folder/f"{now:%Y%m%dT%H%M%S}-{stage}-{website('https://'+domain)}.txt"
    path.write_text(f'Registro não verificado do operador (não comprova identidade do dono)\nEtapa solicitada: {stage}\nProspect: {domain}\nCanal: {channel}\nData: {now.isoformat()}\nNota: {note or "-"}\n')
    os.chmod(path,0o600)
    return {'status':'needs_evidence','document':str(path),'stage_unchanged':True,
            'next_action':'Provide external receipt through sales.py event; this note does not advance the funnel'}


def records():
    c=connect()
    try:return [dict(r,details=json.loads(r['details'])) for r in c.execute('SELECT * FROM leads ORDER BY updated_at DESC')]
    finally:c.close()

ORDER=['candidate','qualified','draft_ready','sent','replied','meeting','won','paid']

def funnel_metrics():
    """Conta quem alcançou cada etapa por origem; etapas operacionais exigem evento com comprovante."""
    c=connect()
    try:
        reached={r['domain']:{r2['stage'] for r2 in c.execute('SELECT stage FROM events WHERE domain=?',[r['domain']])} for r in c.execute('SELECT domain FROM leads')}
        leads={r['domain']:(json.loads(r['details']).get('source_type','outbound'),r['stage']) for r in c.execute('SELECT domain,stage,details FROM leads')}
    finally:c.close()
    rate=lambda a,b:f'{100*a/b:.0f}%' if b else 'n/a'
    result={}
    for source in sorted(SOURCES|{s for s,_ in leads.values()}):
        rows=[(d,stage) for d,(s,stage) in leads.items() if s==source]
        row={'qualified':sum(stage in ORDER and ORDER.index(stage)>=1 for _,stage in rows)}
        for step in FUNNEL[1:]:row[step]=sum(step in reached[d] for d,_ in rows)
        row.update(reply_rate=rate(row['replied'],row['sent']),meeting_rate=rate(row['meeting'],row['replied']),win_rate=rate(row['won'],row['meeting']))
        result[source]=row
    return result

def report():
    leads=records();c=connect()
    try:
        counts={s: c.execute('SELECT count(DISTINCT domain) FROM events WHERE stage=?',[s]).fetchone()[0] for s in TYPES}
        paid=c.execute("SELECT coalesce(sum(amount_cents),0) FROM events WHERE stage='paid'").fetchone()[0]
    finally:c.close()
    funnel=funnel_metrics()
    day=dt.datetime.now(ZoneInfo('America/Caracas')).date().isoformat()
    body=f'# Comercial Chronokairo — {day}\n\nFunil de aquisição; exclui Audiomed. Registros públicos não comprovam interesse.\n\n'
    body+='## Métricas por origem (acumulado, com comprovante)\n\n| Origem | '+' | '.join(FUNNEL)+' | resposta/envio | reunião/resposta | venda/reunião |\n|'+'---|'*(len(FUNNEL)+4)+'\n'
    for source,row in funnel.items():
        body+=f'| {source} | '+' | '.join(str(row[s]) for s in FUNNEL)+' | '+' | '.join(row[k] for k in ['reply_rate','meeting_rate','win_rate'])+' |\n'
    body+='\nTaxas com denominador zero aparecem como n/a. Qualificado mede adequação, não interesse.\n\n'
    body+=f'Empresas registradas: {len(leads)}. Qualificadas/rascunhos disponíveis: {sum(r["stage"] in {"qualified","draft_ready"} for r in leads)}.\n\n'
    body+='Etapas com comprovantes registrados (acumulado): '+', '.join(f'{s}={n}' for s,n in counts.items())+f'. Recebimentos registrados: R$ {paid/100:.2f}. Ausência de registro não prova ausência de receita fora deste funil.\n\n'
    body+='Envios automáticos desabilitados. Respostas exigem registro de evidência; não há caixa de entrada integrada.\n'
    if not leads:body+='\nNenhum candidato registrado ainda. Próximo ciclo: pesquisar empresas novas e preparar abordagens.\n'
    for row in leads:
        detail=row['details'];body+=f'\n## {row["company"]} — {row["domain"]}\n\nEstado: {row["stage"]}; adequação: {detail.get("fit_score",0)}/4.\n\nSinal/hipótese: {detail["demand_signal"]}\n\nCanal: {detail["business_contact_url"]}\n\nOferta: {detail["offer"]}\n\nPróximo passo: {detail["next_action"]}\n\n'
        body+='Fontes: '+', '.join(s['url'] for s in detail['sources'])+'\n'
        if row['stage'] not in {'opt_out','rejected'} and detail.get('draft'):body+='\nRascunho (não enviado):\n\n'+detail['draft']+'\n'
    DESKTOP.mkdir(parents=True,exist_ok=True);dest=DESKTOP/f'Comercial-{day}.md'
    company.atomic(dest,company.redact(body));os.chmod(dest,0o600)
    return {'document':str(dest),'companies':len(leads),'evidence_counts':counts,'paid_cents':paid,'funnel':funnel}

def main():
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='action',required=True)
    sub.add_parser('list');sub.add_parser('report')
    a=sub.add_parser('ingest');a.add_argument('--file',required=True)
    e=sub.add_parser('event');e.add_argument('--domain',required=True);e.add_argument('--stage',choices=list(TYPES),required=True);e.add_argument('--evidence',required=True);e.add_argument('--kind',choices=list(TYPES.values()),required=True);e.add_argument('--amount-cents',type=int)
    m=sub.add_parser('mark',help='dono registra envio, reunião, recusa ou opt-out');m.add_argument('--domain',required=True);m.add_argument('--stage',choices=list(ATTESTABLE),required=True);m.add_argument('--channel',required=True);m.add_argument('--note',default='')
    c=sub.add_parser('campaign',help='lista de WhatsApp 1 a 1');c.add_argument('--start',required=True);c.add_argument('--per-day',type=int,default=20)
    args=p.parse_args()
    if args.action=='list':result=records()
    elif args.action=='report':result=report()
    elif args.action=='ingest':result=ingest(json.loads(Path(args.file).read_text()))
    elif args.action=='campaign':result=campaign(args.start,args.per_day)
    elif args.action=='mark':result=attest(args.domain,args.stage,args.channel,args.note)
    else:result=event(args.domain,args.stage,args.evidence,args.kind,args.amount_cents)
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':main()

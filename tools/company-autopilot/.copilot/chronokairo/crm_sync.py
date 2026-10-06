#!/usr/bin/env python3
"""Gera SQL idempotente do funil local para public.leads do CRM (Supabase único da empresa)."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo
import sales

DESKTOP=Path.home()/'Desktop/Chronokairo'
SOURCE={'referral':'Indicação','partner':'Parceiro','inbound':'Website','demand':'Outbound','outbound':'Outbound'}
STATUS={'candidate':'Novo','qualified':'Qualificado','draft_ready':'Qualificado','sent':'Em Contato','replied':'Em Contato',
        'meeting':'Em Contato','won':'Convertido','paid':'Convertido','rejected':'Desqualificado','opt_out':'Desqualificado'}

def q(value):
    return 'NULL' if value in (None,'') else "'"+str(value).replace("'","''")+"'"

def marker(domain):
    return f'[ck:{domain}]'

def statement(row,products):
    d=row['details'];score=d.get('fit_score',0)
    product=d.get('product');approach=products.get(product,{}).get('name',product) if product else d.get('offer')
    notes='\n'.join(x for x in [marker(row['domain']),'Origem: '+d.get('source_type','outbound'),
        'Contato publicado em: '+d['contact_source'] if d.get('contact_source') else '','Sinal: '+d.get('demand_signal',''),
        'Fontes: '+', '.join(s['url'] for s in d.get('sources',[])),'Rascunho (não enviado):\n'+d['draft'] if d.get('draft') else ''] if x)
    values={'name':d.get('contact_name') or row['company'],'company':row['company'],'email':d.get('email'),'phone':d.get('whatsapp'),
            'source':SOURCE.get(d.get('source_type','outbound'),'Outbound'),'status':STATUS.get(row['stage'],'Novo'),'segment':d.get('segment'),
            'tier':'A' if score>=4 else 'B' if score==3 else 'C','approach':approach,
            'location':', '.join(x for x in [d.get('city'),d.get('country')] if x),'notes':notes}
    cols=list(values)
    sets=', '.join(f'{c} = {q(values[c])}' for c in cols if c!='name' or d.get('contact_name'))
    return (f"UPDATE public.leads l SET {sets}, updated_at = now() FROM org WHERE l.organization_id = org.id AND l.notes LIKE {q('%'+marker(row['domain'])+'%')};\n"
            f"INSERT INTO public.leads (organization_id, {', '.join(cols)})\n"
            f"SELECT org.id, {', '.join(q(values[c]) for c in cols)} FROM org\n"
            f"WHERE NOT EXISTS (SELECT 1 FROM public.leads l WHERE l.organization_id = org.id AND l.notes LIKE {q('%'+marker(row['domain'])+'%')});\n")

def export(org_slug='chronokairo'):
    products=json.loads((sales.BASE/'sales-config.json').read_text()).get('products',{})
    rows=[r for r in sales.records()]
    day=dt.datetime.now(ZoneInfo('America/Caracas')).date().isoformat()
    body=(f'-- Leads do funil Chronokairo -> CRM (public.leads), {day}. Idempotente: atualiza pelo marcador [ck:dominio].\n'
          '-- Rodar no SQL Editor do Supabase único da empresa. Ajuste o slug se a organização não for chronokairo.\n'
          'BEGIN;\n'
          f'CREATE TEMP TABLE org ON COMMIT DROP AS SELECT id FROM public.organizations WHERE slug = {q(org_slug)};\n'
          "DO $$ BEGIN IF (SELECT count(*) FROM org) <> 1 THEN RAISE EXCEPTION 'Organização não encontrada'; END IF; END $$;\n")
    body+=''.join(statement(r,products) for r in rows)+'COMMIT;\n'
    DESKTOP.mkdir(parents=True,exist_ok=True);path=DESKTOP/f'CRM-Leads-{day}.sql'
    path.write_text(body);os.chmod(path,0o600)
    return {'file':str(path),'leads':len(rows)}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--org-slug',default='chronokairo');a=p.parse_args()
    print(json.dumps(export(a.org_slug),ensure_ascii=False))

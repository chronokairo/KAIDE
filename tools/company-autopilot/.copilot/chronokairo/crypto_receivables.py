#!/usr/bin/env python3
"""Cobranças em cripto de clientes: só endereço de recebimento, sem chaves, transferência ou conversão."""
import argparse
import datetime as dt
import decimal
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
from zoneinfo import ZoneInfo
import company
import sales

BASE=Path(__file__).resolve().parent
DESKTOP=Path.home()/'Desktop/Chronokairo'
ZONE=ZoneInfo('America/Caracas')
SECRET_FIELDS=re.compile(r'seed|mnemonic|private|spend.?key|secret|wif',re.I)
TX_HASH=re.compile(r'(0x)?[0-9a-fA-F]{64}')

CONTRACT='''Contrato de recebimentos em cripto:
Missão: transformar vendas ganhas em caixa recebido em cripto, preferindo stablecoins (USDC em Base, USDT em Tron) e XMR quando o cliente pedir. Use python3 ~/.copilot/chronokairo/crypto_receivables.py check/request/confirm/report por meio do coordenador.
Cobrança: somente para venda com aceite registrado (sales.py won) ou pedido do dono; valor em USD da tabela de sales-config.json; ativo volátil exige cotação com fonte e validade de 30 minutos. Entregue ao dono as instruções de pagamento (valor, ativo, rede, endereço, validade) para ele enviar ao cliente; você não envia.
Conferência: verifique a transação em explorador público (ou view key de XMR fornecida pelo dono) — destino igual ao endereço cadastrado, valor, rede e confirmações mínimas — e salve a página/consulta como evidência antes do confirm. Converta para BRL pela PTAX do dia com fonte. O confirm grava o recebimento, avança o funil para paid e gera o SQL de accounts_receivable da platform em Desktop/Chronokairo/Financeiro-Cripto-<data>.sql.
Proibido: gerar, pedir, ler ou guardar semente, chave privada ou spend key; transferir, converter, sacar, fazer swap, trading, staking, mineração ou estorno on-chain; habilitar mainnet ou cadastrar endereço (decisão do dono). Valor menor que o cobrado, rede errada ou endereço diferente: registre blocked para decisão do dono.
Engenharia do checkout fica com a rota payments (gitlab.com/chronokairo/payments, MR !1 testnet); mainnet só após revisão de segurança e autorização do dono.
Relate mensalmente o total em BRL e alerte quando o mês se aproximar de R$30 mil recebidos sem exchange brasileira (declaração IN RFB 1888/2019; confirmar com contador).
'''

def augment(profiles):
    for profile in profiles:
        if profile['id']=='ck-crypto-receivables':profile['content']+='\n'+CONTRACT
        elif profile['id']=='ck-finance-orchestrator':profile['content']+='\nRota crypto-receivables: ck-crypto-receivables → ck-reconciliation. Você executa crypto_receivables.py e sales.py; nunca recebe ou repassa chaves privadas.\n'
    return profiles

def config():
    data=json.loads((BASE/'crypto-config.json').read_text())
    def walk(value,path=''):
        if isinstance(value,dict):
            for k,v in value.items():
                if SECRET_FIELDS.search(k):raise RuntimeError(f'Campo proibido em crypto-config.json: {path+k}. Chaves e sementes ficam com o dono.')
                walk(v,path+k+'.')
        elif isinstance(value,list):
            for v in value:walk(v,path)
    walk(data)
    return data

def connect():
    c=sqlite3.connect(BASE/'crypto.db',timeout=20);c.row_factory=sqlite3.Row
    c.executescript('''CREATE TABLE IF NOT EXISTS requests(
        id TEXT PRIMARY KEY, domain TEXT NOT NULL, description TEXT NOT NULL, amount_usd TEXT NOT NULL,
        asset TEXT NOT NULL, network TEXT NOT NULL, address TEXT NOT NULL, expected_amount TEXT NOT NULL,
        quote_source TEXT, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, status TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS receipts(
        tx_hash TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id), amount TEXT NOT NULL,
        confirmations INTEGER NOT NULL, evidence_path TEXT NOT NULL, evidence_sha256 TEXT NOT NULL,
        brl_rate TEXT NOT NULL, rate_source TEXT NOT NULL, amount_brl_cents INTEGER NOT NULL, created_at TEXT NOT NULL);''')
    os.chmod(BASE/'crypto.db',0o600)
    return c

def option(cfg,asset,network):
    entry=next((a for a in cfg['assets'] if a['symbol']==asset),None)
    if not entry or network not in entry['networks']:raise ValueError(f'{asset} em {network} não é aceito')
    testnet=network in cfg['testnets']
    if not testnet and not cfg.get('mainnet_enabled'):
        raise ValueError('Mainnet desabilitada: o dono precisa habilitar mainnet_enabled e cadastrar o endereço')
    address=cfg['receive_addresses'].get(f'{asset}:{network}')
    if not address:raise ValueError(f'Endereço de recebimento {asset}:{network} não cadastrado pelo dono')
    return entry,address

def request(domain,amount_usd,asset,network,description,quote=None,quote_source=None):
    cfg=config();entry,address=option(cfg,asset,network)
    usd=decimal.Decimal(str(amount_usd))
    if usd<=0:raise ValueError('Valor deve ser positivo')
    if entry.get('stablecoin'):expected=usd.quantize(decimal.Decimal(1).scaleb(-entry['decimals']))
    else:
        if not quote or not quote_source:raise ValueError('Ativo volátil exige cotação USD e fonte')
        expected=(usd/decimal.Decimal(str(quote))).quantize(decimal.Decimal(1).scaleb(-entry['decimals']),rounding=decimal.ROUND_UP)
    now=dt.datetime.now(dt.timezone.utc)
    ttl=cfg['quote_validity_minutes'] if not entry.get('stablecoin') else cfg['invoice_validity_days']*1440
    rid=hashlib.sha256(f'{domain}|{asset}|{network}|{usd}|{now.isoformat()}'.encode()).hexdigest()[:16]
    with connect() as c:
        c.execute('INSERT INTO requests VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(rid,sales.website('https://'+domain),description,str(usd),asset,network,address,str(expected),quote_source,now.isoformat(),(now+dt.timedelta(minutes=ttl)).isoformat(),'open'))
    return {'request_id':rid,'pay':f'{expected} {asset}','network':network,'address':address,'expires_at':(now+dt.timedelta(minutes=ttl)).isoformat(),
            'note':'Instruções para o dono enviar ao cliente; confira a rede antes do envio.'}

def confirm(request_id,tx_hash,amount,confirmations,evidence,brl_rate,rate_source):
    cfg=config()
    if not TX_HASH.fullmatch(tx_hash):raise ValueError('Hash de transação inválido')
    path=Path(evidence).resolve()
    if not path.is_file() or path.stat().st_size==0:raise ValueError('Evidência do explorador ou view key obrigatória')
    if not rate_source.strip():raise ValueError('Fonte da cotação BRL obrigatória (ex.: PTAX do dia)')
    with connect() as c:
        req=c.execute('SELECT * FROM requests WHERE id=?',(request_id,)).fetchone()
        if not req:raise ValueError('Cobrança desconhecida')
        if req['status']!='open':raise ValueError('Cobrança já liquidada ou cancelada')
        if c.execute('SELECT 1 FROM receipts WHERE tx_hash=?',(tx_hash,)).fetchone():raise ValueError('Transação já registrada')
        if dt.datetime.now(dt.timezone.utc)>dt.datetime.fromisoformat(req['expires_at']):raise ValueError('Cobrança expirada: cotação vencida, decisão do dono')
        if decimal.Decimal(str(amount))<decimal.Decimal(req['expected_amount']):raise ValueError('Valor recebido abaixo do cobrado: tratar como parcial manualmente')
        needed=cfg['min_confirmations'].get(req['network'],cfg['min_confirmations']['default'])
        if int(confirmations)<needed:raise ValueError(f'Aguardar {needed} confirmações')
        cents=int((decimal.Decimal(req['amount_usd'])*decimal.Decimal(str(brl_rate))*100).quantize(decimal.Decimal(1)))
        now=dt.datetime.now(ZONE)
        # Funil primeiro: se recusar a evidência, nada é gravado e a cobrança segue aberta.
        lead=next((r for r in sales.records() if r['domain']==req['domain']),None)
        funnel=sales.event(req['domain'],'paid',path,'payment_receipt',cents) if lead and lead['stage']=='won' else None
        c.execute('INSERT INTO receipts VALUES(?,?,?,?,?,?,?,?,?,?)',(tx_hash,request_id,str(amount),int(confirmations),str(path),hashlib.sha256(path.read_bytes()).hexdigest(),str(brl_rate),rate_source,cents,now.isoformat()))
        c.execute("UPDATE requests SET status='paid' WHERE id=?",(request_id,))
    sql=finance_sql(req,tx_hash,cents,now,lead['company'] if lead else None)
    return {'request_id':request_id,'amount_brl':cents/100,'funnel':funnel or 'lead fora da etapa won; registrar venda antes','finance_sql':str(sql)}

def finance_sql(req,tx_hash,cents,now,company_name=None):
    """Lançamento em accounts_receivable da platform; aplicado pelo dono enquanto não houver credencial dedicada."""
    q=lambda v:"'"+str(v).replace("'","''")+"'"
    day=now.date().isoformat()
    sql=(f"-- Recebimento em cripto {req['asset']}/{req['network']} tx {tx_hash}\n"
         "INSERT INTO public.accounts_receivable (organization_id, customer_id, description, invoice_number, amount, due_date, competence_date, received_at, received_amount, status)\n"
         # Cliente só por nome exato do funil; sem correspondência fica NULL para o dono vincular.
         f"SELECT o.id, {'(SELECT id FROM public.customers WHERE organization_id=o.id AND company='+q(company_name)+' ORDER BY created_at LIMIT 1)' if company_name else 'NULL'},\n"
         f"  {q(req['description']+' — '+req['amount_usd']+' USD em '+req['expected_amount']+' '+req['asset']+' ('+req['network']+'), tx '+tx_hash)}, {q('CRYPTO-'+req['id'])},\n"
         f"  {cents/100:.2f}, {q(day)}, {q(day)}, {q(now.isoformat())}, {cents/100:.2f}, 'Pago'\n"
         "FROM public.organizations o WHERE o.slug='chronokairo'\n"
         f"AND NOT EXISTS (SELECT 1 FROM public.accounts_receivable WHERE invoice_number={q('CRYPTO-'+req['id'])});\n")
    DESKTOP.mkdir(parents=True,exist_ok=True)
    path=DESKTOP/f'Financeiro-Cripto-{day}.sql'
    with path.open('a') as f:f.write(sql+'\n')
    os.chmod(path,0o600)
    return path

def report():
    with connect() as c:
        rows=[dict(r) for r in c.execute('SELECT status,count(*) n,group_concat(asset) assets FROM requests GROUP BY status')]
        total=c.execute('SELECT coalesce(sum(amount_brl_cents),0) FROM receipts').fetchone()[0]
        month=dt.datetime.now(ZONE).strftime('%Y-%m')
        monthly=c.execute("SELECT coalesce(sum(amount_brl_cents),0) FROM receipts WHERE substr(created_at,1,7)=?",(month,)).fetchone()[0]
    limit=config()['tax']['monthly_report_threshold_brl']*100
    return {'requests':rows,'received_brl':total/100,'received_brl_this_month':monthly/100,
            'tax_attention':monthly>=limit,'tax_note':config()['tax']['note']}

def main():
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='action',required=True)
    r=sub.add_parser('request');r.add_argument('--domain',required=True);r.add_argument('--amount-usd',required=True);r.add_argument('--asset',required=True);r.add_argument('--network',required=True);r.add_argument('--description',required=True);r.add_argument('--quote');r.add_argument('--quote-source')
    c=sub.add_parser('confirm');c.add_argument('--request',required=True);c.add_argument('--tx-hash',required=True);c.add_argument('--amount',required=True);c.add_argument('--confirmations',type=int,required=True);c.add_argument('--evidence',required=True);c.add_argument('--brl-rate',required=True);c.add_argument('--rate-source',required=True)
    sub.add_parser('report');sub.add_parser('check')
    a=p.parse_args()
    if a.action=='request':result=request(a.domain,a.amount_usd,a.asset,a.network,a.description,a.quote,a.quote_source)
    elif a.action=='confirm':result=confirm(a.request,a.tx_hash,a.amount,a.confirmations,a.evidence,a.brl_rate,a.rate_source)
    elif a.action=='check':cfg=config();result={'mainnet_enabled':cfg.get('mainnet_enabled',False),'addresses':sorted(cfg['receive_addresses'])}
    else:result=report()
    print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':main()

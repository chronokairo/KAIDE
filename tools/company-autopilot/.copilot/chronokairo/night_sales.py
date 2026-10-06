"""Night shift routes and bounded commercial contracts; no external sending."""
import datetime as dt
import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo
import company
import sales
DESKTOP=Path.home()/'Desktop/Chronokairo'

ROUTES=[
 ('night-demand','Revenue — madrugada: demanda declarada','revenue',['demand-scout','pipeline-auditor'],'daily',1,1,'ck-ai'),
 ('night-discovery','Revenue — madrugada: descoberta e contexto','revenue',['lead-discovery','lead-enrichment'],'daily',2,1,'ck-ai'),
 ('night-drafts','Revenue — madrugada: qualificação e SDR','revenue',['qualification','sdr'],'daily',3,1,'ck-ai'),
 ('night-brief','Revenue — madrugada: auditoria e resumo da manhã','revenue',['pipeline-auditor','control-auditor','morning-brief'],'daily',5,1,'ck-ai'),
]
KEYS={r[0] for r in ROUTES}
SOURCES={
 'prospecting':'https://architect.salesforce.com/docs/architect/fundamentals/guide/agentic-patterns',
 'workflows':'https://www.anthropic.com/engineering/building-effective-agents',
}
COMMON='''Turno de madrugada: pesquisa e preparação, sem mensagens externas, anúncios pagos, assinatura de ferramenta ou candidatura. Use somente fontes públicas acessíveis e modelos registrados; 429 encerra a etapa. Até 15 minutos e 12 chamadas por job; não expanda a pesquisa para preencher meta. Ausência de sinal é resultado válido. Retome o funil sales.py, respeitando clientes/partes bloqueadas/opt-out; nenhuma issue interna é demanda comercial. O turno diurno reutiliza este trabalho e não pesquisa os mesmos domínios novamente.\n'''
INSTRUCTIONS={
 'night-demand':'''Pesquise no máximo 3 pedidos empresariais explícitos, publicados nos últimos 30 dias. Exija URL, data do pedido, empresa, problema e forma oficial de candidatura/contato. Vaga de emprego não prova interesse em contratar agência: marque employment_only e não trate como oportunidade de serviço sem indicação de contratação de fornecedor. Pedido vencido/sem remuneração/identidade não confirmada é rejeitado. Auditor confere a evidência independente antes da persistência; se não conseguir abrir a fonte, marque unverified e não qualifique. Registre source_type=demand apenas para pedido de serviço/fornecedor explícito, com service_request={kind: rfp|freelance|contractor|vendor_request, excerpt, url, published_at}. Não execute candidatura.\n''',
 'night-discovery':'''Pesquise no máximo 2 novos domínios ainda ausentes no funil, para manter total noturno até 5. Priorize ICP e idioma configurados, indicações, fornecedores solicitados e problemas documentados. Vagas full-time sem abertura a fornecedor não devem consumir a cota noturna de descoberta. Enriquecimento confirma fonte empresarial e canal oficial; orçamento/interesse não confirmados ficam unknown. Não presumir problema por ausência de informação no site. Salve por sales.py ingest apenas registros com fontes verificadas e dados obrigatórios. Informe fit_score=0 enquanto qualificação não ocorrer. Preserve sinais já coletados às 01h.\n''',
 'night-drafts':'''Não faça descoberta nova. Selecione no máximo 5 registros candidate/qualified do funil sem draft, excluindo blocked/opt_out/rejected/paid e datas expiradas. Use evidências anteriores; quando faltarem, registre lacuna e pule o candidato. Pontue adequação separadamente de intenção. SDR prepara somente para qualified; não crie proposta formal sem resposta real. Registre critérios de score, fontes e draft no mesmo domínio por sales.py ingest. Não regresse registros com eventos de envio/resposta.\n''',
 'night-brief':'''Não faça pesquisa nem crie candidatos. Coordenador executa python3 ~/.copilot/chronokairo/night_sales.py brief para produzir snapshot factual do funil. Pipeline auditor confere evidências e etapas; control auditor confere status/limites dos jobs noturnos no runtime e não presume sucesso por completed. Passe ambos os resultados ao ck-morning-brief: até 5 ações comerciais priorizadas com fonte, motivo, canal, rascunho e incertezas. Coordenador escreve análise em Desktop/Chronokairo/Comercial-Manha-<data>-Analise.md; preserva o snapshot e registra os caminhos em company.py report. Se etapas anteriores falharam, resuma resultados parciais, bloqueios e próxima ação; nunca invente leads.\n''',
}
def instruction(key):
    if key not in KEYS:return ''
    return '\nContrato da madrugada:\n'+COMMON+INSTRUCTIONS[key]

def augment(profiles):
    participants={w for r in ROUTES for w in r[3]}
    for p in profiles:
        if p['id'].removeprefix('ck-') in participants or p['id'] in {'ck-revenue-orchestrator','ck-orchestrator'}:
            p['content']+='\nFundamentação e aceite de pesquisa:\n'+COMMON+'''Padrão operacional adaptado de Salesforce Architects (pesquisar → qualificar → registrar) e Anthropic (etapas com gates e critérios de conclusão). Isso fundamenta o desenho; não certifica este agente nem comprova resultado de vendas. Fontes e matriz de aceite: ~/.copilot/chronokairo/night-sales-validation.md.\n'''
    return profiles

def preflight(key):
    """Dependency gate and durable ledger queue; no model calls for an empty batch."""
    if key!='night-drafts':return {'status':'ready','route':key}
    for upstream in ['night-demand','night-discovery']:
        active=company.runtime_binding(upstream)
        if active:return {'status':'blocked','reason':'Upstream still running: '+upstream,'retry':'next scheduled cycle; ledger retains pending records'}
    eligible=[r for r in sales.records() if r['stage'] in {'candidate','qualified'} and not r['details'].get('draft')]
    eligible.sort(key=lambda r:(r['created_at'],r['domain']))
    batch=[{'domain':r['domain'],'updated_at':r['updated_at']} for r in eligible[:5]]
    return {'status':'ready' if batch else 'empty','route':key,'batch':batch}


def brief():
    day=dt.datetime.now(ZoneInfo('America/Caracas')).date().isoformat()
    records=sales.records()
    eligible=[r for r in records if r['stage'] in {'candidate','qualified','draft_ready'}]
    priority={'demand':0,'referral':1,'inbound':2,'outbound':3}
    eligible.sort(key=lambda r:(priority.get(r['details'].get('source_type','outbound'),3),-r['details'].get('fit_score',0),r['domain']))
    chosen=eligible[:5]
    body=f'# Comercial — resumo da manhã — {day}\n\nSnapshot do funil, não prova de execução das rotinas noturnas. Não houve envio automático por este helper.\n\n'
    body+=f'Registros disponíveis: {len(records)}; candidatos/qualificados com ação pendente: {len(eligible)}. Seleção: {len(chosen)}. Auditoria dos agentes deve conferir fontes e marcar registros não verificáveis antes de recomendar abordagem.\n'
    if not chosen:body+='\nSem candidato elegível. Conferir falhas do runtime e pesquisar demanda no próximo ciclo; não preencher com empresas inventadas.\n'
    for row in chosen:
        d=row['details']
        body+=f'\n## {row["company"]}\n\nDomínio: {row["domain"]}; estado: {row["stage"]}; origem: {d.get("source_type","outbound")}; adequação: {d.get("fit_score",0)}/4.\n\nSinal/hipótese: {d["demand_signal"]}\n\nCanal: {d["business_contact_url"]}\n\nPróxima ação: {d["next_action"]}\n\nFontes:\n'
        for source in d['sources']:body+=f'- {source["url"]} (conferência registrada: {source["checked_at"]})\n'
        body+='\nOrçamento, decisor, urgência e interesse: desconhecidos até evidência específica.\n'
        if d.get('draft'):body+='\nRascunho, não enviado:\n\n'+d['draft']+'\n'
    DESKTOP.mkdir(parents=True,exist_ok=True)
    path=DESKTOP/f'Comercial-Manha-{day}.md';company.atomic(path,company.redact(body));os.chmod(path,0o600)
    return {'document':str(path),'selected':len(chosen),'snapshot_only':True}
if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('command',choices=['brief','preflight']);parser.add_argument('--route',default='night-drafts');args=parser.parse_args()
    print(json.dumps(brief() if args.command=='brief' else preflight(args.route),ensure_ascii=False))

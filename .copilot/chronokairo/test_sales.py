import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import sales
import configure

def lead(**values):
    return dict({'company':'Synthetic Clinic','website':'https://synthetic.example.test','segment':'occupational','city':'Manaus',
        'business_contact_url':'https://synthetic.example.test/contact','demand_signal':'Hypothesis, not buyer intent',
        'fit_criteria':[{'criterion':str(i),'evidence':'Synthetic evidence','source_url':'https://synthetic.example.test'} for i in range(3)],
        'offer':'Scoped service','next_action':'Review draft','fit_score':3,'draft':'Synthetic draft',
        'sources':[{'url':'https://synthetic.example.test','checked_at':'2026-10-05','fact':'Official business website'}]},**values)

class SalesTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name);self.desktop=self.base/'Desktop'
        (self.base/'sales-config.json').write_bytes((sales.BASE/'sales-config.json').read_bytes())
        self.patch=patch.object(sales,'BASE',self.base);self.patch.start();self.addCleanup(self.patch.stop)
        self.patch2=patch.object(sales,'DESKTOP',self.desktop);self.patch2.start();self.addCleanup(self.patch2.stop)
    def test_existing_customer_rejected(self):
        for value in [lead(company='Audiomed'),lead(website='https://www.audiomedam.com.br'),lead(website='https://app.audiomedam.com.br')]:
            with self.assertRaises(ValueError):sales.ingest([value])
    def test_blocked_party_rejected(self):
        for value in [lead(company='Colégio Século Manaus'),lead(company='WD Educacional LTDA'),lead(website='https://portal.ciesa.br')]:
            with self.assertRaises(ValueError):sales.ingest([value])
    def test_source_type_and_funnel_metrics(self):
        with self.assertRaises(ValueError):sales.ingest([lead(source_type='spam')])
        with self.assertRaises(ValueError):sales.ingest([lead(source_type='referral')])
        sales.ingest([lead(source_type='referral',referred_by='Audiomed',language='pt-BR')])
        evidence=self.base/'receipt.txt';evidence.write_text('Synthetic fixture only')
        sales.event('synthetic.example.test','sent',evidence,'send_receipt')
        reply=self.base/'reply.txt';reply.write_text('Synthetic reply')
        sales.event('synthetic.example.test','replied',reply,'prospect_reply')
        funnel=sales.funnel_metrics()['referral']
        self.assertEqual((funnel['qualified'],funnel['sent'],funnel['replied'],funnel['meeting']),(1,1,1,0))
        self.assertEqual((funnel['reply_rate'],funnel['meeting_rate'],funnel['win_rate']),('100%','0%','n/a'))
        self.assertEqual(sales.funnel_metrics()['outbound']['sent'],0)
    def test_owner_attestation_covers_only_sent_meeting_and_exits(self):
        sales.ingest([lead()])
        result=sales.attest('synthetic.example.test','sent','e-mail','primeiro toque')
        self.assertEqual(result['status'],'needs_evidence')
        self.assertEqual(sales.records()[0]['stage'],'draft_ready')
        with self.assertRaises(ValueError):sales.event('synthetic.example.test','sent',result['document'],'send_receipt')
        with self.assertRaises(ValueError):sales.attest('synthetic.example.test','won','e-mail','')
        self.assertEqual(sales.attest('synthetic.example.test','meeting','e-mail','')['status'],'needs_evidence')

        sales.ingest([lead()]);sales.ingest([lead(website='https://www.synthetic.example.test/path')])
        self.assertEqual(len(sales.records()),1)
        metrics=sales.report();self.assertEqual(metrics['evidence_counts']['replied'],0);self.assertEqual(metrics['paid_cents'],0)
    def test_requires_source_and_valid_score(self):
        for value in [lead(sources=[]),lead(fit_score=True),lead(fit_score=9),lead(business_contact_url='mailto:x@example.test')]:
            with self.assertRaises(ValueError):sales.ingest([value])
    def test_evidence_cannot_skip_stages_or_fake_payments(self):
        sales.ingest([lead()]);evidence=self.base/'receipt.txt';evidence.write_text('Synthetic fixture only')
        with self.assertRaises(ValueError):sales.event('synthetic.example.test','paid',evidence,'payment_receipt',500)
        with self.assertRaises(ValueError):sales.event('synthetic.example.test','sent',evidence,'prospect_reply')
        with self.assertRaises(ValueError):sales.event('synthetic.example.test','sent',self.base/'missing','send_receipt')
        first=sales.event('synthetic.example.test','sent',evidence,'send_receipt')
        self.assertTrue(sales.event('synthetic.example.test','sent',evidence,'send_receipt')['duplicate'])
        sales.ingest([lead()]);self.assertEqual(sales.records()[0]['stage'],'sent')
        self.assertEqual(sales.report()['evidence_counts']['sent'],1)
        self.assertFalse(first['duplicate'])
    def test_opt_out_survives_research(self):
        sales.ingest([lead()]);proof=self.base/'opt-out.txt';proof.write_text('Synthetic opt out')
        sales.event('synthetic.example.test','opt_out',proof,'opt_out');sales.ingest([lead()])
        self.assertEqual(sales.records()[0]['stage'],'opt_out')
        with self.assertRaises(ValueError):sales.event('synthetic.example.test','sent',proof,'send_receipt')
    def test_receipts_count_actual_stages_and_payment_once(self):
        sales.ingest([lead()]);proof=self.base/'evidence.txt';proof.write_text('Synthetic lifecycle fixtures, not real business')
        for stage in ['sent','replied','meeting','won']:
            sales.event('synthetic.example.test',stage,proof,sales.TYPES[stage])
        with self.assertRaises(ValueError):sales.event('synthetic.example.test','paid',proof,'payment_receipt',0)
        sales.event('synthetic.example.test','paid',proof,'payment_receipt',12345)
        self.assertTrue(sales.event('synthetic.example.test','paid',proof,'payment_receipt',12345)['duplicate'])
        self.assertEqual(sales.report()['paid_cents'],12345)
        sales.ingest([lead()]);self.assertEqual(sales.records()[0]['stage'],'paid')
    def test_bad_batch_is_not_partially_imported(self):
        with self.assertRaises(ValueError):sales.ingest([lead(),lead(company='Audiomed')])
        self.assertEqual(sales.records(),[])
    def test_generator_has_registered_models_and_complete_routes(self):
        profiles=configure.build('synthetic-provider');ids={p['id'] for p in profiles}
        self.assertEqual(len(ids),41)
        for agent in ['ck-sdr','ck-pipeline-auditor','ck-demand-scout','ck-reply-triage','ck-referral','ck-partnerships']:self.assertIn(agent,ids)
        for flow in configure.FLOWS:self.assertTrue(all('ck-'+w in ids for w in flow[3]))
        for p in profiles:
            if p['domain']=='revenue':self.assertIn('Contrato comercial específico' if p['kind']=='worker' else 'sales.py',p['content'])
if __name__=='__main__':unittest.main()

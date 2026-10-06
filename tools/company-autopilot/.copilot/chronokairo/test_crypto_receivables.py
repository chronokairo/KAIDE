import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import crypto_receivables as cr
import sales

CONFIG={'mainnet_enabled':False,'assets':[{'symbol':'USDC','stablecoin':True,'decimals':6,'networks':['base','sepolia']},{'symbol':'XMR','stablecoin':False,'decimals':12,'networks':['monero-stagenet']}],
        'testnets':['sepolia','monero-stagenet'],'receive_addresses':{'USDC:sepolia':'0xabc','XMR:monero-stagenet':'5abc'},'min_confirmations':{'default':12},
        'quote_validity_minutes':30,'invoice_validity_days':7,'tax':{'monthly_report_threshold_brl':30000,'note':'n'}}
TX='0x'+'a'*64

class CryptoReceivablesTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.base=Path(self.temp.name)
        (self.base/'crypto-config.json').write_text(json.dumps(CONFIG))
        (self.base/'sales-config.json').write_bytes((sales.BASE/'sales-config.json').read_bytes())
        for target,attr,value in [(cr,'BASE',self.base),(cr,'DESKTOP',self.base/'Desktop'),(sales,'BASE',self.base),(sales,'DESKTOP',self.base/'Desktop')]:
            p=patch.object(target,attr,value);p.start();self.addCleanup(p.stop)
    def config(self,**changes):(self.base/'crypto-config.json').write_text(json.dumps(dict(CONFIG,**changes)))

    def test_secrets_in_config_are_refused(self):
        self.config(receive_addresses={'USDC:sepolia':'0xabc'},wallet={'seed_phrase':'x'})
        with self.assertRaises(RuntimeError):cr.config()

    def test_mainnet_and_missing_address_are_blocked(self):
        with self.assertRaises(ValueError):cr.request('acme.com',100,'USDC','base','Roadmapping')
        self.config(mainnet_enabled=True)
        with self.assertRaises(ValueError):cr.request('acme.com',100,'USDC','base','Roadmapping')

    def test_volatile_asset_needs_quote(self):
        with self.assertRaises(ValueError):cr.request('acme.com',100,'XMR','monero-stagenet','Sprint')
        r=cr.request('acme.com',100,'XMR','monero-stagenet','Sprint',quote=200,quote_source='synthetic')
        self.assertEqual(r['pay'],'0.500000000000 XMR')

    def test_confirm_records_brl_finance_sql_and_rejects_reuse(self):
        r=cr.request('acme.com',950,'USDC','sepolia','Roadmapping')
        ev=self.base/'explorer.txt';ev.write_text('synthetic explorer page')
        with self.assertRaises(ValueError):cr.confirm(r['request_id'],TX,'900',20,ev,'5.40','PTAX')
        with self.assertRaises(ValueError):cr.confirm(r['request_id'],TX,'950',3,ev,'5.40','PTAX')
        out=cr.confirm(r['request_id'],TX,'950',20,ev,'5.40','PTAX 2026-10-06')
        self.assertEqual(out['amount_brl'],5130.0)
        self.assertIn("'Pago'",Path(out['finance_sql']).read_text())
        with self.assertRaises(ValueError):cr.confirm(r['request_id'],TX,'950',20,ev,'5.40','PTAX')
        self.assertEqual(cr.report()['received_brl'],5130.0)

if __name__=='__main__':unittest.main()

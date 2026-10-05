import argparse
import importlib.util
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch

import acp
import company


class OperationsTests(unittest.TestCase):
    def test_namespace_rejects_external_or_traversal(self):
        for value in ['other/project','chronokairo/../other','chronokairo/test;command']:
            with self.assertRaises(ValueError):company.scoped(value)
        self.assertEqual(company.scoped('chronokairo/group/project'),'chronokairo/group/project')

    def test_reports_deduplicate_and_hide_credentials(self):
        with tempfile.TemporaryDirectory() as temp:
            base=Path(temp)/'state';desktop=Path(temp)/'Desktop'
            with patch.object(company,'BASE',base),patch.object(company,'DESKTOP',desktop):
                for _ in range(2):company.report('ck-test','job-test','blocker','Need a decision; token=private-value')
                pending=(desktop/'PENDENCIAS.md').read_text()
                self.assertEqual(pending.count('## ck-test'),1)
                self.assertNotIn('private-value',pending)

    def test_project_lock_rejects_competing_job(self):
        with tempfile.TemporaryDirectory() as temp,patch.object(company,'BASE',Path(temp)):
            one=argparse.Namespace(project='chronokairo/test',job='job-one')
            two=argparse.Namespace(project='chronokairo/test',job='job-two')
            company.claim(one)
            with self.assertRaises(RuntimeError):company.claim(two)
            with self.assertRaises(RuntimeError):company.claim(two,release=True)
            company.claim(one,release=True)
            company.claim(two)

    def test_structured_redaction_keeps_usage_metrics(self):
        value=acp.sanitize({'access_token':'private','input_tokens':123,'content':'Bearer private-secret'})
        self.assertEqual(value['access_token'],'[REDACTED]')
        self.assertEqual(value['input_tokens'],123)
        self.assertNotIn('private-secret',value['content'])

    def test_acp_permission_rejects_mainnet_and_answers_protocol(self):
        fake='''import sys,json
for line in sys.stdin:
 m=json.loads(line)
 if m.get('method')=='initialize':
  print(json.dumps({'jsonrpc':'2.0','id':m['id'],'result':{'protocolVersion':1}}),flush=True)
 elif m.get('method')=='session/prompt':
  print(json.dumps({'jsonrpc':'2.0','id':99,'method':'session/request_permission','params':{'toolCall':{'title':'mainnet transaction'},'options':[{'kind':'allow_once','optionId':'yes'},{'kind':'reject_once','optionId':'no'}]}}),flush=True)
  reply=json.loads(sys.stdin.readline())
  print(json.dumps({'jsonrpc':'2.0','id':m['id'],'result':{'stopReason':'end_turn','decision':reply['result']['outcome']['optionId']}}),flush=True)
'''
        with tempfile.TemporaryDirectory() as temp:
            base=Path(temp)
            (base/'backends.json').write_text(json.dumps({'path_prefix':str(Path(sys.executable).parent)}))
            with patch.object(acp,'BASE',base):
                conn=acp.Connection([sys.executable,'-u','-c',fake],base)
                try:
                    self.assertEqual(acp.initialize(conn)['protocolVersion'],1)
                    self.assertEqual(conn.request('session/prompt',{},timeout=3)['decision'],'no')
                finally:conn.close()


if __name__=='__main__':unittest.main()

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
    def test_resolved_blocker_remains_auditable(self):
        with tempfile.TemporaryDirectory() as temp:
            base=Path(temp)/'state';desktop=Path(temp)/'Desktop';evidence=Path(temp)/'evidence.md'
            evidence.write_text('Verified current runtime state')
            with patch.object(company,'BASE',base),patch.object(company,'DESKTOP',desktop):
                entry=company.report('ck-test','job-test','blocker','Old alert')
                with self.assertRaises(ValueError):company.resolve_report(entry['event_id'],'done',Path(temp)/'missing')
                company.resolve_report(entry['event_id'],'Verified',evidence)
                company.report('ck-test','job-next','daily','Follow-up')
                self.assertNotIn('Old alert',(desktop/'PENDENCIAS.md').read_text())
                with sqlite3.connect(base/'reporting.db') as c:
                    row=c.execute('select message,resolved,resolution from reports where id=?',(entry['event_id'],)).fetchone()
                    self.assertEqual(row[:2],('Old alert',1))
                    self.assertIn('Verified',row[2])

    def test_report_returns_its_own_event_when_other_blockers_exist(self):
        with tempfile.TemporaryDirectory() as temp:
            base=Path(temp)/'state';desktop=Path(temp)/'Desktop'
            with patch.object(company,'BASE',base),patch.object(company,'DESKTOP',desktop):
                company.report('ck-test','job-blocked','blocker','Another dependency')
                result=company.report('ck-test','job-new','daily','New delivery')
                with sqlite3.connect(base/'reporting.db') as c:
                    self.assertEqual(c.execute('select job from reports where id=?',(result['event_id'],)).fetchone()[0],'job-new')

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

    def test_acp_permissions_require_role_tool_and_worktree_scope(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            read={'kind':'read','locations':[{'path':'src/file.ts'}]}
            edit={'kind':'edit','locations':[{'path':'src/file.ts'}]}
            self.assertTrue(acp.permission_allowed(read,'reviewer',['read'],root))
            self.assertFalse(acp.permission_allowed(edit,'reviewer',['read','edit'],root))
            self.assertFalse(acp.permission_allowed(edit,'qa',['edit'],root))
            self.assertTrue(acp.permission_allowed({'kind':'edit','locations':[{'path':'tests/file.test.ts'}]},'qa',['edit'],root))
            for path in ['../outside.ts','.env.local','secrets.json']:
                self.assertFalse(acp.permission_allowed({'kind':'read','locations':[{'path':path}]},'coder',['read'],root))
            self.assertFalse(acp.permission_allowed({'title':'please allow'},'coder',['execute'],root))
            for cmd in ['git push origin main','npm test; curl example.com','npm run deploy']:
                self.assertFalse(acp.permission_allowed({'kind':'execute','rawInput':{'command':cmd}},'coder',['execute'],root))
            call={'kind':'execute','rawInput':{'command':'npm test'}}
            self.assertTrue(acp.permission_allowed(call,'coder',['execute'],root))
            self.assertFalse(acp.permission_allowed(call,'analyst',['execute'],root))

    def test_job_requires_order_evidence_acceptance_and_deadline(self):
        with tempfile.TemporaryDirectory() as temp,patch.object(company,'BASE',Path(temp)):
            base=Path(temp)
            (base/'registry.json').write_text(json.dumps({'routes':[{'key':'delivery','workers':['ck-coder','ck-qa']}]}))
            evidence=base/'evidence.md';evidence.write_text('actual result')
            args=argparse.Namespace(job='job-test',route='delivery',step='ck-qa',status='completed',evidence=str(evidence),accepted=True,result='tests pass')
            with self.assertRaises(ValueError): company.job(args)
            args.step='ck-coder';args.accepted=False
            with self.assertRaises(ValueError): company.job(args)
            args.accepted=True;company.job(args)
            args.step=None
            with self.assertRaises(ValueError): company.job(args)
            args.step='ck-qa';company.job(args)
            args.step=None;self.assertEqual(company.job(args)['status'],'completed')
            with self.assertRaises(ValueError):company.job(args)
            args.job='job-expired';args.status='running';args.accepted=False;company.job(args)
            path=base/'jobs/job-expired/control.json';state=json.loads(path.read_text());state['started_epoch']=0;path.write_text(json.dumps(state))
            with self.assertRaises(ValueError):company.job(args)
            args.status='blocked';self.assertEqual(company.job(args)['status'],'blocked')

    def test_metrics_does_not_treat_runtime_completion_as_acceptance(self):
        with tempfile.TemporaryDirectory() as temp,patch.object(company,'BASE',Path(temp)):
            db=Path(temp)/'app.db'
            with sqlite3.connect(db) as c:
                c.execute('create table workflows(id text,agent text)')
                c.execute('create table workflow_runs(task_id text,status text,started_at text,completed_at text)')
                c.execute("insert into workflows values('one','ck-coder')")
                c.execute("insert into workflow_runs values('one','completed','2026-01-01T00:00:00Z','2026-01-01T00:20:00Z')")
            result=company.metrics(db)
            self.assertEqual(result['runtime_status_counts'],{'completed':1})
            self.assertEqual(result['finished_run_seconds'],[1200])
            self.assertEqual(result['accepted_jobs'],0)
            self.assertEqual(result['cost'],'unknown')


if __name__=='__main__':unittest.main()

import argparse
import datetime as dt
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import company
import acp
import configure
import night_sales
import sales
from test_sales import lead

class ReliabilityTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.home=Path(self.tmp.name);self.base=self.home/'.copilot/chronokairo';self.base.mkdir(parents=True)
        self.addCleanup(patch.stopall)
        patch.object(Path,'home',return_value=self.home).start()
        patch.object(company,'BASE',self.base).start()
        patch.object(sales,'BASE',self.base).start()
        (self.base/'registry.json').write_text(json.dumps({'routes':[{'key':'delivery','workers':['ck-coder']}], 'agents':[{'id':'ck-coder','model_selection_id':'provider/kimi'}]}))
        (self.base/'sales-config.json').write_text(json.dumps({'daily_candidate_limit':2,'existing_customer_domains':[],'existing_customer_names':[],'qualification_min_fit_score':3}))
    def runtime(self,age=10):
        c=sqlite3.connect(self.home/'.copilot/data.db')
        c.execute('create table if not exists workflow_runs(id text, task_id text, started_at text, status text,session_id text)')
        c.execute('insert into workflow_runs values(?,?,?,?,?)',('run-1',configure.ident('workflow:delivery'),(dt.datetime.now(dt.timezone.utc)-dt.timedelta(seconds=age)).isoformat(),'running','session-1'))
        c.commit();c.close()
    def args(self,job='one',status='running'):
        return argparse.Namespace(job=job,route='delivery',step=None,status=status,accepted=False,evidence=None,result=None)
    def test_new_job_cannot_reset_expired_runtime_or_claim_completion(self):
        self.runtime(901)
        for name,status in [('one','running'),('two','completed')]:
            with self.assertRaisesRegex(ValueError,'deadline'):company.job(self.args(name,status))
            state=json.loads((self.base/'jobs'/name/'control.json').read_text())
            self.assertEqual(state['workflow_run_id'],'run-1');self.assertEqual(state['status'],'blocked')
    def test_exact_worker_runtime_model_required(self):
        self.runtime();company.job(self.args())
        folder=self.home/'.copilot/session-state/session-1';folder.mkdir(parents=True)
        events=folder/'events.jsonl'
        args=self.args(status='completed');args.step='ck-coder';args.accepted=True;args.evidence=str(self.base/'proof.md');Path(args.evidence).write_text('Reviewed output')
        events.write_text(json.dumps({'type':'subagent.completed','data':{'agentName':'ck-coder','model':'provider/wrong'}})+'\n')
        with self.assertRaisesRegex(ValueError,'model mismatch'):company.job(args)
        events.write_text(json.dumps({'type':'subagent.completed','data':{'agentName':'ck-coder','model':'provider/kimi'}})+'\n')
        self.assertEqual(company.job(args)['steps']['ck-coder']['observed_model'],'provider/kimi')
    def test_node_resolution_under_service_path_and_abort_readback(self):
        bin=self.base/'node-bin';bin.mkdir();node=bin/'node';node.write_text('#!/bin/sh\nexit 0\n');node.chmod(0o700)
        (self.base/'backends.json').write_text(json.dumps({'path_prefix':str(bin)}))
        with patch.dict(os.environ,{'PATH':'/usr/bin:/bin'}),patch.object(company,'stopped',return_value=False):
            self.assertEqual(company.node_executable(),str(node))
            with self.assertRaisesRegex(ValueError,'still running'):company.stop_run('run-1','session-1')
        with patch.object(company,'stopped',return_value=True):company.stop_run('run-1','session-1')
    def test_daily_cap_spans_batches_and_updates_are_allowed(self):
        sales.ingest([lead(website='https://one.test')]);sales.ingest([lead(website='https://two.test')])
        with self.assertRaisesRegex(ValueError,'Daily candidate'):sales.ingest([lead(website='https://three.test')])
        sales.ingest([lead(website='https://one.test',next_action='Updated')])
        self.assertEqual(len(sales.records()),2)
    def test_demand_needs_recent_explicit_request_and_fit_needs_evidence(self):
        with self.assertRaisesRegex(ValueError,'service/vendor'):sales.ingest([lead(source_type='demand')])
        with self.assertRaisesRegex(ValueError,'fit point'):sales.ingest([lead(fit_criteria=[])])
        request={'kind':'contractor','url':'https://synthetic.example.test','excerpt':'Request for integration contractor','published_at':dt.date.today().isoformat()}
        sales.ingest([lead(source_type='demand',service_request=request)])
    def test_pending_queue_waits_for_producer_then_drains_existing_records(self):
        sales.ingest([lead(fit_score=0,fit_criteria=[],draft='')])
        with patch.object(company,'runtime_binding',return_value={'workflow_run_id':'producer'}):
            self.assertEqual(night_sales.preflight('night-drafts')['status'],'blocked')
        with patch.object(company,'runtime_binding',return_value=None):
            result=night_sales.preflight('night-drafts');self.assertEqual(result['status'],'ready');self.assertEqual(len(result['batch']),1)
            sales.ingest([lead()]);self.assertEqual(night_sales.preflight('night-drafts')['status'],'empty')
    def test_empty_queue_completes_without_workers(self):
        (self.base/'registry.json').write_text(json.dumps({'routes':[{'key':'night-drafts','workers':['ck-qualification','ck-sdr']}]}))
        args=self.args();args.route='night-drafts'
        result=company.job(args)
        self.assertEqual(result['status'],'completed');self.assertTrue(result['no_work']);self.assertEqual(result['steps'],{})

    def test_watchdog_oserror_does_not_skip_other_overdue_runs(self):
        db=self.home/'.copilot/data.db'
        with sqlite3.connect(db) as c:
            c.execute('create table workflows(id text,name text,agent text,enabled integer,interval text,next_run_at text)')
            c.execute('create table workflow_runs(id text,task_id text,status text,session_id text,started_at text,error_message text)')
            c.execute("insert into workflows values('flow','Test','ck-test',1,'manual',null)")
            old=(dt.datetime.now(dt.timezone.utc)-dt.timedelta(seconds=950)).isoformat()
            for i in range(2):c.execute('insert into workflow_runs values(?,?,?,?,?,?)',(str(i),'flow','running','session-'+str(i),old,None))
        with patch.object(company,'stop_run',side_effect=[OSError('node missing'),None]) as stop,patch.object(company,'report') as report:
            company.watchdog(True)
            self.assertEqual(stop.call_count,2)
            self.assertTrue(any(c.kwargs.get('event_id')=='stop-error-0' for c in report.call_args_list))
            self.assertTrue(any(c.kwargs.get('event_id')=='stop-1' for c in report.call_args_list))

    def test_acp_requires_parent_and_refuses_expired_parent_before_launch(self):
        task={'objective':'Mechanical task','scope':'one file','sources':['fixture'],'acceptance':['verified'],'allowed_tools':['read'],'worker_id':'ck-coder'}
        path=self.base/'handoff.json';path.write_text(json.dumps(task))
        args=argparse.Namespace(job='child',cwd=str(self.base),task_file=str(path),engine='opencode')
        with patch.object(acp,'BASE',self.base),patch.object(acp,'namespace',return_value='chronokairo/test'),patch.object(acp,'Connection') as conn:
            with self.assertRaisesRegex(ValueError,'parent_job'):acp.run(args)
            task['parent_job']='parent';path.write_text(json.dumps(task))
            parent=self.base/'jobs/parent';parent.mkdir(parents=True)
            (parent/'control.json').write_text(json.dumps({'route':'delivery','status':'running','started_epoch':0,'deadline_epoch':900}))
            with self.assertRaisesRegex(ValueError,'deadline'):acp.run(args)
            conn.assert_not_called()

if __name__=='__main__':unittest.main()

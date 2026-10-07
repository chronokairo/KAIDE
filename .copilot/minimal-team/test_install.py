import datetime as dt
from contextlib import closing
import importlib.util
from pathlib import Path
import sqlite3
import tempfile
import types
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('minimum_install', Path(__file__).with_name('install.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class MinimumTeamTests(unittest.TestCase):
    def test_monday_midnight_is_utc_0400(self):
        agent = {'interval':'weekly','hour':0,'minute':0,'weekday':1}
        now = dt.datetime(2026,10,7,18,tzinfo=dt.timezone.utc)
        self.assertEqual(module.next_run(agent, now), '2026-10-12T04:00:00.000Z')

    def test_monday_after_due_moves_to_following_week(self):
        agent = {'interval':'weekly','hour':0,'minute':0,'weekday':1}
        now = dt.datetime(2026,10,12,4,tzinfo=dt.timezone.utc)
        self.assertEqual(module.next_run(agent, now), '2026-10-19T04:00:00.000Z')

    def test_daily_schedule_respects_manaus_date(self):
        agent = {'interval':'daily','hour':1,'minute':0,'weekday':1}
        # UTC next date, but still 23:30 in Manaus.
        now = dt.datetime(2026,10,8,3,30,tzinfo=dt.timezone.utc)
        self.assertEqual(module.next_run(agent, now), '2026-10-08T05:00:00.000Z')

    def database(self, home):
        c=sqlite3.connect(home/'data.db')
        c.executescript("""
        CREATE TABLE model_providers(id TEXT PRIMARY KEY,name TEXT);
        CREATE TABLE provider_models(provider_id TEXT,model_id TEXT);
        CREATE TABLE projects(id TEXT PRIMARY KEY,main_repo_path TEXT);
        CREATE TABLE workflows(id TEXT PRIMARY KEY,name TEXT,prompt TEXT,model TEXT,project_id TEXT,
          interval TEXT,schedule_hour INTEGER,schedule_day INTEGER,schedule_minute INTEGER,next_run_at TEXT,
          agent TEXT,enabled INTEGER,mode TEXT,workspace_type TEXT,agent_scope TEXT,cron_expression TEXT,updated_at TEXT);
        CREATE TABLE workflow_runs(id TEXT PRIMARY KEY,task_id TEXT REFERENCES workflows(id),status TEXT,session_id TEXT);
        INSERT INTO model_providers VALUES('existing-provider','Nvidia');
        INSERT INTO workflows(id,name,enabled) VALUES('old','Old workflow',1);
        INSERT INTO workflow_runs VALUES('failure','old','failed','old-session');
        INSERT INTO workflow_runs VALUES('active','old','running','active-session');
        """)
        c.executemany('INSERT INTO provider_models VALUES(?,?)', [('existing-provider','z-ai/glm-5.3'),('existing-provider','moonshotai/kimi-k3')])
        for name in ('crm','company-autopilot','payments'):
            c.execute('INSERT INTO projects VALUES(?,?)', (name,str(home/'repos'/name)))
        c.commit();c.close()

    def git(self, args, **kwargs):
        name=Path(args[2]).name
        return types.SimpleNamespace(returncode=0,stdout='https://github.com/chronokairo/'+name+'.git\n')

    def test_install_preserves_history_and_uses_existing_provider(self):
        with tempfile.TemporaryDirectory() as temp:
            home=Path(temp);self.database(home)
            agents=home/'agents';agents.mkdir();(agents/'old.agent.md').write_text('old')
            with patch.object(module.subprocess,'run',side_effect=self.git), patch.object(module,'check_machine_timezone'):
                result=module.install(home,apply=True)
            c=sqlite3.connect(home/'data.db')
            self.assertEqual(c.execute('SELECT count(*) FROM workflows WHERE enabled=1').fetchone()[0],3)
            self.assertEqual(c.execute('SELECT enabled FROM workflows WHERE id=\'old\'').fetchone()[0],0)
            self.assertEqual(c.execute('SELECT count(*) FROM workflow_runs').fetchone()[0],2)
            self.assertEqual(result['runs_to_cancel'][0]['id'],'active')
            self.assertEqual({p.stem for p in agents.glob('*.agent.md')},{'comercial.agent','security.agent','payment.agent'})
            for p in agents.glob('*.agent.md'):
                self.assertIn('existing-provider/',p.read_text(encoding='utf-8'))
                self.assertNotIn('__NVIDIA_PROVIDER__',p.read_text(encoding='utf-8'))
            c.close()

    def test_missing_model_aborts_before_mutation(self):
        with tempfile.TemporaryDirectory() as temp:
            home=Path(temp);self.database(home)
            with closing(sqlite3.connect(home/'data.db')) as c:
                c.execute("DELETE FROM provider_models WHERE model_id='moonshotai/kimi-k3'")
                c.commit()
            with patch.object(module.subprocess,'run',side_effect=self.git), self.assertRaisesRegex(RuntimeError,'Model not registered'):
                module.install(home,apply=True)
            with closing(sqlite3.connect(home/'data.db')) as c:
                self.assertEqual(c.execute('SELECT enabled FROM workflows WHERE id=\'old\'').fetchone()[0],1)
            self.assertFalse((home/'backups').exists())

if __name__=='__main__':
    unittest.main()

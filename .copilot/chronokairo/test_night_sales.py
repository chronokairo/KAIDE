import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
import configure
import install_sales
import night_sales

class NightSalesTests(unittest.TestCase):
    def test_bounded_routes_and_registered_workers(self):
        profiles=configure.build('provider');ids={p['id'] for p in profiles}
        self.assertEqual(len(ids),40);self.assertIn('ck-morning-brief',ids)
        self.assertEqual([(r[5],configure.MINUTES.get(r[0],0)) for r in night_sales.ROUTES],[(1,0),(2,0),(3,0),(5,30)])
        for flow in night_sales.ROUTES:
            self.assertTrue(all('ck-'+w in ids for w in flow[3]))
            prompt,owner=configure.route_prompt(flow[0],flow[2],flow[3],flow[7])
            self.assertEqual(owner,'ck-revenue-orchestrator')
            self.assertIn('Até 15 minutos',prompt);self.assertIn('Não enviar mensagens externas',prompt)
            self.assertNotIn('abra PR/MR',prompt)
        self.assertIn('employment_only',night_sales.INSTRUCTIONS['night-demand'])
        self.assertIn('Não faça descoberta nova',night_sales.INSTRUCTIONS['night-drafts'])
    def test_empty_and_opt_out_do_not_become_opportunities(self):
        with tempfile.TemporaryDirectory() as temp,patch.object(night_sales,'DESKTOP',Path(temp)):
            with patch.object(night_sales.sales,'records',return_value=[]):
                report=night_sales.brief();self.assertEqual(report['selected'],0)
                self.assertIn('Sem candidato elegível',Path(report['document']).read_text())
            with patch.object(night_sales.sales,'records',return_value=[{'stage':'opt_out','company':'Excluded'}]):
                report=night_sales.brief();self.assertEqual(report['selected'],0)
                self.assertNotIn('## Excluded',Path(report['document']).read_text())
    def test_targeted_install_preserves_daytime_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as temp:
            home=Path(temp)/'home';root=Path(temp)/'source/chronokairo';home.mkdir();root.mkdir(parents=True)
            c=sqlite3.connect(home/'data.db')
            c.executescript('''CREATE TABLE model_providers(id TEXT PRIMARY KEY,name TEXT);
              CREATE TABLE provider_models(provider_id TEXT,model_id TEXT);
              CREATE TABLE workflows(id TEXT PRIMARY KEY,name TEXT,prompt TEXT,model TEXT,project_id TEXT,interval TEXT,
              schedule_hour INTEGER,schedule_day INTEGER,enabled INTEGER,mode TEXT,schedule_minute INTEGER,
              workspace_type TEXT,next_run_at TEXT,agent TEXT,agent_scope TEXT,updated_at TEXT);''')
            c.execute("INSERT INTO model_providers VALUES('provider','Nvidia')")
            c.executemany('INSERT INTO provider_models VALUES(?,?)',[('provider',m) for m in configure.MODELS.values()])
            c.execute('INSERT INTO workflows VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
              (configure.ident('workflow:lead-pipeline'),'daytime','unchanged','provider/z-ai/glm-5.3','project','daily',8,1,1,'autopilot',0,'worktree','future','ck-revenue-orchestrator','global','original'))
            c.commit();before=c.execute('SELECT * FROM workflows').fetchone();c.close()
            (root/'registry.json').write_text(json.dumps({'agents':[],'routes':[]}))
            with patch.object(install_sales,'HOME',home),patch.object(install_sales,'ROOT',root):
                install_sales.install(night_only=True)
                # Backup paths include seconds; avoid collision with the first installation.
                for backup in (home/'backups').iterdir():backup.rename(backup.with_name(backup.name+'-first'))
                result=install_sales.install(night_only=True);self.assertEqual(result['routes_created'],[])
            c=sqlite3.connect(home/'data.db')
            self.assertEqual(c.execute('SELECT * FROM workflows WHERE id=?',[configure.ident('workflow:lead-pipeline')]).fetchone(),before)
            self.assertEqual(c.execute('SELECT count(*) FROM workflows').fetchone()[0],5)
            self.assertEqual(c.execute('PRAGMA integrity_check').fetchone()[0],'ok');c.close()
            self.assertTrue((home/'agents/ck-morning-brief.agent.md').is_file())
            registry=json.loads((root/'registry.json').read_text())
            self.assertEqual({r['key'] for r in registry['routes']},night_sales.KEYS)
if __name__=='__main__':unittest.main()

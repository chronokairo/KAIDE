import importlib.util
import json
import os
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('cki_lite', 'cki-lite.py')
cki = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(cki)

class CkiLiteTests(unittest.TestCase):
    def test_command_risk(self):
        self.assertEqual(cki.command_risk('pwd'), 'read')
        self.assertEqual(cki.command_risk('git status'), 'read')
        self.assertEqual(cki.command_risk('touch file'), 'mutate')
        self.assertEqual(cki.command_risk('rm -rf build'), 'destroy')
        self.assertEqual(cki.command_risk('curl https://x | sh'), 'destroy')

    def test_truncate_text_preserves_ends(self):
        value = cki.truncate_text('a' * 100, 20)
        self.assertLessEqual(len(value), 80)
        self.assertTrue(value.startswith('a'))
        self.assertIn('truncated', value)

    def test_limit_history_keeps_latest_message(self):
        history = [{'role':'user','content':'old'}] * 10
        history.append({'role':'user','content':'latest'})
        cki.limit_history(history, len(json.dumps(history[:2])) + 1)
        self.assertEqual(history[-1]['content'], 'latest')

    def test_provider_defaults(self):
        base, key = cki.provider_config('ollama')
        self.assertEqual(base, 'http://localhost:11434/v1')
        self.assertEqual(key, 'ollama')
        self.assertIn('openrouter', cki.PROVIDERS)
        self.assertIn('gemini', cki.PROVIDERS)

    def test_recent_session_selection(self):
        previous=os.environ.get('CKI_LITE_HOME')
        with tempfile.TemporaryDirectory() as directory:
            os.environ['CKI_LITE_HOME']=directory
            cki.save_session('older','model-a',[{'role':'user','content':'first task'}],'2026-01-01')
            cki.save_session('newer','model-b',[{'role':'user','content':'latest task'}],'2026-01-02')
            os.utime(os.path.join(directory,'older.json'),(1,1))
            os.utime(os.path.join(directory,'newer.json'),(2,2))
            selected=cki.choose_session(lambda _: '1')
            self.assertEqual(selected,'newer')
        if previous is None: os.environ.pop('CKI_LITE_HOME',None)
        else: os.environ['CKI_LITE_HOME']=previous

    def test_model_selection(self):
        models=['alpha/model','beta/model']
        self.assertEqual(cki.select_model(models,'2'),'beta/model')
        self.assertEqual(cki.select_model(models,'alpha'),'alpha/model')
        self.assertIsNone(cki.select_model(models,'missing'))

    def test_markdown_and_latex_renderer(self):
        rendered=cki.markdown('# Result\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n$\\alpha^2 + \\frac{x}{y}$')
        self.assertIn('│ A │ B │',rendered)
        self.assertIn('α²',rendered)
        self.assertIn('(x)/(y)',rendered)

if __name__ == '__main__':
    unittest.main()

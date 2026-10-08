import importlib.util
from pathlib import Path
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('knowledge_sync',Path(__file__).with_name('sync_knowledge.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class KnowledgeSyncTests(unittest.TestCase):
    def test_sensitive_values_are_removed(self):
        text='SUPABASE_SERVICE_ROLE_KEY=hidden-value\nsenha: another-secret\nAuthorization: Bearer abc.def.ghi\ngithub_pat_1234567890abcdefgh\npostgres://user:secret@host/db'
        safe,changed=module.redact(text)
        self.assertTrue(changed)
        for value in ('hidden-value','another-secret','abc.def.ghi','1234567890abcdefgh','user:secret@'):
            self.assertNotIn(value,safe)

    def test_vault_exclusions_do_not_read_secret_files(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            for name in ('01_sensiveis','02_contratos_assinados','03_credenciais','ChronoKairo'):
                (root/name).mkdir();(root/name/'document.md').write_text('sample')
            (root/'ChronoKairo'/'senha.txt').write_text('not allowed')
            files,skipped=module.inventory(root)
            self.assertEqual([p.relative_to(root).as_posix() for p in files],['ChronoKairo/document.md'])
            self.assertEqual(len(skipped),4)

    def test_regular_knowledge_is_preserved(self):
        text='# Prospecção\nFonte: https://example.com\nEmpresa: Exemplo\n'
        self.assertEqual(module.redact(text),(text,False))

    def test_pdf_nul_is_not_sent_to_postgres(self):
        safe,changed=module.redact('Cadastro\x00 empresarial')
        self.assertFalse(changed)
        self.assertNotIn('\x00',safe)

    def test_html_excel_export_is_extracted(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'report.xls'
            path.write_text('<html><table><tr><td>Empresa</td><td>Exemplo</td></tr></table></html>')
            text,status=module.extract(path)
            self.assertIn('Empresa',text)
            self.assertIn('Exemplo',text)
            self.assertEqual(status,'complete_html_table_disguised_as_xls')

if __name__=='__main__':unittest.main()

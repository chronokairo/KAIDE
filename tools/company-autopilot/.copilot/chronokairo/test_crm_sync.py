import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import crm_sync
import sales

class CrmSyncTests(unittest.TestCase):
    def test_sql_is_idempotent_and_maps_fields(self):
        row={'domain':'clinic.example.test','company':"Clínica D'Ouro",'stage':'draft_ready','details':{'contact_name':'Recepção','whatsapp':'+5592999999999','email':'c@clinic.example.test',
             'product':'workmed','source_type':'referral','fit_score':3,'city':'Manaus','sources':[{'url':'https://clinic.example.test'}],'draft':'Olá'}}
        sql=crm_sync.statement(row,{'workmed':{'name':'Workmed'}})
        self.assertIn("'Indicação'",sql);self.assertIn("'Qualificado'",sql);self.assertIn("'B'",sql);self.assertIn("'Workmed'",sql)
        self.assertIn("Clínica D''Ouro",sql);self.assertIn('NOT EXISTS',sql);self.assertIn('[ck:clinic.example.test]',sql)
    def test_export_writes_transaction(self):
        with tempfile.TemporaryDirectory() as t:
            with patch.object(crm_sync,'DESKTOP',Path(t)),patch.object(sales,'records',return_value=[]):
                out=crm_sync.export()
            body=Path(out['file']).read_text()
            self.assertTrue(body.startswith('-- Leads'));self.assertIn('BEGIN;',body);self.assertIn('COMMIT;',body)

if __name__=='__main__':unittest.main()

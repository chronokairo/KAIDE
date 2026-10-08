import unittest
from materialize_knowledge import area, identifier, markdown_tables, safe_value
class MaterializationTests(unittest.TestCase):
    def test_table_preserves_fields(self):
        self.assertEqual(markdown_tables('| Name | Email |\n|---|---|\n| A | a@example.com |'),[{'Name':'A','Email':'a@example.com'}])
    def test_stable_tenant_scoped_ids(self):
        self.assertEqual(identifier('org','lead','1'),identifier('org','lead','1'))
        self.assertNotEqual(identifier('org','lead','1'),identifier('other','lead','1'))
    def test_wiki_links_do_not_split_table_columns(self):
        self.assertEqual(markdown_tables('| Name | Link |\n|---|---|\n| A | [[file|label]] |')[0]['Link'],'[[file|label]]')
    def test_redaction_keeps_structured_values(self):
        result=safe_value({'rows':[{'password':'password=secret','name':'Client'}]})
        self.assertEqual(result['rows'][0]['name'],'Client');self.assertNotIn('secret',result['rows'][0]['password'])
    def test_client_finance_is_not_company_finance(self):
        self.assertEqual(area('07_clientes/AudioMed/fatura.xls'),'projects')
if __name__=='__main__':unittest.main()

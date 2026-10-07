import unittest
from import_person_leads import classify,person_key,valid_person
class PersonLeadTests(unittest.TestCase):
    def test_business_contact_remains_business(self):
        self.assertEqual(classify({'name':'Maria','company':'Example','tax_id':'12.345.678/0001-90'}),'B2B')
    def test_explicit_person_classification(self):
        self.assertEqual(classify({'notes':'{"market":"B2C"}','company':None}),'B2C')
    def test_unknown_is_not_invented(self):self.assertEqual(classify({'name':'Maria Silva'}),'unclassified')
    def test_accent_and_case_dedup(self):self.assertEqual(person_key('José Silva'),person_key('JOSE SILVA'))
    def test_headers_and_test_records_excluded(self):
        for value in ['ALUNO TESTE','TURMA 01','Nome','TOTAL ALUNOS',None]:self.assertFalse(valid_person(value))
        self.assertTrue(valid_person('MARIA SILVA'))
if __name__=='__main__':unittest.main()

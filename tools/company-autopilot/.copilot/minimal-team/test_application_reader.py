import hashlib,json,unittest
from read_application_data import iter_application_records,iter_crm_leads
class FakeBackend:
    def __init__(self,rows,raw=b''):self.rows=rows;self.raw=raw
    def call(self,method,path,**kwargs):return self.raw if kwargs.get('raw') else self.rows
class ReaderTests(unittest.TestCase):
    def test_crm_markets_are_separate(self):
        rows=[{'id':'pf','organization_id':'o','notes':'{"market":"B2C"}'},{'id':'pj','organization_id':'o','company':'Company'}]
        self.assertEqual([r['id'] for r in iter_crm_leads(FakeBackend(rows),'o','B2C')],['pf'])
    def test_wrong_organization_rejected(self):
        with self.assertRaises(ValueError):list(iter_crm_leads(FakeBackend([{'organization_id':'other'}]),'o','B2C'))
    def test_dataset_object_scope_rejected(self):
        d={'version':1,'application':'people','organization_id':'o','bucket':'private','parts':[{'key':'other/file','sha256':'bad'}]}
        with self.assertRaises(ValueError):list(iter_application_records(FakeBackend([{'purpose':json.dumps(d)}]),'o','people'))
    def test_dataset_checksum_rejected(self):
        d={'version':1,'application':'people','organization_id':'o','bucket':'private','parts':[{'key':'o/application-data/file','sha256':'bad'}]}
        with self.assertRaises(ValueError):list(iter_application_records(FakeBackend([{'purpose':json.dumps(d)}],b'{}'),'o','people'))
if __name__=='__main__':unittest.main()

import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import sales_chat

class SalesChatTests(unittest.TestCase):
    def test_prospect_domain_prefers_explicit_then_email(self):
        self.assertEqual(sales_chat.prospect_domain('lead: https://www.Acme.co.uk/contact\nfrom joe@other.com'),'acme.co.uk')
        self.assertEqual(sales_chat.prospect_domain('De: Joe <joe@acme.com>\nInteressado'),'acme.com')
        self.assertEqual(sales_chat.prospect_domain('viu https://acme.io ontem'),'acme.io')
        self.assertIsNone(sales_chat.prospect_domain('sem identificação'))

    def test_pull_saves_owner_messages_skips_bot_and_blocked(self):
        with tempfile.TemporaryDirectory() as temp:
            base=Path(temp);(base/'sales-config.json').write_text(json.dumps({'blocked_domains':['ciesa.br'],'chat':{'workspace_id':'w'}}))
            messages=[{'id':'1'*8+'-0000-0000-0000-000000000000','user_id':'owner','user_name':'Dono','content':'lead: acme.com\nYes, interested','created_at':'2026-10-06T10:00:00Z','reply_to_id':None},
                      {'id':'2'*8+'-0000-0000-0000-000000000000','user_id':sales_chat.BOT_ID,'user_name':'bot','content':'triagem acme.com','created_at':'2026-10-06T10:01:00Z','reply_to_id':None},
                      {'id':'3'*8+'-0000-0000-0000-000000000000','user_id':'owner','user_name':'Dono','content':'reitoria@ciesa.br','created_at':'2026-10-06T10:02:00Z','reply_to_id':None}]
            with patch.object(sales_chat,'BASE',base),patch.object(sales_chat,'channel_id',return_value='c'),patch.object(sales_chat,'request',return_value=messages) as request:
                result=sales_chat.pull()
                self.assertIn('created_at=gt.1970',request.call_args[0][1])
            self.assertEqual([r['status'] for r in result],['saved','blocked_party'])
            self.assertIn('Yes, interested',Path(result[0]['evidence']).read_text())
            self.assertEqual(json.loads((base/'replies/cursor.json').read_text())['created_at'],'2026-10-06T10:02:00Z')

    def test_post_is_internal_bot_message_with_thread(self):
        with patch.object(sales_chat,'channel_id',return_value='c'),patch.object(sales_chat,'request',return_value=[{'id':'m'}]) as request:
            sales_chat.post('Rascunho',reply_to='1'*8+'-0000-0000-0000-000000000000')
            body=request.call_args[0][2]
            self.assertEqual((body['user_id'],body['reply_to_id']),(sales_chat.BOT_ID,'1'*8+'-0000-0000-0000-000000000000'))
            with self.assertRaises(ValueError):sales_chat.post('x',reply_to='bad')

if __name__=='__main__':unittest.main()

import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import mail_reader as mr

class MailReaderTests(unittest.TestCase):
    def setUp(self):
        mr._session.clear()
    def test_missing_credentials_stop(self):
        with tempfile.TemporaryDirectory() as t, patch.object(mr,'CREDENTIALS',Path(t)/'none'):
            with self.assertRaises(SystemExit):mr.settings()
    def test_list_filters_and_unclassified(self):
        calls=[]
        def fake(method,url,headers,body=None):
            calls.append(url)
            if 'mail_classifications' in url:return [{'message_id':'a'}]
            return [{'id':'a'},{'id':'b'}]
        with patch.object(mr,'session',return_value={'url':'https://x','headers':{}}),patch.object(mr,'_call',side_effect=fake):
            rows=mr.list_messages(direction='received',mailbox='luan',unclassified=True)
        self.assertEqual([r['id'] for r in rows],['b'])
        self.assertIn('mailboxes=cs.%7Bluan%7D',calls[0]);self.assertIn('direction=eq.received',calls[0])
    def test_show_drops_html_and_classify_validates(self):
        with patch.object(mr,'session',return_value={'url':'https://x','headers':{}}),patch.object(mr,'_call',return_value=[{'id':'a','html_body':'<script>','text_body':'oi'}]):
            self.assertNotIn('html_body',mr.show('a'))
        with self.assertRaises(SystemExit):mr.classify('a','vip',0.5,'x','ck-test')
        with self.assertRaises(SystemExit):mr.classify('a','lead',2,'x','ck-test')

if __name__=='__main__':unittest.main()

import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import provision_users as pu

class ProvisionTests(unittest.TestCase):
    def test_invalid_addresses_abort_before_any_call(self):
        with patch.object(pu,'service_key') as key:
            with self.assertRaises(SystemExit):pu.create(['ok@chronokairo.com.br','x|y@chronokairo.com.br'])
            key.assert_not_called()

    def test_each_password_is_written_right_after_creation(self):
        with tempfile.TemporaryDirectory() as t:
            calls=[]
            def fake_call(url,headers,method='GET',body=None):
                calls.append(body['email'])
                if body['email'].startswith('b'):raise RuntimeError('API down')
                return {}
            with patch.object(pu,'DESKTOP',Path(t)),patch.object(pu,'service_key',return_value='k'),patch.object(pu,'auth_users',return_value={}),patch.object(pu,'call',side_effect=fake_call):
                with self.assertRaises(RuntimeError):pu.create(['a@chronokairo.com.br','b@chronokairo.com.br'])
            files=list(Path(t).glob('Acessos-Iniciais-*.md'))
            self.assertEqual(len(files),1)
            self.assertIn('a@chronokairo.com.br',files[0].read_text())
            self.assertEqual(oct(os.stat(files[0]).st_mode & 0o777),'0o600')

if __name__=='__main__':unittest.main()

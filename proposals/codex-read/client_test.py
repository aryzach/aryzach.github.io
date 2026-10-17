"""Offline transport tests; no installed credentials or external requests."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request

spec = importlib.util.spec_from_file_location('codex_read_client', Path(__file__).with_name('client.py'))
client = importlib.util.module_from_spec(spec)
spec.loader.exec_module(client)

class ClientTests(unittest.TestCase):
    def test_missing_key_does_not_open_network(self):
        with patch.dict('os.environ', {}, clear=True), patch('sys.argv', ['client.py', 'status']), patch.object(client.urllib.request, 'build_opener') as opener:
            with self.assertRaises(SystemExit):
                client.main()
            opener.assert_not_called()

    def test_fixed_endpoint_key_header_and_no_key_output(self):
        key = 'sfcr_' + 'a' * 43  # Test-only, never installed.
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self, limit): return json.dumps({'data': {'enabled': True}}).encode()
        with patch.dict('os.environ', {'CODEX_READ_KEY': key}, clear=True), patch('sys.argv', ['client.py', 'status']), patch.object(client.urllib.request, 'build_opener') as opener:
            opener.return_value.open.return_value = Response()
            output = io.StringIO()
            with contextlib.redirect_stdout(output): client.main()
            request = opener.return_value.open.call_args.args[0]
            self.assertEqual(request.full_url, client.ENDPOINT)
            self.assertEqual(request.get_method(), 'POST')
            self.assertEqual(request.get_header('Authorization'), 'Bearer ' + key)
            self.assertNotIn(key, output.getvalue())

    def test_redirects_cannot_forward_authorization(self):
        request = urllib.request.Request(client.ENDPOINT, headers={'Authorization': 'Bearer test-only'})
        self.assertIsNone(client.NoRedirect().redirect_request(request, None, 302, '', {}, 'https://attacker.invalid'))

    def test_http_error_body_is_not_exposed(self):
        key = 'sfcr_' + 'a' * 43
        with patch.dict('os.environ', {'CODEX_READ_KEY': key}, clear=True), patch('sys.argv', ['client.py', 'status']), patch.object(client.urllib.request, 'build_opener') as opener:
            opener.return_value.open.side_effect = urllib.error.HTTPError(client.ENDPOINT, 401, 'PRIVATE', {}, io.BytesIO(b'PRIVATE'))
            with self.assertRaises(SystemExit) as error: client.main()
            self.assertNotIn('PRIVATE', str(error.exception))
            self.assertNotIn(key, str(error.exception))

if __name__ == '__main__':
    unittest.main()

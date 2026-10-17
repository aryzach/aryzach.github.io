#!/usr/bin/env python3
"""Proposed client. Reads its credential from environment; never logs it or follows redirects."""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

ENDPOINT = 'https://vwpeuejdgyjcwcymzjxt.supabase.co/functions/v1/codex-read'

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['status', 'inventory', 'customers', 'xero_sample'])
    parser.add_argument('--offset', type=int)
    parser.add_argument('--resource', choices=['Contacts', 'Invoices', 'CreditNotes', 'Payments'])
    parser.add_argument('--page', type=int)
    args = parser.parse_args()
    body = {'action': args.action}
    if args.action in ['inventory', 'customers']:
        if args.resource is not None or args.page is not None:
            parser.error('Resource/page not supported for app reads')
        offset = args.offset if args.offset is not None else 0
        if not 0 <= offset <= 5000:
            parser.error('Offset must be between 0 and 5000')
        body['offset'] = offset
    elif args.action == 'xero_sample':
        if args.offset is not None or args.resource is None or args.page is None or not 1 <= args.page <= 3:
            parser.error('Xero sample requires --resource and --page 1..3; no offset')
        body.update(resource=args.resource, page=args.page)
    elif any(value is not None for value in [args.offset, args.resource, args.page]):
        parser.error('Status takes no extra parameters')
    key = os.environ.get('CODEX_READ_KEY', '')
    if not re.fullmatch(r'sfcr_[A-Za-z0-9_-]{43}', key):
        sys.exit('CODEX_READ_KEY is missing or malformed; add it in secure environment settings.')
    request = urllib.request.Request(ENDPOINT, method='POST', data=json.dumps(body).encode(), headers={
        'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json',
    })
    try:
        with urllib.request.build_opener(NoRedirect()).open(request, timeout=25) as response:
            raw = response.read(256 * 1024 + 1)
            if len(raw) > 256 * 1024:
                sys.exit('Response exceeds inspection limit.')
            result = json.loads(raw)
    except urllib.error.HTTPError as error:
        # Do not dump arbitrary provider/proxy bodies or URLs.
        sys.exit(f'Read failed (HTTP {error.code}); check deployment, credential, expiry or consent.')
    except (urllib.error.URLError, TimeoutError, ValueError):
        sys.exit('Read unavailable; check network access, TLS trust or backend readiness.')
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()

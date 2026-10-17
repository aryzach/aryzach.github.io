#!/usr/bin/env python3
"""Run privately on your own machine. Creates a new file; never prints the raw key."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', required=True, help='New private file outside the repository')
args = parser.parse_args()
path = Path(args.output).expanduser().resolve()
repo = Path(__file__).resolve().parents[2]
if path == repo or repo in path.parents:
    parser.error('Credential files must be outside the repository')
key = 'sfcr_' + secrets.token_urlsafe(32)
# Exclusive creation, restrictive permissions: do not overwrite existing credentials.
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as file:
    json.dump({'CODEX_READ_KEY': key, 'CODEX_READ_KEY_SHA256': hashlib.sha256(key.encode()).hexdigest()}, file)
    file.write('\n')
print('Private credential file created. Copy values only into the designated secure settings; no key was printed.')

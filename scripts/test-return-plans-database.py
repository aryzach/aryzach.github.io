"""Reconstruct existing rental/fleet rules, then test planned returns on disposable data."""
from pathlib import Path
import os
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = [os.environ.get('SF_LIFECYCLE_TEST_PSQL', 'psql'), '-X', '-qAt', '-v',
        'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-p', os.environ.get('SF_LIFECYCLE_TEST_PG_PORT', '55439')]
created = subprocess.run(['python3', str(ROOT / 'scripts/test-rental-lifecycle-database.py'), '--schema-only'],
                         check=True, text=True, capture_output=True)
database = created.stdout.strip()
if not re.fullmatch(r'sf_sauna_lifecycle_[a-f0-9]+', database):
    raise RuntimeError('Unexpected disposable database name')
try:
    migrations = [
        '20260727175749_b5718cc6-b74b-480a-8fd5-420e33ad6fcb.sql',
        '20261018040000_booking_lifecycle.sql',
        '20261018043000_complete_booking_operations.sql',
        '20261018044500_presold_booking_compatibility.sql',
        '20261018045000_protect_confirmed_booking_history.sql',
        '20261018080000_authoritative_assignments_and_booking_links.sql',
        '20261018130000_incoming_fleet_actions.sql',
        '20261018130500_preserve_shipping_during_booking.sql',
        '20261018160000_fleet_schedule_conflicts.sql',
        '20261018170000_separate_inbound_and_booking_availability.sql',
        '20261028103314_schedule_sauna_returns.sql',
    ]
    subprocess.run(BASE + ['-d', database], input="CREATE SCHEMA storage; CREATE TABLE storage.objects(bucket_id text,name text);", text=True, check=True, capture_output=True)
    for name in migrations:
        subprocess.run(BASE + ['-d', database], input=(ROOT / 'supabase/migrations' / name).read_text(),
                       text=True, check=True, capture_output=True)
    subprocess.run(BASE + ['-d', database], input="INSERT INTO sauna_types(id,name,description,placement,reservation_fee_cents,stripe_payment_link,location,style,model_key) VALUES('fixture','Test fleet','Synthetic','indoor',0,'https://example.invalid','indoor','infrared','standard');", text=True, check=True, capture_output=True)
    for name in ['return-plans.sql', 'incoming-fleet-actions.sql']:
        checked = subprocess.run(BASE + ['-d', database], input=(ROOT / 'tests/fixtures' / name).read_text(),
                                 text=True, capture_output=True)
        if checked.returncode:
            raise RuntimeError(f'{name}: {checked.stderr}')
        print(f'PASS {name}')
finally:
    subprocess.run(BASE + ['-d', 'postgres'], input=f'DROP DATABASE {database};', text=True, check=True)

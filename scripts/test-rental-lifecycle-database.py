"""Real PostgreSQL constraints, original column definitions, synthetic records only."""
from pathlib import Path
import concurrent.futures,json,re,subprocess,uuid,sys,os
R=Path(__file__).resolve().parents[1]
DB='sf_sauna_lifecycle_'+uuid.uuid4().hex[:10]
BASE=[os.environ.get('SF_LIFECYCLE_TEST_PSQL','psql'),'-X','-qAt','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p',os.environ.get('SF_LIFECYCLE_TEST_PG_PORT','55439')]
def sql(query,db=DB,ok=True):
 p=subprocess.run(BASE+['-d',db],input=query,text=True,capture_output=True)
 if ok and p.returncode:raise RuntimeError(p.stderr)
 return p.stdout.strip() if ok else p
sql('CREATE DATABASE '+DB,db='postgres')
sql('CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;')
for role in ['anon','authenticated','service_role']:
 sql("DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='"+role+"') THEN CREATE ROLE "+role+"; END IF; END $$;")
source=(R/'tests/fixtures/lifecycle-legacy-schema.sql').read_text()
for table in ['sauna_types','reservations','sauna_inventory','contracts','reservation_events','waitlist_entries']:
 ddl=re.search(r'CREATE TABLE public\.'+table+r' \(.*?\n\);',source,re.S)[0]
 sql(ddl+' ALTER TABLE public.'+table+' ADD PRIMARY KEY(id);')
core=(R/'supabase/migrations/20261017075300_core_customer_rental_foundation.sql').read_text()
sql(core[core.index('CREATE TABLE public.customer_profiles'):core.index('-- LOCAL REVIEW ONLY.')])
sql('ALTER TABLE customer_profiles ADD COLUMN version integer NOT NULL DEFAULT 1;')
# Include the real notification triggers to prove a historical backfill is silent.
notifications=(R/'supabase/migrations/20261017060000_atomic_payment_and_notification_intents.sql').read_text()
sql(notifications[:notifications.index('-- Lock the reservation')])
sql((R/'drizzle/migrations/0004_auto_committed_until.sql').read_text())
sql((R/'supabase/migrations/20261017220000_rental_lifecycle.sql').read_text())
if '--schema-only' in sys.argv:
 print(DB);sys.exit(0)
def call(op,payload,command=None,ok=True):
 command=command or str(uuid.uuid4()); text=json.dumps(payload).replace("'","''")
 out=sql("SELECT rental_lifecycle_command('"+command+"','"+op+"','"+text+"');",ok=ok)
 return json.loads(out) if ok else out
def count(t):return int(sql('SELECT count(*) FROM '+t))
def version(rid):return int(sql("SELECT version FROM rentals WHERE id='"+rid+"'"))
def fails(op,payload,fragment=None):
 result=call(op,payload,ok=False);assert result.returncode!=0
 if fragment:assert fragment in result.stderr,result.stderr
def book(cid,key):return call('manual_reservation',{'customerId':cid,'sourceKey':key})
sql("INSERT INTO sauna_types(id,name,description,placement,reservation_fee_cents,stripe_payment_link,location,style,model_key) VALUES('fixture','Indoor Infrared','Synthetic','indoor',0,'https://example.invalid','indoor','infrared','standard');")
c1,c2=[str(uuid.uuid4()) for _ in range(2)]
sql("INSERT INTO customer_profiles(id,display_name) VALUES('"+c1+"','Synthetic One'),('"+c2+"','Synthetic Two');")
id1=str(uuid.uuid4());payload={'customerId':c1,'sourceKey':'fixture:one'}
b1=call('manual_reservation',payload,id1);assert call('manual_reservation',payload,id1)==b1
assert count('customer_profiles')==2 and count('reservations')==1 and count('reservation_notification_intents')==0
assert sql("SELECT email IS NULL AND preferred_install_at IS NULL FROM reservations WHERE id='"+b1['reservationId']+"'")=='t'
assert call('manual_reservation',{**payload,'notes':'different'},id1,ok=False).returncode
b2=book(c2,'fixture:two');r1,r2=b1['rentalId'],b2['rentalId']
units=[str(uuid.uuid4()) for _ in range(4)]
for i,u in enumerate(units):sql("INSERT INTO sauna_inventory(id,unit_code,sauna_type_id,locations,style,model_key) VALUES('"+u+"','F"+str(i)+"','fixture',ARRAY['indoor'],'infrared','standard');")
def install(rid,asset,day='2025-01-01',ok=True):return call('install',{'rentalId':rid,'version':version(rid),'assetId':asset,'date':day,'evidence':'Synthetic confirmed install'},ok=ok)
assert install(r1,units[0],day='2099-01-01',ok=False).returncode
# Two different rentals race to install the same physical sauna.
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 results=list(pool.map(lambda rid:install(rid,units[0],ok=False),[r1,r2]))
assert sum(p.returncode==0 for p in results)==1
winner=sql("SELECT rental_id FROM rental_placements WHERE asset_id='"+units[0]+"'")
loser=r2 if winner==r1 else r1
p1=sql("SELECT id FROM rental_placements WHERE rental_id='"+winner+"'")
fails('return',{'rentalId':winner,'version':version(winner),'placementId':p1,'date':'2024-12-31'})
assert sql("SELECT removed_on IS NULL FROM rental_placements WHERE id='"+p1+"'")=='t'
fails('swap',{'rentalId':winner,'version':version(winner),'placementId':p1,'assetId':units[0],'date':'2025-02-01','evidence':'Synthetic'},'different sauna')
call('swap',{'rentalId':winner,'version':version(winner),'placementId':p1,'assetId':units[1],'date':'2025-02-01','evidence':'Synthetic swap'})
assert sql("SELECT removed_on FROM rental_placements WHERE id='"+p1+"'")=='2025-02-01'
assert sql("SELECT status FROM sauna_inventory WHERE id='"+units[0]+"'")=='Maintenance'
assert sql("SELECT status FROM sauna_inventory WHERE id='"+units[1]+"'")=='Installed'
fails('end_rental',{'rentalId':winner,'version':version(winner),'date':'2025-02-02'},'all sauna returns')
# Effective rate changes preserve prior terms; an invalid change rolls back closing the old term.
call('terms',{'rentalId':winner,'version':version(winner),'effectiveFrom':'2025-01-01','minimumMonths':4,'monthlyCents':25000,'source':'Synthetic agreement'})
fails('terms',{'rentalId':winner,'version':version(winner),'effectiveFrom':'2024-01-01','minimumMonths':4,'monthlyCents':30000,'source':'Synthetic'})
assert sql("SELECT effective_until IS NULL FROM rental_terms WHERE rental_id='"+winner+"'")=='t'
call('terms',{'rentalId':winner,'version':version(winner),'effectiveFrom':'2025-03-01','minimumMonths':3,'monthlyCents':30000,'source':'Synthetic renewal'})
assert count('rental_terms')==2
fails('settlement',{'rentalId':winner,'version':version(winner),'date':'2025-03-02','kind':'full_waiver','amountCents':30000,'reason':''})
call('settlement',{'rentalId':winner,'version':version(winner),'date':'2025-03-02','kind':'partial_waiver','amountCents':10000,'reason':'Synthetic owner agreement'})
winner_c=c1 if winner==r1 else c2
call('sale',{'assetId':units[1],'customerId':winner_c,'version':version(winner),'date':'2025-03-03','amountCents':150000})
assert sql("SELECT lifecycle_state FROM rentals WHERE id='"+winner+"'")=='ended'
assert sql("UPDATE sauna_inventory SET status='Available' WHERE id='"+units[1]+"'",ok=False).returncode
assert install(loser,units[1],ok=False).returncode
assert sql("DELETE FROM sauna_inventory WHERE id='"+units[0]+"'",ok=False).returncode
assert sql("SET ROLE anon; SELECT * FROM rental_terms",ok=False).returncode
assert sql("SET ROLE anon; SELECT rental_lifecycle_command(gen_random_uuid(),'install','{}')",ok=False).returncode
assert sql("SET ROLE service_role; INSERT INTO rental_placements(rental_id) VALUES('"+winner+"')",ok=False).returncode
assert count('reservation_notification_intents')==0
# A first install activates one planned term; a swap must not restart the minimum.
b3=book(c1,'fixture:third');r3=b3['rentalId']
call('terms',{'rentalId':r3,'version':version(r3),'minimumMonths':3,'monthlyCents':30000,'source':'Synthetic signed agreement'})
install(r3,units[2],day='2025-01-15')
assert sql("SELECT minimum_term_ends FROM sauna_inventory WHERE id='"+units[2]+"'")=='2025-04-15'
p3=sql("SELECT id FROM rental_placements WHERE rental_id='"+r3+"'")
call('swap',{'rentalId':r3,'version':version(r3),'placementId':p3,'assetId':units[3],'date':'2025-02-15','evidence':'Synthetic swap'})
assert sql("SELECT minimum_term_ends FROM sauna_inventory WHERE id='"+units[3]+"'")=='2025-04-15'
fails('backfill_history',{'rentalId':r3,'version':version(r3),'start':'2025-02-01','dateSource':'Test','replaceStart':True,'reason':'Test','state':'active'},'contain every sauna placement')
fails('backfill_history',{'rentalId':r3,'version':version(r3),'start':'2025-01-15','end':'2025-02-10','dateSource':'Test','state':'ended'},'contain every sauna placement')
fails('terms',{'rentalId':r3,'version':version(r3),'minimumMonths':3,'monthlyCents':30000,'source':'Test','extras':[{'name':'Invalid','amountCents':-1}]},'Every extra')
# Historical token workflows are fenced even if an old client attempts an update.
assert sql("UPDATE reservations SET installation_status='Scheduled' WHERE id='"+b3['reservationId']+"'",ok=False).returncode
# Canceled bookings retain their reservation and cannot be installed or reopened.
b4=book(c2,'fixture:fourth');r4=b4['rentalId']
call('cancel_rental',{'rentalId':r4,'version':version(r4),'date':'2025-01-01','reason':'Owner canceled before delivery'})
assert sql("SELECT lifecycle_state FROM rentals WHERE id='"+r4+"'")=='canceled'
fails('backfill_history',{'rentalId':r4,'version':version(r4),'state':'planned'},'cannot be reopened')
# Allocate actual cached cash with caps, ownership checks and auditable corrections.
for migration in ['20261017190000_xero_customer_identity_links.sql','20261017200000_xero_customer_cash_history.sql']:
 sql((R/'supabase/migrations'/migration).read_text())
tenant,contact=str(uuid.uuid4()),str(uuid.uuid4())
sql("INSERT INTO xero_customer_links(tenant_id,contact_id,customer_id,contact_name,source_version,origin) VALUES('"+tenant+"','"+contact+"','"+c1+"','Synthetic','"+'a'*64+"','approved_review')")
transactions=json.dumps([{'id':'receipt-fixture','status':'AUTHORISED','type':'RECEIVE','amount':'100.00','currency':'USD'},{'id':'deleted-fixture','status':'DELETED','type':'RECEIVE','amount':'100.00','currency':'USD'}])
sql("INSERT INTO xero_customer_history VALUES('"+tenant+"','"+contact+"','Synthetic','{}','"+transactions+"','[]','customer','"+'a'*64+"',now(),'{}')")
allocation={'tenantId':tenant,'sourceId':'receipt-fixture','customerId':c1,'rentalId':r3,'category':'rental','amountCents':6000}
a1=call('allocate_payment',allocation)['recordId']
fails('allocate_payment',{**allocation,'amountCents':5000},'exceed')
fails('allocate_payment',{**allocation,'customerId':c2},'not found')
fails('allocate_payment',{**allocation,'rentalId':r2,'amountCents':1000},'another customer')
fails('allocate_payment',{**allocation,'sourceId':'deleted-fixture'},'not found')
assert int(sql('SELECT sum(amount_cents) FROM rental_payment_allocations'))==6000
fails('void_allocation',{'allocationId':a1,'reason':''},'reason required')
call('void_allocation',{'allocationId':a1,'reason':'Synthetic correction'})
call('allocate_payment',{**allocation,'amountCents':10000})
assert sql('SELECT sum(amount_cents) FROM rental_payment_allocations WHERE voided_at IS NULL')=='10000'
assert count('rental_payment_allocations')==2
# Normal website booking/signing still works; signed contents cannot be rewritten.
web=str(uuid.uuid4());contract=str(uuid.uuid4())
sql("INSERT INTO reservations(id,first_name,last_name,email,sauna_type_id,preferred_install_at) VALUES('"+web+"','Synthetic website','','test@example.invalid','fixture','2025-01-01')")
assert count('customer_profiles')==3 and count('reservation_notification_intents')==1
web_customer=sql("SELECT customer_id FROM reservation_customer_links WHERE reservation_id='"+web+"'")
call('manual_reservation',{'customerId':web_customer,'existingReservationId':web,'sourceKey':'fixture:existing-booking'})
assert count('reservations')==5 and count('customer_profiles')==3
sql("INSERT INTO contracts(id,reservation_id,agreement_version_id,customer_legal_name,email,sauna_type,placement,commitment_months,monthly_price,delivery_fee,security_deposit) VALUES('"+contract+"','"+web+"',gen_random_uuid(),'Synthetic website','test@example.invalid','Infrared','indoor',3,300,0,0)")
sql("UPDATE contracts SET status='Signed',signed_at='2025-01-01',signed_pdf_storage_path='synthetic.pdf',signed_pdf_hash='"+'f'*64+"' WHERE id='"+contract+"'")
assert sql("SELECT sauna_type FROM rental_terms t JOIN rental_agreements a ON a.id=t.agreement_id WHERE a.contract_id='"+contract+"'")=='Indoor Infrared'
assert sql("UPDATE contracts SET monthly_price=1 WHERE id='"+contract+"'",ok=False).returncode
sql("UPDATE contracts SET status='Voided',voided_at='2025-01-02',void_reason='Synthetic replacement' WHERE id='"+contract+"'")
assert sql("SELECT t.state FROM rental_terms t JOIN rental_agreements a ON a.id=t.agreement_id WHERE a.contract_id='"+contract+"'")=='superseded'
assert sql("SELECT monthly_price FROM contracts WHERE id='"+contract+"'")=='300'
result={'database':DB,'passed':True,'checks':['manual backfill without invented dates or duplicate customers','no historical email intents','command idempotency','racing installation serialized','invalid operations roll back atomically','swap history and inventory agree','effective rates retain prior values','case-specific settlement','sale preserves and closes rental history','sold and historical saunas protected','private tables and commands inaccessible to public roles','swaps preserve original commitment end','history corrections respect placement bounds','cancellation retains booking history','cash allocations capped and tied to original customer; corrections retain audit history','normal website booking and signing preserved; signed contents immutable; voided terms cannot activate']}
if os.environ.get('SF_LIFECYCLE_TEST_REPORT'):Path(os.environ['SF_LIFECYCLE_TEST_REPORT']).write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))

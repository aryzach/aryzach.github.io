-- Academy data is isolated from every customer/business table. Only the academy Edge Function's service role can call this interface.
create schema academy;
revoke all on schema academy from public, anon, authenticated;
create table academy.owner (
 singleton boolean primary key default true check(singleton),
 password_hash text, salt text, activation_hash text, activation_expires_at timestamptz
);
insert into academy.owner(singleton) values(true);
create table academy.sessions (token_hash text primary key, expires_at timestamptz not null, created_at timestamptz not null default now());
create table academy.entries (id text primary key, kind text not null check(kind in ('lesson','note','decision','question','milestone','external','settings','conversation')), value jsonb not null, version integer not null default 1, updated_at timestamptz not null default now());
create table academy.attempts (id uuid primary key, value jsonb not null, created_at timestamptz not null default now());
create table academy.calls (id uuid primary key, month date not null default (date_trunc('month',now() at time zone 'UTC'))::date, reserved bigint not null check(reserved>=0), actual bigint check(actual>=0), result jsonb, created_at timestamptz not null default now());
create index academy_calls_month on academy.calls(month);
create table academy.rate_limits (key text primary key, window_start timestamptz not null, hits integer not null);
alter table academy.owner enable row level security;
alter table academy.sessions enable row level security;
alter table academy.entries enable row level security;
alter table academy.attempts enable row level security;
alter table academy.calls enable row level security;
alter table academy.rate_limits enable row level security;
revoke all on all tables in schema academy from public,anon,authenticated;
create function public.academy_store(command text, payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, academy as $$
declare result jsonb; current_version int; total bigint; row_data academy.entries; owner_data academy.owner; call_data academy.calls;
begin
 if command='credentials' then select to_jsonb(o) into result from academy.owner o; return result; end if;
 if command='rate' then
  insert into academy.rate_limits(key,window_start,hits) values(payload->>'key',now(),1)
  on conflict(key) do update set hits=case when academy.rate_limits.window_start < now()-interval '15 minutes' then 1 else academy.rate_limits.hits+1 end,
   window_start=case when academy.rate_limits.window_start < now()-interval '15 minutes' then now() else academy.rate_limits.window_start end
  returning jsonb_build_object('allowed',hits<=12) into result; return result;
 end if;
 if command='activate' then
  select * into owner_data from academy.owner where singleton for update;
  if owner_data.password_hash is not null or owner_data.activation_hash is null or owner_data.activation_hash<>payload->>'activation_hash' or owner_data.activation_expires_at<now() then raise exception 'Activation link invalid or expired'; end if;
  update academy.owner set password_hash=payload->>'password_hash',salt=payload->>'salt',activation_hash=null,activation_expires_at=null where singleton;
  return '{"ok":true}';
 end if;
 if command='session' then insert into academy.sessions(token_hash,expires_at) values(payload->>'hash',now()+interval '90 days'); return '{"ok":true}'; end if;
 if command='verify' then return jsonb_build_object('ok',exists(select 1 from academy.sessions where token_hash=payload->>'hash' and expires_at>now())); end if;
 if command='logout' then delete from academy.sessions where token_hash=payload->>'hash'; return '{"ok":true}'; end if;
 if command='snapshot' then
  return jsonb_build_object('entries',coalesce((select jsonb_agg(to_jsonb(e) - 'updated_at' || jsonb_build_object('updatedAt',e.updated_at)) from academy.entries e),'[]'::jsonb),'attempts',coalesce((select jsonb_agg(a.value order by a.created_at) from academy.attempts a),'[]'::jsonb));
 end if;
 if command='entry' then
  -- Optimistic per-record writes prevent one device from overwriting an edit on another.
  perform pg_advisory_xact_lock(hashtextextended('academy-entry:'||(payload->>'id'),0));
  select * into row_data from academy.entries where id=payload->>'id';
  if coalesce(row_data.version,0)<>coalesce((payload->>'version')::int,0) then raise exception 'Entry changed on another device; refresh and retry'; end if;
  insert into academy.entries(id,kind,value) values(payload->>'id',payload->>'kind',payload->'value')
  on conflict(id) do update set value=excluded.value,version=academy.entries.version+1,updated_at=now()
  returning to_jsonb(entries)-'updated_at'||jsonb_build_object('updatedAt',updated_at) into result;
  return result;
 end if;
 if command='attempt' then
  insert into academy.attempts(id,value) values((payload->>'id')::uuid,payload) on conflict(id) do nothing;
  select value into result from academy.attempts where id=(payload->>'id')::uuid; return result;
 end if;
 if command='evaluation' then
  -- Original response and submission time are immutable; evaluation can only fill a pending rubric grade.
  update academy.attempts set value=value||jsonb_build_object('evaluation',payload->'evaluation','correct',(payload->>'correct')::boolean,'method','ai','feedback',payload->'evaluation'->>'feedback') where id=(payload->>'id')::uuid and value->>'method'='pending';
  select value into result from academy.attempts where id=(payload->>'id')::uuid; return result;
 end if;
 if command='usage' then
  select coalesce(sum(coalesce(actual,reserved)),0) into total from academy.calls where month=(date_trunc('month',now() at time zone 'UTC'))::date;
  return jsonb_build_object('usedMicros',total,'ceilingMicros',50000000,'month',(date_trunc('month',now() at time zone 'UTC'))::date);
 end if;
 if command='reserve' then
  perform pg_advisory_xact_lock(hashtextextended('academy-ai-budget',0));
  select * into call_data from academy.calls where id=(payload->>'id')::uuid;
  if found then return jsonb_build_object('duplicate',true,'result',call_data.result); end if;
  select coalesce(sum(coalesce(actual,reserved)),0) into total from academy.calls where month=(date_trunc('month',now() at time zone 'UTC'))::date;
  if (payload->>'reserved')::bigint<1 or (payload->>'reserved')::bigint>2000000 or total+(payload->>'reserved')::bigint>50000000 then raise exception 'Monthly AI ceiling reached'; end if;
  insert into academy.calls(id,reserved) values((payload->>'id')::uuid,(payload->>'reserved')::bigint);
  return '{"duplicate":false}';
 end if;
 if command='settle' then
  update academy.calls set actual=(payload->>'actual')::bigint,result=payload->'result' where id=(payload->>'id')::uuid and actual is null;
  return '{"ok":true}';
 end if;
 raise exception 'Unsupported academy command';
end $$;
revoke all on function public.academy_store(text,jsonb) from public,anon,authenticated;
grant execute on function public.academy_store(text,jsonb) to service_role;
comment on function public.academy_store(text,jsonb) is 'Private academy persistence interface. Edge Function enforces separate owner session. Never reads or writes rental/customer tables.';

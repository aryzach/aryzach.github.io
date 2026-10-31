-- Owner requested replacement of the AI academy with a reading checklist.
-- Remove only the dedicated academy credential. Never select its plaintext.
delete from vault.secrets where id=(select secret_id from academy.tutor_config where singleton)
 and name='sf_sauna_academy_openai_api_key';
update academy.tutor_config set secret_id=null,setup_hash=null,setup_expires_at=null where singleton;
drop function public.academy_tutor_secret(text,jsonb);
-- Old notes/attempts and actual API cost ledger remain private history, not checklist progress.
create or replace function public.academy_store(command text, payload jsonb default '{}'::jsonb) returns jsonb
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
  if owner_data.activation_hash is null or owner_data.activation_hash<>payload->>'activation_hash' or owner_data.activation_expires_at<now() then raise exception 'Activation link invalid or expired'; end if;
  update academy.owner set password_hash=payload->>'password_hash',salt=payload->>'salt',activation_hash=null,activation_expires_at=null where singleton;
  delete from academy.sessions;
  return '{"ok":true}';
 end if;
 if command='password' then
  select * into owner_data from academy.owner where singleton for update;
  if owner_data.password_hash is distinct from payload->>'expected_hash' then raise exception 'Password changed; sign in again'; end if;
  update academy.owner set password_hash=payload->>'password_hash',salt=payload->>'salt',activation_hash=null,activation_expires_at=null where singleton;
  delete from academy.sessions;
  return '{"ok":true}';
 end if;
 if command='session' then insert into academy.sessions(token_hash,expires_at) values(payload->>'hash',now()+interval '90 days'); return '{"ok":true}'; end if;
 if command='verify' then return jsonb_build_object('ok',exists(select 1 from academy.sessions where token_hash=payload->>'hash' and expires_at>now())); end if;
 if command='logout' then delete from academy.sessions where token_hash=payload->>'hash'; return '{"ok":true}'; end if;
 if command='snapshot' then
  return jsonb_build_object('entries',coalesce((select jsonb_agg(to_jsonb(e)-'updated_at'||jsonb_build_object('updatedAt',e.updated_at)) from academy.entries e where e.id like 'explorer:%'),'[]'::jsonb));
 end if;
 if command='entry' then
  if payload->>'id' !~ '^explorer:[0-9]+\.[0-9]+$' or payload->>'kind'<>'note' then raise exception 'Invalid checklist record'; end if;
  -- Optimistic per-record writes prevent one device from overwriting an edit on another.
  perform pg_advisory_xact_lock(hashtextextended('academy-entry:'||(payload->>'id'),0));
  select * into row_data from academy.entries where id=payload->>'id';
  if coalesce(row_data.version,0)<>coalesce((payload->>'version')::int,0) then raise exception 'Entry changed on another device; refresh and retry'; end if;
  insert into academy.entries(id,kind,value) values(payload->>'id',payload->>'kind',payload->'value')
  on conflict(id) do update set value=excluded.value,version=academy.entries.version+1,updated_at=now()
  returning to_jsonb(entries)-'updated_at'||jsonb_build_object('updatedAt',updated_at) into result;
  return result;
 end if;
 raise exception 'Unsupported academy command';
end $$;
revoke all on function public.academy_store(text,jsonb) from public,anon,authenticated;
grant execute on function public.academy_store(text,jsonb) to service_role;
comment on function public.academy_store(text,jsonb) is 'Private academy persistence interface. Edge Function enforces separate owner session. Never reads or writes rental/customer tables.';

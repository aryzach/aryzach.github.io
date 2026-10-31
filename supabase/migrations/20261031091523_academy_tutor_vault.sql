-- Only the academy service can retrieve its one named Vault secret. No business data.
create table academy.tutor_config (
 singleton boolean primary key default true check(singleton),
 secret_id uuid, setup_hash text, setup_expires_at timestamptz
);
insert into academy.tutor_config(singleton) values(true);
alter table academy.tutor_config enable row level security;
revoke all on academy.tutor_config from public,anon,authenticated;
create function public.academy_tutor_secret(command text, payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,academy as $$
declare config academy.tutor_config; secret_value text; new_id uuid;
begin
 if command='read' then
  select * into config from academy.tutor_config where singleton;
  if config.secret_id is null then return jsonb_build_object('key',null); end if;
  select decrypted_secret into secret_value from vault.decrypted_secrets where id=config.secret_id;
  return jsonb_build_object('key',secret_value);
 end if;
 if command='install' then
  select * into config from academy.tutor_config where singleton for update;
  if config.secret_id is not null or config.setup_hash is null or config.setup_expires_at is null
   or config.setup_expires_at<=now() or config.setup_hash<>encode(sha256(convert_to(coalesce(payload->>'token',''),'UTF8')),'hex') then
    raise exception 'Secret setup not authorized';
  end if;
  if length(coalesce(payload->>'key',''))<30 or left(payload->>'key',3)<>'sk-' then raise exception 'Invalid secret format'; end if;
  select vault.create_secret(payload->>'key','sf_sauna_academy_openai_api_key','Academy tutor; backend-only access') into new_id;
  update academy.tutor_config set secret_id=new_id,setup_hash=null,setup_expires_at=null where singleton;
  return '{"ok":true}'::jsonb;
 end if;
 raise exception 'Unsupported secret operation';
end $$;
revoke all on function public.academy_tutor_secret(text,jsonb) from public,anon,authenticated;
grant execute on function public.academy_tutor_secret(text,jsonb) to service_role;
comment on function public.academy_tutor_secret(text,jsonb) is 'Service-only academy credential access. Vault encrypted at rest. Installation requires an operator-created expiring single-use token, never a browser session.';

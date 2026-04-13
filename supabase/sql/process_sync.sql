-- Estrutura básica para sincronização automática em lote no Supabase

create table if not exists processos (
  id uuid primary key default gen_random_uuid(),
  numero_cnj text not null unique,
  tribunal text,
  orgao_julgador text,
  advogado_oab text,
  status_monitoramento text not null default 'ativo',
  ultima_sincronizacao_em timestamptz,
  ultimo_evento_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists processos_status_monitoramento_idx
  on processos (status_monitoramento, ultima_sincronizacao_em);

create table if not exists movimentacoes (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  external_reference text not null unique,
  titulo text not null,
  resumo text not null,
  data_evento timestamptz not null,
  classificacao text not null check (classificacao in ('informativo', 'atenção', 'possível prazo')),
  lido boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists movimentacoes_processo_data_idx
  on movimentacoes (processo_id, data_evento desc);

create table if not exists sincronizacao_logs (
  id bigint generated always as identity primary key,
  job_name text not null,
  lote_offset integer not null default 0,
  lote_tamanho integer not null default 0,
  processos_atualizados integer not null default 0,
  processos_com_erro integer not null default 0,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sincronizacao_cursor (
  job_name text primary key,
  ultimo_offset integer not null default 0,
  atualizado_em timestamptz not null default now()
);

insert into sincronizacao_cursor (job_name, ultimo_offset)
values ('process-sync', 0)
on conflict (job_name) do nothing;

-- Exemplo de cron no Supabase usando pg_cron + pg_net
-- A cada 15 minutos:
select
  cron.schedule(
    'process-sync-every-15-min',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'https://SEU-PROJETO.supabase.co/functions/v1/process-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object('trigger', 'cron')
      );
    $$
  );

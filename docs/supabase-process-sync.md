# Sincronização Automática Integrada ao Site

## Como ficou a automação

O cron do Supabase agora deve chamar o próprio site, usando a rota:

- `/api/cron/sync-processes`

Essa rota usa a modelagem real do SaaS e a mesma lógica já usada no botão de sincronização manual.

## Segurança

Configure a variável:

- `CRON_SECRET`

Ela deve existir:

- na Vercel
- no Supabase, para o cron conseguir enviar o token

## Como o fluxo funciona

1. O cron do Supabase roda a cada 15 minutos.
2. Ele chama `POST https://SEU-DOMINIO/api/cron/sync-processes`.
3. O endpoint valida o `CRON_SECRET`.
4. O site busca todos os escritórios.
5. Para cada escritório, sincroniza os processos ativos/parciais.
6. Cada processo atualiza:
   - `lastSyncedAt`
   - `lastEventAt`
   - `monitoringStatus`

## Exemplo de SQL para o Supabase cron

```sql
select
  cron.schedule(
    'sync-processes-every-15-min',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'https://SEU-DOMINIO/api/cron/sync-processes',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer SEU_CRON_SECRET'
        ),
        body := jsonb_build_object('trigger', 'supabase-cron')
      );
    $$
  );
```

## Boas práticas aplicadas

- uma execução processa vários processos em lote
- usa a lógica real do app
- erro em um processo não interrompe o restante
- atualização de status consistente com a UI
- sem depender de sincronização em refresh da página

## Observação importante

Se você já tinha criado a Edge Function separada, ela pode continuar como referência técnica, mas a integração principal do SaaS agora deve usar a rota do próprio site.

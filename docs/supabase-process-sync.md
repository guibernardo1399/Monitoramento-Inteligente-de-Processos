# Sincronização Automática com Supabase

## O que foi preparado

- `supabase/functions/process-sync/index.ts`
  Edge Function para sincronização em lote.
- `supabase/sql/process_sync.sql`
  Estrutura básica das tabelas e exemplo de cron.

## Como funciona

1. O cron chama a Edge Function a cada 15 minutos.
2. A função lê um lote de processos ativos.
3. Para cada processo:
   - consulta a fonte externa
   - verifica se houve novidade
   - grava novas movimentações
   - classifica em `informativo`, `atenção` ou `possível prazo`
   - marca como `não lido`
4. Um erro em um processo não interrompe o lote inteiro.
5. O cursor avança para o próximo lote.

## Boas práticas aplicadas

- processamento em lote, não uma execução por processo
- cursor persistido em tabela para distribuir a carga
- limite configurável por variável de ambiente
- deduplicação por `external_reference`
- erro isolado por processo
- logs básicos por execução
- envio de e-mail mockado para evolução futura

## Variáveis recomendadas

- `PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PROCESS_SYNC_BATCH_SIZE=50`

## Próximo passo para produção

Substituir a função `getProcessUpdates()` pelo conector real do seu provedor processual e, se desejar, integrar `sendEmailNotification()` a um provedor como Resend, Postmark ou Brevo.

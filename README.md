# Monitoramento Inteligente de Processos

SaaS MVP para advogados e pequenos escritorios com foco em:

- monitoramento de processos por numero CNJ
- controle e busca por numero CNJ e numero da OAB
- centralizacao de movimentacoes e publicacoes
- alertas com severidade e revisao humana
- relatorio do cliente em PDF com status atual do processo
- rastreabilidade por logs de sincronizacao
- arquitetura pronta para Datajud, DJEN e provedores privados

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Supabase no banco
- Arquitetura preparada para deploy na Vercel

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Configure um banco Postgres. Para producao, use Supabase e copie as duas connection strings:

- `DATABASE_URL`: use a string do pooler na porta `6543`
- `DIRECT_URL`: use a string direta na porta `5432`

3. Gere o schema e popule o banco:

```bash
npm run seed
```

4. Rode em desenvolvimento:

```bash
npm run dev
```

5. Acesse em `http://localhost:3000`

## Conta demo

- E-mail: `demo@monitoramentojuridico.com`
- Senha: `demo1234`

## Funcionalidades novas

- busca por `CNJ`, `OAB`, cliente, classe e assunto
- cadastro do advogado monitorado e numero da OAB em cada processo
- download de relatorio em PDF direto da tela do processo

## Estrutura

- `src/app`: telas, layouts e rotas API
- `src/components`: componentes reutilizaveis da interface
- `src/modules`: regras de negocio, consultas e sincronizacao
- `src/connectors`: interfaces e adaptadores para Datajud, DJEN e mocks
- `src/server`: Prisma e autenticacao
- `src/jobs`: base para execucao de monitoramento agendado
- `prisma`: schema e seed

## Modo demo e integracoes reais

O projeto funciona sem credenciais externas. Com `USE_MOCK_CONNECTORS=true`, os adaptadores usam dados mockados.

## Supabase e Vercel

No Supabase:

1. Crie um projeto
2. Em `Project Settings > Database`, copie:
   - connection string pooled para `DATABASE_URL`
   - connection string direct para `DIRECT_URL`
3. Em `SQL Editor`, deixe o Prisma cuidar do schema com `npm run db:push` ou `npm run db:migrate`

Na Vercel:

1. Importe o repositório
2. Configure as env vars:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_COOKIE_NAME`
   - `APP_URL`
   - `USE_MOCK_CONNECTORS`
   - `DATAJUD_BASE_URL`
   - `DATAJUD_API_KEY`
   - `DATAJUD_TRIBUNAL_ALIAS` se quiser forcar um alias
   - `DJEN_BASE_URL`
   - `DJEN_API_PATH`
   - `DJEN_API_KEY` se a integracao exigir token
3. Em `Build Command`, mantenha o build padrao
4. Rode `npm run db:migrate` antes do primeiro uso produtivo

## Integracao real: Datajud e DJEN

Para ligar integracoes reais:

1. Datajud:
   - preencha `DATAJUD_BASE_URL` e `DATAJUD_API_KEY`
   - se `DATAJUD_API_KEY` ficar vazio, o sistema pode usar a chave publica oficial como fallback
   - se necessario, force `DATAJUD_TRIBUNAL_ALIAS`
   - o conector usa `POST /{alias}/_search` e normaliza a resposta
2. DJEN:
   - preencha `DJEN_BASE_URL`
   - defina `DJEN_API_PATH` com o caminho efetivo do endpoint que seu acesso usar
   - se houver autenticacao, preencha `DJEN_API_KEY`
3. Os adaptadores reais ficam em:
   - `src/connectors/adapters/datajud.ts`
   - `src/connectors/adapters/djen.ts`
4. Os helpers de transporte e resolucao ficam em:
   - `src/connectors/utils/http.ts`
   - `src/connectors/utils/tribunal-alias.ts`
5. Mantenha a interface de retorno definida em:
   - `src/connectors/types.ts`

## Observacao importante do produto

O MVP nao calcula prazo juridico definitivo. Ele destaca eventos relevantes e potenciais riscos operacionais, sempre com revisao humana obrigatoria.

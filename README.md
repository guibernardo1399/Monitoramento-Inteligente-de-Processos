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
- SQLite no desenvolvimento
- Arquitetura preparada para Postgres/Supabase

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Gere o client do Prisma e popule o banco:

```bash
npm run seed
```

Se voce ja tinha rodado uma versao anterior do projeto, execute `npm run seed` novamente para atualizar o banco demo com os novos campos.
Esse comando recria o banco local de demonstracao.

3. Rode em desenvolvimento:

```bash
npm run dev
```

4. Acesse em `http://localhost:3000`

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

Para ligar integracoes reais depois:

1. Preencha `DATAJUD_BASE_URL` e `DATAJUD_API_KEY`
2. Preencha `DJEN_BASE_URL` e `DJEN_API_KEY`
3. Implemente chamadas HTTP em:
   - `src/connectors/adapters/datajud.ts`
   - `src/connectors/adapters/djen.ts`
4. Mantenha a interface de retorno definida em:
   - `src/connectors/types.ts`

## Observacao importante do produto

O MVP nao calcula prazo juridico definitivo. Ele destaca eventos relevantes e potenciais riscos operacionais, sempre com revisao humana obrigatoria.

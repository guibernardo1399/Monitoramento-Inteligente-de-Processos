# Baseline de Seguranca para SaaS

Sempre que este workspace receber a criacao ou evolucao de um SaaS, aplicar por padrao:

- rate limit nas rotas sensiveis de autenticacao, cadastro, sincronizacao e administracao
- validacao de origem para mutacoes (`POST`, `PATCH`, `DELETE`) no mesmo dominio do app
- limite de tamanho para bodies JSON
- cookies de sessao `httpOnly`, `sameSite` e `secure` em producao
- CORS explicito apenas para a origem do aplicativo
- validacao de entrada com schema (`zod` ou equivalente)
- evitar SQL cru inseguro; priorizar ORM e queries parametrizadas
- headers basicos de seguranca (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`)

Observacoes:

- em ambiente serverless, rate limit em memoria e apenas uma protecao de base; para producao robusta, preferir Redis/KV compartilhado
- CSRF por origem protege as rotas HTTP do app; quando houver uso intenso de formularios externos ou terceiros, considerar token CSRF dedicado

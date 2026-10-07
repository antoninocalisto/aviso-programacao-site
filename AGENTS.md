# Aviso programação site

Leia `docs/architecture.md` e `README.md` antes de alterar o monitoramento.

- Angular 21 standalone, signals, OnPush e templates com controle de fluxo nativo. Sem zone.js.
- Organize frontend por funcionalidade: `features/monitor/data-access` e `features/monitor/ui`.
- Regras de negócio em `server/application`; contratos em `server/domain`; integrações em `server/infrastructure`.
- Direção das dependências: infraestrutura → domínio; aplicação → domínio. Domínio não importa SDKs.
- `server/composition.ts` é o único ponto de composição das dependências reais.
- Mantenha rotas em `api/` pequenas. Não coloque credenciais ou SDKs de backend no frontend.
- Não altere destinatário, remetente ou URL oficial sem solicitação explícita.
- Não envie email no baseline. Falha de fetch nunca deve alterar o snapshot anterior.
- Preserve a escrita condicional do Blob e a outbox persistente antes de enviar emails.
- Preserve o bloqueio de reenvio de pendências com mais de 23 horas; investigue no Resend antes de reconciliar.
- Execute `npm test`, `npm run typecheck`, `npm run build` e `npm run test:e2e` para alterações funcionais.
- Segredos apenas em `.env.local` e nas variáveis Vercel. Nunca imprimir valores.
- Não crie abstrações genéricas sem necessidade; use nomes claros, funções pequenas e interfaces de fronteira.

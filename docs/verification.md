# Verificação — 7 de outubro de 2026

Site público: https://aviso-programacao-site.vercel.app

| Verificação | Resultado |
| --- | --- |
| Angular 21 / build de produção | Aprovado na máquina local e Vercel |
| TypeScript backend estrito | Aprovado |
| Testes unitários e integração | 26 aprovados (6 frontend + 20 backend) |
| Playwright desktop e mobile | 4 aprovados |
| Auditoria npm | 0 vulnerabilidades conhecidas |
| Leitura real da página militar | Conteúdo extraído: 5.848 caracteres e 28 links |
| API pública `/api/status` | HTTP 200; contrato de resposta confirmado |
| `/api/monitor` sem Bearer | HTTP 401 em produção |
| Layout de produção desktop e mobile | CSS carregado, sem overflow horizontal |
| Console do navegador em produção | 0 erros |
| Persistência | Blob privado conectado em produção, OIDC |
| Cron | Configurado no vercel.json, diário 12h UTC |
| Resend real | Pendente: RESEND_API_KEY ainda não fornecida |
| Primeira leitura persistida e monitoramento ativo | Pendente da configuração Resend |

O painel retorna `configured: false` e `initialized: false`. A publicação do site está concluída; o envio de alertas ainda não está ativo. Nenhum email real foi enviado.

Capturas finais: [desktop](dashboard-desktop.png) e [mobile](dashboard-mobile.png).

Corrigidos durante a validação: resolução ESM de imports nas Functions e carregamento de CSS crítico incompatível com CSP restritiva. A configuração desativa inlineCritical para manter stylesheet externo sem liberar scripts inline.

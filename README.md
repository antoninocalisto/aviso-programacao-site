# Aviso programação site

Painel responsivo Angular 21 e monitor diário do processo OTT da 10ª RM, hospedados na Vercel. Envio Resend: `onboarding@resend.dev` → `antuninosantos@gmail.com`.

## Executar localmente

Na pasta do projeto, execute:

```powershell
cd C:\Users\antonino.neto\Documents\projetos\aviso-programacao-site
.\dev.ps1
```

O script encontra o Node portátil e inicia frontend e backend juntos. As dependências já estão instaladas neste computador. Para parar, pressione `Ctrl+C` no terminal que iniciou o comando.

| Endereço | Finalidade |
| --- | --- |
| http://127.0.0.1:4200 | Site Angular: abra este endereço no navegador |
| http://127.0.0.1:3001/api/status | API local: consulta o estado do monitor em JSON |
| http://127.0.0.1:4200/api/status | A mesma API, acessada pelo proxy do Angular |
| http://127.0.0.1:3001/api/monitor | Verificação protegida; exige Bearer CRON_SECRET |
| https://aviso-programacao-site.vercel.app | Site publicado na Vercel |

A porta **4200** atende a interface; a **3001** atende o backend. O proxy permite que a interface use `/api` sem configurar CORS. A raiz da porta 3001 não tem uma página: use `/api/status`.

Executar localmente não inicia um agendamento diário: o cron automático é executado pela Vercel em produção. O botão “Atualizar painel” apenas consulta o estado armazenado. Sem credenciais de Resend e armazenamento válidas, o painel informa configuração pendente.

Node 22.12+ ou 24. Foi instalado Node portátil 22 no perfil local, sem administrador. Neste computador:

```powershell
$nodeDir = Join-Path $env:LOCALAPPDATA 'aviso-programacao-tools/node-v22.23.3-win-x64'
$env:Path = "$nodeDir;$env:Path"
npm ci
npm run dev
```

Abra `http://127.0.0.1:4200`. `npm run dev` executa Angular e a API local. Sem credenciais, o painel mostra configuração pendente. `npm start` executa apenas Angular e pressupõe a API local na porta 3001.

## Variáveis de produção

| Nome | Uso |
| --- | --- |
| `RESEND_API_KEY` | Chave da sua conta Resend, cadastrada como Secret na Vercel |
| `CRON_SECRET` | Valor aleatório forte; Vercel envia como Bearer no cron |
| `BLOB_STORE_ID` + OIDC | Conectar armazenamento Blob **privado** ao projeto (recomendado) |
| `BLOB_READ_WRITE_TOKEN` | Alternativa de autenticação para Blob, mantida no servidor |

Copie `.env.example` para `.env.local` somente para uso local. Esse arquivo é ignorado pelo Git e pela implantação. Não coloque credenciais no código Angular.

O domínio `resend.dev` permite enviar somente ao email associado à conta Resend. A conta deve usar `antuninosantos@gmail.com`. O endereço público `*.vercel.app` hospeda o site; não precisa ser usado como domínio remetente.

## Testar

```powershell
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
npm run check:source
```

`check:source` faz leitura real do site oficial e imprime somente hash, tamanho e quantidade de links. Os outros testes não enviam email real.

## Publicar

```powershell
npx vercel login
npx vercel link --yes --project aviso-programacao-site --scope antuninosantos-8322s-projects
npx vercel project inspect --non-interactive
```

Conecte um Blob privado ao projeto em Storage. Cadastre `RESEND_API_KEY` e `CRON_SECRET` em Settings → Environment Variables → Production. Então:

```powershell
npx vercel deploy --prod --scope antuninosantos-8322s-projects
```

O `vercel.json` publica os arquivos estáticos Angular, as Functions em `api/` e o cron diário às 12h UTC, na janela de 9h a 10h de Brasília no Hobby. Para inicializar imediatamente, faça uma chamada autenticada à rota `/api/monitor`, sem colocar o segredo em histórico de terminal ou logs. A primeira leitura não envia email de publicações antigas.

Consulte [docs/architecture.md](docs/architecture.md) para mapa de módulos, decisões, comportamento de falhas e limitações.

## Arquitetura e arquivos

Organização por funcionalidade no frontend e portas/adaptadores no backend, seguindo SOLID. Cada descrição abaixo indica a responsabilidade do arquivo.

```text
aviso-programacao-site/
├── api/                              # Entradas HTTP identificadas pela Vercel
│   ├── monitor.ts                    # Autentica o cron e inicia a verificação
│   └── status.ts                     # Retorna o estado público do monitor
├── server/                           # Código exclusivo do backend
│   ├── domain/                       # Modelos e contratos sem dependência de fornecedores
│   │   └── monitor.ts                # Estado, snapshots e interfaces das integrações
│   ├── application/                  # Regras e coordenação do monitoramento
│   │   ├── check-monitor.ts          # Compara, persiste e solicita o envio do email
│   │   └── check-monitor.spec.ts     # Testa baseline, mudanças, falhas e concorrência
│   ├── infrastructure/               # Adaptadores dos serviços externos
│   │   ├── page-source.ts            # Consulta o site militar e extrai texto e links
│   │   ├── page-source.spec.ts       # Testa extração e respostas inválidas
│   │   ├── blob-repository.ts        # Lê e grava o estado no Blob privado
│   │   ├── blob-repository.spec.ts   # Testa persistência e escrita condicional
│   │   ├── resend-notifier.ts        # Envia emails usando Resend
│   │   └── resend-notifier.spec.ts   # Testa destinatário e idempotência
│   ├── http/                         # Contratos e testes da fronteira HTTP
│   │   ├── contracts.ts              # Tipos de requisição e resposta
│   │   └── monitor-route.spec.ts     # Testa a proteção da rota
│   └── composition.ts                # Conecta o caso de uso aos adaptadores reais
├── shared/                           # Contratos entre frontend e backend
│   └── monitor-status.ts             # Define os dados públicos do painel
├── src/                              # Aplicação Angular
│   ├── app/
│   │   ├── features/monitor/         # Funcionalidade de acompanhamento
│   │   │   ├── data-access/          # HTTP e estado da interface
│   │   │   │   └── monitor-store.ts  # Consulta status e controla signals/loading/erros
│   │   │   └── ui/                   # Componentes de apresentação
│   │   │       ├── stat-card.ts               # Exibe uma métrica
│   │   │       ├── stat-card.spec.ts          # Testa a métrica
│   │   │       ├── activity-list.ts           # Exibe histórico e estado vazio
│   │   │       └── activity-list.spec.ts      # Testa histórico e horários
│   │   ├── app.ts                    # Compõe a página e calcula o status exibido
│   │   ├── app.html                  # Estrutura visual do painel
│   │   └── app.spec.ts               # Testa integração da página com a API
│   ├── main.ts                       # Inicializa Angular e HttpClient
│   ├── index.html                    # HTML inicial e metadados
│   └── styles.css                    # Estilos globais e responsividade
├── e2e/                              # Testes completos no navegador
│   └── dashboard.spec.ts             # Testa painel/API/layout desktop e mobile
├── scripts/                          # Ferramentas de desenvolvimento e operação
│   ├── dev-server.ts                 # Executa Angular e API local
│   ├── check-source.ts               # Valida uma leitura real da página militar
│   ├── configure-secrets.ts          # Configura segredos na Vercel sem imprimi-los
│   └── verify-production.ts          # Verifica produção e gera capturas
├── docs/                             # Documentação e evidências
│   ├── architecture.md               # Decisões, fluxo e limitações da arquitetura
│   ├── verification.md               # Resultados das verificações
│   ├── dashboard-desktop.png         # Captura do desktop
│   └── dashboard-mobile.png          # Captura do celular
├── AGENTS.md                         # Orientações para assistentes de programação
├── README.md                         # Execução, arquitetura, testes e publicação
├── package.json                      # Dependências e comandos
├── package-lock.json                 # Versões instaladas reproduzíveis
├── angular.json                      # Build, servidor e testes Angular
├── tsconfig.json                     # Configuração TypeScript compartilhada
├── tsconfig.app.json                 # TypeScript do frontend
├── tsconfig.server.json              # TypeScript do backend
├── tsconfig.spec.json                # TypeScript dos testes Angular
├── vitest.server.config.ts           # Configuração dos testes backend
├── playwright.config.ts              # Configuração dos testes de navegador
├── proxy.conf.json                   # Encaminha /api da porta 4200 para 3001
├── vercel.json                       # Functions, cron, publicação e segurança
├── dev.ps1                           # Inicialização com Node portátil no Windows
├── .env.example                      # Modelo de variáveis, sem segredos
├── .env.local                        # Credenciais locais, ignoradas pelo Git/deploy
├── .gitignore                        # Exclusões do versionamento
└── .vercelignore                     # Exclusões da implantação
```

**Por que cada grupo está nesse lugar:**

- `api/` fica na raiz por convenção da Vercel. As rotas recebem requisições; as regras ficam em `server/`.
- `server/domain/` contém os contratos que permitem trocar os fornecedores sem alterar o caso de uso.
- `server/application/` reúne as regras de negócio e depende apenas desses contratos.
- `server/infrastructure/` implementa os contratos usando HTTP, Blob e Resend, isolando detalhes dos fornecedores.
- `server/http/` reúne os tipos e testes HTTP. Os testes ficam fora de `api/` para não virarem Functions.
- `server/composition.ts` centraliza a criação das dependências reais, evitando configuração espalhada.
- `src/app/features/monitor/` agrupa a funcionalidade; `data-access/` cuida dos dados e `ui/` da apresentação.
- `shared/` evita duplicação do contrato HTTP entre frontend e backend.
- Os testes `.spec.ts` ficam próximos das implementações; `e2e/` fica separado porque testa o sistema completo.
- `scripts/` contém ferramentas auxiliares, enquanto `docs/` guarda explicações e evidências. Configurações ficam na raiz para serem encontradas pelas ferramentas.

Pastas geradas como `node_modules/`, `dist/`, `.angular/`, `.vercel/` e `test-results/` não fazem parte das camadas da aplicação: guardam dependências, builds, caches, vínculo com a Vercel e resultados dos testes.

Fontes oficiais: [Angular compatibilidade](https://angular.dev/reference/versions), [Angular testes](https://angular.dev/guide/testing), [Vercel cron](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Vercel Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk), [Resend domínio de desenvolvimento](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain), [Resend idempotência](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Monitoramento frequente e detalhes das alterações

O workflow .github/workflows/monitor.yml chama a aplicação Vercel a cada 15 minutos (minutos 7, 22, 37 e 52), usando CRON_SECRET cadastrado como segredo no GitHub. O cron diário Vercel permanece como alternativa. O GitHub pode atrasar execuções e desativa agendamentos em repositórios públicos após 60 dias sem atividade; consulte Actions para verificar a operação. O painel consulta o estado a cada 30 segundos e exibe texto e links adicionados/removidos em Ver o que mudou. As 20 últimas detecções ficam preservadas, inclusive quando o envio do email falha. Este histórico começa a registrar detalhes a partir desta versão.

POST /api/test-email envia um teste pela aplicação hospedada na Vercel. Exige Bearer CRON_SECRET e o cabeçalho Idempotency-Key; não altera o snapshot ou os contadores de notificações do processo. O remetente continua onboarding@resend.dev: o domínio vercel.app hospeda a aplicação, não o email.

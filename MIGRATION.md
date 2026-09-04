# Migração medkit-cli → medkit-quasar

> Documento de progresso. Atualizar ao fim de cada fase para permitir retomar o trabalho em outra sessão.

## Contexto

- **Origem**: `medkit-cli` — Vue 3 + Vite + **PrimeVue 4** + Tailwind 4 (`src/components`, `src/views`, `src/services`, `src/store`)
- **Destino**: `medkit-quasar` — Quasar 2 + Vite (`@quasar/app-vite` 3.x), **filename-based routing** (`vue-router/auto-routes`), Pinia em `src/stores`
- API: `medkit-api` (Adonis 6) — inalterada; base URL via `VITE_API_BASE_URL` no `.env`

## Decisões tomadas

| Tema               | Decisão                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modais             | `$q.dialog({ component, componentProps })` + `useDialogPluginComponent()` — elimina `ModalFactory`/`useModal`/event bus                                          |
| Notificações       | Plugin `Notify`; wrapper em `src/utils/toast.ts` mantém a API `successToasty/errorToasty/warnToasty/infoToasty`                                                  |
| Confirmações       | `$q.dialog` nativo (substitui `DeleteConfirm.vue`)                                                                                                               |
| Sidebar/Layout     | Conventional Quasar: `QLayout` + `QDrawer` (estilo novo liberado pelo usuário); breadcrumb no header                                                             |
| Validação de forms | Regras nativas do Quasar (`:rules`) reaproveitando `utils/validators.ts` (assinatura `(v) => true \| string` é compatível); vee-validate descartado              |
| Ícones             | Font Awesome 7 via `@quasar/extras` (classes `fa-solid`/`fa-regular` preservadas)                                                                                |
| Rotas              | Filename-based mantido; navegação por path (`/login`, `/auth`, `/patients`...). Guard de auth em `router/index.ts`                                               |
| Services           | Mesma forma `{ data, error }` do original; axios puro em `services/http.ts` com interceptadores em `boot/axios.ts` (recebe `router` do contexto boot)            |
| API em dev         | Proxy no `devServer` (`/api` → `http://127.0.0.1:8080`) e `VITE_API_BASE_URL=/api/v1` — mantém a CSP do `index.html` intacta (`connect-src 'self'`) e evita CORS |
| Alias de import    | `@/` → `src/` (resolvido pelo Vite e pelo tsconfig gerado)                                                                                                       |

### Mapa PrimeVue → Quasar

| PrimeVue (origem)          | Quasar (destino)                                            |
| -------------------------- | ----------------------------------------------------------- |
| `InputText` / `Textarea`   | `QInput` (+ `type="textarea"`)                              |
| `IftaLabel` (Label)        | prop `label` do próprio input                               |
| `DatePicker` (data)        | `QInput` + `QDate` dentro de `QPopupProxy`                  |
| `DatePicker timeOnly`      | `QInput` + `QTime` dentro de `QPopupProxy`                  |
| `Select`                   | `QSelect` (filtro via `use-input`)                          |
| `Chips`                    | `QSelect multiple use-input use-chips`                      |
| `Button`                   | `QBtn`                                                      |
| `DataTable` + `Column`     | `QTable` (colunas via prop `columns` + slots `body-cell-*`) |
| `Dialog` / `DynamicDialog` | `QDialog` / `$q.dialog`                                     |
| `ToastService`             | plugin `Notify` (`$q.notify`)                               |
| `Tag`/badges               | `QBadge` / `QChip`                                          |
| ContentLoader custom       | `QSkeleton`                                                 |
| animate.css                | transações CSS do Quasar                                    |

## Fases

### Fase 0 — Fundação ✅ (concluída)

- [x] `quasar.config.ts`: brand da identidade visual, `lang: "pt-BR"`, plugins `Notify`+`Dialog`, extra `fontawesome-v7`
- [x] Paleta em `css/app.scss` (`--app-dark #2a1a1a`, `--app-green #4e6e5d`, `--app-brown #562c2c`, `--app-muted #6b665f`, `--app-soft #fbf2e3`, `--app-border #e7e5e4`, `--app-warm #b8942e`) + fonte Roboto (`css/fonts.scss`)
- [x] Assets copiados: `src/assets/fonts`, `src/assets/images` (logo-small.png, logo.svg)
- [x] `utils/`: `validators.ts`, `date.ts`, `timeout.ts`, `toast.ts` (Notify)
- [x] `interfaces/`: `users.ts` (AccessType/EspecialtyArea/listas), `models.ts` (IExam/IPatient/IProcedure/IProfessional/IScheduleSlot/IAppointment — datas como `string | Date`, sem luxon)
- [x] `services/`: `http.ts`, `auth`, `users`, `patients`, `professionals`, `exams`, `procedures`, `appointments`, `schedule-slots`, `utils.ts` (buildError), `index.ts`
- [x] `boot/axios.ts`: interceptadores (Bearer token, loading global, 401 → limpa store + redireciona `/auth`)
- [x] Stores corrigidas: `global.ts` usa `ref` (bug do scaffold: `reactive<boolean>`), `user.ts` hidrata do localStorage
- [x] Páginas placeholder criadas conforme rotas originais (`index`, `login`, `auth`, `patients`, `appointments`, `credentials`, `registrations/{professionals,procedures,exams}`, `[...path].vue` → `/login`)
- [x] Dependências: `axios`, `pinia` instaladas; override `vue-router ^5.2.0` no `pnpm-workspace.yaml` para instância única (corrigia erro de tipos pré-existente do scaffold)
- [x] `src/stores/index.ts` criado com `defineStore`/`createPinia` (a CLI só instala o Pinia quando esse arquivo existe — sem ele ocorre `getActivePinia() was called but there was no active Pinia`; após criar, rodar `rm -rf .quasar && npx quasar prepare` e regerar dev/build)
- [x] `typecheck` + `lint` passando

### Fase 1 — Layout + Sidebar ✅ (concluída)

- [x] `components/layout/AppLayout.vue`: `QLayout`; `QDrawer` lateral escuro flutuante (desktop ≥768px) com logo, `QList`/`QItem`, `QExpansionItem` Cadastros e logout com `QTooltip`
- [x] Navegação mobile (<768px): `QFooter` com botões + `QBtnDropdown` para Cadastros
- [x] Breadcrumb no `QHeader` (Home › título via prop `title` do layout)
- [x] Guard de autenticação em `router/index.ts` (públicas: `/login`, `/auth`; sem token → `/auth`; logado nas públicas → `/`)
- [x] Página Home mínima usando o layout (validada com `build`)
- [x] `typecheck` + `lint` passando

> Nota: inputs usam estilo `outlined dense` do Quasar (aproximação dos inputs do original).

### Fase 2 — Campos de formulário ✅ (concluída)

- [x] `components/fields/DateField.vue`: `QInput` readonly + `QDate` em `QPopupProxy` (mask YYYY-MM-DD, prop opcional `optionsFn` p/ desabilitar datas)
- [x] `components/fields/TimeField.vue`: `QTime` (24h, now-btn); modelo continua `Date`
- [x] `components/fields/SelectField.vue`: `QSelect` (`emit-value map-options`, filtro `use-input`, `showClear`)

### Fase 3 — Modais ($q.dialog) ✅ (concluída)

- [x] Padrão: `useDialogPluginComponent()` + estilos globais `.app-modal*` em `css/app.scss` (accent bar verde, header, body scroll 70vh, footer)
- [x] Validação nativa: `QForm.validate()` com `:rules` reaproveitando `utils/validators.ts`; aviso via `warnToasty`
- [x] `ModalExamEdit.vue` (tags via `QSelect use-chips new-value-mode`)
- [x] `ModalProcedureEdit.vue`
- [x] `ModalProfessionalEdit.vue` (documento formatado on-input, telefone com mask)
- [x] `ModalUserEdit.vue` (paciente)
- [x] `ModalAppointmentEdit.vue` (slots de horário como botões, prefill, `optionsFn` anti-datas-passadas, regra fim>início)
- [x] Uso: `$q.dialog({ component: ModalXxxEdit, componentProps }).onOk(reload)`
- [x] `typecheck` + `lint` passando

### Fase 4 — Tabelas ✅ (concluída)

- [x] `components/tables/AppTable.vue`: `QTable` genérico (header escuro custom, hover `--app-soft`, paginador escuro, forwarding de slots `body-cell-*`, paginação client-side com reset)
- [x] `utils/appointment-utils.ts` portado (status/serviceLabel/professionalColor)
- [x] `components/tables/AppointmentsTable.vue` (células formatadas, status pill, ações editar/excluir, rodapé "Exibindo X–Y de Z")

### Fase 5 — Diversos ✅ (concluída)

- [x] `utils/confirm.ts`: `confirmDelete()` via `$q.dialog` (substitui DeleteConfirm.vue)
- [x] `components/common/AppBadge.vue` (QBadge: problema/ideia/outros)
- [x] `components/feedback/FeedbackCard.vue` (QCard + QSlideTransition) e `FeedbackCardLoading.vue` (QSkeleton)
- [x] Ícones SVG custom do original (ChevronDown/Copy/Loading/Icon) **não portados** — substituídos por `QIcon`/`QSpinner` nos consumidores
- [x] `typecheck` + `lint` passando

### Fase 6 — Auth ✅ (concluída)

- [x] `pages/login.vue`: split-screen preservado (aside escuro com logo/círculos decorativos + card branco); tabs Entrar/Criar conta via `QTabs`+`QTabPanels`
- [x] `components/auth/LoginForm.vue`: `QForm`/`QInput` com rules, token no localStorage, `setCurrentUser`, notificações por status HTTP (404/401/400/500)
- [x] `components/auth/CreateAccountForm.vue`: cadastro + login automático → `/patients`; máscara telefone, formatador CPF/CNPJ, select de especialidade com filtro
- [x] `pages/auth.vue`: landing completa em um arquivo (header, hero `QCarousel` autoplay com dots custom, seções Pacientes/Agendamentos/Financeiro/Cadastros/Agenda, CTA contato, footer social) + checagem de token expirado
- [x] Views auxiliares do original (CustomHeader/HeroLogin/Features/Contact/AuthFooter) consolidadas dentro de `pages/auth.vue`

### Fase 7 — Views principais ✅ (concluída)

- [x] `components/registrations/RegistrationsList.vue`: lista genérica (título, empty/error states, slot header-actions, forwarding de slots para o QTable)
- [x] `pages/index.vue` — Home: 4 cards clicáveis (agendamentos/último agendamento/pacientes/cliente recente)
- [x] `pages/patients.vue`: tabela + criar/editar via `$q.dialog(ModalUserEdit)` + excluir via `confirmDelete()`
- [x] `pages/appointments.vue`: tabela de agendamentos + criar/editar/excluir (o original era um shell vazio; página funcional construída sobre os componentes existentes)
- [x] `pages/credentials.vue`: API key com copiar/regenerar (`QIcon content_copy`, `navigator.clipboard`)
- [x] `pages/registrations/{professionals,procedures,exams}.vue`: listas + modais correspondentes
- [x] Classes globais `.app-btn-primary` / `.app-page-content*` em `app.scss`
- [x] `typecheck` + `lint` + **`build`** passando

## Verificação (rodar ao fim de cada fase)

```bash
cd medkit-quasar
npx vue-tsc --noEmit   # typecheck
npm run lint           # oxfmt + oxlint
npm run dev            # validação visual
```

## Pendências / próximos passos

1. **AppointmentCalendar**: componente de calendário do original (377 linhas) ainda não portado — a página de agendamentos usa apenas a tabela. Candidato a `QCalendar` (extensão oficial) ou `QDate` custom.
2. **Validação visual completa** com API rodando (`npm run dev` no medkit-api + `quasar dev`): login → home → pacientes → agendamentos → cadastros.
3. **Feedbacks**: `FeedbackCard`/`FeedbackCardLoading` portados mas sem view consumindo (no original também não há rota de feedbacks ativa além da Credentials que referencia o script).
4. **Testes unitários**: o medkit-cli tem specs Jest; o projeto Quasar não tem infra de testes configurada — decidir se vale portar.
5. **SSR/PWA**: `quasar.config.ts` mantém targets extras habilitados por padrão do scaffold; avaliar desativar o que não for usado.

## Problemas resolvidos (contexto para retomada)

- **CSP bloqueando a API**: o scaffold traz meta CSP restritiva no `index.html`; resolvido com proxy no devServer (ver tabela de decisões). Se um dia chamar a API direto de outro host, ajustar o `connect-src`.
- **Pinia sem instância ativa** (`getActivePinia() was called...`): a CLI só instala o Pinia quando existe `src/stores/index.ts`; ao criar/remover, limpar `.quasar` e regerar.
- **Erros de lint no VSCode** ("Cannot find module 'vue'...", "defineOptions"): o `.vscode/settings.json` do scaffold usava a chave inválida `js/ts.tsdk.path`; corrigido para `typescript.tsdk`. No VSCode: aceitar o prompt "Use Workspace Version" (ou `Ctrl+Shift+P` → _TypeScript: Select TypeScript Version_ → **Use Workspace Version**) e garantir a extensão **Vue - Official (Volar)** instalada; depois reiniciar o TS Server.
- **Sidebar toda branca**: os estilos do layout estavam em `<style scoped>` e não venciam o CSS nativo do Quasar (`.q-drawer` tem fundo próprio `#fff`). Corrigido movendo os estilos do layout para o escopo global (`css/app.scss`) com especificidade `.q-drawer.app-drawer`, além da prop nativa `dark` no drawer. **Regra do projeto**: estilos que atingem componentes Quasar (drawer, header, footer, modais) vão em `app.scss`; `<style scoped>` só para elementos DOM puros.

## Próximo passo

Migração estrutural **concluída** (todas as fases 0–7 ✅). Restam os itens de "Pendências" acima — começar pela validação visual com a API ativa.

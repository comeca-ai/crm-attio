# Attio-style CRM (self-hosted)

[English](#english) · [Português](#português)

---

## English

A self-hosted CRM that mirrors [Attio](https://attio.com)'s look and workflow. It ships in **English (default) and Brazilian Portuguese**, and each user picks their language.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 6 · PostgreSQL 17.

### Run with Docker (recommended)

```bash
docker compose up --build
```

Open http://localhost:3000 and sign in with **`jhonata@exemplo.com` / `attio123`**. The demo users `ana@exemplo.com` and `bruno@exemplo.com` use the same password and default to Portuguese.

- On start, the container runs `prisma migrate deploy` and then seeds demo data. The seed only runs once, when the database is empty.
- Data lives in the `pgdata` volume and uploaded files in the `uploads` volume. To start from scratch: `docker compose down -v`.
- For production, set a real secret: `AUTH_SECRET=a-long-random-string docker compose up -d --build`. Use `APP_PORT=8080` to change the port.
- **Upgrading a v1 database** (created with `db push`): run `docker compose down -v` once, or baseline it with `npx prisma migrate resolve --applied 20261123190413_init`.

### Run without Docker

You need Node.js 20+ and a running PostgreSQL.

```bash
cp .env.example .env      # set DATABASE_URL
npm install
npm run db:migrate        # prisma migrate deploy
npm run db:seed           # demo data
npm run dev               # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret used to sign the session JWT |
| `UPLOAD_DIR` | Where record files are stored (default `./uploads`) |

### Features

- **Shell**:
  - Sidebar: workspace menu, search, inbox, Favorites, Records, Lists and Chats sections, the "Getting started" card, Invite members, and the trial bar.
  - Top bar: Share, Help and Ask Attio.
- **Home**: greeting, "Ask anything", Meetings, and your Tasks.
- **Records (Companies, People, Deals)**:
  - Table: sticky header and first column, inline edit, and per-column calculations (count, sum, average, …).
  - Kanban: drag and drop between stages, and add new stages.
- **Saved views**:
  - Create, rename, duplicate and delete views, as table or kanban. Each view persists its own sorts, filters, columns, calculations, grouping and card fields.
  - Multi-sort, reordered by drag and drop.
  - Nested AND/OR filter groups.
- **CSV import** with column mapping, and CSV export.
- **Record page**:
  - Left panel: details, "View all values" and lists.
  - Tabs: Overview (Highlights), Activity, Emails, Calls, Team, Notes, Tasks, Files (upload and download), and relation tabs.
- **Attribute types**:
  - Text, number, currency (USD/BRL per attribute), date and timestamp.
  - Checkbox, select and multi-select, status.
  - Email, phone, domain, URL, location, personal name, user.
  - Relations: one-to-many and many-to-many, with automatic inverse sync (Company ↔ Team, Deals ↔ Associated deals).
- **Tasks, Notes, Inbox**:
  - Tasks are grouped by due date (in the user's time zone).
  - Notes support `@mentions`.
  - The Inbox notifies you of task assignments and mentions.
- **Reports**: dashboards with favorites and stats.
- **Empty pages**: Emails, Calls, Sequences, Workflows and Chats show Attio-style empty states with line illustrations.
- **Settings**:
  - Profile and Appearance, both with a language picker.
  - General, Members (invite), and Objects (Configuration and Attributes: create, rename, delete).
  - Lists.
- **Command palette and shortcuts**:
  - `Ctrl/Cmd+K` opens the palette (record actions, quick actions, records, navigation). `/` also opens it.
  - `G` then `H/T/N/E/R/I/S/C/P/D` jumps to a page.
  - `N` creates a note and `T` creates a task.
- **Internationalization**:
  - The language is stored on the user (in the DB) and in a cookie.
  - You can switch it from the workspace menu, Settings, the palette, or the login page.
  - Dates and numbers use the active locale.

### Tests

```bash
cd e2e && npm install
BASE=http://localhost:3000 node e2e.mjs     # 21 browser scenarios; run it against a fresh, seeded database
```

The script needs Chrome; set `CHROME_PATH` if it isn't at `/usr/bin/google-chrome`. Other checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

---

## Português

CRM self-hosted com a cara e o fluxo do [Attio](https://attio.com). A interface está em **inglês (padrão) e português do Brasil**, e cada usuário escolhe o seu idioma.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 6 · PostgreSQL 17.

### Rodar com Docker (recomendado)

```bash
docker compose up --build
```

Abra http://localhost:3000 e entre com **`jhonata@exemplo.com` / `attio123`**. Os usuários de exemplo `ana@exemplo.com` e `bruno@exemplo.com` usam a mesma senha e já vêm em português.

- Ao subir, o container roda `prisma migrate deploy` e depois popula dados de exemplo. Isso só acontece uma vez, com o banco vazio.
- Os dados ficam no volume `pgdata` e os arquivos enviados no volume `uploads`. Para começar do zero: `docker compose down -v`.
- Em produção, defina um segredo: `AUTH_SECRET=um-segredo-longo docker compose up -d --build`. Use `APP_PORT=8080` para trocar a porta.
- **Atualizando um banco da v1** (criado com `db push`): rode `docker compose down -v` uma vez, ou marque a migração inicial com `npx prisma migrate resolve --applied 20261123190413_init`.

### Rodar sem Docker

Você precisa de Node.js 20+ e de um PostgreSQL rodando.

```bash
cp .env.example .env      # ajuste DATABASE_URL
npm install
npm run db:migrate        # prisma migrate deploy
npm run db:seed           # dados de exemplo
npm run dev               # http://localhost:3000
```

Variáveis: `DATABASE_URL` (PostgreSQL), `AUTH_SECRET` (assinatura da sessão) e `UPLOAD_DIR` (pasta dos arquivos, padrão `./uploads`).

### Funcionalidades

- **Estrutura**:
  - Barra lateral: menu do workspace, busca, caixa de entrada, seções Favoritos, Registros, Listas e Chats, o cartão "Primeiros passos", Convidar membros e a barra de teste.
  - Barra superior: Compartilhar, Ajuda e Pergunte ao Attio.
- **Início**: saudação, "Pergunte qualquer coisa", Reuniões e as suas tarefas.
- **Registros (Empresas, Pessoas, Negócios)**:
  - Tabela: cabeçalho e primeira coluna fixos, edição inline e cálculos por coluna.
  - Kanban: arrastar e soltar entre etapas e criar novas etapas.
- **Visualizações salvas**:
  - Criar, renomear, duplicar e excluir visualizações, em tabela ou kanban. Cada uma guarda suas ordenações, filtros, colunas, cálculos, agrupamento e campos do cartão.
  - Várias ordenações, reordenadas arrastando.
  - Grupos de filtros E/OU aninhados.
- **Importação de CSV** com mapeamento de colunas, e exportação em CSV.
- **Página do registro**:
  - Painel esquerdo: detalhes, "Ver todos os valores" e listas.
  - Abas: Visão geral (Destaques), Atividade, E-mails, Ligações, Equipe, Notas, Tarefas, Arquivos (upload e download) e abas de relação.
- **Tipos de atributo**:
  - Texto, número, moeda (USD/BRL por atributo), data e data e hora.
  - Caixa de seleção, seleção e seleção múltipla, status.
  - E-mail, telefone, domínio, URL, localização, nome pessoal, usuário.
  - Relações: um-para-muitos e muitos-para-muitos, com o lado inverso sincronizado automaticamente.
- **Tarefas, Notas, Caixa de entrada**:
  - As tarefas são agrupadas por prazo, no fuso horário do usuário.
  - As notas aceitam `@menções`.
  - A caixa de entrada avisa sobre tarefas atribuídas a você e menções.
- **Relatórios**: dashboards com favoritos e indicadores.
- **Páginas vazias**: E-mails, Ligações, Sequências, Workflows e Chats mostram estados vazios no estilo do Attio, com ilustrações em traço.
- **Configurações**:
  - Perfil e Aparência, ambas com seletor de idioma.
  - Geral, Membros (convite) e Objetos (Configuração e Atributos: criar, renomear, excluir).
  - Listas.
- **Paleta de comandos e atalhos**:
  - `Ctrl/Cmd+K` abre a paleta. `/` também abre.
  - `G` e depois `H/T/N/E/R/I/S/C/P/D` navega entre as páginas.
  - `N` cria uma nota e `T` cria uma tarefa.
- **Idiomas**:
  - O idioma fica salvo no usuário (no banco) e num cookie.
  - Dá para trocar pelo menu do workspace, pelas Configurações, pela paleta ou pela tela de login.
  - Datas e valores seguem o idioma ativo.

### Testes

```bash
cd e2e && npm install
BASE=http://localhost:3000 node e2e.mjs     # 21 cenários no navegador; rode contra um banco novo, com seed
```

O script precisa do Chrome; defina `CHROME_PATH` se ele não estiver em `/usr/bin/google-chrome`. Outras checagens: `npx tsc --noEmit`, `npm run lint` e `npm run build`.

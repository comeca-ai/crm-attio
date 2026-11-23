# CRM (inspirado no Attio)

CRM self-hosted com a cara e o jeito de usar do [Attio](https://attio.com): barra lateral, tabelas compactas com edição inline, Kanban de negócios, página de registro com atividade, notas e tarefas, e busca rápida com `Ctrl/Cmd + K`.

Feito com Next.js 16 (App Router) + TypeScript + Tailwind 4 + Prisma 6 + PostgreSQL.

## Rodar com Docker (recomendado)

Pré-requisito: Docker com Compose.

```bash
docker compose up --build
```

Abra http://localhost:3000 e entre com:

- **E-mail:** `jhonata@exemplo.com`
- **Senha:** `attio123`

Outros usuários de exemplo (mesma senha): `ana@exemplo.com`, `bruno@exemplo.com`.

Na primeira subida, o app cria as tabelas e popula dados de exemplo. Nas próximas, os dados ficam no volume `pgdata`. Para começar do zero: `docker compose down -v`.

Para produção, defina um segredo próprio: `AUTH_SECRET=um-segredo-longo docker compose up -d --build`.

## Rodar sem Docker

Pré-requisitos: Node.js 20+ e um PostgreSQL rodando.

```bash
cp .env.example .env          # ajuste DATABASE_URL
npm install
npm run db:push               # cria as tabelas
npm run db:seed               # dados de exemplo
npm run dev                   # http://localhost:3000
```

Build de produção: `npm run build && npm start`.
Zerar o banco e repopular: `npm run db:reset`.

## O que tem

| Área | O que faz |
| --- | --- |
| **Barra lateral** | Troca de workspace (menu com sair), Busca rápida, Tarefas, Notas, Registros (Empresas, Pessoas, Negócios) e Listas |
| **Tabelas** | Edição inline em qualquer célula, ordenar, filtrar (contém, é, maior/menor que, vazio), adicionar coluna, excluir em lote, totais no rodapé |
| **Atributos** | Texto, número, moeda (R$), data, seleção, status, usuário, relação com outro registro, e-mail, link e caixa de seleção |
| **Kanban** | Negócios por etapa, arrastar e soltar entre colunas, soma do valor por coluna, criação rápida no fim da coluna |
| **Registro** | Cabeçalho, abas Atividade / Notas / Tarefas, painel de atributos editável, registros relacionados (ex.: pessoas e negócios de uma empresa) |
| **Tarefas** | Agrupadas por prazo (Atrasadas, Hoje, Amanhã, Próximos 7 dias…), concluir com um clique, responsável, prazo e registro vinculado |
| **Notas** | Ligadas a um registro, com título e texto; visão geral em /notes |
| **Listas** | Coleções de registros (ex.: “Pipeline Q4”) com a mesma tabela e Kanban |
| **Busca rápida** | `Ctrl/Cmd + K` busca empresas, pessoas e negócios e navega pelo teclado |
| **Login** | E-mail e senha (bcrypt + cookie JWT httpOnly), um único workspace |

## Estrutura

```
prisma/schema.prisma      modelo de dados (objetos, atributos, registros, notas, tarefas, listas, atividade)
prisma/seed.mjs           dados de exemplo (só roda se o banco estiver vazio)
src/app/(app)/            páginas logadas: tasks, notes, objects/[slug], objects/[slug]/[id], lists
src/app/api/              rotas REST usadas pela interface
src/components/           tabela/Kanban (object-view), registro, tarefas, notas, barra lateral, busca rápida
src/proxy.ts              redireciona para /login sem sessão
```

Os valores dos registros ficam em JSON (`Record.values`), indexados pelo `slug` do atributo. Assim dá para criar atributos novos pela interface sem migração.

## Limites conhecidos

- Um workspace só; sem convite de usuários nem permissões.
- Ordenação e filtros rodam no navegador e não ficam salvos como visualização.
- Relação aceita um registro por atributo (não múltiplos).
- Sem caixa de entrada de e-mail, sincronização de calendário ou enriquecimento automático.

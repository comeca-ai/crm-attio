// Seed idempotente: só popula se o banco estiver vazio.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const opt = (id, label, color) => ({ id, label, color });

async function main() {
  if ((await prisma.user.count()) > 0) {
    console.log("Seed: banco já tem dados, nada a fazer.");
    return;
  }
  const hash = await bcrypt.hash("attio123", 10);
  const jhon = await prisma.user.create({ data: { email: "jhonata@exemplo.com", name: "Jhonata Emerick", passwordHash: hash, avatarColor: "#f97316" } });
  const ana = await prisma.user.create({ data: { email: "ana@exemplo.com", name: "Ana Souza", passwordHash: hash, avatarColor: "#8b5cf6" } });
  const bruno = await prisma.user.create({ data: { email: "bruno@exemplo.com", name: "Bruno Lima", passwordHash: hash, avatarColor: "#10b981" } });

  const companies = await prisma.objectType.create({ data: { slug: "companies", singular: "Empresa", plural: "Empresas", icon: "building", color: "#3b82f6", order: 0 } });
  const people = await prisma.objectType.create({ data: { slug: "people", singular: "Pessoa", plural: "Pessoas", icon: "user", color: "#10b981", order: 1 } });
  const deals = await prisma.objectType.create({ data: { slug: "deals", singular: "Negócio", plural: "Negócios", icon: "target", color: "#f59e0b", order: 2 } });

  const A = (objectId, list) =>
    prisma.attribute.createMany({ data: list.map((a, i) => ({ objectId, order: i, isSystem: i === 0, ...a })) });

  await A(companies.id, [
    { slug: "name", name: "Nome", type: "text", isPrimary: true },
    { slug: "domain", name: "Domínios", type: "url", isSystem: true },
    { slug: "description", name: "Descrição", type: "text", isSystem: true },
    { slug: "categories", name: "Categorias", type: "multiselect", isSystem: true, options: [opt("tecnologia", "Tecnologia", "blue"), opt("internet", "Internet", "orange"), opt("b2b", "B2B", "yellow"), opt("b2c", "B2C", "green"), opt("saas", "SaaS", "purple"), opt("fintech", "Fintech", "pink"), opt("hardware", "Hardware", "gray"), opt("viagens", "Viagens", "red"), opt("dados", "Dados & IA", "blue")] },
    { slug: "location", name: "Localização principal", type: "text", isSystem: true },
    { slug: "linkedin", name: "LinkedIn", type: "url", isSystem: true },
    { slug: "twitter", name: "Twitter", type: "url", isSystem: true },
    { slug: "founded", name: "Data de fundação", type: "date", isSystem: true },
    { slug: "employee_range", name: "Faixa de funcionários", type: "select", isSystem: true, options: [opt("1-10", "1-10", "gray"), opt("11-50", "11-50", "gray"), opt("51-250", "51-250", "blue"), opt("251-1k", "251-1K", "blue"), opt("1k-10k", "1K-10K", "purple"), opt("10k-100k", "10K-100K", "purple"), opt("100k+", "100K+", "green")] },
    { slug: "arr", name: "ARR estimado", type: "select", isSystem: true, options: [opt("0-1m", "R$ 0-1M", "gray"), opt("1m-10m", "R$ 1M-10M", "blue"), opt("10m-100m", "R$ 10M-100M", "purple"), opt("100m-1b", "R$ 100M-1B", "orange"), opt("1b-10b", "R$ 1B-10B", "yellow"), opt("10b+", "R$ 10B+", "green")] },
    { slug: "funding", name: "Investimento captado", type: "currency", isSystem: true },
    { slug: "connection", name: "Força da conexão", type: "select", isSystem: true, options: [opt("muito-forte", "Muito forte", "green"), opt("forte", "Forte", "blue"), opt("media", "Média", "yellow"), opt("fraca", "Fraca", "orange"), opt("nenhuma", "Sem conexão", "gray")] },
    { slug: "owner", name: "Responsável", type: "user" },
  ]);
  await A(people.id, [
    { slug: "name", name: "Nome", type: "text", isPrimary: true },
    { slug: "email", name: "E-mails", type: "email", isSystem: true },
    { slug: "company", name: "Empresa", type: "relation", relationObjectId: companies.id, isSystem: true },
    { slug: "job_title", name: "Cargo", type: "text", isSystem: true },
    { slug: "phone", name: "Telefones", type: "text", isSystem: true },
    { slug: "location", name: "Localização", type: "text", isSystem: true },
    { slug: "linkedin", name: "LinkedIn", type: "url", isSystem: true },
  ]);
  await A(deals.id, [
    { slug: "name", name: "Nome do negócio", type: "text", isPrimary: true },
    { slug: "stage", name: "Etapa", type: "status", isSystem: true, options: [opt("lead", "Lead", "blue"), opt("andamento", "Em andamento", "yellow"), opt("ganho", "Ganho 🎉", "green"), opt("perdido", "Perdido", "red")] },
    { slug: "owner", name: "Responsável", type: "user", isSystem: true },
    { slug: "value", name: "Valor", type: "currency", isSystem: true },
    { slug: "contact", name: "Pessoa associada", type: "relation", relationObjectId: people.id, isSystem: true },
    { slug: "company", name: "Empresa associada", type: "relation", relationObjectId: companies.id, isSystem: true },
    { slug: "close_date", name: "Previsão de fechamento", type: "date" },
  ]);

  const compData = [
    ["Google", "google.com", "O Google organiza a informação do mundo e a torna acessível e útil.", ["tecnologia", "internet", "b2c"], "Mountain View, EUA", "100k+", "10b+", 0, "forte", jhon.id, "1998-09-04"],
    ["Microsoft", "microsoft.com", "Desenvolve, licencia e oferece suporte a software, serviços e dispositivos.", ["tecnologia", "b2b", "saas"], "Redmond, EUA", "100k+", "10b+", 0, "media", ana.id, "1975-04-04"],
    ["Apple", "apple.com", "Projeta e vende smartphones, computadores, tablets e serviços.", ["tecnologia", "hardware", "b2c"], "Cupertino, EUA", "100k+", "10b+", 0, "fraca", bruno.id, "1976-04-01"],
    ["Airbnb", "airbnb.com", "Comunidade global de hospedagem e experiências.", ["internet", "viagens", "b2c"], "São Francisco, EUA", "1k-10k", "10b+", 6400000000, "media", jhon.id, "2008-08-01"],
    ["Nubank", "nubank.com.br", "Banco digital com mais de 100 milhões de clientes na América Latina.", ["fintech", "b2c"], "São Paulo, Brasil", "1k-10k", "1b-10b", 4100000000, "muito-forte", jhon.id, "2013-05-06"],
    ["Datarisk", "datarisk.io", "Plataforma de modelos de crédito e prevenção a fraude com IA.", ["dados", "b2b", "saas"], "São Paulo, Brasil", "51-250", "10m-100m", 50000000, "forte", ana.id, "2017-01-01"],
    ["Hotmart", "hotmart.com", "Plataforma para criar, vender e distribuir produtos digitais.", ["internet", "b2b"], "Belo Horizonte, Brasil", "1k-10k", "100m-1b", 680000000, "media", ana.id, "2011-01-01"],
    ["Intercom", "intercom.com", "Plataforma de atendimento ao cliente com IA.", ["saas", "b2b"], "Dublin, Irlanda", "1k-10k", "100m-1b", 240000000, "nenhuma", bruno.id, "2011-08-01"],
  ];
  const comp = {};
  for (const [name, domain, description, categories, location, employee_range, arr, funding, connection, owner, founded] of compData) {
    const handle = name.toLowerCase();
    comp[name] = await prisma.record.create({ data: { objectId: companies.id, values: { name, domain, description, categories, location, employee_range, arr, funding: funding || null, connection, owner, founded, linkedin: `linkedin.com/company/${handle}`, twitter: `x.com/${handle}` } } });
  }

  const peopleData = [
    ["Mariana Costa", "mariana@nubank.com.br", "Head de Compras", "Nubank", "+55 11 98888-1111", "São Paulo, Brasil"],
    ["Rafael Alves", "rafael@hotmart.com", "CTO", "Hotmart", "+55 31 97777-2222", "Belo Horizonte, Brasil"],
    ["Juliana Martins", "juliana@datarisk.io", "Gerente de Operações", "Datarisk", "+55 11 96666-3333", "São Paulo, Brasil"],
    ["Sundar Pichai", "sundar@google.com", "CEO", "Google", "+1 650 555-0100", "Mountain View, EUA"],
    ["Satya Nadella", "satya@microsoft.com", "CEO", "Microsoft", "+1 425 555-0101", "Redmond, EUA"],
    ["Tim Cook", "tim@apple.com", "CEO", "Apple", "+1 408 555-0102", "Cupertino, EUA"],
    ["Brian Chesky", "brian@airbnb.com", "CEO", "Airbnb", "+1 415 555-0103", "São Francisco, EUA"],
    ["Lucas Ferreira", "lucas@datarisk.io", "Head de Vendas", "Datarisk", "+55 11 93333-6666", "São Paulo, Brasil"],
    ["Fernanda Lopes", "fernanda@nubank.com.br", "Analista Financeira", "Nubank", "+55 11 90000-9999", "São Paulo, Brasil"],
    ["Eoghan McCabe", "eoghan@intercom.com", "CEO", "Intercom", "+353 1 555-0104", "Dublin, Irlanda"],
  ];
  const ppl = {};
  for (const [name, email, job_title, c, phone, location] of peopleData) {
    ppl[name] = await prisma.record.create({ data: { objectId: people.id, values: { name, email, job_title, company: comp[c].id, phone, location, linkedin: `linkedin.com/in/${name.toLowerCase().replace(/ /g, "-")}` } } });
  }

  const dealData = [
    ["Nubank — Licença anual", "andamento", 180000, "Nubank", "Mariana Costa", jhon.id, "2026-12-15"],
    ["Hotmart — Expansão", "andamento", 95000, "Hotmart", "Rafael Alves", ana.id, "2026-12-20"],
    ["Datarisk — Piloto", "lead", 40000, "Datarisk", "Juliana Martins", jhon.id, "2027-01-10"],
    ["Google — Integração Workspace", "lead", 250000, "Google", "Sundar Pichai", bruno.id, "2027-02-01"],
    ["Microsoft — Parceria Azure", "ganho", 320000, "Microsoft", "Satya Nadella", ana.id, "2026-11-10"],
    ["Airbnb — Upsell", "andamento", 135000, "Airbnb", "Brian Chesky", jhon.id, "2026-12-05"],
    ["Apple — Prova de conceito", "perdido", 120000, "Apple", "Tim Cook", bruno.id, "2026-10-30"],
    ["Intercom — Novo contrato", "lead", 48000, "Intercom", "Eoghan McCabe", ana.id, "2027-01-20"],
  ];
  const dl = {};
  for (const [name, stage, value, c, p, owner, close_date] of dealData) {
    dl[name] = await prisma.record.create({ data: { objectId: deals.id, values: { name, stage, value, company: comp[c].id, contact: ppl[p].id, owner, close_date } } });
  }

  // Atividade de criação para todos os registros
  const all = await prisma.record.findMany();
  await prisma.activity.createMany({ data: all.map((r) => ({ recordId: r.id, actorId: jhon.id, kind: "created", message: "criou o registro", createdAt: r.createdAt })) });

  const day = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
  const tasks = [
    ["Enviar proposta revisada para a Mariana", -1, jhon.id, dl["Nubank — Licença anual"].id],
    ["Ligar para o Rafael sobre a expansão", 0, jhon.id, dl["Hotmart — Expansão"].id],
    ["Preparar demo do piloto", 0, ana.id, dl["Datarisk — Piloto"].id],
    ["Mapear decisores no Google", 2, bruno.id, comp["Google"].id],
    ["Revisar contrato do Airbnb", 5, jhon.id, dl["Airbnb — Upsell"].id],
    ["Agendar reunião de kickoff com a Intercom", 12, ana.id, comp["Intercom"].id],
    ["Atualizar previsão do trimestre", null, jhon.id, null],
  ];
  for (const [content, d, assigneeId, recordId] of tasks) {
    await prisma.task.create({ data: { content, dueDate: d === null ? null : day(d), assigneeId, recordId, creatorId: jhon.id } });
  }
  await prisma.task.create({ data: { content: "Enviar NDA para a Microsoft", dueDate: day(-3), assigneeId: ana.id, recordId: comp["Microsoft"].id, creatorId: jhon.id, completed: true, completedAt: day(-3) } });

  await prisma.note.create({ data: { recordId: dl["Nubank — Licença anual"].id, authorId: jhon.id, title: "Call de alinhamento", content: "Mariana confirmou orçamento para Q1.\nPróximo passo: enviar proposta com desconto de 10% para contrato de 2 anos." } });
  await prisma.note.create({ data: { recordId: comp["Hotmart"].id, authorId: ana.id, title: "Contexto da conta", content: "Time de engenharia avaliando 3 fornecedores. Rafael é o decisor técnico." } });
  await prisma.note.create({ data: { recordId: comp["Datarisk"].id, authorId: jhon.id, title: "Primeira conversa", content: "Interesse em automatizar o funil de vendas. Lucas pediu estudo de caso do setor de crédito." } });

  for (const n of await prisma.note.findMany()) {
    await prisma.activity.create({ data: { recordId: n.recordId, actorId: n.authorId, kind: "note", message: `adicionou a nota “${n.title}”` } });
  }

  const l1 = await prisma.list.create({ data: { name: "Pipeline Q4", objectId: deals.id } });
  const l2 = await prisma.list.create({ data: { name: "Contas estratégicas", objectId: companies.id } });
  for (const n of ["Nubank — Licença anual", "Hotmart — Expansão", "Airbnb — Upsell"]) await prisma.listEntry.create({ data: { listId: l1.id, recordId: dl[n].id } });
  for (const n of ["Nubank", "Datarisk", "Google"]) await prisma.listEntry.create({ data: { listId: l2.id, recordId: comp[n].id } });

  console.log("Seed concluído. Login: jhonata@exemplo.com / attio123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

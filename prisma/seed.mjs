// Idempotent seed: only populates an empty database.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const opt = (obj, attr, id, label, color) => ({ id, label, color, key: `opt.${obj}.${attr}.${id}` });

async function main() {
  if ((await prisma.user.count()) > 0) {
    console.log("Seed: database already has data, skipping.");
    return;
  }
  const hash = await bcrypt.hash("attio123", 10);
  const jhon = await prisma.user.create({ data: { email: "jhonata@exemplo.com", firstName: "Jhonata", lastName: "Emerick", passwordHash: hash, avatarColor: "#f97316", locale: "en" } });
  const ana = await prisma.user.create({ data: { email: "ana@exemplo.com", firstName: "Ana", lastName: "Souza", passwordHash: hash, avatarColor: "#8b5cf6", locale: "pt-BR" } });
  const bruno = await prisma.user.create({ data: { email: "bruno@exemplo.com", firstName: "Bruno", lastName: "Lima", passwordHash: hash, avatarColor: "#10b981", locale: "pt-BR" } });
  await prisma.workspace.create({ data: { name: "Jhonata" } });

  const mkObj = (slug, singular, plural, icon, color, order) => prisma.objectType.create({ data: { slug, singular, plural, nameKey: slug, icon, color, order } });
  const companies = await mkObj("companies", "Company", "Companies", "building", "#2e7cf6", 0);
  const people = await mkObj("people", "Person", "People", "user", "#2e7cf6", 1);
  const deals = await mkObj("deals", "Deal", "Deals", "target", "#f2802d", 2);

  const A = {};
  const mkAttrs = async (obj, list) => {
    A[obj.slug] = {};
    let i = 0;
    for (const a of list) {
      A[obj.slug][a.slug] = await prisma.attribute.create({
        data: { objectId: obj.id, order: i++, isSystem: true, nameKey: `attr.${obj.slug}.${a.slug}`, ...a },
      });
    }
  };
  const ro = { readOnly: true };

  await mkAttrs(companies, [
    { slug: "name", name: "Name", type: "text", isPrimary: true },
    { slug: "domains", name: "Domains", type: "domain" },
    { slug: "description", name: "Description", type: "text" },
    { slug: "team", name: "Team", type: "relation", relationObjectId: people.id, config: { multiple: true } },
    { slug: "categories", name: "Categories", type: "multiselect", options: [
      opt("companies", "categories", "technology", "Technology", "blue"), opt("companies", "categories", "internet", "Internet", "orange"),
      opt("companies", "categories", "b2b", "B2B", "yellow"), opt("companies", "categories", "b2c", "B2C", "green"),
      opt("companies", "categories", "saas", "SaaS", "purple"), opt("companies", "categories", "fintech", "Financial Services", "pink"),
      opt("companies", "categories", "hardware", "Hardware", "gray"), opt("companies", "categories", "travel", "Travel", "red"),
      opt("companies", "categories", "data", "Data & AI", "blue"), opt("companies", "categories", "broadcasting", "Broadcasting", "purple"),
      opt("companies", "categories", "publishing", "Publishing", "pink"), opt("companies", "categories", "enterprise", "Enterprise", "gray"),
    ] },
    { slug: "primary_location", name: "Primary location", type: "location" },
    { slug: "linkedin", name: "LinkedIn", type: "url" },
    { slug: "twitter", name: "Twitter", type: "url" },
    { slug: "twitter_followers", name: "Twitter follower count", type: "number" },
    { slug: "foundation_date", name: "Foundation date", type: "date" },
    { slug: "employee_range", name: "Employee range", type: "select", options: ["1-10", "11-50", "51-250", "251-1K", "1K-5K", "5K-10K", "10K-50K", "50K-100K", "100K+"].map((l) => ({ id: l.toLowerCase(), label: l, color: "gray" })) },
    { slug: "estimated_arr", name: "Estimated ARR", type: "select", options: ["$0-$1M", "$1M-$10M", "$10M-$50M", "$50M-$100M", "$100M-$250M", "$250M-$500M", "$500M-$1B", "$1B-$10B", "$10B+"].map((l, i) => ({ id: `arr${i}`, label: l, color: "gray" })) },
    { slug: "funding_raised", name: "Funding raised", type: "currency", config: { currency: "USD" } },
    { slug: "connection_strength", name: "Connection strength", type: "select", options: [
      opt("companies", "connection_strength", "very_strong", "Very strong", "green"), opt("companies", "connection_strength", "strong", "Strong", "blue"),
      opt("companies", "connection_strength", "good", "Good", "yellow"), opt("companies", "connection_strength", "weak", "Weak", "orange"),
      opt("companies", "connection_strength", "very_weak", "Very weak", "red"),
    ] },
    { slug: "associated_deals", name: "Associated deals", type: "relation", relationObjectId: deals.id, config: { multiple: true } },
    { slug: "created_at", name: "Created at", type: "timestamp", config: ro },
    { slug: "created_by", name: "Created by", type: "user", config: ro },
  ]);
  await mkAttrs(people, [
    { slug: "name", name: "Name", type: "personal-name", isPrimary: true },
    { slug: "email_addresses", name: "Email addresses", type: "email" },
    { slug: "company", name: "Company", type: "relation", relationObjectId: companies.id, config: {} },
    { slug: "job_title", name: "Job title", type: "text" },
    { slug: "phone_numbers", name: "Phone numbers", type: "phone" },
    { slug: "primary_location", name: "Primary location", type: "location" },
    { slug: "linkedin", name: "LinkedIn", type: "url" },
    { slug: "connection_strength", name: "Connection strength", type: "select", options: [
      opt("people", "connection_strength", "very_strong", "Very strong", "green"), opt("people", "connection_strength", "strong", "Strong", "blue"),
      opt("people", "connection_strength", "good", "Good", "yellow"), opt("people", "connection_strength", "weak", "Weak", "orange"),
      opt("people", "connection_strength", "very_weak", "Very weak", "red"),
    ] },
    { slug: "associated_deals", name: "Associated deals", type: "relation", relationObjectId: deals.id, config: { multiple: true } },
    { slug: "created_at", name: "Created at", type: "timestamp", config: ro },
    { slug: "created_by", name: "Created by", type: "user", config: ro },
  ]);
  await mkAttrs(deals, [
    { slug: "name", name: "Deal name", type: "text", isPrimary: true },
    { slug: "stage", name: "Deal stage", type: "status", options: [
      opt("deals", "stage", "lead", "Lead", "blue"), opt("deals", "stage", "in_progress", "In Progress", "pink"),
      opt("deals", "stage", "won", "Won 🎉", "green"), opt("deals", "stage", "lost", "Lost", "red"),
    ] },
    { slug: "owner", name: "Deal owner", type: "user" },
    { slug: "value", name: "Deal value", type: "currency", config: { currency: "USD" } },
    { slug: "associated_people", name: "Associated people", type: "relation", relationObjectId: people.id, config: { multiple: true } },
    { slug: "associated_company", name: "Associated company", type: "relation", relationObjectId: companies.id, config: {} },
    { slug: "close_date", name: "Expected close date", type: "date" },
    { slug: "created_at", name: "Created at", type: "timestamp", config: ro },
    { slug: "created_by", name: "Created by", type: "user", config: ro },
  ]);

  // Inverse pairs (many-to-many / one-to-many)
  const pair = async (a, b) => {
    await prisma.attribute.update({ where: { id: a.id }, data: { config: { ...(a.config ?? {}), inverseAttrId: b.id } } });
    await prisma.attribute.update({ where: { id: b.id }, data: { config: { ...(b.config ?? {}), inverseAttrId: a.id } } });
  };
  await pair(A.companies.team, A.people.company);
  await pair(A.companies.associated_deals, A.deals.associated_company);
  await pair(A.people.associated_deals, A.deals.associated_people);

  const compData = [
    ["Google", "google.com", "Google specializes in organizing and providing access to the world's information.", ["technology", "internet", "broadcasting", "publishing"], "Mountain View, United States", 28946065, "1998-09-04", "100k+", "arr8", null, "good"],
    ["Microsoft", "microsoft.com", "Microsoft develops, licenses, and supports software, services, devices and solutions.", ["technology", "saas", "enterprise"], "Redmond, United States", 12814907, "1975-04-04", "100k+", "arr8", null, "strong"],
    ["Disney", "disney.com", "Disney serves as a comprehensive hub for entertainment, parks and experiences.", ["broadcasting", "b2c"], "Burbank, United States", 10140332, "1923-10-16", "100k+", "arr8", null, "weak"],
    ["Apple", "apple.com", "Apple is a multinational technology company that designs consumer electronics and software.", ["technology", "hardware", "b2c"], "Cupertino, United States", 9119742, "1976-04-01", "100k+", "arr8", null, "very_weak"],
    ["United Airlines", "united.com", "United Airlines, a subsidiary of United Airlines Holdings, is a major American airline.", ["travel", "b2c"], "Chicago, United States", 1174209, "1926-04-06", "50k-100k", "arr8", null, "weak"],
    ["PayPal", "paypal.com", "PayPal provides a comprehensive digital payments platform for consumers and merchants.", ["fintech", "internet"], "San Jose, United States", 969425, "1998-12-01", "10k-50k", "arr8", null, "good"],
    ["Airbnb", "airbnb.com", "Airbnb is the world's largest community-driven hospitality marketplace.", ["internet", "travel", "b2c"], "San Francisco, United States", 883549, "2008-08-01", "5k-10k", "arr7", 6400000000, "strong"],
    ["LVMH", "lvmh.com", "LVMH, the world leader in luxury, is a family-controlled group of iconic brands.", ["b2c"], "Paris, France", 198135, "1987-06-03", "100k+", "arr8", null, "very_weak"],
    ["Intercom", "intercom.com", "Intercom provides a comprehensive AI-first customer service platform.", ["saas", "b2b"], "San Francisco, United States", 42427, "2011-08-01", "1k-5k", "arr5", 240000000, "good"],
    ["Attio", "attio.com", "Attio provides a customizable and data-driven CRM for modern teams.", ["saas", "b2b"], "London, United Kingdom", 1340, "2019-01-01", "51-250", "arr2", 116000000, "very_strong"],
    ["Nubank", "nubank.com.br", "Nubank is a digital bank serving more than 100 million customers in Latin America.", ["fintech", "b2c"], "São Paulo, Brazil", 280000, "2013-05-06", "5k-10k", "arr7", 4100000000, "very_strong"],
    ["Datarisk", "datarisk.io", "Datarisk builds machine-learning models for credit and fraud prevention.", ["data", "b2b", "saas"], "São Paulo, Brazil", 2100, "2017-01-01", "51-250", "arr2", 50000000, "strong"],
  ];
  const comp = {};
  let t0 = Date.now() - 1000 * 60 * 60 * 24 * 20;
  const at = () => new Date((t0 += 1000 * 60 * 37));
  for (const [name, domains, description, categories, loc, followers, founded, emp, arr, funding, conn] of compData) {
    const handle = name.toLowerCase().replace(/[^a-z]/g, "");
    comp[name] = await prisma.record.create({ data: { objectId: companies.id, createdById: jhon.id, createdAt: at(), values: {
      name, domains, description, categories, primary_location: loc, twitter_followers: followers, foundation_date: founded,
      employee_range: emp, estimated_arr: arr, funding_raised: funding, connection_strength: conn,
      linkedin: `linkedin.com/company/${handle}`, twitter: `x.com/${handle}`, team: [], associated_deals: [],
    } } });
  }

  const peopleData = [
    ["Mariana", "Costa", "mariana@nubank.com.br", "Head of Procurement", "Nubank", "+55 11 98888-1111", "São Paulo, Brazil", "very_strong"],
    ["Rafael", "Alves", "rafael@intercom.com", "CTO", "Intercom", "+1 415 555-0122", "San Francisco, United States", "good"],
    ["Juliana", "Martins", "juliana@datarisk.io", "Operations Manager", "Datarisk", "+55 11 96666-3333", "São Paulo, Brazil", "strong"],
    ["Sundar", "Pichai", "sundar@google.com", "CEO", "Google", "+1 650 555-0100", "Mountain View, United States", "good"],
    ["Satya", "Nadella", "satya@microsoft.com", "CEO", "Microsoft", "+1 425 555-0101", "Redmond, United States", "strong"],
    ["Tim", "Cook", "tim@apple.com", "CEO", "Apple", "+1 408 555-0102", "Cupertino, United States", "weak"],
    ["Brian", "Chesky", "brian@airbnb.com", "CEO", "Airbnb", "+1 415 555-0103", "San Francisco, United States", "strong"],
    ["Lucas", "Ferreira", "lucas@datarisk.io", "Head of Sales", "Datarisk", "+55 11 93333-6666", "São Paulo, Brazil", "very_strong"],
    ["Fernanda", "Lopes", "fernanda@nubank.com.br", "Financial Analyst", "Nubank", "+55 11 90000-9999", "São Paulo, Brazil", "good"],
    ["Eoghan", "McCabe", "eoghan@intercom.com", "CEO", "Intercom", "+353 1 555-0104", "Dublin, Ireland", "weak"],
    ["Nicolas", "Sharp", "nicolas@attio.com", "Co-founder", "Attio", "+44 20 5555-0105", "London, United Kingdom", "very_strong"],
  ];
  const ppl = {};
  for (const [first_name, last_name, email, job_title, c, phone, loc, conn] of peopleData) {
    const r = await prisma.record.create({ data: { objectId: people.id, createdById: jhon.id, createdAt: at(), values: {
      name: { first_name, last_name }, email_addresses: email, job_title, company: comp[c].id, phone_numbers: phone, primary_location: loc,
      connection_strength: conn, linkedin: `linkedin.com/in/${first_name.toLowerCase()}-${last_name.toLowerCase()}`, associated_deals: [],
    } } });
    ppl[`${first_name} ${last_name}`] = r;
    const cv = comp[c].values; cv.team.push(r.id);
  }

  const dealData = [
    ["Nubank — Annual license", "in_progress", 180000, "Nubank", ["Mariana Costa", "Fernanda Lopes"], jhon.id, "2026-12-15"],
    ["Intercom — Expansion", "in_progress", 95000, "Intercom", ["Rafael Alves"], ana.id, "2026-12-20"],
    ["Datarisk — Pilot", "lead", 40000, "Datarisk", ["Juliana Martins", "Lucas Ferreira"], jhon.id, "2027-01-10"],
    ["Google — Workspace integration", "lead", 250000, "Google", ["Sundar Pichai"], bruno.id, "2027-02-01"],
    ["Microsoft — Azure partnership", "won", 320000, "Microsoft", ["Satya Nadella"], ana.id, "2026-11-10"],
    ["Airbnb — Upsell", "in_progress", 135000, "Airbnb", ["Brian Chesky"], jhon.id, "2026-12-05"],
    ["Apple — Proof of concept", "lost", 120000, "Apple", ["Tim Cook"], bruno.id, "2026-10-30"],
    ["Attio — Partner program", "lead", 48000, "Attio", ["Nicolas Sharp"], ana.id, "2027-01-20"],
  ];
  const dl = {};
  for (const [name, stage, value, c, ps, owner, close_date] of dealData) {
    const r = await prisma.record.create({ data: { objectId: deals.id, createdById: owner, createdAt: at(), values: {
      name, stage, value, owner, close_date, associated_company: comp[c].id, associated_people: ps.map((p) => ppl[p].id),
    } } });
    dl[name] = r;
    comp[c].values.associated_deals.push(r.id);
    for (const p of ps) ppl[p].values.associated_deals.push(r.id);
  }
  for (const r of [...Object.values(comp), ...Object.values(ppl)]) await prisma.record.update({ where: { id: r.id }, data: { values: r.values } });

  const all = await prisma.record.findMany();
  await prisma.activity.createMany({ data: all.map((r) => ({ recordId: r.id, actorId: null, kind: "created", data: {}, createdAt: r.createdAt })) });

  // Due dates are calendar dates stored at 12:00 UTC; "today" is taken in the users' zone.
  const [ty, tm, td] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("-").map(Number);
  const day = (n) => new Date(Date.UTC(ty, tm - 1, td + n, 12));
  const tasks = [
    ["Send revised proposal to Mariana", -1, jhon.id, dl["Nubank — Annual license"].id, ana.id],
    ["Call Rafael about the expansion", 0, jhon.id, dl["Intercom — Expansion"].id, jhon.id],
    ["Prepare pilot demo", 0, ana.id, dl["Datarisk — Pilot"].id, jhon.id],
    ["Map decision makers at Google", 2, bruno.id, comp["Google"].id, jhon.id],
    ["Review Airbnb contract", 5, jhon.id, dl["Airbnb — Upsell"].id, bruno.id],
    ["Schedule kickoff with Attio", 12, ana.id, comp["Attio"].id, jhon.id],
    ["Update quarterly forecast", null, jhon.id, null, jhon.id],
  ];
  for (const [content, d, assigneeId, recordId, creatorId] of tasks) {
    const t = await prisma.task.create({ data: { content, dueDate: d === null ? null : day(d), assigneeId, recordId, creatorId } });
    if (assigneeId !== creatorId) await prisma.notification.create({ data: { userId: assigneeId, actorId: creatorId, kind: "task_assigned", data: { taskId: t.id, content, recordId } } });
    if (recordId) await prisma.activity.create({ data: { recordId, actorId: creatorId, kind: "task_created", data: { content } } });
  }
  await prisma.task.create({ data: { content: "Send NDA to Microsoft", dueDate: day(-3), assigneeId: ana.id, recordId: comp["Microsoft"].id, creatorId: jhon.id, completed: true, completedAt: day(-3) } });

  const notes = [
    [dl["Nubank — Annual license"].id, ana.id, "Alignment call", "Mariana confirmed budget for Q1.\nNext step: send a proposal with 10% off for a 2-year contract. @Jhonata can you own this?"],
    [comp["Intercom"].id, ana.id, "Account context", "Engineering is evaluating 3 vendors. Rafael is the technical decision maker."],
    [comp["Datarisk"].id, jhon.id, "First conversation", "Interested in automating the sales funnel. Lucas asked for a credit-industry case study."],
  ];
  for (const [recordId, authorId, title, content] of notes) {
    const n = await prisma.note.create({ data: { recordId, authorId, title, content } });
    await prisma.activity.create({ data: { recordId, actorId: authorId, kind: "note", data: { title } } });
    if (content.includes("@Jhonata")) await prisma.notification.create({ data: { userId: jhon.id, actorId: authorId, kind: "mention", data: { noteId: n.id, title, recordId } } });
  }

  // Default views
  await prisma.view.create({ data: { objectId: companies.id, name: "All Companies", nameKey: "views.allCompanies", type: "table", order: 0, config: {
    sorts: [{ slug: "created_at", dir: "asc" }], filter: { kind: "group", id: "root", conj: "and", items: [] }, calcs: {},
    columns: ["description", "primary_location", "foundation_date", "twitter_followers", "twitter", "linkedin", "domains", "categories", "team", "employee_range", "estimated_arr", "connection_strength", "associated_deals"],
  } } });
  await prisma.view.create({ data: { objectId: people.id, name: "All People", nameKey: "views.allPeople", type: "table", order: 0, config: {
    sorts: [{ slug: "created_at", dir: "asc" }], filter: { kind: "group", id: "root", conj: "and", items: [] }, calcs: {},
    columns: ["email_addresses", "company", "job_title", "phone_numbers", "primary_location", "connection_strength", "linkedin", "associated_deals"],
  } } });
  await prisma.view.create({ data: { objectId: deals.id, name: "Pipeline", nameKey: "views.pipeline", type: "kanban", order: 0, config: {
    sorts: [{ slug: "created_at", dir: "desc" }], filter: { kind: "group", id: "root", conj: "and", items: [] }, calcs: {},
    columns: ["stage", "owner", "value", "associated_company", "associated_people", "close_date", "created_by"], groupBy: "stage", cardFields: ["value", "associated_company", "owner"],
  } } });
  await prisma.view.create({ data: { objectId: deals.id, name: "All Deals", nameKey: "views.allDeals", type: "table", order: 1, config: {
    sorts: [{ slug: "created_at", dir: "desc" }], filter: { kind: "group", id: "root", conj: "and", items: [] }, calcs: { value: "sum" },
    columns: ["stage", "owner", "value", "associated_company", "associated_people", "close_date", "created_by"],
  } } });

  const l1 = await prisma.list.create({ data: { name: "Q4 Pipeline", objectId: deals.id } });
  const l2 = await prisma.list.create({ data: { name: "Strategic accounts", objectId: companies.id } });
  for (const n of ["Nubank — Annual license", "Intercom — Expansion", "Airbnb — Upsell"]) await prisma.listEntry.create({ data: { listId: l1.id, recordId: dl[n].id } });
  for (const n of ["Nubank", "Datarisk", "Google"]) await prisma.listEntry.create({ data: { listId: l2.id, recordId: comp[n].id } });

  await prisma.favorite.create({ data: { userId: jhon.id, recordId: comp["Nubank"].id } });
  await prisma.dashboard.create({ data: { name: "Sales overview" } });

  console.log("Seed complete. Login: jhonata@exemplo.com / attio123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

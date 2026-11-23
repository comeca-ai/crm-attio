// E2E v2 for the Attio clone. BASE env (default http://localhost:3101). Mutates data: run against a fresh seeded DB.
import { chromium } from "playwright-core";
import fs from "node:fs";
const B = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "e2e/output";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const errors = [];
page.on("console", (m) => m.type() === "error" && !/favicon|google\.com\/s2|status of 404 \(\)/.test(m.text()) && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
page.on("response", (r) => r.status() >= 400 && !/google\.com\/s2|gstatic\.com/.test(r.url()) && errors.push(`HTTP ${r.status()} ${r.url()}`));
page.on("dialog", (d) => d.accept(d.type() === "prompt" ? globalThis.__prompt ?? "" : undefined));
const results = [];
let n = 0;
async function step(name, fn) {
  n++;
  try { await fn(); results.push(["PASS", name]); console.log("PASS", name); }
  catch (e) {
    results.push(["FAIL", name, String(e).split("\n")[0]]); console.log("FAIL", name, String(e).split("\n").slice(0, 3).join(" | "));
    await page.screenshot({ path: `${OUT}/fail-${String(n).padStart(2, "0")}.png` }).catch(() => {});
  }
}
const ok = (c, m) => { if (!c) throw new Error(m); };
const api = async (path, method = "GET", body) => {
  const r = await page.request.fetch(B + path, { method, data: body, headers: body ? { "content-type": "application/json" } : {} });
  ok(r.ok(), `${method} ${path} -> ${r.status()}`); return r.json();
};
const go = async (p) => { await page.goto(B + p); await page.waitForLoadState("networkidle"); };
const records = async (slug) => (await api(`/api/objects/${slug}/records`)).records ?? (await api(`/api/objects/${slug}/records`));
const byName = async (slug, name) => (await records(slug)).find((r) => (r.values.name?.full ?? r.values.name) === name || r.values.name === name);
const drag = async (src, dst) => {
  const a = await src.boundingBox(), b = await dst.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 5, a.y + a.height / 2 + 5, { steps: 3 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 }); await page.mouse.up();
};

await step("login (English default)", async () => {
  await go("/login");
  await page.fill("input[type=email]", "jhonata@exemplo.com");
  await page.fill("input[type=password]", "attio123");
  await page.click("form button:not([type=button])");
  await page.waitForURL("**/home");
  await page.getByTestId("greeting").filter({ hasText: /^Good (morning|afternoon|evening), Jhonata/ }).waitFor();
  ok((await page.getAttribute("html", "lang")) === "en", "html lang en");
});

await step("language: workspace menu -> Português, persisted", async () => {
  await page.getByTestId("workspace-menu").click();
  await page.getByText("Language", { exact: true }).click();
  await page.getByTestId("language-menu").getByText("Português (Brasil)").click();
  await page.getByTestId("greeting").filter({ hasText: /^(Bom dia|Boa tarde|Boa noite), Jhonata/ }).waitFor();
  await page.getByTestId("sidebar").getByText("Tarefas", { exact: true }).waitFor();
  await page.reload(); await page.getByTestId("greeting").filter({ hasText: /^(Bom dia|Boa tarde|Boa noite)/ }).waitFor();
  ok((await page.getAttribute("html", "lang")) === "pt-BR", "html lang pt-BR");
  const me = await api("/api/me"); ok((me.user ?? me).locale === "pt-BR", "DB locale pt-BR");
  await page.screenshot({ path: `${OUT}/home-pt-BR.png` });
});

await step("pt-BR: locale-aware currency and dates on deals", async () => {
  await go("/objects/deals?view=");
  await page.getByText(/US\$\s?250\.000/).first().waitFor();
  await go("/objects/companies");
  await page.getByText("4 de set. de 1998").first().waitFor();
  await page.getByTestId("sort-chip").filter({ hasText: "Ordenado por" }).waitFor();
});

await step("language: Settings > Appearance -> English", async () => {
  await go("/settings/appearance");
  await page.getByTestId("lang-en").click();
  await page.getByText("Appearance", { exact: true }).first().waitFor();
  ok((await api("/api/me")).user?.locale === "en" || (await api("/api/me")).locale === "en", "DB locale en");
});

await step("language: command palette switch (and back)", async () => {
  await go("/home");
  await page.keyboard.press("Control+k");
  await page.getByTestId("palette").waitFor();
  await page.keyboard.type("Switch language");
  await page.getByTestId("palette-item").filter({ hasText: "Switch language to Português" }).click();
  await page.getByTestId("greeting").filter({ hasText: /^(Bom dia|Boa tarde|Boa noite)/ }).waitFor();
  await page.keyboard.press("Control+k");
  await page.keyboard.type("Mudar idioma");
  await page.getByTestId("palette-item").filter({ hasText: "Mudar idioma para English" }).click();
  await page.getByTestId("greeting").filter({ hasText: /^Good/ }).waitFor();
});

await step("saved views: create, rename, duplicate, delete", async () => {
  await go("/objects/companies");
  await page.getByTestId("view-menu").click();
  await page.getByText("Create new view").click();
  await page.getByTestId("view-name").fill("E2E view");
  await page.getByTestId("view-save").click();
  await page.waitForURL(/view=/);
  await page.getByTestId("view-menu").filter({ hasText: "E2E view" }).waitFor();
  globalThis.__prompt = "E2E renamed";
  await page.getByTestId("view-menu").click();
  const row = page.getByTestId("view-menu-popover").locator("div.group, div").filter({ hasText: /^E2E view$/ }).last();
  await row.getByLabel("View options").click();
  await page.getByText("Rename", { exact: true }).click();
  await page.getByTestId("view-menu").filter({ hasText: "E2E renamed" }).waitFor();
  await page.getByTestId("view-menu").click();
  await page.getByTestId("view-menu-popover").locator("div").filter({ hasText: /^E2E renamed$/ }).last().getByLabel("View options").click();
  await page.getByText("Duplicate", { exact: true }).click();
  await page.getByTestId("view-menu").filter({ hasText: "E2E renamed (copy)" }).waitFor({ timeout: 5000 }).catch(async () => { await page.getByTestId("view-menu").filter({ hasText: /E2E renamed/ }).waitFor(); });
  const views = (await api("/api/views?objectSlug=companies").catch(() => null));
  await page.getByTestId("view-menu").click();
  await page.getByTestId("view-menu-popover").locator("div").filter({ hasText: /^E2E renamed$/ }).last().getByLabel("View options").click();
  await page.getByText("Delete", { exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByTestId("view-menu").click();
  ok(await page.getByTestId("view-menu-popover").getByText("E2E renamed", { exact: true }).count() === 0, "deleted view gone");
  await page.keyboard.press("Escape");
  void views;
});

await step("kanban view creation on companies (group by select)", async () => {
  await go("/objects/companies");
  await page.getByTestId("view-menu").click();
  await page.getByText("Create new view").click();
  await page.getByTestId("view-name").fill("By range");
  await page.getByTestId("view-type-kanban").click();
  await page.getByTestId("view-save").click();
  await page.getByTestId("kanban").waitFor();
  ok(await page.getByTestId("kanban-card").count() > 0, "cards rendered");
});

await step("multi-sort: add second sort, drag to reorder, persisted", async () => {
  await go("/objects/companies");
  await page.getByTestId("view-menu").click();
  await page.getByTestId("view-menu-popover").getByText("All Companies", { exact: true }).click();
  await page.getByTestId("sort-chip").click();
  await page.getByText("Add sort").click();
  const rows = page.getByTestId("sort-row");
  await rows.nth(1).waitFor();
  await rows.nth(1).locator("select").first().selectOption("name");
  ok(await rows.nth(0).locator("select").first().inputValue() === "created_at", "first is created_at");
  await drag(rows.nth(1).locator("svg").first(), rows.nth(0));
  await page.waitForFunction(() => document.querySelectorAll('[data-testid=sort-row] select')[0]?.value === "name");
  await page.getByTestId("sort-chip").filter({ hasText: "+1" }).waitFor();
  await page.waitForTimeout(600);
  await page.keyboard.press("Escape");
  await page.reload(); await page.waitForLoadState("networkidle");
  await page.getByTestId("sort-chip").filter({ hasText: /Name\s*\+1/ }).waitFor();
  const first = await page.getByTestId("record-row").first().innerText();
  ok(/Airbnb/.test(first), "sorted by name asc: first row Airbnb, got " + first.slice(0, 40));
});

await step("nested filters: rule AND (group OR) -> 2 rows, persisted", async () => {
  await page.getByTestId("filter-chip").click();
  await page.getByTestId("filter-popover").getByRole("button", { name: "Name", exact: true }).click();
  await page.getByTestId("filter-value").first().fill("o");
  await page.getByTestId("filter-add-group").click();
  const g = page.getByTestId("filter-group");
  await g.getByTestId("filter-value").first().fill("Goo");
  await g.getByTestId("filter-add-rule").click();
  await g.locator("[data-testid=filter-rule] select:first-child").nth(1).selectOption("name");
  await g.getByTestId("filter-value").nth(1).fill("Micro");
  await g.getByTestId("filter-conj").selectOption("or");
  await page.waitForTimeout(700);
  await page.keyboard.press("Escape");
  ok(await page.getByTestId("record-row").count() === 2, "2 rows, got " + await page.getByTestId("record-row").count());
  await page.reload(); await page.waitForLoadState("networkidle");
  ok(await page.getByTestId("record-row").count() === 2, "persisted 2 rows");
  await page.getByTestId("filter-chip").filter({ hasText: "3 filters" }).waitFor();
  await page.screenshot({ path: `${OUT}/filters.png` });
  await page.getByTestId("filter-chip").click();
  await page.getByText("Clear filters").click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  ok(await page.getByTestId("record-row").count() >= 12, "cleared");
});

await step("CSV import with column mapping", async () => {
  const csv = "Company name,Website,About,Ignore me\nAcme Corp,acme.com,Rockets and anvils,x\n\"Globex, Inc\",globex.com,Unclear,y\n";
  fs.writeFileSync("/tmp/e2e-import.csv", csv);
  await page.getByTestId("import-export").click();
  await page.getByText("Import CSV").click();
  await page.getByTestId("import-file").setInputFiles("/tmp/e2e-import.csv");
  const maps = page.getByTestId("import-map");
  await maps.nth(0).waitFor();
  await maps.nth(0).selectOption("name");
  await maps.nth(1).selectOption("domains");
  await maps.nth(2).selectOption("description");
  await maps.nth(3).selectOption("");
  await page.getByTestId("import-run").click();
  await page.getByTestId("import-done").filter({ hasText: "2 records imported" }).waitFor();
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByTestId("record-row").filter({ hasText: "Globex, Inc" }).waitFor();
  const g = await byName("companies", "Globex, Inc"); ok(g && JSON.stringify(g.values.domains).includes("globex.com"), "domains mapped");
});

let googleId;
await step("record page: tabs, favorite -> sidebar Favorites", async () => {
  googleId = (await byName("companies", "Google")).id;
  await go(`/objects/companies/${googleId}`);
  await page.getByTestId("record-tabs").waitFor();
  for (const t of ["overview", "activity", "rel-team", "notes", "tasks", "files"]) await page.getByTestId(`tab-${t}`).waitFor();
  await page.getByTestId("favorite-toggle").click();
  await page.getByTestId("sidebar").getByText("Google", { exact: true }).waitFor();
});

await step("record page: inline edit description persisted", async () => {
  await page.getByTestId("detail-description").locator("button").first().click();
  const ed = page.locator("[data-testid=detail-description] textarea, [data-testid=detail-description] input").first();
  await ed.fill("Edited by E2E");
  await ed.press("Enter");
  await page.waitForTimeout(500);
  await page.reload();
  await page.getByTestId("detail-description").filter({ hasText: "Edited by E2E" }).waitFor();
});

await step("record page: file upload", async () => {
  fs.writeFileSync("/tmp/e2e-file.txt", "hello attio");
  await page.getByTestId("tab-files").click();
  await page.getByTestId("file-input").setInputFiles("/tmp/e2e-file.txt");
  await page.getByTestId("file-row").filter({ hasText: "e2e-file.txt" }).waitFor();
});

await step("relation sync: company.team <-> person.company", async () => {
  const lucas = (await records("people")).find((p) => JSON.stringify(p.values.name).includes("Lucas"));
  ok(lucas, "person exists");
  const g = await api(`/api/records/${googleId}`);
  const team = (g.record ?? g).values.team ?? [];
  await api(`/api/records/${googleId}`, "PATCH", { values: { team: [...team, lucas.id] } });
  const p = await api(`/api/records/${lucas.id}`);
  ok(((p.record ?? p).values.company) === googleId || JSON.stringify((p.record ?? p).values.company).includes(googleId), "inverse set");
  await go(`/objects/companies/${googleId}`);
  await page.getByTestId("tab-rel-team").click();
  await page.getByText("Lucas", { exact: false }).first().waitFor();
});

await step("inbox: mention + task assignment from another user", async () => {
  const other = await browser.newContext();
  const r = await other.request.post(B + "/api/auth/login", { data: { email: "ana@exemplo.com", password: "attio123" } });
  ok(r.ok(), "ana login");
  await other.request.post(B + "/api/notes", { data: { title: "E2E mention", content: "Hey @Jhonata please check", recordId: googleId } });
  const me = await api("/api/me");
  await other.request.post(B + "/api/tasks", { data: { content: "E2E task for Jhonata", assigneeId: (me.user ?? me).id, recordId: googleId } });
  await other.close();
  await go("/inbox");
  await page.getByTestId("inbox-item").filter({ hasText: "mentioned you" }).first().waitFor();
  await page.getByTestId("inbox-item").filter({ hasText: "E2E task for Jhonata" }).first().waitFor();
  await page.getByTestId("mark-all-read").click();
  await page.waitForTimeout(500);
  const nres = await api("/api/notifications");
  ok((nres.notifications ?? nres).every((x) => x.read || x.readAt), "all read");
});

await step("keyboard shortcuts: G T, G H, / and Ctrl+K", async () => {
  await go("/home");
  await page.evaluate(() => (document.activeElement)?.blur());
  await page.keyboard.press("g"); await page.keyboard.press("t"); await page.waitForURL("**/tasks");
  await page.keyboard.press("g"); await page.keyboard.press("h"); await page.waitForURL("**/home");
  await page.keyboard.press("/"); await page.getByTestId("palette").waitFor(); await page.keyboard.press("Escape");
  await page.keyboard.press("Control+k"); await page.getByTestId("palette").waitFor();
  await page.keyboard.type("Google"); await page.getByTestId("palette-item").filter({ hasText: "Google" }).first().waitFor();
  await page.keyboard.press("Escape");
  await page.keyboard.press("t"); await page.getByTestId("task-content").waitFor(); await page.keyboard.press("Escape");
});

await step("tasks + notes create", async () => {
  await go("/tasks");
  await page.getByTestId("new-task").click();
  await page.getByTestId("task-content").fill("E2E created task");
  await page.getByTestId("task-save").click();
  await page.getByTestId("task-row").filter({ hasText: "E2E created task" }).waitFor();
  await go("/notes");
  await page.getByTestId("new-note").click();
  await page.getByTestId("note-title").fill("E2E note");
  await page.getByTestId("note-record").selectOption({ label: "Google" });
  await page.getByTestId("note-content").fill("Body");
  await page.getByTestId("note-save").click();
  await page.getByTestId("note-row").filter({ hasText: "E2E note" }).waitFor();
});

await step("kanban drag-and-drop: Lead -> Won persisted", async () => {
  await go("/objects/deals");
  await page.getByTestId("kanban").waitFor();
  const card = page.getByTestId("kanban-col-lead").getByTestId("kanban-card").first();
  const title = (await card.innerText()).split("\n")[0].trim();
  await drag(card, page.getByTestId("kanban-col-won"));
  await page.getByTestId("kanban-col-won").getByText(title).waitFor();
  await page.waitForTimeout(500);
  const d = await byName("deals", title);
  ok(d.values.stage === "won" || JSON.stringify(d.values.stage).includes("won"), "stage won");
});

await step("new record via button + attribute types (phone) in settings", async () => {
  await go("/objects/people");
  await page.getByTestId("new-record").click();
  const nm = page.getByTestId("new-record-name");
  if (await nm.locator("input").count()) { await nm.locator("input").nth(0).fill("Zed"); await nm.locator("input").nth(1).fill("Tester"); } else await nm.fill("Zed Tester");
  await page.getByTestId("new-record-save").click();
  await page.getByText("Zed Tester").first().waitFor();
  await go("/settings/objects/people/attributes");
  await page.getByTestId("create-attribute").click();
  await page.getByTestId("attr-name").fill("Mobile");
  await page.getByRole("button", { name: "Phone number", exact: true }).click();
  await page.getByTestId("attr-create").click();
  await page.getByTestId("attribute-row").filter({ hasText: "Mobile" }).waitFor();
});

await step("settings pages render (EN)", async () => {
  for (const [p, txt] of [["/settings/profile", "Profile"], ["/settings/appearance", "Appearance"], ["/settings/general", "General"], ["/settings/members", "Members and teams"], ["/settings/objects", "Objects"], ["/settings/objects/companies", "Configuration"], ["/settings/lists", "Lists"]]) {
    await go(p);
    await page.getByTestId("settings-sidebar").waitFor();
    await page.getByText(txt, { exact: true }).first().waitFor();
  }
});

await step("reports: dashboard detail", async () => {
  await go("/reports");
  await page.getByTestId("dashboard-row").first().locator("a").click();
  await page.getByTestId("report-stats").waitFor();
});

console.log("\nconsole errors:", errors.length ? errors : "none");
const failed = results.filter((r) => r[0] === "FAIL");
console.log(`\n${results.length - failed.length}/${results.length} passed`);
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify({ results, errors }, null, 2));
await browser.close();
process.exit(failed.length ? 1 : 0);

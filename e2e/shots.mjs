import fs from "node:fs";
import { chromium } from "playwright-core";
// PAGES="name:/path[:palette]" ; LOC=en|pt-BR ; W/H viewport (default 1684x940 @1.14 = ref 1920x1072)
const B = process.env.BASE || "http://localhost:3000", S = process.env.OUT || "e2e/output";
const W = +(process.env.W || 1684), H = +(process.env.H || 940), DSF = +(process.env.DSF || 1.14), PFX = process.env.PFX || "raw-";
fs.mkdirSync(S, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && !/status of 404 \(\)/.test(m.text()) && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(B + "/login");
await page.fill("input[type=password]", "attio123");
await page.click("form button:not([type=button])");
await page.waitForURL("**/home");
await page.evaluate((l) => fetch("/api/me", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: l }) }), process.env.LOC || "en");
const ids = await page.evaluate(async () => {
  const out = {};
  for (const o of ["companies", "people", "deals"]) { const r = await fetch(`/api/objects/${o}/records`).then((r) => r.json()); for (const x of r.records ?? r) out[typeof x.values.name === "string" ? x.values.name : x.values.name?.full] = x.id; }
  return out;
});
const pages = (process.env.PAGES || "home:/home,companies:/objects/companies,deals:/objects/deals,tasks:/tasks").split(",");
for (const p of pages) {
  const [name, url0, action] = p.split(":");
  const url = url0.replace(/\{([^}]+)\}/g, (_, k) => ids[k]);
  await page.goto(B + url);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(700);
  if (action === "palette") { await page.keyboard.press("Control+k"); await page.waitForTimeout(400); }
  if (action === "wsmenu") { await page.getByTestId("workspace-menu").click(); await page.getByTestId("workspace-menu").page().locator("text=/^(Language|Idioma)$/").click(); await page.waitForTimeout(300); }
  await page.screenshot({ path: `${S}/${PFX}${name}.png` });
}
console.log("errors:", errors);
await browser.close();

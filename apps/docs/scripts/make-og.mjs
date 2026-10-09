// Draws the picture shown when a link to the docs is shared (public/og.png, 1200 x 630).
//
//   node scripts/make-og.mjs
//
// The card is plain HTML rendered with the same font as the site. Run it again when the tagline changes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const font = path.resolve(root, "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2");
const logo = fs.readFileSync(path.join(root, "public/favicon.svg"), "utf8");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Jakarta"; src: url("data:font/woff2;base64,${fs.readFileSync(font).toString("base64")}") format("woff2"); font-weight: 200 800; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #faf8f5; color: #1c1a17; font-family: "Jakarta", sans-serif; position: relative; overflow: hidden; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(#e4e0d8 1px, transparent 1px), linear-gradient(90deg, #e4e0d8 1px, transparent 1px); background-size: 48px 48px; opacity: .55; mask-image: linear-gradient(180deg, #000, transparent 85%); }
.wrap { position: relative; height: 100%; padding: 64px 72px; display: flex; flex-direction: column; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 16px; font-size: 40px; font-weight: 700; letter-spacing: -0.04em; }
.brand svg { width: 52px; height: 52px; }
h1 { font-size: 76px; line-height: 1.04; letter-spacing: -0.045em; font-weight: 700; max-width: 960px; }
h1 em { font-style: normal; color: #c2410c; }
p { font-size: 30px; line-height: 1.4; color: #6a645b; max-width: 1040px; }
.row { display: flex; gap: 14px; flex-wrap: wrap; }
.tag { border: 2px solid #e4e0d8; background: #fff; border-radius: 999px; padding: 10px 22px; font-size: 24px; white-space: nowrap; font-weight: 600; }
</style></head><body><div class="grid"></div><div class="wrap">
<div class="brand">${logo}<span>rdloom</span></div>
<div><h1>Production-ready React blocks you <em>copy and own</em></h1><p style="margin-top:24px">For ERP, SaaS and B2B apps. Accessible, tested, and yours to change.</p></div>
<div class="row"><span class="tag">Tables and forms</span><span class="tag">Settings and billing</span><span class="tag">Dashboards</span><span class="tag">AI chat</span></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, "public/og.png") });
await browser.close();
console.log("wrote public/og.png");

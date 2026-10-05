// Measures the data grid at 100,000 and 1,000,000 rows in a production build:
//   npm run bench:grid            (builds the playground, runs Chromium headless)
//   npm run bench:grid -- --rows 250000,2000000
//
// Each time is how long the page takes to paint the result of one action
// (two animation frames after it), median of five runs. Single-machine numbers:
// compare them with each other, not with other machines.
import { execSync, spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const arg = process.argv.indexOf("--rows");
const sizes = (arg > -1 ? process.argv[arg + 1] : "100000,1000000").split(",").map(Number);
const PORT = 4174;

execSync("npx vite build apps/playground", { stdio: "ignore" });
const server = spawn("npx", ["vite", "preview", "apps/playground", "--port", String(PORT), "--strictPort"], { stdio: "ignore", shell: true });
const stop = () => server.kill();
process.on("exit", stop);

async function ready() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${PORT}`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("preview server did not start");
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const ms = (n) => (n < 10 ? n.toFixed(1) : Math.round(n)) + " ms";

await ready();
const browser = await chromium.launch({ args: ["--enable-precise-memory-info", "--js-flags=--expose-gc"] });
const results = [];
let serverRun;

for (const rows of sizes) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const started = Date.now();
  await page.goto(`http://localhost:${PORT}/?rows=${rows}`);
  await page.locator('[role=grid][aria-label="Orders"]').waitFor({ timeout: 120_000 });
  const firstRender = Date.now() - started;

  const out = await page.evaluate(async (rows) => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const time = async (action, times = 5) => {
      const runs = [];
      for (let i = 0; i < times; i++) {
        const t = performance.now();
        action(i);
        await frame();
        runs.push(performance.now() - t);
      }
      return runs;
    };
    const grid = document.querySelector('[role=grid][aria-label="Orders"]');
    const header = (name) => [...grid.querySelectorAll('[role=columnheader]')].find((h) => h.textContent.trim() === name);
    const search = document.querySelector("input[type=search], input");
    const setSearch = (value) => {
      const input = [...document.querySelectorAll("input")].find((i) => /^Search/.test(i.labels?.[0]?.textContent ?? ""));
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const res = {};
    res.domRows = grid.querySelectorAll("[role=row]").length;
    res.sortNumbers = await time(() => header("Total").click());
    res.sortText = await time(() => header("Customer").click());
    res.sortDates = await time(() => header("Placed").click());
    const queries = ["Tokyo", "Refunded", "tok", "Hopper Paid", "zzz"];
    res.search = await time((i) => setSearch(queries[i % queries.length]));
    setSearch("");
    await frame();
    const cell = grid.querySelector('[data-cell="2:0"]');
    cell.focus();
    await frame();
    const key = (k, ctrlKey = false) => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: k, ctrlKey, bubbles: true }));
    res.arrow = await time(() => key("ArrowDown"));
    res.ctrlEnd = await time((i) => key(i % 2 ? "Home" : "End", true));
    const scroller = grid.firstElementChild;
    res.scroll = await time((i) => (scroller.scrollTop = ((i + 1) / 6) * scroller.scrollHeight));
    window.gc?.();
    res.heapMB = performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null;
    return res;
  }, rows);

  const row = { rows, "first render": firstRender, "DOM rows": out.domRows, "heap (MB)": Math.round(out.heapMB ?? 0) };
  for (const key of ["sortNumbers", "sortText", "sortDates", "search", "arrow", "ctrlEnd", "scroll"]) row[key] = median(out[key]);
  results.push(row);
  await page.close();
}

// Server-side mode: the grid shows 25 rows of a million that live elsewhere.
const serverRows = 1_000_000;
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const started = Date.now();
  await page.goto(`http://localhost:${PORT}/?server=${serverRows}`);
  await page.locator('[role=grid][aria-label="Server orders"]').waitFor({ timeout: 60_000 });
  await page.waitForFunction(() => !document.querySelector('[aria-label="Server orders"]')?.hasAttribute("aria-busy"));
  const firstRender = Date.now() - started;
  const out = await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const grid = document.querySelector('[role=grid][aria-label="Server orders"]');
    const time = async (action, times = 5) => {
      const runs = [];
      for (let i = 0; i < times; i++) {
        const t = performance.now();
        action(i);
        await frame();
        runs.push(performance.now() - t);
      }
      return runs;
    };
    const header = (name) => [...grid.querySelectorAll("[role=columnheader]")].find((h) => h.textContent.trim() === name);
    const button = (label) => document.querySelector(`button[aria-label="${label}"]`);
    window.gc?.();
    return {
      sort: await time(() => header("Order").click()),
      next: await time(() => button("Next page").click()),
      last: await time((i) => button(i % 2 ? "First page" : "Last page").click()),
      heapMB: performance.memory.usedJSHeapSize / 1048576,
      domRows: grid.querySelectorAll("[role=row]").length,
      ariaRows: grid.getAttribute("aria-rowcount"),
    };
  });
  serverRun = { firstRender, ...out, sort: median(out.sort), next: median(out.next), last: median(out.last) };
  await page.close();
}
await browser.close();
stop();

const name = { sortNumbers: "Sort numbers", sortText: "Sort text", sortDates: "Sort ISO dates", search: "Search (any query)", arrow: "Arrow-key move", ctrlEnd: "Ctrl+End / Ctrl+Home", scroll: "Scroll to a new spot" };
const head = (n) => (n >= 1e6 ? `${n / 1e6}M` : `${n / 1e3}k`) + " rows";
console.log(["| Action", ...results.map((r) => head(r.rows))].join(" | ") + " |");
console.log("|---|" + results.map(() => "---|").join(""));
console.log(`| First render, data included | ${results.map((r) => ms(r["first render"])).join(" | ")} |`);
console.log(`| Rows in the DOM | ${results.map((r) => r["DOM rows"]).join(" | ")} |`);
console.log(`| JS heap | ${results.map((r) => r["heap (MB)"] + " MB").join(" | ")} |`);
for (const key of Object.keys(name)) console.log(`| ${name[key]} | ${results.map((r) => ms(r[key])).join(" | ")} |`);

console.log(`
Server-side mode, ${serverRows.toLocaleString("en-US")} rows held elsewhere (rows answered instantly, so this is the grid's own cost):`);
console.log("| Measure | Result |");
console.log("|---|---|");
console.log(`| First render | ${ms(serverRun.firstRender)} |`);
console.log(`| Rows in the DOM | ${serverRun.domRows} |`);
console.log(`| aria-rowcount | ${Number(serverRun.ariaRows).toLocaleString("en-US")} |`);
console.log(`| JS heap | ${Math.round(serverRun.heapMB)} MB |`);
console.log(`| Change the sort | ${ms(serverRun.sort)} |`);
console.log(`| Next page | ${ms(serverRun.next)} |`);
console.log(`| Jump to the last / first page | ${ms(serverRun.last)} |`);

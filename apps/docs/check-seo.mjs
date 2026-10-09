// Checks the built site for the things search engines care about. Run after the build:
//
//   node check-seo.mjs        (npm run build -w @rdloom/docs runs it for you)
//
// Fails (exit 1) on: a missing or repeated title or description, not exactly one h1, a missing canonical link or
// share picture, an indexable page left out of the sitemap, or an internal link that goes nowhere.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withoutPreviews } from "./seo-regions.mjs";

const dist = process.env.DOCS_DIST ? path.resolve(process.env.DOCS_DIST) : path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
const problems = [];
const warnings = [];

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "assets" || e.name === "r") continue;
      walk(full);
    } else if (e.name.endsWith(".html")) files.push(full);
  }
})(dist);

const rel = (f) => path.relative(dist, f).split(path.sep).join("/");
const routeOf = (f) => {
  const r = rel(f).replace(/\.html$/, "");
  return r === "index" ? "/" : "/" + r;
};
const exists = (route) => {
  const clean = route.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
  if (clean === "/") return true;
  return fs.existsSync(path.join(dist, clean + ".html")) || fs.existsSync(path.join(dist, clean)) || fs.existsSync(path.join(dist, clean, "index.html"));
};
const get = (html, re) => (html.match(re) || [])[1];

const titles = new Map();
const descriptions = new Map();
const indexable = [];
let canonicalHost = "";

for (const f of files) {
  const route = routeOf(f);
  const html = fs.readFileSync(f, "utf8");
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  const where = `${route}:`;
  const title = get(html, /<title>(.*?)<\/title>/);
  const description = get(html, /<meta name="description" content="(.*?)"/);
  if (!title) problems.push(`${where} no <title>`);
  if (!description) problems.push(`${where} no meta description`);
  if (noindex) continue;
  indexable.push(route);
  if (title) {
    if (titles.has(title)) problems.push(`${where} same title as ${titles.get(title)}`);
    titles.set(title, route);
    if (title.length > 70) warnings.push(`${where} title is ${title.length} characters (search results cut at about 60)`);
  }
  if (description) {
    if (descriptions.has(description)) problems.push(`${where} same description as ${descriptions.get(description)}`);
    descriptions.set(description, route);
    if (description.length > 200) warnings.push(`${where} description is ${description.length} characters (cut at about 160)`);
  }
  // Demo screens inside the example previews have their own headings and links: only the page itself is checked.
  const own = withoutPreviews(html);
  const h1s = (own.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) problems.push(`${where} has ${h1s} h1 headings`);
  const canonical = get(html, /<link rel="canonical" href="(.*?)"/);
  if (!canonical) problems.push(`${where} no canonical link`);
  else {
    canonicalHost ||= new URL(canonical).origin;
    if (new URL(canonical).pathname !== route) problems.push(`${where} canonical points to ${canonical}`);
  }
  if (!/<meta property="og:image" content="https?:\/\//.test(html)) problems.push(`${where} no share picture (og:image)`);
  for (const m of own.matchAll(/<a [^>]*href="(\/[^"#?][^"]*)"/g)) {
    const href = m[1].replace(/&amp;/g, "&");
    if (!exists(href) && !href.startsWith("/r/")) problems.push(`${where} link to ${href} goes nowhere`);
  }
}

// Install commands shown in the docs must name real registry items (a copied command that fails is a bug a visitor meets first).
const registryFile = path.join(dist, "r", "registry.json");
if (!fs.existsSync(registryFile)) problems.push("r/registry.json is missing from the build (run npm run gen before the docs build)");
else {
  const names = new Set(JSON.parse(fs.readFileSync(registryFile, "utf8")).items.map((i) => i.name));
  for (const f of files) {
    const html = fs.readFileSync(f, "utf8");
    // Only code blocks: the highlighter splits words into spans, so tags are removed without adding spaces.
    for (const pre of html.matchAll(/<pre[\s\S]*?<\/pre>/g)) {
      const code = pre[0].replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
      for (const line of code.split(/\r?\n/)) {
        const m = line.match(/npx\s+rdloom\s+add\s+([^#]*)/);
        if (!m) continue;
        for (const token of m[1].trim().split(/\s+/)) {
          if (token.startsWith("-")) break;
          // Placeholders (<name...>), other registries (acme/kit, @acme/kit) and addresses are not names in this registry.
          if (/[/@<.:]/.test(token)) continue;
          if (!names.has(token)) problems.push(`${routeOf(f)}: the command "rdloom add ${token}" names nothing in the registry`);
        }
      }
    }
  }
}

const sitemapFile = path.join(dist, "sitemap.xml");
if (!fs.existsSync(sitemapFile)) problems.push("no sitemap.xml");
else {
  const sitemap = fs.readFileSync(sitemapFile, "utf8");
  for (const r of indexable) {
    const url = canonicalHost + (r === "/" ? "/" : r);
    if (!sitemap.includes(`<loc>${url}</loc>`)) problems.push(`sitemap.xml does not list ${url}`);
  }
}
const robots = fs.existsSync(path.join(dist, "robots.txt")) ? fs.readFileSync(path.join(dist, "robots.txt"), "utf8") : "";
if (!/Sitemap: https?:\/\//.test(robots)) problems.push("robots.txt does not name the sitemap");
if (!fs.existsSync(path.join(dist, "og.png"))) problems.push("og.png is missing from the build");

for (const w of warnings.slice(0, 10)) console.warn(`  warning: ${w}`);
if (warnings.length > 10) console.warn(`  ... and ${warnings.length - 10} more warnings`);
if (problems.length) {
  console.error(`SEO check failed (${problems.length}):\n${problems.map((p) => "  ✗ " + p).join("\n")}`);
  process.exit(1);
}
console.log(`✓ SEO check: ${indexable.length} indexable pages, titles and descriptions unique, canonical links, share picture and sitemap in place`);

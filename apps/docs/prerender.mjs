// Builds the site as static HTML, one file per page, so search engines and
// AI crawlers read real content without running JavaScript. The browser then
// hydrates the page into the normal app.
//
//   node prerender.mjs     (npm run build -w @rdloom/docs)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import { neutralizeDemoLinks } from "./seo-regions.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
// DOCS_DIST builds into another folder (a second copy of the site for a test that must not disturb the first).
const dist = process.env.DOCS_DIST ? path.resolve(process.env.DOCS_DIST) : path.join(root, "dist");
const serverOut = dist + "-server";

// DOCS_MODE=development builds with React's development version, whose hydration errors say what differed.
const mode = process.env.DOCS_MODE === "development" ? "development" : "production";
await build({ root, mode, logLevel: "warn", build: { outDir: dist } });
await build({ root, mode, logLevel: "warn", build: { ssr: "src/entry-server.tsx", outDir: serverOut } });

const { render, allPaths, previewPaths, siteUrl, faq } = await import(pathToFileURL(path.join(serverOut, "entry-server.js")).href);
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function page(html, { title, description }, url, extraHead = "", renderedPath = "") {
  // Absolute URLs only make sense once the site has an address: without
  // SITE_URL, canonical and og:url are left out rather than pointing nowhere.
  const head = [
    ...(siteUrl ? [`<link rel="canonical" href="${url}" />`, `<meta property="og:url" content="${url}" />`] : []),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="rdloom" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    // The share picture needs an absolute address, so it is only named once the site has one.
    ...(siteUrl
      ? [
          `<meta property="og:image" content="${siteUrl}/og.png" />`,
          `<meta property="og:image:width" content="1200" />`,
          `<meta property="og:image:height" content="630" />`,
          `<meta property="og:image:alt" content="rdloom: production-ready React blocks you copy and own" />`,
          `<meta name="twitter:card" content="summary_large_image" />`,
          `<meta name="twitter:image" content="${siteUrl}/og.png" />`,
        ]
      : [`<meta name="twitter:card" content="summary" />`]),
    extraHead,
  ].join("\n    ");
  return template
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace("<!--head-->", head)
    .replace('<div id="root">', `<div id="root" data-path="${esc(renderedPath)}">`)
    .replace("<!--app-->", () => neutralizeDemoLinks(html));
}

const ld = (data) => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c")}</script>`;

// The home page: what the site is, the project, and the questions it answers (the same text as the page shows).
const homeLd = (description) =>
  [
    ld({ "@type": "WebSite", name: "rdloom", description, ...(siteUrl ? { url: siteUrl } : {}) }),
    ld({
      "@type": "SoftwareSourceCode",
      name: "rdloom",
      description,
      ...(siteUrl ? { url: siteUrl } : {}),
      codeRepository: "https://github.com/DevHydeOut/rdloom",
      programmingLanguage: ["TypeScript", "React"],
      license: "https://opensource.org/licenses/MIT",
      author: { "@type": "Person", name: "Vimal Bhatt" },
    }),
    ld({
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    }),
  ].join("\n    ");

// Inner pages: where the page sits (Home > Components > Button), which search results can show as a trail.
const crumbsLd = (p, title) => {
  const parts = p.split("/").filter(Boolean);
  const label = (seg) => seg.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
  const trail = [{ name: "Home", url: siteUrl + "/" }];
  if (parts[0] === "components" || parts[0] === "blocks") trail.push({ name: label(parts[0]), url: `${siteUrl}/${parts[0]}` });
  if (parts[0] === "docs") trail.push({ name: "Docs", url: `${siteUrl}/docs/getting-started` });
  if (parts.length > 1) trail.push({ name: title.replace(/[:·].*$/, "").trim(), url: siteUrl + p });
  else if (parts.length === 1) trail.push({ name: title.replace(/[:·].*$/, "").trim(), url: siteUrl + p });
  return ld({
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: t.url })),
  });
};

const pages = [];
for (const p of allPaths) {
  const result = await render(p);
  const url = siteUrl + (p === "/" ? "/" : p);
  // /components/button -> components/button.html: static hosts serve it at the
  // URL without .html (Cloudflare Pages, Netlify, GitHub Pages, vite preview).
  const file = p === "/" ? path.join(dist, "index.html") : path.join(dist, `${p.slice(1)}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(result.html, result, url, p === "/" ? homeLd(result.description) : siteUrl ? crumbsLd(p, result.title) : "", p));
  pages.push({ path: p, url, ...result });
}

// The full-screen example pages: real files so a link to one works, kept out of search results and the sitemap.
for (const p of previewPaths) {
  const result = await render(p);
  const file = path.join(dist, `${p.slice(1)}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(result.html, result, siteUrl + p, '<meta name="robots" content="noindex" />', p));
}

// Unknown paths: static hosts serve 404.html (with a real 404 status).
const missing = await render("/404");
fs.writeFileSync(path.join(dist, "404.html"), page(missing.html, missing, `${siteUrl}/404`, '<meta name="robots" content="noindex" />', "*"));

// A sitemap lists absolute URLs, so it needs SITE_URL. robots.txt is written
// either way; it only names the sitemap once there is one.
if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    path.join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
      .map((p) => `  <url><loc>${p.url}</loc><lastmod>${today}</lastmod></url>`)
      .join("\n")}\n</urlset>\n`,
  );
}
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /visual/
Disallow: /preview/\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ""}`,
);

// llms.txt (llmstxt.org): a plain index of the docs for AI tools.
const section = (title, list) => `## ${title}\n\n${list.map((p) => `- [${p.title.replace(/ · rdloom$/, "")}](${p.url}): ${p.description}`).join("\n")}\n`;
fs.writeFileSync(
  path.join(dist, "llms.txt"),
  `# rdloom\n\n> ${pages[0].description}\n\nFor AI coding agents, the MCP server (npx rdloom-mcp) serves the same specs with tested example code.\n\n${section(
    "Guides",
    pages.filter((p) => p.path.startsWith("/docs/")),
  )}\n${section(
    "Components",
    pages.filter((p) => p.path.startsWith("/components/")),
  )}\n${section(
    "Blocks",
    pages.filter((p) => p.path.startsWith("/blocks/")),
  )}`,
);

fs.rmSync(serverOut, { recursive: true, force: true });
console.log(
  `prerendered ${pages.length} pages + 404, robots.txt, llms.txt${
    siteUrl ? `, sitemap.xml (site: ${siteUrl})` : " (no SITE_URL: no sitemap or canonical links)"
  }`,
);

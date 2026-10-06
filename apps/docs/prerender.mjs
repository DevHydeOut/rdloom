// Builds the site as static HTML, one file per page, so search engines and
// AI crawlers read real content without running JavaScript. The browser then
// hydrates the page into the normal app.
//
//   node prerender.mjs     (npm run build -w @rdloom/docs)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const serverOut = path.join(root, "dist-server");

await build({ root, logLevel: "warn" });
await build({ root, logLevel: "warn", build: { ssr: "src/entry-server.tsx", outDir: serverOut } });

const { render, allPaths, previewPaths, siteUrl } = await import(pathToFileURL(path.join(serverOut, "entry-server.js")).href);
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
    `<meta name="twitter:card" content="summary" />`,
    extraHead,
  ].join("\n    ");
  return template
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace("<!--head-->", head)
    .replace('<div id="root">', `<div id="root" data-path="${esc(renderedPath)}">`)
    .replace("<!--app-->", html);
}

const jsonLd = (description) =>
  `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: "rdloom",
    description,
    ...(siteUrl ? { url: siteUrl } : {}),
    codeRepository: "https://github.com/DevHydeOut/rdloom",
    programmingLanguage: ["TypeScript", "React"],
  })}</script>`;

const pages = [];
for (const p of allPaths) {
  const result = await render(p);
  const url = siteUrl + (p === "/" ? "/" : p);
  // /components/button -> components/button.html: static hosts serve it at the
  // URL without .html (Cloudflare Pages, Netlify, GitHub Pages, vite preview).
  const file = p === "/" ? path.join(dist, "index.html") : path.join(dist, `${p.slice(1)}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(result.html, result, url, p === "/" ? jsonLd(result.description) : "", p));
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
const section = (title, list) => `## ${title}\n\n${list.map((p) => `- [${p.title.replace(/ Â· rdloom$/, "")}](${p.url}): ${p.description}`).join("\n")}\n`;
fs.writeFileSync(
  path.join(dist, "llms.txt"),
  `# rdloom\n\n> ${pages[0].description}\n\nFor AI coding agents, the MCP server (npx rdloom-mcp) serves the same specs with tested example code.\n\n${section(
    "Guides",
    pages.filter((p) => p.path.startsWith("/docs/")),
  )}\n${section(
    "Components",
    pages.filter((p) => p.path.startsWith("/components/")),
  )}`,
);

fs.rmSync(serverOut, { recursive: true, force: true });
console.log(
  `prerendered ${pages.length} pages + 404, robots.txt, llms.txt${
    siteUrl ? `, sitemap.xml (site: ${siteUrl})` : " (no SITE_URL: no sitemap or canonical links)"
  }`,
);

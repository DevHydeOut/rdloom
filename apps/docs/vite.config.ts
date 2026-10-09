import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/** The preview server answers an unknown address with the app shell and a 200; a real host sends 404.html with a 404. This does the same, so a test of the 404 page sees what a visitor would. */
function notFoundInPreview(): Plugin {
  return {
    name: "rdloom-preview-404",
    configurePreviewServer(server) {
      const out = path.resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
        const clean = url.replace(/\/+$/, "") || "/";
        const candidates = [clean, `${clean}.html`, path.posix.join(clean, "index.html")];
        const found = candidates.some((c) => {
          const file = path.join(out, c);
          return file.startsWith(out) && fs.existsSync(file) && fs.statSync(file).isFile();
        });
        const page = path.join(out, "404.html");
        if (found || !fs.existsSync(page)) return next();
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(fs.readFileSync(page));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), notFoundInPreview()],
  // Specs and examples live at the repo root.
  server: { fs: { allow: ["../.."] } },
});

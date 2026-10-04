import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./app";
import "./styles.css";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Prerendered pages (prerender.mjs) say which path they were rendered for.
// Hydrate when that's this page. Otherwise (the dev server, the 404 page, or
// a host serving another page's HTML) render from scratch.
const here = location.pathname.replace(/\/+$/, "") || "/";
if (root.dataset.path === here) hydrateRoot(root, app);
else {
  root.textContent = "";
  createRoot(root).render(app);
}

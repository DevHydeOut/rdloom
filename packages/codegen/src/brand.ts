// The library name lives here so a future rename is a one-file change
// (plus package.json names and the npm scope).
export const brand = {
  name: "rdloom",
  displayName: "rdloom",
  cssPrefix: "rd",
  npmScope: "@rdloom",
  repoUrl: "https://github.com/DevHydeOut/rdloom",
} as const;

/**
 * Where the docs site is hosted; it also serves the shadcn-format registry at
 * /r/. Set SITE_URL when building. Empty means "not hosted yet": the generated
 * registry then uses a placeholder instead of a domain nobody owns.
 */
export const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");

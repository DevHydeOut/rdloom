// The library name lives here so a future rename is a one-file change
// (plus package.json names and the npm scope).
export const brand = {
  name: "rdloom",
  displayName: "rdloom",
  cssPrefix: "rd",
  npmScope: "@rdloom",
  /** The docs site; also serves the shadcn-format registry at /r/. */
  siteUrl: "https://rdloom.com",
} as const;

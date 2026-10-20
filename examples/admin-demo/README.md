# Sample app: orders admin

A small admin page built the way a user would build it: the components are
added with the `rdloom` CLI, not imported from this repo.

- Search, status and date-range filters over 5,000 orders (TextField, Select, DateRangePicker)
- DataGrid with multi-select, a bulk action and inline editing of Items
- "New order" Dialog with a validated form (Combobox, TextField, DatePicker) and a Toast

This folder holds only the app's own code. `src/components/rdloom/` and
`src/styles/rdloom-tokens.css` are created by `rdloom init` and `add`.

## Run it

There are two ways. Both end with the app at http://localhost:5180.

### 1. With the published CLI (any shell, including Windows PowerShell)

This needs only Node 22 or newer and npm. Copy this folder somewhere outside the repo, then:

```bash
cd admin-demo
npm install
npx rdloom init
npx rdloom add button text-field select combobox date-picker date-range-picker dialog toast data-grid --install
npm run dev
```

`rdloom init` writes `rdloom.json` and the design tokens; `rdloom add` copies the component source into
`src/components/rdloom/`, and `--install` adds the npm packages they use. Running `npm run build` before
those commands stops with a message telling you to run them.

If `npm install` stops with `EPERM` or `TAR_ENTRY_ERROR`, your npm cache is damaged. Use a cache inside the
project for the install: `npm install --cache ./.npm-cache`.

### 2. From a checkout of this repo (also tests the packed CLI)

From the repo root, with Bash (Git Bash on Windows works):

```bash
bash scripts/sample-app.sh            # sets it up in $TMPDIR/rdloom-admin-demo
cd "$TMPDIR/rdloom-admin-demo" && npm run dev   # http://localhost:5180
```

The script packs `rdloom` and `@rdloom/mcp` exactly as `npm publish` would,
installs them from those tarballs in a folder outside the repo (so nothing
resolves from the repo's node_modules), runs `init` and `add`, typechecks,
builds, and checks the MCP server starts from `node_modules`.

`.mcp.json` connects Claude Code (and other MCP clients) to the installed MCP server.

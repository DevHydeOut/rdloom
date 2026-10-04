# Sample app: orders admin

A small admin page built the way a user would build it: the components are
added with the `rdloom` CLI, not imported from this repo.

- Search, status and date-range filters over 5,000 orders (TextField, Select, DateRangePicker)
- DataGrid with multi-select, a bulk action and inline editing of Items
- "New order" Dialog with a validated form (Combobox, TextField, DatePicker) and a Toast

This folder holds only the app's own code. `src/components/rdloom/` and
`src/styles/rdloom-tokens.css` are created by `rdloom init` and `add`.

## Run it

From the repo root:

```bash
bash scripts/sample-app.sh            # sets it up in $TMPDIR/rdloom-admin-demo
cd "$TMPDIR/rdloom-admin-demo" && npm run dev   # http://localhost:5180
```

The script packs `rdloom` and `@rdloom/mcp` exactly as `npm publish` would,
installs them from those tarballs in a folder outside the repo (so nothing
resolves from the repo's node_modules), runs `init` and `add`, typechecks,
builds, and checks the MCP server starts from `node_modules`.

`.mcp.json` connects Claude Code (and other MCP clients) to the installed MCP server.

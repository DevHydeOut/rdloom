# rdloom

Add accessible React components to your project. **You own the code; the lock file keeps it upgradable.**

rdloom copies component source into your repository, and remembers exactly what it shipped — so you can take later improvements without losing your edits.

```bash
npx rdloom init
npx rdloom add data-grid --install
```

The source lands in your project (`src/components/rdloom/` by default). Change anything you like. When a new version comes out:

```bash
npx rdloom diff      # what you changed, what upstream changed, per file
npx rdloom upgrade   # merges upstream changes into your edits, like git
```

Files you edited are merged rather than overwritten; overlapping changes get `<<<<<<<` conflict markers instead of silently losing work.

## What you get

Components built on [React Aria](https://react-spectrum.adobe.com/react-aria/) and Tailwind v4, tested with axe and real keyboard navigation — including the hard ones:

- **DataGrid** — virtualized to 100k+ rows, editing, row grouping with totals, tree data, master-detail, pinned and resizable columns
- **DateRangePicker** — presets, typed or picked, one month on phones
- **Combobox** — async search, load more, 5,000+ options

Plus Button, Dialog, Sheet, Menu, Select, Tabs, Toast, Accordion, Slider and more.

## Commands

```bash
rdloom init [--components-dir <dir>] [--tokens-css <file>] [--no-agents]
rdloom add <component...> [--overwrite] [--install]
rdloom list
rdloom diff [component...] [--patch]
rdloom upgrade [component...] [--dry-run] [--install]
rdloom registry build|validate [manifest]
```

Every command takes `--json` for scripts and AI agents, and `--cwd <dir>`.

## Built for AI agents

`rdloom init` also writes an rdloom section into `AGENTS.md`, points `CLAUDE.md` at it, and registers the [rdloom MCP server](https://www.npmjs.com/package/@rdloom/mcp) in `.mcp.json` — so Claude, Cursor and Copilot check real component APIs instead of guessing. Skip it with `--no-agents`.

## Your own registry

Publish components from any GitHub repository, including private ones:

```bash
npx rdloom add acme/design-system/auth-kit
npx rdloom add acme/design-system/auth-kit#v2   # a branch, tag or commit
```

## Monorepos

Commands work from any folder — rdloom finds `rdloom.json` upwards. Install one copy per app, or one shared copy for all of them:

```bash
npx rdloom init --components-dir packages/ui/src/rdloom --tokens-css packages/ui/src/rdloom.css
```

With the shared layout a single `rdloom upgrade` updates every app at once.

## Also works with the shadcn CLI

```bash
npx shadcn@latest add <your-docs-url>/r/data-grid.json
```

Upgrades need `rdloom add`, since the shadcn CLI doesn't track what it installed.

---

[github.com/DevHydeOut/rdloom](https://github.com/DevHydeOut/rdloom) · MIT

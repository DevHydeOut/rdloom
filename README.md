# rdloom

[![CI](https://github.com/DevHydeOut/rdloom/actions/workflows/ci.yml/badge.svg)](https://github.com/DevHydeOut/rdloom/actions/workflows/ci.yml)

**Production-ready React blocks and components that you copy into your app and own.**

rdloom gives you the screens that business software needs every day: data tables, forms, dashboards, settings pages, sign-in screens, invite dialogs and more. You add what you need with one command. The code lands in your project, so you can read it, change it and keep it.

Website and documentation: **https://rdloom.vimalbhatt.com**

> **Found a bug, a problem or a security issue?** Please tell us.
> - Bugs and problems: [open an issue](https://github.com/DevHydeOut/rdloom/issues/new/choose).
> - Security issues: please do not post them in public. Use [private reporting](https://github.com/DevHydeOut/rdloom/security/advisories/new). More in [SECURITY.md](SECURITY.md).

## Why rdloom

- **You own the code.** Components are copied into your project. There is no hidden package to wait on, and nothing breaks when we publish a new version.
- **Accessible by default.** Built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/), so keyboard use, focus and screen reader support are part of every component and are tested.
- **Made for business apps.** Tables with a lot of rows, forms, permissions, loading and error states, and the layouts of an admin or SaaS product.
- **Your API stays yours.** rdloom does the screen around a request: loading, empty, error and permission states. It never fetches data, signs anyone in or does routing for you.
- **Your look.** It uses your app's font and its own colour tokens, in light and dark.

## What is inside

- **120 components and blocks**, including a DataGrid that handles 100,000 rows, tables, charts, date and time pickers, command palette, file upload and form pieces.
- **Blocks:** dashboard shell, customer table, user management, settings, billing, sign-in screens, sidebars and calendars.
- **AI screens:** chat, messages, tool steps and approvals, for apps that talk to a model.
- **Optional motion extras**, in their own category, that you only get if you ask for them.
- **A CLI** (`rdloom`) that copies components and later merges updates with your edits.
- **An MCP server** (`@rdloom/mcp`) so AI coding tools use the real props and examples instead of guessing.

## Quick start

You need React 18.3 or 19, Tailwind CSS 3.4 or 4, and Node 22 or newer for the CLI.

```bash
npx rdloom init               # sets up tokens and shared helpers in your project
npx rdloom add button         # copies the Button component
npx rdloom add data-grid --install
npx rdloom list               # see everything you can add
```

The code goes to `src/components/rdloom/`. Commit it, along with `rdloom.lock.json` and the `.rdloom/` folder: they let `npx rdloom upgrade` merge new versions with your changes.

See the [docs](https://rdloom.vimalbhatt.com) for each component, its examples and its accessibility notes.

## How it works

Every component starts as one small JSON file in `specs/`. From it we generate the TypeScript types, the install files, the documentation pages, the context for AI tools and the Figma data. That is why the docs, the code and the tools always agree.

```
specs/*.spec.json  and  tokens/*.tokens.json
        |
        v
     codegen  ->  types, registry, docs data, MCP context, Figma data
```

## Folders

| Folder | What it holds |
|---|---|
| `specs/` | One JSON spec per component: props, states, accessibility rules |
| `tokens/` | Design tokens (colour, spacing, type) |
| `packages/react/` | The components that get copied into your app |
| `packages/cli/` | The `rdloom` command |
| `packages/mcp/` | The MCP server for AI coding tools |
| `packages/figma/` | The Figma plugin |
| `apps/docs/` | The documentation website (what gets deployed) |
| `examples/` | Tested examples shown in the docs |

## Work on rdloom

```bash
git clone https://github.com/DevHydeOut/rdloom.git
cd rdloom
npm ci
npm run build      # generate, typecheck and run all unit tests
npm run docs       # open the documentation site locally
```

The [developer guide](docs/developer-guide.md) explains the repository in detail. Before you open a pull request, please read [CONTRIBUTING.md](CONTRIBUTING.md): it covers the branches we use, how to write commit messages and what we check.

## License

MIT. Built by the rdloom team.

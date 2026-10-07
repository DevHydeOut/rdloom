# rdloom

[![CI](https://github.com/DevHydeOut/rdloom/actions/workflows/ci.yml/badge.svg)](https://github.com/DevHydeOut/rdloom/actions/workflows/ci.yml)

**Spec-driven UI components. Own it, upgrade it.**

Every component is defined once, as a JSON spec. That spec generates the TypeScript types, the design tokens, the Figma library, the documentation and the AI-agent context, so design, code and AI tools never drift apart.

> Status: 83 components built and tested, including a 100,000-row DataGrid, a command palette, file upload, DateRangePicker, Combobox and Table. The CLI (`rdloom`) and the MCP server (`@rdloom/mcp`) are on npm; the docs site is not hosted yet.

## How it works

```
specs/*.spec.json ──┐
tokens/*.tokens.json ┴─► codegen ─┬─► packages/react/src/generated/*.types.ts
                                  ├─► packages/tokens/dist/tokens.css (+ tokens.json)
                                  ├─► packages/mcp/context.json (served to AI agents)
                                  └─► packages/figma/src/generated (Figma variables and variants)
```

- **Specs** (`specs/`) describe props, variants, states, tokens, accessibility and usage rules. They're validated against [`specs/schema/component.schema.json`](specs/schema/component.schema.json) plus cross-checks (enum defaults, variant props, known tokens, Figma mappings).
- **Tokens** (`tokens/`) use the W3C DTCG format in three layers: core palette → semantic light → semantic dark overrides.
- **Components** (`packages/react`) are the styled layer that users will own. Behavior and accessibility come from [React Aria Components](https://react-spectrum.adobe.com/react-aria/).

## Repository layout

| Path | What it is |
|---|---|
| `specs/` | Component specs (source of truth) and the spec schema |
| `tokens/` | Design tokens (DTCG) |
| `packages/codegen` | Validator and generators (`npm run gen`) |
| `packages/tokens` | Generated CSS variables and flat token JSON |
| `packages/react` | Styled React components |
| `packages/cli` | `rdloom` CLI and the generated component registry |
| `packages/figma` | Figma plugin: tokens as variables, spec variants as component sets |
| `packages/mcp` | MCP server that gives AI coding agents the specs, tokens and source |
| `examples/admin-demo` | Sample app that uses the packed CLI like a real user ([README](examples/admin-demo/README.md)) |
| `apps/docs` | The docs site, generated from specs, examples and tokens |
| `apps/playground` | Vite + Tailwind v4 page showing every component, with a theme toggle |

## Development

Requires Node 22+.

```bash
npm install
npm run validate   # check every spec
npm run gen        # validate, then generate tokens, types and the registry
npm run build      # gen + typecheck (components and tools) + tests
npm run dev        # playground at http://localhost:5173
npm run docs       # docs site at http://localhost:5190
npm test           # component tests only
npm run smoke:cli  # fresh app: init, add every component, typecheck, upgrade with a merge (needs bash)
npm run smoke:mcp  # start the MCP server on stdio and call a tool
npm run build:bins # compile the CLI and MCP server to dist/ (also runs on npm pack)
bash scripts/sample-app.sh  # the sample app, installed from packed tarballs outside the repo
```

### CI
`.github/workflows/ci.yml` runs on every push to `main` and every pull request:
- **Linux, Node 22 and 24:** `npm ci`, validate and generate, check generated files are committed, typecheck components and tools, tests, playground build, CLI smoke test
- **Windows, Node 24:** tests, generated-files check, CLI smoke test (the CLI has Windows-specific shell handling)

If CI says generated files are out of date, run `npm run gen` and commit what changes.

Dependency ranges in `packages/react/package.json` become the versions the CLI tells users to install, so their floor must be the version tests run against. `npm run gen` fails if a floor is lower.

### Tests
`packages/react/test` runs on Vitest + Testing Library + jsdom:
- **Behavior:** mouse and keyboard interaction, focus trapping and restore, form semantics
- **Accessibility:** axe-core on every component, including open overlays
- **Contrast:** WCAG ratios computed from the generated tokens for every text/background pairing, in light and dark, including hover states
- **Spec conformance:** every spec has an exported component, and generated defaults match the spec

jsdom can't compute layout or colors, so axe's page-level contrast rule is skipped there. The token contrast test covers colors instead.

### Visual regression tests
`tests/visual` screenshots every spec example in light and dark mode, plus four hard components opened (Select list, DateRangePicker popover, Combobox list, alert Dialog): 138 images. Any changed pixel fails the test, apart from the anti-aliased edges Playwright always ignores. `tests/visual/interactions.spec.ts` also checks behavior that needs a real browser (scrolling, IntersectionObserver): for example, that keyboard users can reach all 200 results of the async Combobox as it loads more. The clock is frozen at 15 March 2026 and the time zone and locale are fixed, so calendars look the same every day.

```bash
npx playwright install chromium   # once
npm run test:visual               # compare
npm run test:visual:update        # accept intended changes
```

Fonts render differently on each OS, so baselines are kept per platform, and only the Linux ones are committed (`tests/visual/__screenshots__/linux/`). Local runs on Windows or macOS make their own ignored baselines for development. CI compares against the Linux ones and uploads a report with diffs when something changed. To create or update the Linux baselines, run the **Update visual baselines** workflow from the Actions tab, then download its artifact, look at the images and commit them. Until then, the CI job skips with a notice.

### Screen reader audit
Tests can't hear what a screen reader says. [`docs/accessibility-audit.md`](docs/accessibility-audit.md) is the manual checklist for NVDA, VoiceOver and TalkBack: setup, how to record results, the known risks to check first, and every component's checks. It's generated from each spec's `a11y` section (`screenReader`, `keyboard`, `requirements`), so edit the specs, not the file. The validator requires `a11y.screenReader` on every spec.

### CLI (in a user's project)

```bash
npx rdloom init              # writes rdloom.json, copies tokens CSS + shared utils
npx rdloom add button        # copies the component; prints the deps to install
npx rdloom add button --install
npx rdloom list
```

Inside this repo, run it with `npm run cli -- <command> --cwd <app-dir>`.

`add` never overwrites a file you've edited (unless `--overwrite`), and it leaves already-installed components alone. It records each shipped file's hash in `rdloom.lock.json` and keeps an as-shipped copy in `.rdloom/base/`. **Commit both**: they're the merge base for upgrades.

Built for AI agents too:

- `init` adds an rdloom block to `AGENTS.md` (how to find, add, check and upgrade components), points `CLAUDE.md` at it, and registers the MCP server in `.mcp.json` (plus `.cursor/mcp.json` and `.vscode/mcp.json` when those folders exist). Re-running only replaces rdloom's own block and entry; `--no-agents` skips it.
- `--json` prints one object on stdout (`{ ok, command, result, messages, warnings }`), errors included; installer output goes to stderr.
- The CLI never prompts, so `-y`/`--yes` is accepted and does nothing.
- Names can be written as in code (`rdloom add DataGrid`), and mistakes name the fix: `"buton" is not in the registry. Did you mean "button"?`, `unknown option --force. Did you mean --overwrite?`, `rdloom install` → `Did you mean rdloom add?`.

### What the components need

Verified by building a real app against the packed tarball for each row:

| | Supported | Notes |
|---|---|---|
| React | 18.3 and 19 | Both build and run |
| Tailwind CSS | v3.4 and v4 | v4: `@source "./components/rdloom"`. v3: add that folder to `content` in `tailwind.config.js` |
| Next.js | 15, App Router | Server Components; see below |
| React Router | 7, SSR | Server-rendered and hydrated |
| Astro | 5 | React islands (`client:load`) |
| Vite | 6 and 7 | |
| Node (for the CLI) | 22+ | |
| Package managers | npm, pnpm, yarn, bun | Detected from the lockfile |

Each framework was checked by installing the packed tarball into a fresh app and building it. For the server-rendered ones the built app was then loaded in Chromium to confirm the markup comes from the server, the browser console is free of hydration warnings, and the components still respond to the keyboard afterwards.

### React Server Components (Next.js App Router)

Every component that uses a hook or React Aria ships with `"use client"`, so a Server Component can import and render one directly. A test asserts the directive on each such file, and `scripts/next-app.sh` builds a real Next.js App Router app against the packed tarball in CI.

React itself still can't send a function across the server boundary, so props like `getRowId`, `onCellEdit` or `onPress` have to come from client code:

```tsx
// app/people.tsx
"use client";
export function People() {
  return <DataGrid label="People" data={rows} columns={columns} getRowId={(p) => p.id} />;
}
```

### Monorepos

Commands work from any directory: rdloom looks for `rdloom.json` in the working directory and then upwards, so `rdloom add` inside `apps/web/src/features/` finds the project at `apps/web`. The lock file and `.rdloom/base` always sit next to that config.

Two layouts work:

```bash
# One copy per app: run init inside each one.
npx rdloom init --cwd apps/web

# One shared copy for every app: run init at the repo root and point it at a package.
npx rdloom init --components-dir packages/ui/src/rdloom --tokens-css packages/ui/src/rdloom.css
```

With the shared layout there is a single `rdloom.lock.json` at the root, so one `rdloom upgrade` updates every app at once. Each app imports the tokens CSS once and needs `@source "../../packages/ui/src/rdloom"` (adjust the path) so Tailwind scans the shared folder. Components import each other with relative paths, so they work unchanged inside a workspace package.

Run a command at a root that has no config and rdloom names the workspaces that do: `rdloom is set up in: apps/web, packages/ui`.

### With the shadcn CLI

`npm run gen` also writes every item in the shadcn registry format to `apps/docs/public/r/` (gitignored), which the docs site serves:

```bash
npx shadcn@latest add $SITE_URL/r/data-grid.json
# or with "registries": { "@rdloom": "$SITE_URL/r/{name}.json" } in components.json
npx shadcn@latest add @rdloom/data-grid
```

Files land in `<components alias>/rdloom/` with our folder layout (so relative imports keep working), dependencies on our own items are full URLs, and the tokens become shadcn `cssVars`: colours on `:root` and `.dark` (each also a Tailwind colour such as `bg-rd-color-action-primary`), everything else as plain CSS. shadcn doesn't track installs, so `rdloom upgrade` only works for components added with `rdloom add`. Set `RDLOOM_SITE_URL` when running `gen` to point the URLs at another host, such as a local docs server for testing.

### Upgrading components you've edited

```bash
npx rdloom diff              # what changed, per file: yours, upstream's, or both
npx rdloom diff --patch      # the same, with the actual changes
npx rdloom upgrade --dry-run # what upgrade would do
npx rdloom upgrade [name...] # apply it
```

For each file, `upgrade` compares three versions (as shipped, yours, and the new one), the way git merges:

| You changed it | Upstream changed it | Result |
|---|---|---|
| no | yes | replaced with the new version |
| yes | no | your version kept |
| yes | yes, different lines | both changes merged |
| yes | yes, same lines | git-style conflict markers (`<<<<<<< yours` … `>>>>>>> rdloom 0.2.0`), exit code 1 |

It also adds new files and newly required components, prints only newly needed npm packages, keeps files the new version dropped, doesn't restore files you deleted, and keeps your line endings. Projects set up before `.rdloom/base/` existed still upgrade untouched files; for files you changed there, it writes `<file>.upstream` next to yours to merge by hand.

Registry items (`packages/cli/registry/*.json`) use the shadcn registry-item shape, so the shadcn CLI can read them too.

### GitHub registries
Components can also come from any GitHub repository that publishes an rdloom registry, public or private:

```bash
npx rdloom add acme/design-system/auth-kit        # default branch
npx rdloom add acme/design-system/auth-kit#v2     # a branch, tag or commit
npx rdloom add @acme/auth-kit                     # with "registries": { "@acme": "acme/design-system" } in rdloom.json
```

- **Private repos** work when `GH_TOKEN` or `GITHUB_TOKEN` is set, or you're logged in to the GitHub CLI. Public repos are read anonymously first; a token is only used when needed, and only sent to api.github.com.
- **Pinned:** the lock file records the source and commit SHA. `diff` and `upgrade` re-fetch the branch or tag and merge the new commit into your edits, the same as built-in components.
- **Dependencies:** an item's plain `registryDependencies` (`"button"`) use the repo's own item when it has one, and the built-in rdloom item otherwise. `owner/repo/item` or `@ns/item` point at another registry.

To publish one, add `rdloom-registry.json` at the repo root, listing items and their source files, then build and commit the output:

```json
{
  "name": "acme",
  "output": "registry",
  "items": [
    {
      "name": "auth-kit", "version": "1.0.0", "description": "Sign-in form",
      "dependencies": ["zod@^4"], "registryDependencies": ["button", "text-field"],
      "files": [{ "path": "auth-kit/auth-kit.tsx", "source": "src/auth-kit.tsx" }]
    }
  ]
}
```

```bash
npx rdloom registry validate   # every problem at once
npx rdloom registry build      # writes registry/<item>.json and index.json
```

This repo is a registry too (`rdloom-registry.json` points at `packages/cli/registry`), so `npx rdloom add DevHydeOut/rdloom/button` installs straight from GitHub.

### MCP server (for AI coding agents)
`packages/mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server, so Claude Code, Cursor and other agents write code that follows the specs instead of guessing. Its read-only tools:

| Tool | Returns |
|---|---|
| `list_components` | All components, or ranked by a search like "pick a date range" |
| `get_component` | Install and import lines, props, variants, use when / avoid when, anti-patterns, accessibility requirements |
| `get_example` | Working example code (all 65 are tested with axe) |
| `get_component_source` | The files `add` copies, as shipped (or `utils`, `tokens`) |
| `get_tokens` | Semantic tokens with CSS variables and light/dark values |
| `validate_props` | Checks props against the spec: required, enum values, types |
| `get_setup` | init, tokens CSS, Tailwind, add and upgrade |

It serves `packages/mcp/context.json`, which `npm run gen` builds from the specs, tokens and registry, so it's never out of date with the components. From this repo, add it to Claude Code with:

```bash
claude mcp add rdloom -- node /path/to/rdloom/packages/mcp/src/index.ts
```

Other clients take the same command in their MCP config (`"command": "node", "args": ["/path/to/rdloom/packages/mcp/src/index.ts"]`). Once published it will be `npx @rdloom/mcp`.

### Figma plugin
`packages/figma` puts the same tokens and variants into a Figma file, so design and code share names and values.

- **Variables:** a "rdloom" collection with Light and Dark modes. Each semantic token becomes a variable named like `color/action/primary`, with Dev Mode code syntax `var(--rd-color-action-primary)`.
- **Components:** a "rdloom components" page with one component set per spec. Variant properties come from each spec's `variants`, named through `figma.variantMap` (e.g. `Variant=primary, Size=md, Disabled=false`). Fills, strokes, corner radius and padding are bound to the variables.
- **Drawn like the components.** Each variant comes from a blueprint in `packages/figma/src/blueprint.ts` that mirrors the component's structure: a TextField is a label, an input with a placeholder and, when invalid, an error message; a DataGrid has a header, rows at the chosen density and checkboxes when selectable; a Menu has items, a shortcut and a red Delete. Colors, radii and padding stay bound to the variables. A test checks every component has a blueprint that only uses existing tokens.
- **Re-running is safe.** It updates variable values, adds missing variants and never deletes or restyles anything, so designers can refine the starting designs. A variant you delete comes back on the next sync. Variables the tokens dropped are listed, not deleted.
- After a sync, the plugin shows each component set's key to paste into the spec's `figma.componentKey`.

To run it: `npm run gen && npm run build:figma`, then in the Figma desktop app choose **Plugins → Development → Import plugin from manifest…** and pick `packages/figma/manifest.json`. It needs the Inter font, and it makes no network requests.

### Docs site
`apps/docs` builds the site from the same sources as the code: component pages come from the specs (props, usage rules, accessibility, tokens) and the tested examples, so they can't drift from the components. `npm run build:docs` writes a static site to `apps/docs/dist`.

For search engines, every page is prerendered to its own HTML file (`apps/docs/prerender.mjs`), with the full content, including the examples, plus its own title, description, canonical URL and Open Graph tags. The build also writes `sitemap.xml`, `robots.txt`, `llms.txt` (an index for AI tools) and a `404.html`. In the browser the page hydrates into the app, so navigation stays instant.

To host it, point any static host at `apps/docs/dist`: Cloudflare Pages, Netlify and GitHub Pages all serve `/components/data-grid` from `components/data-grid.html` and use `404.html` for unknown paths, with no configuration. Build with `SITE_URL` set to the public address (`SITE_URL=https://example.com npm run build:docs`) so the canonical links, `sitemap.xml`, `robots.txt` and the shadcn registry URLs point at it. Without it those are left out rather than guessed.

### Examples
Every name in a spec's `examples` list is a file: `examples/components/<id>/<name>.tsx`, default-exporting a small component. The validator fails if one is missing or unlisted. They're shown on the docs site, served by the MCP server's `get_example`, and `packages/react/test/examples.test.tsx` renders each one with axe.

### Adding a component
1. Create `specs/<kebab-name>.spec.json` (copy `button.spec.json` as a start).
2. Use only semantic tokens that exist in `tokens/semantic.light.tokens.json`.
3. Run `npm run gen`, then build the component in `packages/react/src/<name>/` using the generated `*SpecProps` and `*Defaults`.

## Data Grid performance

Reproduce with `npm run bench:grid` (builds the playground, drives it in headless Chromium). Each figure is how long the page takes to paint the result of one action, the median of five runs, in a production build on one Windows machine. About 33 ms is the floor of the method (two animation frames at 60 Hz), so a 33 ms row means no measurable blocking.

| | 100,000 rows | 1,000,000 rows |
|---|---|---|
| Rows in the DOM | 19 | 19 |
| First render, data included | ~1.1 s | ~10–15 s |
| JS heap | ~330 MB | ~3.1 GB |
| Sort: numbers / text / ISO dates | ~100 ms | ~1.0–1.3 s |
| Search or column filter | ~33 ms | ~230–350 ms |
| Arrow key, Ctrl+End, scrolling | 33 ms | 33 ms |

The DOM and keyboard cost don't grow with the dataset: the grid only ever draws the rows in view. Memory and sorting do, because a client-side grid has to hold every row. Up to a few hundred thousand rows that is fine. At a million, pass the data a page at a time with `serverSide` instead:

| `serverSide`, 1,000,000 rows on the server | |
|---|---|
| First render | ~340 ms |
| Rows in the DOM / JS heap | 19 / ~28 MB |
| `aria-rowcount` | 1,000,002 (the full size, so assistive technology reports the real dataset) |
| Change the sort, next page, jump to the last page | 33 ms each |

That row measures the grid alone: the demo "server" answers instantly, so your own latency comes on top.

How:
- **Sorting** (`data-grid/sorting.ts`) sorts all rows once per sort change, reading each value once and sorting indexes. Filtering then keeps that order in one O(n) pass instead of re-sorting. TanStack's default "alphanumeric" sort took ~1.3 s on 100k date strings.
- **Filtering** (`data-grid/filtering.ts`) builds a lowercase search string per row once per dataset, so a keystroke is a plain `includes()` scan. TanStack's `includesString` took ~450–770 ms here.

These are single-machine numbers; treat them as orders of magnitude. Search matches raw cell values, and also the display text of columns with `meta.format` (so "$1,901" finds `1901.74`). Formatting runs once per dataset: about 60 ms for 100,000 currency values.

### Data Grid editing notes
Edits are reported through `onCellEdit`; the grid never changes your data. Enter, F2, double-click and typing start an edit. With an IME (Japanese, Chinese, Korean input), the first key opens an empty editor and the composition continues in it. On phones, where a cell can't bring up the keyboard, a second tap on the selected cell opens the editor (like a spreadsheet); double-tap works too. Touch is tested in Chromium with touch emulation (`tests/visual/interactions.spec.ts`).

### Data Grid server-side data
Set `serverSide`, `pageSize`, `rowCount` (the server's total) and `onQueryChange`. The grid sends `{ sorting, filters, search, pageIndex, pageSize }` on mount and on every change, and shows the rows you give it back as they are: it does no sorting, filtering or paging of its own. Sort and page changes go out at once; typing in a filter or search waits `queryDelay` ms (default 250). A new sort or filter asks for page 1, once. Pass `isLoading` while you fetch, and ignore a response that a newer request has overtaken (the example keeps a request counter). Things to know:
- A "select" filter normally lists the values in the loaded rows, which is one page here; give the full list with `meta.filterOptions`.
- Selection is kept by row id across pages. "Select all" and the CSV/Excel export cover the rows that are loaded, so export from the server when you need everything.
- `groupBy` and `getSubRows` need the whole dataset and are ignored. `renderDetail`, editing, ranges and copy/paste work as usual on the loaded page.

### Data Grid column menu, set filters and row reorder
- **Column menu** (`columnMenu`). Every header gets a menu: sort ascending or descending, clear the sort, pin to the left, reset the width, hide the column. Hidden columns come back from any header's menu ("Show City"). From the keyboard, Alt+Down, Shift+F10 or the Menu key on a header opens it; Escape closes it and returns to the header. The last visible column can't be hidden.
- **Set filter** (`meta: { filter: "set" }`). A checklist of the column's values, like a spreadsheet's filter: any ticked value matches. It lists the values in the data (up to 200) or `meta.filterOptions` when you give them, and gets a search box once there are more than 8. Enter or typing on its filter cell opens it. With `serverSide`, its value reaches `onQueryChange` as an array of strings.
- **Row reorder** (`rowReorder`, `onRowReorder`). A handle column lets users drag rows, or move the focused row with Alt+Up and Alt+Down. The grid never changes your data: it calls `onRowReorder({ rowId, fromIndex, toIndex })` and you apply it, usually with the exported `reorderRows(rows, move)`. Every move is announced ("Moved Ada to position 2 of 4"). Reordering is switched off, and the handles say so, whenever the displayed order is no longer your data's order: while sorting, filtering or searching, with `groupBy` or `getSubRows`, and with `serverSide`.

### Data Grid fill handle
When the grid has focus, a small handle sits on the corner of the selection (or the focused cell). Drag it over adjacent cells to fill them from the selection, as in a spreadsheet; a preview outlines what will change, nothing is written until you let go, and Escape cancels. The grid scrolls when you reach its edge, and a fill follows whichever way you've gone further, down, up, left or right, never two at once.

| Selected | Filled with |
|---|---|
| `2`, `4` | `6`, `8`, `10`: a steady step continues |
| `10` (one number) | `10`, `10`: copied, as in a spreadsheet |
| `Item 1` or `ORD-0009` | `Item 2`, `Item 3` or `ORD-0010`: text ending in a number counts up, keeping its width |
| `2026-01-05`, `2026-01-12` | `2026-01-19`, `2026-01-26`: ISO dates step by the gap; a single date counts up a day |
| anything else, or an uneven run | the selection repeats |

Only editable cells are written (read-only cells and values a number column can't take are skipped and counted in the announcement), through `onCellsEdit` in one batch, or `onCellEdit` once per cell. The handle is a mouse shortcut and is hidden from assistive technology; the keyboard route is **Ctrl+D** (Cmd+D) to copy the top row of a selection down across it, or the cell above when nothing is selected, and **Ctrl+R** to do the same to the right. Both repeat rather than count up, like a spreadsheet's. Turn it all off with `fillHandle={false}`; it also needs `rangeSelection` and an edit handler.

### Data Grid ranges, clipboard and export
- **Ranges.** Shift+arrows, Shift+click or a mouse drag select a block of cells; Escape clears it. Turn it off with `rangeSelection={false}`.
- **Copy** (Ctrl/Cmd+C) puts the block on the clipboard as tab-separated text, the way the cells show it (`$1,200.50`, not `1200.5`), so it pastes straight into Excel or Google Sheets. With no block, it copies the focused cell.
- **Paste** (Ctrl/Cmd+V) writes spreadsheet text into editable cells from the focused cell; read-only cells and text in a number column are skipped and counted in the announcement. One copied value fills a selected block. Pass `onCellsEdit` to apply a whole paste in a single state update; without it, `onCellEdit` is called once per cell, and applying each with `setRows(rows.map(...))` instead of the functional form would keep only the last.
- **Export.** Pass `apiRef` (`useRef<DataGridApi>(null)`) and call `getCsv()`, `downloadCsv()` or `downloadExcel()`. They export every row that passes the search and filters, across pages, in display order, with raw values (numbers stay numbers); `{ scope: "selected" }` exports only selected rows. CSV prefixes text starting with `=`, `+`, `-` or `@` with an apostrophe so a spreadsheet can't run it as a formula (`sanitize: false` turns that off). The .xlsx is written in the browser with no extra dependency.

## Motion components (optional)
Animated extras live in their own category, apart from the plain components. `rdloom add button` is unchanged; `rdloom add shimmer-button` adds one more file that builds on it. Nothing is included unless you add it.

| Buttons | Effects | Text and reveal |
|---|---|---|
| `ShimmerButton`, `RippleButton`, `PulseButton`, `GradientButton`, `RevealButton` | `ShuttleBorder` (light that runs round an edge), `ShineBorder`, `Ripple` (rings behind content) | `TextShimmer`, `GradientText`, `BlurFade` |

Every one of them follows the same rules, and tests check them:
- **Decoration only.** The animated layers are hidden from assistive technology and never take focus, so a button is still named by its label alone.
- **Still for reduced motion.** With `prefers-reduced-motion: reduce` they stand still, and in high-contrast mode the text effects fall back to plain system colours. The `rdm-still` class on any ancestor forces the still state; the docs use it for the **Still** switch on each preview.
- **Pausable.** `isPaused` stops an effect, because moving content should be stoppable.
- **One stylesheet, no setup, no inline `<style>` tags.** The keyframes and still rules for every effect live in one file, `rdloom-motion.css`. The first time you add a motion component, `rdloom add` writes it next to your tokens CSS and adds a single `@import` line to the tokens file, so it loads with what you already import. A project that never adds an effect never gets the file, and because nothing is injected as a `<style>` tag it works under a strict content-security policy. (`BlurFade` and `RevealButton` are plain transitions and need no CSS.) Adding by hand? Save the file and import it. Per-effect settings such as speed are small CSS variables set on the element, with defaults in the stylesheet, so an effect still moves at a sensible pace even if a policy strips style attributes.
- **No packages.** The text effects, borders and `BlurFade` need no npm packages beyond rdloom's own shared helpers, and several render in a React Server Component.
- **Never hides content.** `BlurFade` is visible in the server HTML and for visitors without JavaScript; it is only hidden, before the first paint, once the browser can reveal it again, and never when reduced motion is on.

## AI interface components

Eleven components for building an assistant, copilot or agent screen: `Chat`, `Message`, `PromptInput`, `Response`, `ToolCall`, `AgentActivity`, `ApprovalBox`, `Citation`, `Sources`, `GeneratedTable` and `GeneratedChart`. They are in their own category (`ai`) and are opt-in like every other component.

- **One message shape.** A message is an ordered list of typed parts (`text`, `reasoning`, `tool`, `citation`, `artifact`, `file`). The shape is in `packages/react/src/utils/ai.ts` and as JSON Schema in `specs/schema/ai-message.schema.json`. Each part has its own component, so tool steps, tables and charts keep their structure instead of becoming one long markdown string.
- **Bring your own model.** Nothing calls a model or a server. You pass messages in and get `onSend`, `onStop`, `onApprove` and `onDeny` back, so it works with any backend or AI SDK (map its messages into the shape once).
- **Tool states only move forward.** `pending → running → done | failed`, and `running → awaiting-approval → approved | denied`. `updateTool`, `appendText` and `finishMessage` return new messages and ignore a backwards update, so a late event can't reopen a finished tool.
- **Built for how assistive technology handles streaming.** The message list is not a live region; one polite status line says when a reply starts and ends, and each tool announces its own change once. An approval is announced when it appears, takes focus on the box (not on a button), says its risk in words, can't be collapsed away, and returns focus to the tool when answered. Charts always carry a written summary and a "View as table" switch; series differ by shape, not only color.
- **Safe with text you don't control.** `Response` reads markdown into React elements and never injects HTML; links with unsafe schemes show as plain text; half-finished markdown while streaming never throws. CSV export prefixes cells that start with `=`, `+`, `-` or `@` so a spreadsheet can't run them as formulas.
- **A real message box.** `PromptInput` is one rounded bar: a `+` menu on the left (add files, plus any tools you list), the text, then your own controls, a microphone and Send. Files added show above the text, pictures as small previews drawn only from this device. You get only the buttons you ask for; with just `onSubmit` it is a plain box. `Chat` passes all of it through.
- **No chart library.** `GeneratedChart` draws bars and lines in plain SVG.

## Charts, stats and blocks

- **Chart** draws bars, stacked bars, lines, areas and donuts in plain SVG, with no chart library. It is one tab stop: the arrow keys move between values, a tooltip and a polite announcement say what is selected, and "View as table" swaps the drawing for the same numbers as a real table. Series colors come from six chart tokens (`--rd-color-chart-1` to `-6`), tested for contrast in light and dark, and series are told apart by shape and label as well as color.
- **Stat** also has a card look (`variant="card"`): the trend as a pill at the top right, the number big, a headline and a note on a soft rounded surface. Big numbers read an optional `--rd-font-numeric` font variable and otherwise inherit the page font, so an app can give its numbers a typeface without any component forcing one.
- **Stat** is a key number with a trend (an arrow and a signed value, said in words for screen readers) and an optional **Sparkline**.
- **DashboardShell** is the frame of a dashboard or admin app: a sidebar of navigation that folds down to icons (each item keeps its name and shows it in a tooltip), sub-items, badges, an account menu, a workspace switcher, a top bar with the fold button, a breadcrumb slot, search and actions, and a skip link. In a narrow space, a phone or just a small frame, the sidebar becomes a menu that slides in. It has no router: items are links (`href`, or your router's link through `renderLink`) or buttons. **DashboardPage** is one page inside it: the h1, actions, and a row of key numbers.
- **CustomerTable** is a block: a ready-made piece built from the library's own parts. Give it customers and it has search, status and plan filters, sorting, pages, CSV export, loading rows, an empty state, an error with retry, and cards instead of a table on a phone. Above it, totals and a chart follow the filters. For a large list set `serverSide`: the table shows exactly what you pass and asks for more through `onQueryChange` (search waits for typing to pause). It never fetches anything itself.

## Renaming the library
The name is kept in few places on purpose: `packages/codegen/src/brand.ts` (name, CSS prefix, npm scope), the `name` fields in each `package.json`, and this README.

## Roadmap (next)
- Run the screen reader audit (NVDA, VoiceOver) and fix what it finds
- Figma: component visuals closer to the real components, and syncing designers' changes back to specs
- Pick the final name, then publish to npm

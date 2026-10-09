import { useState } from "react";
import { Button, TextField } from "@rdloom/react";
import { repoUrl, semanticTokens } from "../data";
import { Link } from "../router";
import { registryBase } from "../routes";
import { CodeBlock, H2, PageTitle, Prose } from "../ui";

export function GettingStarted() {
  return (
    <article>
      <PageTitle lead="Add rdloom to a React 19 app with Tailwind CSS v4. It takes about two minutes.">Getting started</PageTitle>
      <Prose>
        <H2 id="init">1. Set up the project</H2>
        <CodeBlock code="npx rdloom init" label="Init command" />
        <p>
          This writes <code>rdloom.json</code>, copies the design tokens to <code>src/styles/rdloom-tokens.css</code> and adds a few shared
          utilities.
        </p>
        <H2 id="css">2. Import the tokens and point Tailwind at the components</H2>
        <CodeBlock
          label="CSS"
          code={`/* src/index.css */
@import "tailwindcss";
@import "./styles/rdloom-tokens.css";
@source "./components/rdloom";`}
        />
        <H2 id="add">3. Add components</H2>
        <CodeBlock code="npx rdloom add button date-range-picker data-grid --install" label="Add command" />
        <p>
          The source lands in <code>src/components/rdloom/</code>. <code>--install</code> also installs the npm packages they need. Then import
          them like any of your own files:
        </p>
        <CodeBlock
          label="Usage"
          code={`import { Button } from "./components/rdloom/button/button";

export function Save() {
  return <Button onPress={() => save()}>Save</Button>;
}`}
        />
        <H2 id="commit">4. Commit the lock file</H2>
        <p>
          Commit <code>rdloom.json</code>, <code>rdloom.lock.json</code> and the <code>.rdloom/</code> folder. They record what was shipped, which
          is what lets <Link href="/docs/cli">upgrades</Link> merge into your edits.
        </p>
        <H2 id="theme">Dark mode</H2>
        <p>
          The tokens follow <code>prefers-color-scheme</code>. To force a theme, set <code>data-theme="light"</code> or <code>data-theme="dark"</code>{" "}
          on <code>&lt;html&gt;</code>.
        </p>
      </Prose>
    </article>
  );
}

export function CliGuide() {
  return (
    <article>
      <PageTitle lead="Own the code, and still take upgrades.">CLI and upgrades</PageTitle>
      <Prose>
        <CodeBlock
          label="Commands"
          code={`npx rdloom init              # set up rdloom.json, tokens and utils
npx rdloom add <name...>      # copy components (add --install for npm packages)
npx rdloom list               # what's available and installed
npx rdloom diff [--patch]     # your changes vs upstream's, per file
npx rdloom upgrade --dry-run  # what an upgrade would do
npx rdloom upgrade [name...]  # apply it`}
        />
        <H2 id="github">Components from GitHub</H2>
        <p>
          Install from any GitHub repository that publishes an rdloom registry, including private ones. The lock file pins each item to a commit,
          and <code>upgrade</code> merges new commits into your edits.
        </p>
        <CodeBlock
          label="GitHub commands"
          code={`npx rdloom add acme/design-system/auth-kit       # default branch
npx rdloom add acme/design-system/auth-kit#v2    # a branch, tag or commit
npx rdloom add @acme/auth-kit                    # with "registries": { "@acme": "acme/design-system" } in rdloom.json`}
        />
        <p>
          Private repositories work when <code>GH_TOKEN</code> or <code>GITHUB_TOKEN</code> is set, or you're logged in with <code>gh auth login</code>.
          The token is only sent to api.github.com. To publish your own, list items in <code>rdloom-registry.json</code> and run{" "}
          <code>npx rdloom registry build</code>.
        </p>
        <H2 id="monorepo">Monorepos</H2>
        <p>
          Commands work from any directory: rdloom looks for <code>rdloom.json</code> where you are and then upwards, so a command run deep
          inside an app still finds it. The lock file and merge bases sit next to that config. Pick one of two layouts:
        </p>
        <CodeBlock
          label="Monorepo setup"
          code={`# One copy per app
npx rdloom init --cwd apps/web

# One shared copy for every app: run at the repo root
npx rdloom init --components-dir packages/ui/src/rdloom --tokens-css packages/ui/src/rdloom.css`}
        />
        <p>
          The shared layout keeps a single lock file at the root, so one <code>rdloom upgrade</code> updates every app at once. Components
          import each other with relative paths, so they work unchanged inside a workspace package. Each app imports the tokens CSS once and
          adds <code>@source</code> for the shared folder so Tailwind scans it.
        </p>
        <H2 id="shadcn">With the shadcn CLI</H2>
        <p>
          Every component is also published in the shadcn registry format, so you can add rdloom components with that CLI instead of this one.
          Files land in <code>components/rdloom/</code> under your components alias, the npm packages are installed, and the colour tokens are
          added to your global CSS, with dark values on the <code>.dark</code> class.
        </p>
        <CodeBlock
          label="shadcn commands"
          code={`npx shadcn@latest add ${registryBase}/r/data-grid.json

# or add a namespace to components.json once:
#   "registries": { "@rdloom": "${registryBase}/r/{name}.json" }
npx shadcn@latest add @rdloom/data-grid`}
        />
        <p>
          The shadcn CLI doesn't track what it installed, so <code>rdloom diff</code> and <code>rdloom upgrade</code> can't merge later changes into
          your edits. For upgrades, use <code>npx rdloom add</code> instead.
        </p>
        <H2 id="merge">How upgrades merge</H2>
        <p>For each file, upgrade compares three versions: as shipped, yours, and the new one. It merges them the way git does.</p>
        <div role="region" aria-label="Upgrade results" tabIndex={0} className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--site-border)]">
                <th scope="col" className="py-2 pe-4 font-medium">You changed it</th>
                <th scope="col" className="py-2 pe-4 font-medium">Upstream changed it</th>
                <th scope="col" className="py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["No", "Yes", "Replaced with the new version"],
                ["Yes", "No", "Your version kept"],
                ["Yes", "Yes, different lines", "Both changes merged"],
                ["Yes", "Yes, same lines", "Conflict markers to resolve, exit code 1"],
              ].map((r) => (
                <tr key={r.join()} className="border-b border-[var(--site-border)]">
                  {r.map((c, i) => (i === 0 ? <th key={i} scope="row" className="py-2 pe-4 font-normal">{c}</th> : <td key={i} className="py-2 pe-4">{c}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <code>add</code> never overwrites a file you've edited, new versions only print npm packages you don't have yet, and your line endings
          are kept.
        </p>
      </Prose>
    </article>
  );
}

export function McpGuide() {
  return (
    <article>
      <PageTitle lead="Give Claude Code, Cursor and other agents the rules, so they write code that works the first time.">AI agents (MCP)</PageTitle>
      <Prose>
        <p>
          The <code>@rdloom/mcp</code> server serves the specs: props, when to use each component and when not to, anti-patterns, accessibility
          requirements, tokens and tested examples. It's read-only and needs no network access.
        </p>
        <H2 id="setup">Set up</H2>
        <CodeBlock code="npm install -D @rdloom/mcp" label="Install" />
        <p>Claude Code:</p>
        <CodeBlock code="claude mcp add rdloom -- npx rdloom-mcp" label="Claude Code command" />
        <p>
          Other clients, in their MCP config (for example <code>.mcp.json</code>):
        </p>
        <CodeBlock label="MCP config" code={`{\n  "mcpServers": {\n    "rdloom": { "command": "npx", "args": ["rdloom-mcp"] }\n  }\n}`} />
        <H2 id="tools">Tools</H2>
        <ul className="flex list-disc flex-col gap-1 ps-5">
          <li><code>list_components</code>: all components, or ranked by a search like "pick a date range"</li>
          <li><code>get_component</code>: install and import lines, props, usage rules, accessibility, the first example</li>
          <li><code>get_example</code>: working example code, each one tested with axe</li>
          <li><code>get_component_source</code>: the files <code>add</code> copies</li>
          <li><code>get_tokens</code>: CSS variables with light and dark values</li>
          <li><code>validate_props</code>: checks props against the spec before the agent writes them</li>
          <li><code>get_setup</code>: how to set up a project</li>
        </ul>
      </Prose>
    </article>
  );
}

export function FigmaGuide() {
  return (
    <article>
      <PageTitle lead="The same tokens and variants in Figma, so design and code share names and values.">Figma plugin</PageTitle>
      <Prose>
        <ul className="flex list-disc flex-col gap-2 ps-5">
          <li>
            <strong>Variables:</strong> an "rdloom" collection with Light and Dark modes. Dev Mode shows each one's CSS variable, like{" "}
            <code>var(--site-primary)</code>.
          </li>
          <li>
            <strong>Components:</strong> one component set per spec, with variant properties named from the spec (
            <code>Variant=primary, Size=md, Disabled=false</code>). Each variant is drawn like the component (a field's label, input and error;
            a grid's header and rows) with colors and radii bound to the variables.
          </li>
          <li>
            <strong>Safe to re-run:</strong> it updates values and adds missing variants, and never deletes or restyles designers' work.
          </li>
        </ul>
        <H2 id="run">Run it</H2>
        <p>
          The plugin isn't in the Figma Community yet. Build it from the <a href={repoUrl}>repository</a>:
        </p>
        <CodeBlock code="npm run gen && npm run build:figma" label="Build command" />
        <p>
          Then in the Figma desktop app: <strong>Plugins → Development → Import plugin from manifest…</strong> and pick{" "}
          <code>packages/figma/manifest.json</code>.
        </p>
      </Prose>
    </article>
  );
}

export function AiGuide() {
  return (
    <article>
      <PageTitle lead="Components for chat, tool use and approvals, built around one message shape and for how assistive technology handles text that streams in.">AI interfaces</PageTitle>
      <Prose>
        <p>
          A normal screen is a button and a result. An AI screen is a conversation: the assistant looks something up, uses a tool, asks permission, and produces a table or a chart.
          These components show that, and they leave the model, the server and the data to you. They take messages in one shape and tell you what the person did.
        </p>

        <H2 id="shape">The message shape</H2>
        <p>
          A message has a role (<code>user</code>, <code>assistant</code> or <code>system</code>), a status, and an ordered list of <strong>parts</strong>. Each part has a type, and each type has its own component.
        </p>
        <div role="region" aria-label="Message parts" tabIndex={0} className="overflow-x-auto rounded-[var(--site-radius)] border border-[var(--site-border)]">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-[var(--site-subtle)]">
              <tr>
                {["Part", "What it is", "Shown by"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["text", "Markdown, with a streaming flag", "Response"],
                ["reasoning", "A short account of how the answer was reached", "Message (closed by default)"],
                ["tool", "One tool the assistant used, and where it is", "ToolCall, grouped by AgentActivity"],
                ["citation", "A source for a statement", "Citation markers and Sources"],
                ["artifact", "A table or a chart the assistant made", "GeneratedTable and GeneratedChart"],
                ["file", "An attachment", "Message"],
              ].map(([part, what, shown]) => (
                <tr key={part} className="border-t border-[var(--site-border)]">
                  <th scope="row" className="px-3 py-2 font-mono font-medium">
                    {part}
                  </th>
                  <td className="px-3 py-2">{what}</td>
                  <td className="px-3 py-2 text-[var(--site-muted)]">{shown}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="tools">Tool states</H2>
        <p>
          A tool is <code>pending</code>, <code>running</code>, <code>awaiting-approval</code>, <code>approved</code>, <code>denied</code>, <code>done</code> or <code>failed</code>. States only move forward: a tool that needs
          permission goes from running to awaiting-approval, then to approved (and runs on) or denied. <code>denied</code>, <code>done</code> and <code>failed</code> are final. A late or repeated update can never take a finished tool
          back, so a screen reader hears "Searching, done" once and never a flicker.
        </p>

        <H2 id="wire">Wire it up</H2>
        <p>
          The helpers return new messages and never change the one you pass in, so they fit any state library. This is the whole loop for a streamed reply:
        </p>
        <CodeBlock
          label="Streaming a reply"
          code={`import { Chat, appendText, finishMessage, updateTool, type ChatMessage } from "@rdloom/react";

const [messages, setMessages] = useState<ChatMessage[]>([]);
const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready");

// Text arrives: add it to the last assistant message.
setMessages((m) => [...m.slice(0, -1), appendText(m[m.length - 1], chunk)]);

// A tool moved on (it can't go backwards).
setMessages((m) => [...m.slice(0, -1), updateTool(m[m.length - 1], "q1", { state: "done" })]);

// All done.
setMessages((m) => [...m.slice(0, -1), finishMessage(m[m.length - 1])]);

<Chat
  messages={messages}
  status={status}
  onSend={send}          // call your model or API here
  onStop={stop}
  onApprove={(toolId) => approve(toolId)}
  onDeny={(toolId) => deny(toolId)}
/>`}
        />
        <p>
          Nothing here talks to a model. If you use an AI SDK, map its messages into this shape once, in a small function, and keep the rest of your app unchanged.
        </p>

        <H2 id="a11y">What is different about accessibility</H2>
        <ul className="flex list-disc flex-col gap-2 ps-5">
          <li>
            <strong>Streaming is not read token by token.</strong> The message list is not a live region. One polite status line says "Assistant is responding" and "Response complete", and the reply is marked busy while it grows.
          </li>
          <li>
            <strong>Tools announce themselves.</strong> Each tool says its own state changes, once, and a tool that arrives already finished is not read out again.
          </li>
          <li>
            <strong>Approvals are never hidden or accidental.</strong> The question is announced when it appears (assertively for high risk), focus goes to the box and not to a button, risk is said in words as well as drawn, and a group with
            a waiting question can't be collapsed. After an answer, focus returns to the tool.
          </li>
          <li>
            <strong>Charts always have words.</strong> A written summary sits beside every chart and View as table shows the same numbers as a table. Series differ by shape, not just color.
          </li>
          <li>
            <strong>Following the reply is polite.</strong> The list follows new text only while you are at the bottom; scroll up and it stops, with a Jump to latest button.
          </li>
          <li>
            <strong>Model text is never trusted.</strong> Replies are built as elements, never injected as HTML, and unsafe links show as plain text.
          </li>
        </ul>

        <H2 id="components">The components</H2>
        <p>
          <Link href="/components/chat" className="underline underline-offset-4">Chat</Link> puts it all together. Use the parts on their own for your own layout:{" "}
          <Link href="/components/message" className="underline underline-offset-4">Message</Link>,{" "}
          <Link href="/components/prompt-input" className="underline underline-offset-4">PromptInput</Link>,{" "}
          <Link href="/components/response" className="underline underline-offset-4">Response</Link>,{" "}
          <Link href="/components/tool-call" className="underline underline-offset-4">ToolCall</Link>,{" "}
          <Link href="/components/agent-activity" className="underline underline-offset-4">AgentActivity</Link>,{" "}
          <Link href="/components/approval-box" className="underline underline-offset-4">ApprovalBox</Link>,{" "}
          <Link href="/components/citation" className="underline underline-offset-4">Citation</Link>,{" "}
          <Link href="/components/sources" className="underline underline-offset-4">Sources</Link>,{" "}
          <Link href="/components/generated-table" className="underline underline-offset-4">GeneratedTable</Link> and{" "}
          <Link href="/components/generated-chart" className="underline underline-offset-4">GeneratedChart</Link>.
        </p>
      </Prose>
    </article>
  );
}

export function AccessibilityGuide() {
  return (
    <article>
      <PageTitle lead="What rdloom does for keyboards, screen readers, touch and reduced motion, how it is checked, and what is still left for people to check.">Accessibility</PageTitle>
      <Prose>
        <H2 id="target">The target</H2>
        <p>
          Every component aims at WCAG 2.2 level AA. Components are built on React Aria, which handles keyboard behaviour, focus and screen reader
          roles for the hard cases such as comboboxes, date pickers, menus and dialogs. Each component page lists the keys it responds to, what a
          screen reader announces, and the rules to follow when you use it.
        </p>
        <H2 id="checks">What is checked automatically</H2>
        <ul>
          <li>Every example on this site runs through axe, an automated accessibility checker, in tests that must pass before a release.</li>
          <li>Keyboard behaviour is tested per component: Tab order, arrow keys, Enter, Space and Escape, and where focus goes after a dialog or menu closes.</li>
          <li>Every example is opened at phone and tablet width, and the page must not scroll sideways.</li>
          <li>Tap targets on a phone are scanned: links and buttons must be at least 24 by 24 pixels.</li>
          <li>Docs pages must not take focus or scroll by themselves when they open.</li>
          <li>Animations stop for visitors who prefer reduced motion, and each motion example has a Still switch.</li>
          <li>Colour is never the only way to say something: errors, warnings and statuses also use text or an icon.</li>
        </ul>
        <H2 id="forms">Forms and permissions</H2>
        <p>
          Form fields have visible labels, errors are announced and linked to their field, and a form with several errors lists them in a summary
          that takes focus. A control you are not allowed to use stays focusable, says why, and is not just hidden.
        </p>
        <H2 id="limits">What is not done yet</H2>
        <p>
          Automated tests find a share of the problems, not all of them. A full pass by people using NVDA, VoiceOver and a keyboard alone has not
          been done yet. The checklist for it is in the repository, and results will be published here when it is finished. If you find a barrier,
          please{" "}
          <a href={`${repoUrl}/issues`} className="underline">
            open an issue
          </a>
          .
        </p>
      </Prose>
    </article>
  );
}

export function TokensGuide() {
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  return (
    <article>
      <PageTitle lead="Semantic tokens as CSS variables. Use these instead of raw values: colors and shadows switch for dark mode by themselves, and sizes follow the density you choose.">Design tokens</PageTitle>
      <Prose>
        <H2 id="elevation">Elevation</H2>
        <p>
          Four shadow levels, defined once. Components use them by name, so a popover, a dialog and a menu always feel related, and changing the look of depth is one edit. In dark mode each level uses a deeper shadow with a faint light
          edge, because a dark shadow barely shows on a dark surface.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {[
            ["control", "Filled buttons and checked boxes: a lit top edge and a small drop."],
            ["raised", "Resting controls, cards and the selected tab."],
            ["floating", "Menus, listboxes, tooltips and toasts."],
            ["overlay", "Dialogs, sheets and the command palette."],
          ].map(([name, use]) => (
            <li key={name} className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="size-14 shrink-0 rounded-xl border border-[var(--site-border)] bg-[var(--rd-color-surface-raised)]"
                style={{ boxShadow: `var(--rd-elevation-${name})` }}
              />
              <span className="flex flex-col text-sm">
                <code>--rd-elevation-{name}</code>
                <span className="text-[var(--site-muted)]">{use}</span>
              </span>
            </li>
          ))}
        </ul>
        <CodeBlock label="Use an elevation token" code={`.menu { box-shadow: var(--rd-elevation-floating); }`} />

        <H2 id="density">Density</H2>
        <p>
          Control heights and padding come from tokens too. Put <code>data-density=&quot;compact&quot;</code> on <code>&lt;html&gt;</code>, or on any container, and everything inside tightens. Use it for data-heavy admin
          screens; leave it off for marketing pages and forms people fill in once.
        </p>
        <div className="not-prose flex flex-col gap-3 rounded-[var(--site-radius)] border border-[var(--site-border)] p-4">
          <div role="group" aria-label="Density" className="flex w-fit gap-1 rounded-lg border border-[var(--site-border)] bg-[var(--site-subtle)] p-1">
            {(["comfortable", "compact"] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={density === d}
                onClick={() => setDensity(d)}
                className="rounded-md px-3 py-1 text-sm capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] aria-pressed:bg-[var(--site-bg)] aria-pressed:font-medium aria-pressed:shadow-sm"
              >
                {d}
              </button>
            ))}
          </div>
          <div data-density={density} className="flex flex-wrap items-end gap-3">
            <TextField label="Search" placeholder="Find an invoice" className="w-56" />
            <Button>Search</Button>
            <Button variant="secondary">Filters</Button>
          </div>
        </div>
        <CodeBlock label="Set the density" code={`<html data-density="compact">\n\n<section data-density="compact">…</section>`} />
        <H2 id="all">All tokens</H2>
      </Prose>
      <div role="region" aria-label="Tokens" tabIndex={0} className="overflow-x-auto rounded-[var(--site-radius)] border border-[var(--site-border)]">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-[var(--site-subtle)]">
            <tr>
              {["Token", "CSS variable", "Light", "Dark"].map((h) => (
                <th key={h} scope="col" className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {semanticTokens.map((t) => (
              <tr key={t.path} className="border-t border-[var(--site-border)]">
                <th scope="row" className="px-3 py-2 font-normal">{t.path}</th>
                <td className="px-3 py-2">
                  <code>{t.cssVar}</code>
                </td>
                {[t.light, t.dark].map((v, i) => (
                  <td key={i} className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {t.type === "color" && <span aria-hidden="true" className="size-4 shrink-0 rounded border border-[var(--site-border-strong)]" style={{ background: v }} />}
                      <code className="text-xs">{v}</code>
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

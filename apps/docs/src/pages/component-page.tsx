import { Suspense, useContext, useEffect, useState, type ReactNode } from "react";
import {
  categoryLabel,
  components,
  defaultComponentsDir,
  defaultMotionCssPath,
  displayName,
  hrefOf,
  loadMotionCss,
  EagerExamples,
  neighbours,
  repoUrl,
  semanticTokens,
  type DocComponent,
  type Example,
  type PropSpec,
  type RegistryFile,
} from "../data";
import { ArrowLeftIcon, ArrowRightIcon } from "../icons";
import { Link } from "../router";
import { registryBase } from "../routes";
import { addCommand, Badge, CodeBlock, CommandBlock, CopyPill, DocTabs, H2, H3, List, Muted, PageHeader, Preview, runCommand } from "../ui";

const title = (name: string) => name.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

export function Live({ component, example }: { component: DocComponent; example: Example }) {
  const Example = useContext(EagerExamples)?.[`${component.id}/${example.name}`] ?? example.Component;
  return (
    <Suspense fallback={<span className="text-sm text-[var(--site-muted)]">Loading example…</span>}>
      <Example />
    </Suspense>
  );
}

// --- Props -----------------------------------------------------------------------

function propType(p: PropSpec) {
  if (p.type === "enum") return (p.values ?? []).map((v) => `"${v}"`).join(" | ");
  return (p.tsType ?? p.type).replace(/import\("[^"]+"\)\./g, "");
}

function PropsTable({ props }: { props: Record<string, PropSpec> }) {
  return (
    <div role="region" aria-label="Props" tabIndex={0} className="overflow-x-auto rounded-xl border border-[var(--site-border)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]">
      <table className="w-full min-w-[38rem] border-collapse text-start text-sm">
        <thead>
          <tr className="border-b border-[var(--site-border)] bg-[var(--site-subtle)] text-xs text-[var(--site-muted)]">
            {["Prop", "Type", "Default"].map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(props).map(([name, p]) => (
            <tr key={name} className="border-b border-[var(--site-border)] align-top last:border-b-0">
              <th scope="row" className="w-[34%] px-4 py-3 text-start font-normal">
                <code className="font-medium">{name}</code>
                {p.required && <span className="ms-1.5 text-xs text-[var(--rd-color-feedback-danger)]">required</span>}
                <p className="pt-1 text-[13px] leading-5 text-[var(--site-muted)]">{p.description}</p>
              </th>
              <td className="px-4 py-3">
                <code className="text-xs break-words">{propType(p)}</code>
              </td>
              <td className="px-4 py-3">{p.default === undefined ? <span className="text-[var(--site-muted)]">—</span> : <code>{JSON.stringify(p.default)}</code>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Tokens ----------------------------------------------------------------------

function Swatch({ token }: { token: string }) {
  const row = semanticTokens.find((t) => t.path === token);
  const isColor = row?.type === "color";
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {isColor ? (
        <span aria-hidden="true" className="size-5 shrink-0 rounded-md border border-[var(--site-border-strong)]" style={{ background: `var(${row!.cssVar})` }} />
      ) : (
        <span aria-hidden="true" className="size-5 shrink-0" />
      )}
      <code className="text-[12.5px]">{row?.cssVar ?? token}</code>
    </li>
  );
}

// --- Installation ------------------------------------------------------------------

/** The source files, fetched when the Manual tab is opened. */
function ManualFiles({ component }: { component: DocComponent }) {
  const [files, setFiles] = useState<RegistryFile[] | null>(null);
  useEffect(() => {
    let live = true;
    component.loadFiles().then((f) => live && setFiles(f));
    return () => {
      live = false;
    };
  }, [component]);
  if (!files) return <Muted>Loading the source…</Muted>;
  return (
    <div className="flex flex-col gap-3">
      {files.map((f, i) => (
        <details key={f.path} open={i === 0} className="group/file overflow-hidden rounded-xl border border-[var(--site-border)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[var(--site-subtle)] px-4 py-2.5 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)] [&::-webkit-details-marker]:hidden">
            <span>{`${defaultComponentsDir}/${f.path}`}</span>
            <span aria-hidden="true" className="text-[var(--site-muted)] transition-transform group-open/file:rotate-90">
              ›
            </span>
          </summary>
          <CodeBlock bare code={f.content} label={`${f.path} source`} lang={f.path.endsWith(".json") ? "text" : "tsx"} className="border-t border-[var(--site-border)]" />
        </details>
      ))}
    </div>
  );
}

function Step({ n, title: heading, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3.5">
      <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-subtle)] text-xs font-medium">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3 pb-6">
        <p className="text-[15px] font-medium leading-7">{heading}</p>
        {children}
      </div>
    </li>
  );
}

/** The motion stylesheet, fetched when the Manual tab is opened. */
function MotionCssFile() {
  const [file, setFile] = useState<RegistryFile | null>(null);
  useEffect(() => {
    let live = true;
    loadMotionCss().then((files) => live && setFile(files[0] ?? null));
    return () => {
      live = false;
    };
  }, []);
  if (!file) return <Muted>Loading the stylesheet…</Muted>;
  return (
    <details className="group/file overflow-hidden rounded-xl border border-[var(--site-border)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[var(--site-subtle)] px-4 py-2.5 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)] [&::-webkit-details-marker]:hidden">
        <span>{defaultMotionCssPath}</span>
        <span aria-hidden="true" className="text-[var(--site-muted)] transition-transform group-open/file:rotate-90">
          ›
        </span>
      </summary>
      <CodeBlock bare code={file.content} label="Motion CSS" lang="text" className="border-t border-[var(--site-border)]" />
    </details>
  );
}

function Installation({ component }: { component: DocComponent }) {
  const { id, dependencies, registryDependencies } = component;
  const parts = registryDependencies.filter((d) => d !== "tokens" && d !== "utils" && d !== "motion-css");
  const needsShared = registryDependencies.includes("tokens") || registryDependencies.includes("utils");
  const needsMotionCss = registryDependencies.includes("motion-css");

  const manualSteps: Array<{ title: string; body: ReactNode }> = [];
  if (dependencies.length > 0) {
    manualSteps.push({ title: "Install the dependencies.", body: <CommandBlock commands={addCommand(dependencies.map((d) => `"${d}"`).join(" "))} label="Dependencies command" /> });
  }
  if (needsShared || parts.length > 0) {
    manualSteps.push({
      title: "Add the parts it builds on.",
      body: (
        <Muted>
          {needsShared && (
            <>
              The design tokens and shared helpers: <code>npx rdloom init</code> adds them. Or copy <code>utils</code> and the tokens CSS by hand.{" "}
            </>
          )}
          {parts.length > 0 && (
            <>
              It also uses{" "}
              {parts.map((p, i) => (
                <span key={p}>
                  {i > 0 && ", "}
                  {components.some((c) => c.id === p) ? (
                    <Link href={hrefOf(components.find((c) => c.id === p)!)} className="underline underline-offset-4">
                      {displayName(components.find((c) => c.id === p)!.spec.name)}
                    </Link>
                  ) : (
                    p
                  )}
                </span>
              ))}
              : add those first.
            </>
          )}
        </Muted>
      ),
    });
  }
  if (needsMotionCss) {
    manualSteps.push({
      title: "Add the motion stylesheet, and import it.",
      body: (
        <>
          <Muted>
            The keyframes for every motion component live in one CSS file. Save it beside your tokens CSS, then import it once, at the top of the tokens file or in your global CSS:
          </Muted>
          <CodeBlock lang="text" code={`@import "./rdloom-motion.css";`} label="Import the motion CSS" />
          <MotionCssFile />
        </>
      ),
    });
  }
  manualSteps.push({ title: "Copy this source into your project.", body: <ManualFiles component={component} /> });
  manualSteps.push({ title: "Update the import paths to match your setup.", body: <Muted>Imports between these files are relative. If you keep them together in one folder, nothing needs to change.</Muted> });

  return (
    <DocTabs
      label="Installation method"
      tabs={[
        {
          id: "cli",
          title: "CLI",
          content: (
            <div className="flex flex-col gap-3">
              <CommandBlock commands={runCommand(`rdloom add ${id}`)} label="Add command" />
              <Muted>
                Copies the source into <code>{defaultComponentsDir}</code>. Edit it freely: <code>rdloom upgrade</code> merges later versions into your changes.
                {dependencies.length > 0 && (
                  <>
                    {" "}
                    It needs {dependencies.map((d) => d.replace(/@\^.*$/, "")).join(", ")}; add <code>--install</code> to install them.
                  </>
                )}
              </Muted>
              {needsMotionCss && (
                <Muted>
                  It also adds <code>rdloom-motion.css</code> next to your tokens and imports it from the tokens file, once: no setup, and no inline styles. The plain components you already use are untouched.
                </Muted>
              )}
              <details className="text-sm">
                <summary className="cursor-pointer text-[var(--site-muted)] hover:text-[var(--site-fg)]">Use another registry client</summary>
                <div className="flex flex-col gap-2 pt-3">
                  <CodeBlock lang="text" code={`npx shadcn@latest add ${registryBase}/r/${id}.json`} label="Registry command" />
                  <Muted>
                    Works, but <Link href="/docs/cli#shadcn" className="underline underline-offset-4">without upgrade tracking</Link>
                    {needsMotionCss && ", and you import the motion CSS yourself"}.
                  </Muted>
                </div>
              </details>
            </div>
          ),
        },
        {
          id: "manual",
          title: "Manual",
          content: (
            <ol className="flex flex-col pt-1">
              {manualSteps.map((step, i) => (
                <Step key={step.title} n={i + 1} title={step.title}>
                  {step.body}
                </Step>
              ))}
            </ol>
          ),
        },
      ]}
    />
  );
}

// --- Usage -----------------------------------------------------------------------------

/** The import line and the JSX of an example, to show as a short usage snippet. */
function usageOf(code: string): string | null {
  const importLine = code.match(/import \{[^}]*\} from "@rdloom\/react";/)?.[0];
  if (!importLine) return null;
  const jsx = code.match(/return \(\n([\s\S]*?)\n  \);\n\}\s*$/)?.[1] ?? code.match(/return (<[\s\S]*?>);\n\}\s*$/)?.[1];
  if (!jsx) return importLine;
  const lines = jsx.split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return `${importLine}\n\n${lines.map((l) => l.slice(indent)).join("\n")}`;
}

// --- Copy page -------------------------------------------------------------------------

/** The whole page as Markdown, for pasting into an AI assistant or a note. */
function toMarkdown(component: DocComponent): string {
  const { spec, id } = component;
  const props = Object.entries(spec.props)
    .map(([name, p]) => `- \`${name}\`${p.required ? " (required)" : ""}: \`${propType(p)}\`${p.default === undefined ? "" : `, default \`${JSON.stringify(p.default)}\``}. ${p.description}`)
    .join("\n");
  const list = (items: string[] = []) => items.map((i) => `- ${i}`).join("\n");
  return [
    `# ${spec.name}`,
    spec.description,
    `Install: \`npx rdloom add ${id}\``,
    "## Props",
    props,
    ...(spec.contract
      ? [
          "## Block contract",
          list([
            `Data: ${spec.contract.data}`,
            `Data states: ${spec.contract.dataStates.join(", ") || "none"}`,
            `Permissions: ${spec.contract.permissions.join(", ") || "none yet"}`,
            `Events: ${spec.contract.events.join(", ") || "none"}`,
            `Customization: ${spec.contract.customization.join("; ")}`,
          ]),
        ]
      : []),
    "## Use it when",
    list(spec.usage.use_when),
    "## Avoid it when",
    list(spec.usage.avoid_when),
    ...(spec.usage.anti_patterns?.length ? ["## Don't", list(spec.usage.anti_patterns)] : []),
    `## Accessibility (role ${spec.a11y.role}, WCAG ${spec.a11y.wcag})`,
    "### Keyboard",
    list(spec.a11y.keyboard),
    ...(spec.a11y.requirements?.length ? ["### Requirements", list(spec.a11y.requirements)] : []),
    ...component.examples.map((e) => `## Example: ${title(e.name)}\n\n\`\`\`tsx\n${e.code.trimEnd()}\n\`\`\``),
  ].join("\n\n");
}

function PageActions({ component, showSteps = true }: { component: DocComponent; showSteps?: boolean }) {
  const { previous, next } = neighbours(component.id);
  const arrow = "flex size-8 items-center justify-center rounded-lg border border-[var(--site-border)] bg-[var(--site-subtle)] text-[var(--site-muted)] outline-none hover:text-[var(--site-fg)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";
  return (
    <>
      <CopyPill text={toMarkdown(component)} label="Copy page" className="hidden sm:inline-flex" />
      {showSteps && previous ? (
        <Link href={`/components/${previous.id}`} aria-label={`Previous: ${displayName(previous.spec.name)}`} className={arrow}>
          <ArrowLeftIcon size={15} />
        </Link>
      ) : null}
      {showSteps && next ? (
        <Link href={`/components/${next.id}`} aria-label={`Next: ${displayName(next.spec.name)}`} className={arrow}>
          <ArrowRightIcon size={15} />
        </Link>
      ) : null}
    </>
  );
}

function NeighbourLinks({ id }: { id: string }) {
  const { previous, next } = neighbours(id);
  const card = "group flex flex-1 flex-col gap-0.5 rounded-xl border border-[var(--site-border)] p-4 outline-none hover:bg-[var(--site-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";
  return (
    <nav aria-label="Previous and next component" className="mt-16 flex gap-3">
      {previous ? (
        <Link href={`/components/${previous.id}`} className={card}>
          <span className="text-xs text-[var(--site-muted)]">Previous</span>
          <span className="font-medium">{displayName(previous.spec.name)}</span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
      {next ? (
        <Link href={`/components/${next.id}`} className={`${card} text-end`}>
          <span className="text-xs text-[var(--site-muted)]">Next</span>
          <span className="font-medium">{displayName(next.spec.name)}</span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
    </nav>
  );
}

// --- The page ----------------------------------------------------------------------------

/** What every motion component promises, said once at the top of its page. */
function MotionNote() {
  return (
    <div className="mb-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-subtle)] p-4 text-sm leading-6">
      <p className="font-medium">Optional, and kept apart.</p>
      <p className="text-[var(--site-muted)]">
        Nothing here is included in a project unless you add it, and the plain component it builds on is unchanged. This effect is decoration: it is hidden from screen readers,
        stands still for visitors who prefer reduced motion, and can be paused. Use <strong className="font-medium text-[var(--site-fg)]">Still</strong> on a preview to see that version.
      </p>
    </div>
  );
}

/** What every AI interface component promises, said once at the top of its page. */
function AiNote() {
  return (
    <div className="mb-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-subtle)] p-4 text-sm leading-6">
      <p className="font-medium">Bring your own model.</p>
      <p className="text-[var(--site-muted)]">
        These components only show what you give them, in one{" "}
        <Link href="/docs/ai" className="underline underline-offset-4">
          message shape
        </Link>
        , and report what the person does. They never call a model or a server, so they work with any backend. They are built for how assistive technology handles streaming text, tool steps and approvals.
      </p>
    </div>
  );
}

/** What every block promises, said once at the top of its page. */
function BlockNote() {
  return (
    <div className="mb-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-subtle)] p-4 text-sm leading-6">
      <p className="font-medium">A ready-made piece, built from the library&apos;s own parts.</p>
      <p className="text-[var(--site-muted)]">
        A block puts several components together into something you would otherwise assemble by hand. It never fetches data: you give it the data, or answer its callbacks. It is copied into your project like any
        component, with the parts it uses, so you can change anything.
      </p>
    </div>
  );
}

/** One example of a block, shown big: choose the width to see how it folds, switch to the code, or open it full screen. */
function BlockExample({ component, example }: { component: DocComponent; example: Example }) {
  const [size, setSize] = useState<"desktop" | "tablet" | "phone">("desktop");
  const [view, setView] = useState<"preview" | "code">("preview");
  const widths = { desktop: "max-w-full", tablet: "max-w-[768px]", phone: "max-w-[390px]" } as const;
  // Blocks that are a whole application screen fill a frame; the rest take the height of their content.
  const tall = component.id === "dashboard-shell" || component.id === "sidebar";
  const seg = (active: boolean) =>
    `h-7 rounded-md px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] ${active ? "bg-[var(--site-bg)] text-[var(--site-fg)] shadow-sm" : "text-[var(--site-muted)] hover:text-[var(--site-fg)]"}`;
  return (
    <section className="min-w-0">
      <H2 id={`example-${example.name}`} label={title(example.name)}>
        {title(example.name)}
      </H2>
      {/* A whole screen gets a fixed, tall frame (1040px with the toolbar), so you see the real layout and scroll inside it. */}
      <div className={`overflow-hidden rounded-xl border border-[var(--site-border)] ${tall && view === "preview" ? "flex h-[1040px] flex-col" : ""}`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--site-border)] bg-[var(--site-bg)] px-3 py-2">
          <div role="group" aria-label="Preview or code" className="flex gap-0.5 rounded-lg bg-[var(--site-subtle)] p-0.5">
            <button type="button" aria-pressed={view === "preview"} onClick={() => setView("preview")} className={seg(view === "preview")}>
              Preview
            </button>
            <button type="button" aria-pressed={view === "code"} onClick={() => setView("code")} className={seg(view === "code")}>
              Code
            </button>
          </div>
          {view === "preview" && (
            <div role="group" aria-label="Preview width" className="hidden gap-0.5 rounded-lg bg-[var(--site-subtle)] p-0.5 sm:flex">
              {([["desktop", "Desktop"], ["tablet", "Tablet"], ["phone", "Phone"]] as const).map(([id, label]) => (
                <button key={id} type="button" aria-pressed={size === id} onClick={() => setSize(id)} className={seg(size === id)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          <a
            href={`/preview/${component.id}/${example.name}`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-[var(--site-muted)] outline-none hover:text-[var(--site-fg)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
          >
            Full screen
            <span className="sr-only"> (opens in a new tab)</span>
            <ArrowRightIcon size={12} className="-rotate-45" />
          </a>
        </div>
        {view === "preview" ? (
          <div data-block-preview className={`bg-[var(--site-subtle)] ${tall ? "min-h-0 flex-1" : ""} ${tall && size === "desktop" ? "p-0" : "p-3 sm:p-6"}`}>
            <div
              className={`mx-auto w-full overflow-hidden transition-[max-width] duration-300 motion-reduce:transition-none ${widths[size]} ${
                tall ? `h-full bg-[var(--rd-color-surface-default)] ${size === "desktop" ? "" : "rounded-xl border border-[var(--site-border)]"}` : ""
              }`}
            >
              <Live component={component} example={example} />
            </div>
          </div>
        ) : (
          <CodeBlock bare code={example.code} label={`${title(example.name)} code`} />
        )}
      </div>
    </section>
  );
}

export function ComponentPage({ component, layout = "page" }: { component: DocComponent; /** "block": examples shown at full width, the rest in a reading column. */ layout?: "page" | "block" }) {
  const asBlock = layout === "block";
  const { spec, id } = component;
  const a = spec.a11y;
  const [hero, ...more] = component.examples;
  const usage = hero ? usageOf(hero.code) : null;

  return (
    <article>
      <PageHeader
        title={displayName(spec.name)}
        lead={spec.description}
        actions={<PageActions component={component} showSteps={!asBlock} />}
        meta={
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <Badge>{categoryLabel(spec.category)}</Badge>
            <Badge>v{spec.version}</Badge>
            {spec.status && <Badge>{spec.status}</Badge>}
            <Badge>WCAG {a.wcag}</Badge>
            <a className="ms-1 text-xs text-[var(--site-muted)] underline underline-offset-4 hover:text-[var(--site-fg)]" href={`${repoUrl}/blob/main/specs/${id}.spec.json`}>
              View spec
            </a>
          </div>
        }
      />

      {spec.category === "motion" && <MotionNote />}
      {spec.category === "ai" && <AiNote />}
      {spec.category === "block" && <BlockNote />}

      {asBlock && component.examples.map((e) => <BlockExample key={e.name} component={component} example={e} />)}

      <div className={asBlock ? "mx-auto max-w-3xl" : undefined}>
      {!asBlock && hero && (
        <Preview code={hero.code} label={`${title(hero.name)} code`} tall={id === "data-grid" || id === "calendar"} motion={spec.category === "motion"} flush={spec.category === "block"}>
          <Live component={component} example={hero} />
        </Preview>
      )}

      <H2 id="installation">Installation</H2>
      <Installation component={component} />

      <H2 id="usage">Usage</H2>
      {usage ? <CodeBlock code={usage} label="Usage" /> : <Muted>See the examples below.</Muted>}

      {!asBlock && more.map((e) => (
        <section key={e.name} className="min-w-0">
          <H2 id={`example-${e.name}`} label={title(e.name)}>
            {title(e.name)}
          </H2>
          <Preview code={e.code} label={`${title(e.name)} code`} motion={spec.category === "motion"} flush={spec.category === "block"}>
            <Live component={component} example={e} />
          </Preview>
        </section>
      ))}

      <H2 id="api-reference" label="API Reference">
        API Reference
      </H2>
      <Muted className="pb-4">
        Defined by the spec. Components also accept the props of the React Aria component they wrap.
      </Muted>
      <PropsTable props={spec.props} />

      <H2 id="accessibility">Accessibility</H2>
      <Muted className="pb-5">
        Role <code>{a.role}</code>, WCAG {a.wcag}. Tested with axe and keyboard tests; screen reader checks are in the{" "}
        <a className="underline underline-offset-4" href={`${repoUrl}/blob/main/docs/accessibility-audit.md#${spec.name.toLowerCase()}`}>
          audit checklist
        </a>
        .
      </Muted>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--site-border)] p-4">
          <H3>Keyboard</H3>
          {a.keyboard.length ? <List items={a.keyboard} /> : <Muted>Not interactive.</Muted>}
        </div>
        {a.screenReader?.length ? (
          <div className="rounded-xl border border-[var(--site-border)] p-4">
            <H3>Screen readers announce</H3>
            <List items={a.screenReader} />
          </div>
        ) : null}
      </div>
      {a.requirements?.length ? (
        <div className="mt-4 rounded-xl border border-[var(--site-border)] p-4">
          <H3>What your code must do</H3>
          <List items={a.requirements} />
        </div>
      ) : null}

      {spec.contract ? (
        <div className="mb-8 rounded-xl border border-[var(--site-border)] p-4">
          <H3>Block contract</H3>
          <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
            <dt className="text-[var(--site-muted)]">Data</dt>
            <dd>{spec.contract.data}</dd>
            <dt className="text-[var(--site-muted)]">Data states</dt>
            <dd>{spec.contract.dataStates.length ? spec.contract.dataStates.join(", ") : "None: it shows what it is given"}</dd>
            <dt className="text-[var(--site-muted)]">Permissions</dt>
            <dd>{spec.contract.permissions.length ? spec.contract.permissions.join(", ") : "None yet"}</dd>
            <dt className="text-[var(--site-muted)]">Events</dt>
            <dd>{spec.contract.events.length ? spec.contract.events.join(", ") : "None"}</dd>
            <dt className="text-[var(--site-muted)]">You can replace</dt>
            <dd>{spec.contract.customization.join("; ")}</dd>
          </dl>
        </div>
      ) : null}

      <H2 id="guidelines">Guidelines</H2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--site-border)] p-4">
          <H3>Use it when</H3>
          <List items={spec.usage.use_when} tone="do" />
        </div>
        <div className="rounded-xl border border-[var(--site-border)] p-4">
          <H3>Avoid it when</H3>
          <List items={spec.usage.avoid_when} tone="dont" />
        </div>
      </div>
      {spec.usage.anti_patterns?.length ? (
        <div className="mt-4 rounded-xl border border-[var(--site-border)] p-4">
          <H3>Don't</H3>
          <List items={spec.usage.anti_patterns} tone="dont" />
        </div>
      ) : null}

      {spec.tokens?.length ? (
        <>
          <H2 id="tokens">Design tokens</H2>
          <Muted className="pb-4">
            The semantic tokens this component uses. Change them once and every component follows; see <Link href="/docs/tokens" className="underline underline-offset-4">Design tokens</Link>.
          </Muted>
          <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {spec.tokens.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </ul>
        </>
      ) : null}

      </div>
      {!asBlock && <NeighbourLinks id={id} />}
    </article>
  );
}



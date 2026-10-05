import { Suspense, useContext, useEffect, useState, type ReactNode } from "react";
import {
  categoryLabel,
  components,
  defaultComponentsDir,
  displayName,
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
import { addCommand, Badge, CodeBlock, CommandBlock, CopyButton, DocTabs, H2, H3, List, Muted, PageHeader, Preview, runCommand } from "../ui";

const title = (name: string) => name.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

function Live({ component, example }: { component: DocComponent; example: Example }) {
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

function Installation({ component }: { component: DocComponent }) {
  const { id, dependencies, registryDependencies } = component;
  const parts = registryDependencies.filter((d) => d !== "tokens" && d !== "utils");
  const needsShared = registryDependencies.includes("tokens") || registryDependencies.includes("utils");
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
              <details className="text-sm">
                <summary className="cursor-pointer text-[var(--site-muted)] hover:text-[var(--site-fg)]">Use another registry client</summary>
                <div className="flex flex-col gap-2 pt-3">
                  <CodeBlock lang="text" code={`npx shadcn@latest add ${registryBase}/r/${id}.json`} label="Registry command" />
                  <Muted>
                    Works, but <Link href="/docs/cli#shadcn" className="underline underline-offset-4">without upgrade tracking</Link>.
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
              {dependencies.length > 0 && (
                <Step n={1} title="Install the dependencies.">
                  <CommandBlock commands={addCommand(dependencies.map((d) => `"${d}"`).join(" "))} label="Dependencies command" />
                </Step>
              )}
              {(needsShared || parts.length > 0) && (
                <Step n={dependencies.length > 0 ? 2 : 1} title="Add the parts it builds on.">
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
                              <Link href={`/components/${p}`} className="underline underline-offset-4">
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
                </Step>
              )}
              <Step n={1 + (dependencies.length > 0 ? 1 : 0) + (needsShared || parts.length > 0 ? 1 : 0)} title="Copy this source into your project.">
                <ManualFiles component={component} />
              </Step>
              <Step n={2 + (dependencies.length > 0 ? 1 : 0) + (needsShared || parts.length > 0 ? 1 : 0)} title="Update the import paths to match your setup.">
                <Muted>Imports between these files are relative. If you keep them together in one folder, nothing needs to change.</Muted>
              </Step>
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

function PageActions({ component }: { component: DocComponent }) {
  const { previous, next } = neighbours(component.id);
  const arrow = "flex size-8 items-center justify-center rounded-lg border border-[var(--site-border)] bg-[var(--site-subtle)] text-[var(--site-muted)] outline-none hover:text-[var(--site-fg)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";
  return (
    <>
      <span className="hidden items-center gap-1 rounded-lg border border-[var(--site-border)] bg-[var(--site-subtle)] ps-2.5 text-sm font-medium sm:flex">
        Copy page
        <CopyButton text={toMarkdown(component)} label="Copy this page as Markdown" className="rounded-md" />
      </span>
      {previous ? (
        <Link href={`/components/${previous.id}`} aria-label={`Previous: ${displayName(previous.spec.name)}`} className={arrow}>
          <ArrowLeftIcon size={15} />
        </Link>
      ) : null}
      {next ? (
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

export function ComponentPage({ component }: { component: DocComponent }) {
  const { spec, id } = component;
  const a = spec.a11y;
  const [hero, ...more] = component.examples;
  const usage = hero ? usageOf(hero.code) : null;

  return (
    <article>
      <PageHeader
        title={displayName(spec.name)}
        lead={spec.description}
        actions={<PageActions component={component} />}
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

      {hero && (
        <Preview code={hero.code} label={`${title(hero.name)} code`} tall={id === "data-grid" || id === "calendar"}>
          <Live component={component} example={hero} />
        </Preview>
      )}

      <H2 id="installation">Installation</H2>
      <Installation component={component} />

      <H2 id="usage">Usage</H2>
      {usage ? <CodeBlock code={usage} label="Usage" /> : <Muted>See the examples below.</Muted>}

      {more.map((e) => (
        <section key={e.name} className="min-w-0">
          <H2 id={`example-${e.name}`} label={title(e.name)}>
            {title(e.name)}
          </H2>
          <Preview code={e.code} label={`${title(e.name)} code`}>
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

      <NeighbourLinks id={id} />
    </article>
  );
}



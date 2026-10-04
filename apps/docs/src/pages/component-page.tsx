import { Suspense, useContext } from "react";
import { Tab, TabList, TabPanel, Tabs } from "@rdloom/react";
import { EagerExamples, repoUrl, semanticTokens, type DocComponent, type Example, type PropSpec } from "../data";
import { Link } from "../router";
import { siteUrl } from "../routes";
import { Badge, CodeBlock, H2, List, PageTitle } from "../ui";

const title = (name: string) => name.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

function ExampleBlock({ component, example }: { component: DocComponent; example: Example }) {
  const id = `${component.id}-${example.name}`;
  const Example = useContext(EagerExamples)?.[`${component.id}/${example.name}`] ?? example.Component;
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <h3 id={id} className="font-medium">
        {title(example.name)}
      </h3>
      <Tabs variant="pill" defaultSelectedKey="preview">
        <TabList aria-label={`${title(example.name)} example`}>
          <Tab id="preview">Preview</Tab>
          <Tab id="code">Code</Tab>
        </TabList>
        <TabPanel id="preview">
          <div className="flex min-h-28 min-w-0 flex-wrap items-center overflow-x-auto rounded-[var(--site-radius-lg)] border border-[var(--site-border)] p-6">
            <Suspense fallback={<span className="text-sm text-[var(--site-muted)]">Loading example…</span>}>
              <Example />
            </Suspense>
          </div>
        </TabPanel>
        <TabPanel id="code">
          <CodeBlock code={example.code} label={`${title(example.name)} code`} />
        </TabPanel>
      </Tabs>
    </section>
  );
}

function propType(p: PropSpec) {
  if (p.type === "enum") return (p.values ?? []).map((v) => `"${v}"`).join(" | ");
  return (p.tsType ?? p.type).replace(/import\("[^"]+"\)\./g, "");
}

function PropsTable({ props }: { props: Record<string, PropSpec> }) {
  return (
    <div role="region" aria-label="Props" tabIndex={0} className="overflow-x-auto rounded-[var(--site-radius)] border border-[var(--site-border)]">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="bg-[var(--site-subtle)]">
          <tr>
            {["Prop", "Type", "Default", "Description"].map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(props).map(([name, p]) => (
            <tr key={name} className="border-t border-[var(--site-border)] align-top">
              <th scope="row" className="px-3 py-2 font-normal">
                <code>{name}</code>
                {p.required && <span className="ms-1 text-xs text-[var(--rd-color-feedback-danger)]">required</span>}
              </th>
              <td className="px-3 py-2">
                <code className="text-xs">{propType(p)}</code>
              </td>
              <td className="px-3 py-2">{p.default === undefined ? "" : <code>{JSON.stringify(p.default)}</code>}</td>
              <td className="px-3 py-2 text-[var(--site-muted)]">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Swatch({ token }: { token: string }) {
  const row = semanticTokens.find((t) => t.path === token);
  const isColor = row?.type === "color";
  return (
    <li className="flex items-center gap-2 text-sm">
      {isColor ? (
        <span aria-hidden="true" className="size-4 rounded border border-[var(--site-border-strong)]" style={{ background: `var(${row!.cssVar})` }} />
      ) : (
        <span aria-hidden="true" className="size-4" />
      )}
      <code>{row?.cssVar ?? token}</code>
    </li>
  );
}

export function ComponentPage({ component }: { component: DocComponent }) {
  const { spec, id } = component;
  const a = spec.a11y;
  const install = `npx rdloom add ${id}`;

  return (
    <article>
      <PageTitle lead={spec.description}>{spec.name}</PageTitle>
      <div className="-mt-4 flex flex-wrap items-center gap-2 pb-6">
        <Badge>v{spec.version}</Badge>
        {spec.status && <Badge>{spec.status}</Badge>}
        <Badge>{spec.category}</Badge>
        <a className="text-sm underline" href={`${repoUrl}/blob/main/specs/${id}.spec.json`}>
          View spec
        </a>
      </div>

      <H2 id="install">Install</H2>
      <CodeBlock code={install} label="Install command" />
      <p className="pt-2 text-sm text-[var(--site-muted)]">
        Copies the source into your project. Edit it freely: <code>npx rdloom upgrade</code> merges later changes into your edits.
        {component.dependencies.length > 0 && <> Needs {component.dependencies.map((d) => d.replace(/@\^.*$/, "")).join(", ")}; add <code>--install</code> to install them.</>}
      </p>
      <CodeBlock code={`npx shadcn@latest add ${siteUrl}/r/${id}.json`} label="Install with the shadcn CLI" />
      <p className="pt-2 text-sm text-[var(--site-muted)]">
        Also supported, <Link href="/docs/cli#shadcn">without upgrade tracking</Link>.
      </p>

      <H2 id="examples">Examples</H2>
      <div className="flex flex-col gap-8">
        {component.examples.map((e) => (
          <ExampleBlock key={e.name} component={component} example={e} />
        ))}
      </div>

      <H2 id="usage">Usage</H2>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="pb-2 font-medium">Use it when</h3>
          <List items={spec.usage.use_when} tone="do" />
        </div>
        <div>
          <h3 className="pb-2 font-medium">Avoid it when</h3>
          <List items={spec.usage.avoid_when} tone="dont" />
        </div>
      </div>
      {spec.usage.anti_patterns?.length ? (
        <div className="pt-6">
          <h3 className="pb-2 font-medium">Don't</h3>
          <List items={spec.usage.anti_patterns} tone="dont" />
        </div>
      ) : null}

      <H2 id="props">Props</H2>
      <p className="pb-3 text-sm text-[var(--site-muted)]">
        Defined by the spec. Components also accept the props of the React Aria component they wrap.
      </p>
      <PropsTable props={spec.props} />

      <H2 id="accessibility">Accessibility</H2>
      <p className="pb-4 text-sm text-[var(--site-muted)]">
        Role <code>{a.role}</code>, WCAG {a.wcag}. Tested with axe and keyboard tests; screen reader checks are in the{" "}
        <a className="underline" href={`${repoUrl}/blob/main/docs/accessibility-audit.md#${spec.name.toLowerCase()}`}>
          audit checklist
        </a>
        .
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="pb-2 font-medium">Keyboard</h3>
          <List items={a.keyboard} />
        </div>
        {a.screenReader?.length ? (
          <div>
            <h3 className="pb-2 font-medium">Screen readers announce</h3>
            <List items={a.screenReader} />
          </div>
        ) : null}
      </div>
      {a.requirements?.length ? (
        <div className="pt-6">
          <h3 className="pb-2 font-medium">What your code must do</h3>
          <List items={a.requirements} />
        </div>
      ) : null}

      {spec.tokens?.length ? (
        <>
          <H2 id="tokens">Tokens</H2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {spec.tokens.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}

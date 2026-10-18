import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { ToastRegion } from "@rdloom/react";
import { blocks, type Block, type Example } from "./blocks";

type Theme = "light" | "dark";
type Dir = "ltr" | "rtl";
type Result = { status: "pending" } | { status: "pass"; ms: number } | { status: "fail"; error: string };

interface Controls {
  theme: Theme;
  dir: Dir;
  /** Width of the frame an example is drawn in, in pixels; 0 is the full width. */
  width: number;
}

const WIDTHS = [
  { label: "Full", value: 0 },
  { label: "Desktop 1024", value: 1024 },
  { label: "Tablet 768", value: 768 },
  { label: "Phone 375", value: 375 },
];

const border = "border-[var(--rd-color-border-default)]";
const muted = "text-[var(--rd-color-text-muted)]";
const current = "aria-[current=page]:bg-[var(--rd-color-surface-muted,#eee)]";

class Boundary extends Component<{ onError: (message: string) => void; children: ReactNode }, { error?: string }> {
  state: { error?: string } = {};
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  componentDidCatch(e: unknown) {
    this.props.onError(e instanceof Error ? e.message : String(e));
  }
  render() {
    if (this.state.error) return <div role="alert" className="m-3 rounded border border-red-500 bg-red-500/10 p-3 text-sm text-red-600">Failed to render: {this.state.error}</div>;
    return this.props.children;
  }
}

/** One example in its own frame. Passes once it has drawn something; fails if it throws or draws nothing. */
function Frame({ example, controls, onResult }: { example: Example; controls: Controls; onResult: (r: Result) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    onResult({ status: "pending" });
    const started = performance.now();
    const check = window.setTimeout(() => {
      const el = ref.current;
      if (el?.querySelector("*") && el.getBoundingClientRect().height > 0) onResult({ status: "pass", ms: Math.round(performance.now() - started) });
      else onResult({ status: "fail", error: "rendered nothing" });
    }, 600);
    return () => window.clearTimeout(check);
    // Re-run only when a different example is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [example]);
  return (
    <div
      ref={ref}
      dir={controls.dir}
      style={controls.width ? { width: controls.width, maxWidth: "100%" } : undefined}
      className={`overflow-auto rounded-lg border ${border} bg-[var(--rd-color-surface-default)]`}
    >
      <Boundary onError={(error) => onResult({ status: "fail", error })}>
        <Suspense fallback={<p className="p-4 text-sm">Loading…</p>}>
          <example.Component />
        </Suspense>
      </Boundary>
    </div>
  );
}

function Badge({ result }: { result?: Result }) {
  if (!result || result.status === "pending") return <span className="rounded px-2 py-0.5 text-xs opacity-60">…</span>;
  if (result.status === "pass") return <span data-result="pass" className="rounded bg-green-600/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">pass · {result.ms}ms</span>;
  return <span data-result="fail" title={result.error} className="rounded bg-red-600/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">fail</span>;
}

const key = (b: Block, e: Example) => `${b.id}/${e.name}`;

interface Run {
  controls: Controls;
  results: Record<string, Result>;
  setResult: (k: string, r: Result) => void;
}

/** One block: every example of it, each with its own result. */
function BlockPage({ block, controls, results, setResult }: Run & { block: Block }) {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold">{block.name}</h1>
        <p className={`mt-1 max-w-3xl text-sm ${muted}`}>{block.description}</p>
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-xs">
          <div><dt className="inline font-semibold">Data states: </dt><dd className="inline">{block.dataStates.join(", ") || "none"}</dd></div>
          <div><dt className="inline font-semibold">Permissions: </dt><dd className="inline">{block.permissions.join(", ") || "none"}</dd></div>
        </dl>
      </header>
      {block.examples.map((ex) => (
        <section key={ex.name} id={`${block.id}-${ex.name}`} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="font-mono text-sm font-semibold">{ex.name}</h2>
            <Badge result={results[key(block, ex)]} />
          </div>
          <Frame example={ex} controls={controls} onResult={(r) => setResult(key(block, ex), r)} />
        </section>
      ))}
    </div>
  );
}

/** The whole suite: mounts each example in turn and tallies pass and fail. */
function Suite({ controls, results, setResult }: Run) {
  const all = blocks.flatMap((b) => b.examples.map((e) => [b, e] as const));
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const done = running && index >= all.length;
  useEffect(() => {
    if (!running || index >= all.length) return;
    const t = window.setTimeout(() => setIndex((i) => i + 1), 900);
    return () => window.clearTimeout(t);
  }, [running, index, all.length]);
  const passed = all.filter(([b, e]) => results[key(b, e)]?.status === "pass").length;
  const failed = all.filter(([b, e]) => results[key(b, e)]?.status === "fail");
  const now = running && index < all.length ? all[index] : undefined;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Run all blocks</h1>
      <p className={`text-sm ${muted}`}>Mounts all {all.length} examples of {blocks.length} blocks one after another, with the theme, direction and width chosen above.</p>
      <div className="flex items-center gap-3">
        <button type="button" data-testid="run-all" className="rounded bg-[var(--rd-color-action-primary-default,#111)] px-3 py-1.5 text-sm text-white" onClick={() => { setIndex(0); setRunning(true); }}>
          {running && !done ? "Running…" : "Run all"}
        </button>
        <span data-testid="summary" className="text-sm">{done ? `Done: ${passed} passed, ${failed.length} failed of ${all.length}` : `${passed} passed, ${failed.length} failed so far`}</span>
      </div>
      {failed.length > 0 && (
        <ul data-testid="failures" className="list-disc ps-5 text-sm text-red-600">
          {failed.map(([b, e]) => <li key={key(b, e)}>{key(b, e)}: {(results[key(b, e)] as { error: string }).error}</li>)}
        </ul>
      )}
      {now && <Frame key={key(now[0], now[1])} example={now[1]} controls={controls} onResult={(r) => setResult(key(now[0], now[1]), r)} />}
      <table className="w-full text-sm">
        <tbody>
          {blocks.map((b) => (
            <tr key={b.id} className={`border-t align-top ${border}`}>
              <th scope="row" className="py-2 pe-4 text-start font-medium">{b.name}</th>
              <td className="py-2">
                <div className="flex flex-wrap gap-3">
                  {b.examples.map((e) => <span key={e.name} className="flex items-center gap-1 text-xs"><span className="font-mono">{e.name}</span><Badge result={results[key(b, e)]} /></span>)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useHash() {
  const [hash, setHash] = useState(() => location.hash.slice(1) || "suite");
  useEffect(() => {
    const on = () => setHash(location.hash.slice(1) || "suite");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

function Select({ label, value, onChange, options }: { label: string; value: string | number; onChange: (v: string) => void; options: Array<{ label: string; value: string | number }> }) {
  return (
    <label className="flex items-center gap-2">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`rounded border ${border} bg-transparent px-2 py-1`}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function App() {
  const hash = useHash();
  const [controls, setControls] = useState<Controls>({ theme: "light", dir: "ltr", width: 0 });
  const [results, setResults] = useState<Record<string, Result>>({});
  const setResult = (k: string, r: Result) => setResults((prev) => (prev[k]?.status === r.status && r.status !== "fail" ? prev : { ...prev, [k]: r }));
  useEffect(() => {
    document.documentElement.dataset.theme = controls.theme;
    document.documentElement.style.colorScheme = controls.theme;
  }, [controls.theme]);
  const block = blocks.find((b) => b.id === hash);
  return (
    <div className="flex min-h-screen">
      <nav aria-label="Blocks" className={`sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-1 overflow-y-auto border-e p-3 text-sm ${border}`}>
        <a href="#suite" aria-current={!block ? "page" : undefined} className={`rounded px-2 py-1 font-semibold ${current}`}>Run all</a>
        <p className={`mt-2 px-2 text-xs uppercase tracking-wide ${muted}`}>Blocks ({blocks.length})</p>
        {blocks.map((b) => {
          const fails = b.examples.filter((e) => results[key(b, e)]?.status === "fail").length;
          return (
            <a key={b.id} href={`#${b.id}`} aria-current={block?.id === b.id ? "page" : undefined} className={`flex justify-between rounded px-2 py-1 ${current}`}>
              {b.name}
              <span className={fails ? "text-red-600" : muted}>{fails ? `${fails} failed` : b.examples.length}</span>
            </a>
          );
        })}
      </nav>
      <main className="min-w-0 flex-1 p-6">
        <div role="toolbar" aria-label="Test controls" className="mb-6 flex flex-wrap items-center gap-4 text-sm">
          <Select label="Theme" value={controls.theme} onChange={(v) => setControls({ ...controls, theme: v as Theme })} options={[{ label: "Light", value: "light" }, { label: "Dark", value: "dark" }]} />
          <Select label="Direction" value={controls.dir} onChange={(v) => setControls({ ...controls, dir: v as Dir })} options={[{ label: "LTR", value: "ltr" }, { label: "RTL", value: "rtl" }]} />
          <Select label="Width" value={controls.width} onChange={(v) => setControls({ ...controls, width: Number(v) })} options={WIDTHS} />
        </div>
        {block ? <BlockPage key={block.id} block={block} controls={controls} results={results} setResult={setResult} /> : <Suite controls={controls} results={results} setResult={setResult} />}
      </main>
      <ToastRegion />
    </div>
  );
}

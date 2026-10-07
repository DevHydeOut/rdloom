import { createContext, lazy, type ComponentType } from "react";
import tokens from "@rdloom/tokens/tokens.json";

// Everything on the site comes from the same sources as the code: the specs,
// the tested examples, the registry the CLI installs from, and the tokens.

export interface PropSpec {
  type: string;
  description: string;
  values?: string[];
  default?: unknown;
  required?: boolean;
  tsType?: string;
}

export interface Spec {
  name: string;
  version: string;
  category: string;
  status?: string;
  description: string;
  props: Record<string, PropSpec>;
  variants?: string[];
  states?: string[];
  tokens?: string[];
  a11y: { role: string; keyboard: string[]; requirements?: string[]; screenReader?: string[]; wcag: string };
  usage: { use_when: string[]; avoid_when: string[]; anti_patterns?: string[] };
  contract?: { data: string; dataStates: string[]; permissions: string[]; events: string[]; customization: string[] };
  examples?: string[];
}

export interface Example {
  name: string;
  Component: ComponentType;
  code: string;
}

export interface RegistryFile {
  path: string;
  content: string;
}

export interface DocComponent {
  id: string;
  spec: Spec;
  examples: Example[];
  /** npm packages the component needs, e.g. "react-aria-components@^1.21.1". */
  dependencies: string[];
  /** Other rdloom parts it builds on, e.g. "button", "utils", "tokens". */
  registryDependencies: string[];
  /** The source files the CLI copies. Loaded on demand: they are the bulk of the registry. */
  loadFiles: () => Promise<RegistryFile[]>;
}

const specs = import.meta.glob<Spec>("../../../specs/*.spec.json", { eager: true, import: "default" });
// Only the dependency lists up front: the registry items also hold every file's source.
const registry = import.meta.glob<string[]>(["../../../packages/cli/registry/*.json", "!**/index.json"], { eager: true, import: "dependencies" });
const registryParts = import.meta.glob<string[]>(["../../../packages/cli/registry/*.json", "!**/index.json"], { eager: true, import: "registryDependencies" });
const registrySources = import.meta.glob<RegistryFile[]>(["../../../packages/cli/registry/*.json", "!**/index.json"], { import: "files" });
// Example components load with their page; their source text is small enough to bundle.
const modules = import.meta.glob<ComponentType>("../../../examples/components/*/*.tsx", { import: "default" });
const sources = import.meta.glob<string>("../../../examples/components/*/*.tsx", { eager: true, query: "?raw", import: "default" });

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

export const components: DocComponent[] = Object.values(specs)
  .map((spec) => {
    const id = kebab(spec.name);
    const file = (name: string) => `../../../examples/components/${id}/${name}.tsx`;
    return {
      id,
      spec,
      examples: (spec.examples ?? []).map((name) => ({ name, Component: lazy(() => modules[file(name)]().then((c) => ({ default: c }))), code: sources[file(name)] })),
      dependencies: registry[`../../../packages/cli/registry/${id}.json`] ?? [],
      registryDependencies: registryParts[`../../../packages/cli/registry/${id}.json`] ?? [],
      loadFiles: () => registrySources[`../../../packages/cli/registry/${id}.json`]?.() ?? Promise.resolve([]),
    };
  })
  .sort((a, b) => a.spec.name.localeCompare(b.spec.name));

/**
 * Prerendering provides the example components directly (entry-server.tsx),
 * so their HTML is in the page instead of a loading placeholder. In the
 * browser this is null and examples load lazily, per page.
 */
export const EagerExamples = createContext<Record<string, ComponentType> | null>(null);

/**
 * Components grouped by what you reach for them to do, so "buttons" or "search" is one heading in
 * the sidebar, not a hunt through an alphabet. A component missing here still shows up, under
 * "More", and a test fails so it gets a home.
 */
export const componentGroupDefs: Array<{ id: string; label: string; ids: string[] }> = [
  { id: "buttons", label: "Buttons", ids: ["button", "shimmer-button", "ripple-button", "pulse-button", "gradient-button", "reveal-button"] },
  { id: "search", label: "Search and commands", ids: ["command-palette", "combobox"] },
  { id: "text-inputs", label: "Text and number inputs", ids: ["text-field", "input-otp", "number-field", "tag-input", "file-upload"] },
  { id: "choice", label: "Choices and toggles", ids: ["select", "checkbox", "radio-group", "switch", "slider", "segmented-control", "toggle-button"] },
  { id: "forms", label: "Forms", ids: ["form", "error-summary", "field-array"] },
  { id: "date-time", label: "Dates and times", ids: ["calendar", "date-picker", "date-range-picker", "time-field"] },
  { id: "data", label: "Tables and data", ids: ["data-grid", "table", "tree", "pagination"] },
  { id: "charts", label: "Charts and stats", ids: ["chart", "sparkline", "stat"] },
  { id: "navigation", label: "Navigation", ids: ["tabs", "breadcrumbs", "steps", "menu"] },
  { id: "overlays", label: "Dialogs and popovers", ids: ["dialog", "alert-dialog", "sheet", "popover", "tooltip"] },
  { id: "feedback", label: "Feedback and status", ids: ["alert", "toast", "progress", "skeleton", "empty-state", "badge"] },
  { id: "display", label: "Content and layout", ids: ["card", "accordion", "avatar", "kbd", "collapsible", "separator", "avatar-group"] },
  { id: "ai", label: "AI chat and agents", ids: ["chat", "message", "prompt-input", "response", "tool-call", "agent-activity", "approval-box", "citation", "sources", "generated-table", "generated-chart"] },
  { id: "motion", label: "Motion and effects", ids: ["text-shimmer", "gradient-text", "blur-fade", "shine-border", "shuttle-border", "ripple"] },
  { id: "blocks", label: "Blocks", ids: ["dashboard-shell", "dashboard-page", "sidebar", "customer-table"] },
];

export interface ComponentGroup {
  id: string;
  label: string;
  items: DocComponent[];
}

export const componentGroups: ComponentGroup[] = (() => {
  const byId = new Map(components.map((c) => [c.id, c]));
  const placed = new Set<string>();
  const groups: ComponentGroup[] = componentGroupDefs.map((g) => ({
    id: g.id,
    label: g.label,
    items: g.ids.flatMap((id) => {
      const c = byId.get(id);
      if (!c) return [];
      placed.add(id);
      return [c];
    }),
  }));
  const rest = components.filter((c) => !placed.has(c.id));
  if (rest.length) groups.push({ id: "more", label: "More", items: rest });
  return groups.filter((g) => g.items.length > 0);
})();

/** The group a component sits in, for opening the right one in the sidebar. */
export const groupIdOf = (componentId: string) => componentGroups.find((g) => g.items.some((c) => c.id === componentId))?.id;

export const categories = [...new Set(components.map((c) => c.spec.category))].sort();

export interface TokenRow {
  path: string;
  cssVar: string;
  type: string;
  light: string;
  dark: string;
}

const light = tokens.modes.light as Record<string, { type: string; value: string }>;
const dark = tokens.modes.dark as Record<string, { type: string; value: string }>;

export const semanticTokens: TokenRow[] = Object.entries(light).map(([path, t]) => ({
  path,
  cssVar: `--rd-${path.replace(/\./g, "-")}`,
  type: t.type,
  light: t.value,
  dark: dark[path]?.value ?? t.value,
}));

export const repoUrl = "https://github.com/DevHydeOut/rdloom";

/** The motion components' shared stylesheet, as the registry ships it. Loaded on demand. */
export const loadMotionCss = () => registrySources["../../../packages/cli/registry/motion-css.json"]?.() ?? Promise.resolve([] as RegistryFile[]);

/** The folder the CLI copies into by default. */
export const defaultComponentsDir = "src/components/rdloom";
/** Where the CLI writes the motion CSS: beside the tokens file. */
export const defaultMotionCssPath = "src/styles/rdloom-motion.css";

/** Blocks are whole screens, so they have their own pages (/blocks) instead of sitting among the components. */
export const isBlock = (c: DocComponent) => c.spec.category === "block";
export const blocks = components.filter(isBlock);
export const parts = components.filter((c) => !isBlock(c));
/** Where a component's page lives. */
export const hrefOf = (c: Pick<DocComponent, "id" | "spec">) => `${c.spec.category === "block" ? "/blocks" : "/components"}/${c.id}`;

/** The component before and after this one in the sidebar's order (blocks are not in the sequence). */
export function neighbours(id: string) {
  const i = parts.findIndex((c) => c.id === id);
  return { previous: i > 0 ? parts[i - 1] : undefined, next: i >= 0 && i < parts.length - 1 ? parts[i + 1] : undefined };
}

/** "DataGrid" -> "Data Grid": the name people read, while code keeps the real one. */
export const displayName = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

export const categoryLabel = (category: string) => (category === "ai" ? "AI" : category === "block" ? "Block" : category[0].toUpperCase() + category.slice(1));

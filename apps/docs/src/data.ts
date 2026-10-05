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

/** The component before and after this one in the sidebar's order. */
export function neighbours(id: string) {
  const i = components.findIndex((c) => c.id === id);
  return { previous: i > 0 ? components[i - 1] : undefined, next: i >= 0 && i < components.length - 1 ? components[i + 1] : undefined };
}

/** "DataGrid" -> "Data Grid": the name people read, while code keeps the real one. */
export const displayName = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

export const categoryLabel = (category: string) => (category === "ai" ? "AI" : category[0].toUpperCase() + category.slice(1));

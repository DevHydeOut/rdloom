import { lazy, type ComponentType } from "react";

// The blocks are read from the specs (category "block") and their examples from examples/components,
// so a new block or example shows up here with no change to the lab.

interface BlockSpec {
  name: string;
  category: string;
  description: string;
  examples?: string[];
  contract?: { dataStates: string[]; permissions: string[] };
}

export interface Example {
  name: string;
  Component: ComponentType;
}

export interface Block {
  id: string;
  name: string;
  description: string;
  dataStates: string[];
  permissions: string[];
  examples: Example[];
}

const specs = import.meta.glob<BlockSpec>("../../../specs/*.spec.json", { eager: true, import: "default" });
const modules = import.meta.glob<ComponentType>("../../../examples/components/*/*.tsx", { import: "default" });

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

export const blocks: Block[] = Object.values(specs)
  .filter((s) => s.category === "block")
  .map((s) => {
    const id = kebab(s.name);
    return {
      id,
      name: s.name,
      description: s.description,
      dataStates: s.contract?.dataStates ?? [],
      permissions: s.contract?.permissions ?? [],
      examples: (s.examples ?? []).map((name) => {
        const load = modules[`../../../examples/components/${id}/${name}.tsx`];
        return { name, Component: lazy(() => load().then((c) => ({ default: c }))) };
      }),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

import fs from "node:fs";
import path from "node:path";
import { specsDir } from "./paths.ts";

export interface PropSpec {
  type: "string" | "number" | "boolean" | "enum" | "node" | "callback" | "custom";
  description: string;
  values?: string[];
  default?: unknown;
  required?: boolean;
  tsType?: string;
}

export interface ComponentSpec {
  name: string;
  version: string;
  category: string;
  status?: string;
  description: string;
  props: Record<string, PropSpec>;
  variants?: string[];
  states?: string[];
  slots?: string[];
  tokens?: string[];
  a11y: { role: string; keyboard: string[]; requirements?: string[]; screenReader?: string[]; wcag: string };
  usage: { use_when: string[]; avoid_when: string[]; anti_patterns?: string[] };
  examples?: string[];
  figma?: { componentKey?: string | null; variantMap?: Record<string, string> };
}

export interface LoadedSpec {
  file: string;
  raw: unknown;
  spec: ComponentSpec;
}

export function loadSpecs(): LoadedSpec[] {
  return fs
    .readdirSync(specsDir)
    .filter((f) => f.endsWith(".spec.json"))
    .sort()
    .map((f) => {
      const file = path.join(specsDir, f);
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      return { file, raw, spec: raw as ComponentSpec };
    });
}

/** "DateRangePicker" -> "date-range-picker" */
export const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

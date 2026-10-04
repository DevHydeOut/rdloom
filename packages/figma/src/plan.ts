// Pure helpers for the plugin: no Figma API here, so they're unit-tested.

export interface VariableData {
  name: string; // "color/action/primary"
  token: string; // "color.action.primary"
  cssVar: string;
  type: "COLOR" | "FLOAT";
  light: string;
  dark: string;
}

export interface PropertyData {
  prop: string;
  name: string;
  values: string[];
  default: string;
}

export interface ComponentData {
  name: string;
  id: string;
  version: string;
  description: string;
  properties: PropertyData[];
}

export interface FigmaData {
  collection: string;
  variables: VariableData[];
  components: ComponentData[];
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** "#4f46e5", "#fff", "#4f46e580" or "rgb(0 0 0 / 0.5)" / "rgba(0,0,0,.5)" to Figma's 0..1 channels. */
export function parseColor(value: string): RGBA {
  const v = value.trim();
  const hex = v.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) throw new Error(`Bad color ${value}`);
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255;
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
  }
  const fn = v.match(/^rgba?\((.+)\)$/i);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
    const channel = (s: string) => (s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s) / 255);
    const alpha = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    const [r, g, b] = parts.slice(0, 3).map(channel);
    if ([r, g, b, alpha].some(Number.isNaN)) throw new Error(`Bad color ${value}`);
    return { r, g, b, a: alpha };
  }
  throw new Error(`Unsupported color ${value}`);
}

/** "8px" -> 8 */
export function parseDimension(value: string): number {
  const n = parseFloat(value);
  if (Number.isNaN(n)) throw new Error(`Bad dimension ${value}`);
  return value.trim().endsWith("rem") ? n * 16 : n;
}

export type Combo = Record<string, string>; // prop -> value

export const MAX_VARIANTS = 64;

/** Every combination of variant values, defaults first. Capped so a big spec can't flood the file. */
export function variantCombos(props: PropertyData[], max = MAX_VARIANTS): Combo[] {
  let combos: Combo[] = [{}];
  for (const p of props) {
    const ordered = [p.default, ...p.values.filter((v) => v !== p.default)];
    combos = combos.flatMap((c) => ordered.map((v) => ({ ...c, [p.prop]: v })));
  }
  return combos.slice(0, max);
}

/** Figma's variant name format: "Size=md, Disabled=false". */
export function variantName(props: PropertyData[], combo: Combo): string {
  return props.map((p) => `${p.name}=${combo[p.prop]}`).join(", ");
}

/** Parses a Figma variant name back to a combo, or null if it's not one of ours. */
export function parseVariantName(props: PropertyData[], name: string): Combo | null {
  const pairs = new Map(name.split(",").map((s) => s.split("=").map((x) => x.trim()) as [string, string]));
  const combo: Combo = {};
  for (const p of props) {
    const v = pairs.get(p.name);
    if (v === undefined) return null;
    combo[p.prop] = v;
  }
  return combo;
}

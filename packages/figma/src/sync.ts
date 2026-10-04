import { blueprintFor, FONT_WEIGHTS, type BpBox, type BpFrame, type BpNode, type BpText } from "./blueprint.ts";
import { parseColor, parseDimension, parseVariantName, variantCombos, variantName, type FigmaData } from "./plan.ts";

// Everything that touches the Figma API. Both steps are safe to re-run: they
// update what the plugin made before (found by name or plugin data) and
// never delete or restyle anything, so designers' edits survive a sync.

export const PAGE_NAME = "rdloom components";
const SPEC_KEY = "spec";

export interface VariableReport {
  created: string[];
  updated: string[];
  /** Variables in the collection that the tokens no longer have. Left alone; delete them by hand if unused. */
  stale: string[];
}

export async function syncVariables(api: PluginAPI, data: FigmaData): Promise<VariableReport> {
  const collections = await api.variables.getLocalVariableCollectionsAsync();
  const collection = collections.find((c) => c.name === data.collection) ?? api.variables.createVariableCollection(data.collection);

  const lightMode = collection.modes[0].modeId;
  if (collection.modes[0].name !== "Light") collection.renameMode(lightMode, "Light");
  const darkMode = collection.modes.find((m) => m.name === "Dark")?.modeId ?? collection.addMode("Dark");

  const existing = new Map(
    (await api.variables.getLocalVariablesAsync())
      .filter((v) => v.variableCollectionId === collection.id)
      .map((v) => [v.name, v]),
  );

  const report: VariableReport = { created: [], updated: [], stale: [] };
  for (const d of data.variables) {
    let variable = existing.get(d.name);
    if (variable && variable.resolvedType !== d.type) {
      throw new Error(`Variable ${d.name} is a ${variable.resolvedType}, but the token is a ${d.type}. Rename or delete it, then sync again.`);
    }
    if (variable) report.updated.push(d.name);
    else {
      variable = api.variables.createVariable(d.name, collection, d.type);
      report.created.push(d.name);
    }
    const value = (raw: string) => (d.type === "COLOR" ? parseColor(raw) : parseDimension(raw));
    variable.setValueForMode(lightMode, value(d.light));
    variable.setValueForMode(darkMode, value(d.dark));
    variable.description = `${d.token} (${d.cssVar})`;
    variable.setVariableCodeSyntax("WEB", `var(${d.cssVar})`);
    if (d.type === "FLOAT") variable.scopes = d.token.startsWith("radius") ? ["CORNER_RADIUS"] : ["GAP", "WIDTH_HEIGHT"];
  }

  const names = new Set(data.variables.map((d) => d.name));
  report.stale = [...existing.keys()].filter((n) => !names.has(n));
  return report;
}

export interface ComponentReport {
  created: string[]; // "Button: Variant=primary, Size=md, Disabled=false"
  keys: Record<string, string>; // component name -> component set key, for specs' figma.componentKey
  capped: string[]; // components with more variant combinations than we build
}

async function variablesByToken(api: PluginAPI, data: FigmaData): Promise<Map<string, Variable>> {
  const collection = (await api.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === data.collection);
  if (!collection) throw new Error(`No "${data.collection}" variable collection. Run "Sync variables" first.`);
  const byName = new Map(
    (await api.variables.getLocalVariablesAsync()).filter((v) => v.variableCollectionId === collection.id).map((v) => [v.name, v]),
  );
  return new Map(data.variables.flatMap((d) => (byName.has(d.name) ? [[d.token, byName.get(d.name)!] as const] : [])));
}

export async function buildComponents(api: PluginAPI, data: FigmaData): Promise<ComponentReport> {
  const vars = await variablesByToken(api, data);
  const need = (token: string) => {
    const v = vars.get(token);
    if (!v) throw new Error(`Variable for ${token} is missing. Run "Sync variables" first.`);
    return v;
  };
  const paint = (token: string): SolidPaint =>
    api.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", need(token));

  const page = api.root.children.find((p) => p.name === PAGE_NAME) ?? Object.assign(api.createPage(), { name: PAGE_NAME });
  await page.loadAsync();
  for (const style of FONT_WEIGHTS) await api.loadFontAsync({ family: "Inter", style });

  const corners = ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"] as const;
  const setRadius = (node: FrameNode | ComponentNode | RectangleNode, radius: BpFrame["radius"]) => {
    if (typeof radius === "number") node.cornerRadius = radius;
    else if (radius) for (const c of corners) node.setBoundVariable(c, need(radius));
  };
  const setPaints = (node: FrameNode | ComponentNode | RectangleNode, fill?: string, stroke?: string) => {
    node.fills = fill ? [paint(fill)] : [];
    node.strokes = stroke ? [paint(stroke)] : [];
    if (stroke) node.strokeWeight = 1;
  };
  const AXIS = { start: "MIN", center: "CENTER", end: "MAX", between: "SPACE_BETWEEN" } as const;

  /** Lays out a frame from its blueprint. The node must already be in its parent. */
  const applyFrame = (node: FrameNode | ComponentNode, bp: BpFrame, isRoot: boolean) => {
    if (bp.name && !isRoot) node.name = bp.name;
    node.layoutMode = bp.dir === "col" ? "VERTICAL" : "HORIZONTAL";
    node.itemSpacing = bp.gap ?? 0;
    const [py, px] = Array.isArray(bp.pad) ? bp.pad : [bp.pad ?? 0, bp.pad ?? 0];
    node.paddingTop = node.paddingBottom = py;
    node.paddingLeft = node.paddingRight = px;
    node.primaryAxisAlignItems = AXIS[bp.align ?? "start"];
    node.counterAxisAlignItems = AXIS[bp.cross ?? "start"] as "MIN" | "CENTER" | "MAX";
    // resize() first: it resets sizing modes, which are set right after.
    if (typeof bp.w === "number" || typeof bp.h === "number") node.resize(typeof bp.w === "number" ? bp.w : 100, typeof bp.h === "number" ? bp.h : 100);
    node.layoutSizingHorizontal = typeof bp.w === "number" ? "FIXED" : bp.w === "fill" && !isRoot ? "FILL" : "HUG";
    node.layoutSizingVertical = typeof bp.h === "number" ? "FIXED" : "HUG";
    setPaints(node, bp.fill, bp.stroke);
    setRadius(node, bp.radius);
    if (bp.opacity !== undefined) node.opacity = bp.opacity;
    for (const child of bp.children) render(node, child);
  };

  const render = (parent: FrameNode | ComponentNode, bp: BpNode) => {
    if (bp.kind === "frame") {
      const f = api.createFrame();
      parent.appendChild(f);
      applyFrame(f, bp, false);
    } else if (bp.kind === "text") {
      renderText(parent, bp);
    } else {
      renderBox(parent, bp);
    }
  };

  const renderText = (parent: FrameNode | ComponentNode, bp: BpText) => {
    const t = api.createText();
    parent.appendChild(t);
    t.fontName = { family: "Inter", style: bp.weight ?? "Regular" };
    t.characters = bp.text;
    t.fontSize = bp.size;
    t.fills = [paint(bp.color)];
    if (bp.w === "fill") {
      t.layoutSizingHorizontal = "FILL";
      t.textAutoResize = "HEIGHT";
    }
  };

  const renderBox = (parent: FrameNode | ComponentNode, bp: BpBox) => {
    const r = api.createRectangle();
    parent.appendChild(r);
    if (bp.name) r.name = bp.name;
    r.resize(typeof bp.w === "number" ? bp.w : 10, bp.h);
    if (bp.w === "fill") r.layoutSizingHorizontal = "FILL";
    setPaints(r, bp.fill, bp.stroke);
    setRadius(r, bp.radius);
  };

  const report: ComponentReport = { created: [], keys: {}, capped: [] };
  let y = 0;

  for (const component of data.components) {
    const all = variantCombos(component.properties, Infinity);
    const combos = variantCombos(component.properties);
    if (all.length > combos.length) report.capped.push(`${component.name} (${combos.length} of ${all.length})`);

    const set = page.children.find(
      (n): n is ComponentSetNode | ComponentNode =>
        (n.type === "COMPONENT_SET" || n.type === "COMPONENT") && n.getPluginData(SPEC_KEY) === component.id,
    );
    const have = new Set(
      set?.type === "COMPONENT_SET"
        ? set.children.map((c) => JSON.stringify(parseVariantName(component.properties, c.name)))
        : set
          ? [JSON.stringify({})]
          : [],
    );

    const made: ComponentNode[] = [];
    for (const combo of combos) {
      if (have.has(JSON.stringify(combo))) continue;
      const node = api.createComponent();
      // New nodes land on the current page; combineAsVariants needs them on ours.
      page.appendChild(node);
      node.name = component.properties.length ? variantName(component.properties, combo) : component.name;
      applyFrame(node, blueprintFor(component, combo), true);

      made.push(node);
      report.created.push(`${component.name}: ${node.name}`);
    }

    let target: ComponentSetNode | ComponentNode | undefined = set;
    if (made.length) {
      if (set?.type === "COMPONENT_SET") for (const n of made) set.appendChild(n);
      else if (!component.properties.length) {
        target = made[0];
        page.appendChild(target);
      } else {
        target = api.combineAsVariants(made, page);
        target.name = component.name;
      }
      if (target && !set) {
        target.setPluginData(SPEC_KEY, component.id);
        target.x = 0;
        target.y = y;
        if (target.type === "COMPONENT_SET") {
          target.layoutMode = "HORIZONTAL";
          target.layoutWrap = "WRAP";
          target.itemSpacing = 16;
          target.counterAxisSpacing = 16;
          target.paddingLeft = target.paddingRight = target.paddingTop = target.paddingBottom = 24;
          target.resize(1200, target.height);
          target.primaryAxisSizingMode = "FIXED";
          target.counterAxisSizingMode = "AUTO";
        }
      }
    }
    if (target) {
      target.description = `${component.description}\n\nSpec: specs/${component.id}.spec.json (v${component.version})`;
      report.keys[component.name] = target.key;
      y = Math.max(y, target.y + target.height + 80);
    }
  }
  return report;
}

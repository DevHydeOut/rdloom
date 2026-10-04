// Just enough of the Figma plugin API to run sync.ts: variables, pages and
// component nodes as plain objects.

let nextId = 1;

export class FakeNode {
  id = `node:${nextId++}`;
  name = "";
  children: FakeNode[] = [];
  parent: FakeNode | null = null;
  plugin = new Map<string, string>();
  bound: Record<string, unknown> = {};
  fills: unknown[] = [];
  strokes: unknown[] = [];
  width = 100;
  height = 100;
  x = 0;
  y = 0;
  key: string;
  [k: string]: unknown;
  constructor(public type: string) {
    this.key = `key-${this.id}`;
  }
  appendChild(n: FakeNode) {
    if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1);
    n.parent = this;
    this.children.push(n);
  }
  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }
  setBoundVariable(field: string, v: { id: string }) {
    this.bound[field] = v.id;
  }
  setPluginData(k: string, v: string) {
    this.plugin.set(k, v);
  }
  getPluginData(k: string) {
    return this.plugin.get(k) ?? "";
  }
  async loadAsync() {}
}

interface FakeMode {
  modeId: string;
  name: string;
}

export function fakeFigma() {
  const collections: any[] = [];
  const variables: any[] = [];
  const root = new FakeNode("DOCUMENT");
  const first = new FakeNode("PAGE");
  first.name = "Page 1";
  root.appendChild(first);

  const api = {
    root,
    variables: {
      async getLocalVariableCollectionsAsync() {
        return [...collections];
      },
      async getLocalVariablesAsync() {
        return [...variables];
      },
      createVariableCollection(name: string) {
        let m = 1;
        const modes: FakeMode[] = [{ modeId: "m0", name: "Mode 1" }];
        const c = {
          id: `col:${nextId++}`,
          name,
          modes,
          renameMode(id: string, n: string) {
            modes.find((x) => x.modeId === id)!.name = n;
          },
          addMode(n: string) {
            const modeId = `m${m++}`;
            modes.push({ modeId, name: n });
            return modeId;
          },
        };
        collections.push(c);
        return c;
      },
      createVariable(name: string, collection: { id: string }, type: string) {
        const v = {
          id: `var:${nextId++}`,
          name,
          variableCollectionId: collection.id,
          resolvedType: type,
          valuesByMode: {} as Record<string, unknown>,
          description: "",
          scopes: ["ALL_SCOPES"],
          codeSyntax: {} as Record<string, string>,
          setValueForMode(mode: string, value: unknown) {
            v.valuesByMode[mode] = value;
          },
          setVariableCodeSyntax(platform: string, value: string) {
            v.codeSyntax[platform] = value;
          },
        };
        variables.push(v);
        return v;
      },
      setBoundVariableForPaint(paint: object, _field: string, v: { id: string }) {
        return { ...paint, boundVariables: { color: { type: "VARIABLE_ALIAS", id: v.id } } };
      },
    },
    createPage() {
      const p = new FakeNode("PAGE");
      root.appendChild(p);
      return p;
    },
    // Like Figma, new nodes are created on the current page (the first one).
    createComponent() {
      const n = new FakeNode("COMPONENT");
      first.appendChild(n);
      return n;
    },
    createText() {
      const n = new FakeNode("TEXT");
      first.appendChild(n);
      return n;
    },
    createFrame() {
      const n = new FakeNode("FRAME");
      first.appendChild(n);
      return n;
    },
    createRectangle() {
      const n = new FakeNode("RECTANGLE");
      first.appendChild(n);
      return n;
    },
    async loadFontAsync() {},
    combineAsVariants(nodes: FakeNode[], parent: FakeNode) {
      if (nodes.some((n) => n.parent !== parent)) throw new Error("Grouped nodes must be in the same page as the parent");
      const set = new FakeNode("COMPONENT_SET");
      for (const n of nodes) set.appendChild(n);
      parent.appendChild(set);
      return set;
    },
  };
  return { api: api as unknown as PluginAPI, collections, variables, root };
}

import fs from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getComponent,
  getComponentSource,
  getExample,
  getSetup,
  getTokens,
  listComponents,
  ToolError,
  validateProps,
  type Context,
} from "./tools.ts";

export function loadContext(file = new URL("../context.json", import.meta.url)): Context {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// Tool errors (unknown component, bad file) go back to the agent as text it
// can act on, not as protocol errors.
const text = (run: () => string) => {
  try {
    return { content: [{ type: "text" as const, text: run() }] };
  } catch (error) {
    if (!(error instanceof ToolError)) throw error;
    return { content: [{ type: "text" as const, text: error.message }], isError: true };
  }
};

const readOnly = { readOnlyHint: true, openWorldHint: false };

export function createServer(ctx: Context = loadContext()): McpServer {
  const server = new McpServer(
    { name: `${ctx.brand.name}-mcp`, version: "0.0.0" },
    {
      instructions: `${ctx.brand.displayName} is a spec-driven React component library that users copy into their project and own. Before writing UI with it, call get_component for each component you use: follow its usage rules, avoid its anti-patterns, and meet its accessibility requirements. Style with the semantic tokens from get_tokens, not raw colors. Call validate_props to check the props you're about to write.`,
    },
  );

  server.registerTool(
    "list_components",
    {
      title: "List components",
      description: "List the components, optionally ranked by a search like \"pick a date range\" or \"table\".",
      inputSchema: { query: z.string().optional().describe("Words describing what the UI needs to do") },
      annotations: readOnly,
    },
    ({ query }) => text(() => listComponents(ctx, query)),
  );

  server.registerTool(
    "get_component",
    {
      title: "Get component",
      description: "Props, variants, install and import lines, when to use it and when not to, anti-patterns, and accessibility requirements for one component.",
      inputSchema: { name: z.string().describe('Component name or id, e.g. "DateRangePicker" or "date-range-picker"') },
      annotations: readOnly,
    },
    ({ name }) => text(() => getComponent(ctx, name)),
  );

  server.registerTool(
    "get_example",
    {
      title: "Get example",
      description: "Working, accessible example code for a component: one example by name, or all of them. Every example is tested with axe.",
      inputSchema: {
        name: z.string().describe("Component name or id"),
        example: z.string().optional().describe('Example name from get_component, e.g. "with-presets"; omit for all'),
      },
      annotations: readOnly,
    },
    ({ name, example }) => text(() => getExample(ctx, name, example)),
  );

  server.registerTool(
    "get_component_source",
    {
      title: "Get component source",
      description: "The source files `add` copies into the project, as shipped. Use it to explain or adapt a component, or pass \"utils\" or \"tokens\" for the shared files.",
      inputSchema: {
        name: z.string().describe('Component name or id, or "utils" / "tokens"'),
        file: z.string().optional().describe("One file path from the component, e.g. \"button.tsx\"; omit for all"),
      },
      annotations: readOnly,
    },
    ({ name, file }) => text(() => getComponentSource(ctx, name, file)),
  );

  server.registerTool(
    "get_tokens",
    {
      title: "Get design tokens",
      description: "Semantic design tokens with their CSS variables and light and dark values.",
      inputSchema: { prefix: z.string().optional().describe('Filter by path prefix, e.g. "color.action" or "radius"') },
      annotations: readOnly,
    },
    ({ prefix }) => text(() => getTokens(ctx, prefix)),
  );

  server.registerTool(
    "validate_props",
    {
      title: "Validate props",
      description: "Check a component's props against its spec: required props, allowed enum values and types.",
      inputSchema: {
        name: z.string().describe("Component name or id"),
        props: z.record(z.string(), z.unknown()).describe('Props as JSON, e.g. {"variant": "primary", "size": "md"}; use any placeholder for callbacks and nodes'),
      },
      annotations: readOnly,
    },
    ({ name, props }) => text(() => validateProps(ctx, name, props)),
  );

  server.registerTool(
    "get_setup",
    {
      title: "Get setup instructions",
      description: "How to add the library to a project: init, tokens CSS, Tailwind, adding and upgrading components.",
      inputSchema: {},
      annotations: readOnly,
    },
    () => text(() => getSetup(ctx)),
  );

  return server;
}

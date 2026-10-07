import fs from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeAll, describe, expect, it } from "vitest";
import { createServer, loadContext } from "../src/server.ts";
import { findComponent, getComponent, getExample, getComponentSource, getTokens, listComponents, validateProps } from "../src/tools.ts";

const ctx = loadContext();

describe("context bundle", () => {
  it("has every component with its source and install info", () => {
    const specCount = fs.readdirSync(new URL("../../../specs/", import.meta.url)).filter((f) => f.endsWith(".spec.json")).length;
    expect(ctx.components.length).toBe(specCount);
    for (const c of ctx.components) {
      expect(c.files.length).toBeGreaterThan(0);
      expect(c.install.registryDependencies).toContain("tokens");
    }
  });

  it("resolves tokens to values in both modes", () => {
    const primary = ctx.tokens.find((t) => t.path === "color.action.primary")!;
    expect(primary.cssVar).toBe("--rd-color-action-primary");
    expect(primary.light).toMatch(/^#/);
    expect(primary.dark).toMatch(/^#/);
    expect(ctx.tokens.every((t) => !t.light.includes("{"))).toBe(true);
  });
});

describe("tools", () => {
  it("finds components by name or id, in any case", () => {
    expect(findComponent(ctx, "date-range-picker").spec.name).toBe("DateRangePicker");
    expect(findComponent(ctx, "daterangepicker").spec.name).toBe("DateRangePicker");
    expect(() => findComponent(ctx, "hologram")).toThrow(/Available: .*Button/);
  });

  it("ranks components by a search", () => {
    const out = listComponents(ctx, "date range");
    expect(out.split("\n")[4]).toMatch(/^\| DateRangePicker /);
    expect(out).not.toContain("| Button");
    expect(listComponents(ctx, "zzz")).toMatch(/No components match/);
  });

  it("describes a component with import, props, usage and accessibility", () => {
    const out = getComponent(ctx, "Button");
    expect(out).toContain("npx rdloom add button");
    expect(out).toMatch(/import \{ Button[^}]*\} from "<componentsDir>\/button\/button"/);
    expect(out).toContain(String.raw`"primary" \| "secondary"`);
    expect(out).toContain("## Anti-patterns");
    expect(out).toContain("Screen readers announce");
  });

  it("serves example code", () => {
    expect(getComponent(ctx, "DateRangePicker")).toContain("## Examples");
    expect(getExample(ctx, "date-range-picker", "with-presets")).toContain("presets={defaultDateRangePresets}");
    expect(getExample(ctx, "button")).toContain("Button: with-icon");
    expect(() => getExample(ctx, "button", "nope")).toThrow(/Examples: variants/);
  });

  it("returns source, one file or all", () => {
    expect(getComponentSource(ctx, "button", "button.tsx")).toContain("```tsx");
    expect(getComponentSource(ctx, "button")).toContain("generated/button.types.ts");
    expect(getComponentSource(ctx, "utils")).toContain("cx");
    expect(() => getComponentSource(ctx, "button", "nope.ts")).toThrow(/Files:/);
  });

  it("filters tokens by prefix or CSS variable", () => {
    expect(getTokens(ctx, "radius")).not.toContain("color.action");
    expect(getTokens(ctx, "--rd-color-action")).toContain("color.action.primary");
    expect(() => getTokens(ctx, "shadow")).toThrow();
  });

  it("validates props against the spec", () => {
    expect(validateProps(ctx, "Button", { variant: "primary", children: "Save", onPress: "fn" })).toMatch(/^✓ These props are valid/);
    const bad = validateProps(ctx, "Button", { variant: "outline", isDisabled: "yes" });
    expect(bad).toContain('"outline" isn\'t allowed');
    expect(bad).toContain("`isDisabled` must be a boolean");
    expect(bad).toContain("Missing required prop `children`");
    expect(validateProps(ctx, "Button", { "aria-label": "Close" })).not.toContain("children");
    expect(validateProps(ctx, "Button", { children: "x", disabled: true })).toContain("`disabled` isn't in the spec");
    expect(validateProps(ctx, "TextField", { label: "Name", isInvalid: false })).toContain("hides built-in errors");
  });
});

describe("server over MCP", () => {
  const client = new Client({ name: "test", version: "0" });

  beforeAll(async () => {
    const [a, b] = InMemoryTransport.createLinkedPair();
    await createServer(ctx).connect(a);
    await client.connect(b);
  });

  it("lists the tools, all read-only", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      ["get_component", "get_component_source", "get_example", "get_setup", "get_tokens", "list_components", "validate_props"],
    );
    expect(tools.every((t) => t.annotations?.readOnlyHint)).toBe(true);
    expect(client.getInstructions()).toContain("get_component");
  });

  it("answers a call", async () => {
    const res = await client.callTool({ name: "get_component", arguments: { name: "Combobox" } });
    expect((res.content as Array<{ text: string }>)[0].text).toContain("# Combobox");
  });

  it("reports unknown components as a tool error, not a protocol error", async () => {
    const res = await client.callTool({ name: "get_component", arguments: { name: "Hologram" } });
    expect(res.isError).toBe(true);
    expect((res.content as Array<{ text: string }>)[0].text).toContain("Available:");
  });
});

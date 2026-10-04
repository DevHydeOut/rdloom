import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import { ToastRegion } from "../src";
import { axeViolations } from "./axe";

// Every spec example (examples/components/<id>/<name>.tsx) is shown on the
// docs site and served to AI agents by the MCP server, so each must render
// without errors and without axe violations.
const modules = import.meta.glob<{ default: ComponentType }>("../../../examples/components/*/*.tsx", { eager: true });

const examples = Object.entries(modules).map(([file, mod]) => {
  const [, id, name] = file.match(/components\/([^/]+)\/([^/]+)\.tsx$/)!;
  return { id, name, Example: mod.default };
});

describe("spec examples", () => {
  it("finds them all", () => {
    expect(examples.length).toBeGreaterThanOrEqual(65);
  });

  it.each(examples.map((e) => [`${e.id}/${e.name}`, e] as const))("%s renders with no axe violations", async (_, { Example }) => {
    const { container } = render(
      <>
        <Example />
        <ToastRegion />
      </>,
    );
    expect(container.firstChild).not.toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  }, 20_000); // axe over a whole grid can take seconds on a busy CI machine
});

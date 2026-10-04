import axe from "axe-core";

/**
 * Runs axe-core and returns violations as readable strings, so a failing
 * test shows which rule broke and on which element.
 *
 * color-contrast is off because jsdom has no layout or computed colors;
 * contrast gets checked in the browser instead. "region" is off because
 * isolated components aren't inside page landmarks.
 */
export async function axeViolations(root: Element = document.body): Promise<string[]> {
  const result = await axe.run(root, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return result.violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${v.help} -> ${n.target.join(" ")}`),
  );
}

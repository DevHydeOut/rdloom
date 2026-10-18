import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// One test per block and setting. The block list comes from the specs, like the lab itself, so a new block is covered at once.
const specsDir = path.resolve(__dirname, "../../specs");
const slug = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const blocks = fs
  .readdirSync(specsDir)
  .filter((f) => f.endsWith(".spec.json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(specsDir, f), "utf8")))
  .filter((s) => s.category === "block")
  .map((s) => ({ id: slug(s.name), examples: (s.examples ?? []) as string[] }));

const settings = [
  { name: "light ltr", theme: "light", dir: "ltr", width: "0" },
  { name: "dark rtl", theme: "dark", dir: "rtl", width: "0" },
  { name: "phone", theme: "light", dir: "ltr", width: "375" },
];

for (const block of blocks) {
  for (const s of settings) {
    test(`${block.id} · ${s.name}`, async ({ page }) => {
      const problems: string[] = [];
      page.on("pageerror", (e) => problems.push(`uncaught: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error") problems.push(`console: ${m.text()}`);
      });
      await page.goto(`/#${block.id}`);
      const toolbar = page.getByRole("toolbar", { name: "Test controls" });
      await toolbar.getByLabel("Theme").selectOption(s.theme);
      await toolbar.getByLabel("Direction").selectOption(s.dir);
      await toolbar.getByLabel("Width").selectOption(s.width);
      // Every example reports pass or fail once it has had time to draw.
      const badges = page.locator("[data-result]");
      await expect(badges).toHaveCount(block.examples.length, { timeout: 20_000 });
      const results = await badges.evaluateAll((els) => els.map((e) => [e.closest("section")?.querySelector("h2")?.textContent, e.getAttribute("data-result"), e.getAttribute("title")]));
      const failed = results.filter(([, r]) => r !== "pass");
      expect(failed, `failed examples: ${JSON.stringify(failed)}`).toEqual([]);
      expect(problems).toEqual([]);
    });
  }
}

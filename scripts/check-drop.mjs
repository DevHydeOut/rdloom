// Drops real files onto the FileUpload example, using Chrome's own drag-and-drop protocol
// (the same events an OS file drag produces), to check what jsdom can't.
//   node scripts/check-drop.mjs        (needs the docs dev server on :5190)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "drop-"));
const make = (name, size) => {
  const file = path.join(dir, name);
  fs.writeFileSync(file, Buffer.alloc(size, 120));
  return file;
};
const files = [make("a.png", 1000), make("notes.txt", 50), make("huge.png", 3 * 1024 * 1024)];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1100, height: 900 } });
const page = await context.newPage();
await page.goto("http://localhost:5190/components/file-upload");
await page.waitForSelector("h1");
const height = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < height; y += 500) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(120);
}
const group = page.getByRole("group", { name: "Photos" });
await group.waitFor();
const zone = group.locator("[data-rac]").first();
await zone.scrollIntoViewIfNeeded();
const box = await zone.boundingBox();
const x = box.x + box.width / 2;
const y = box.y + box.height / 2;

const cdp = await context.newCDPSession(page);
const data = { items: [], files, dragOperationsMask: 1 };
await cdp.send("Input.dispatchDragEvent", { type: "dragEnter", x, y, data });
await cdp.send("Input.dispatchDragEvent", { type: "dragOver", x, y, data });
await page.waitForTimeout(150);
const dragOverState = await zone.evaluate((el) => el.hasAttribute("data-drop-target"));
const overText = await zone.textContent();
await cdp.send("Input.dispatchDragEvent", { type: "drop", x, y, data });
await page.waitForTimeout(600);

const result = await group.evaluate((el) => ({
  files: [...el.querySelectorAll("ul[aria-label] li")].map((li) => li.textContent),
  errors: [...el.querySelectorAll("ul:not([aria-label]) li")].map((li) => li.textContent),
  live: el.querySelector("[aria-live]").textContent,
}));
console.log(JSON.stringify({ dragOverState, overText: overText.trim(), ...result }, null, 2));
await browser.close();
fs.rmSync(dir, { recursive: true, force: true });

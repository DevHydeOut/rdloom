import data from "./generated/figma-data.json";
import type { FigmaData } from "./plan.ts";
import { buildComponents, syncVariables } from "./sync.ts";

// Plugin entry. The UI (ui.html) sends a command; we run it and post back a report.

const spec = data as FigmaData;
figma.showUI(__html__, { width: 360, height: 440, themeColors: true });

figma.ui.onmessage = async (msg: { type: "variables" | "components" | "all" }) => {
  try {
    const lines: string[] = [];
    let keys: Record<string, string> | undefined;
    if (msg.type === "variables" || msg.type === "all") {
      const r = await syncVariables(figma, spec);
      lines.push(`Variables: ${r.created.length} created, ${r.updated.length} updated.`);
      if (r.stale.length) lines.push(`Not in the tokens any more (left alone): ${r.stale.join(", ")}`);
    }
    if (msg.type === "components" || msg.type === "all") {
      const r = await buildComponents(figma, spec);
      lines.push(`Components: ${r.created.length} variants created. Existing variants were left as they are.`);
      if (r.capped.length) lines.push(`Only the first combinations were built for: ${r.capped.join(", ")}`);
      keys = r.keys;
    }
    figma.ui.postMessage({ type: "done", text: lines.join("\n"), keys });
    figma.notify("rdloom sync done");
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    figma.ui.postMessage({ type: "error", text });
    figma.notify(text, { error: true });
  }
};

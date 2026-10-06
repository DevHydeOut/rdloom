import { StrictMode, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./app";
import { EagerExamples } from "./data";
import { allPaths, previewPaths, routeFor, siteUrl } from "./routes";

export { allPaths, previewPaths, siteUrl };

// Server-only: every example imported up front, keyed "<component>/<example>".
const modules = import.meta.glob<ComponentType>("../../../examples/components/*/*.tsx", { eager: true, import: "default" });
const eager = Object.fromEntries(
  Object.entries(modules).map(([file, C]) => [file.match(/components\/(.+)\.tsx$/)![1], C]),
);

/**
 * Full HTML for one page. Examples are provided eagerly above, so nothing
 * suspends and everything is written inline. (react-dom/static would split
 * large sections into hidden blocks swapped in by script, which crawlers
 * without JavaScript don't see.)
 */
export function render(path: string) {
  const html = renderToString(
    <StrictMode>
      <EagerExamples.Provider value={eager}>
        <App path={path} />
      </EagerExamples.Provider>
    </StrictMode>,
  );
  const route = routeFor(path);
  return { html, title: route.title, description: route.description };
}

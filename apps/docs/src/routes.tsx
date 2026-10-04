import type { ReactNode } from "react";
import { components } from "./data";
import { ComponentPage } from "./pages/component-page";
import { CliGuide, FigmaGuide, GettingStarted, McpGuide, TokensGuide } from "./pages/guides";
import { Home } from "./pages/home";
import { Link } from "./router";
import { PageTitle } from "./ui";

// Every page with its title and search-result description. The browser app
// and the prerender step (prerender.mjs) both read this list.

export const siteUrl = "https://rdloom.com";

export const guides = [
  { href: "/docs/getting-started", title: "Getting started", description: "Add rdloom to a React 19 and Tailwind CSS v4 app: init, tokens, and your first components.", Page: GettingStarted },
  { href: "/docs/cli", title: "CLI and upgrades", description: "The rdloom CLI copies components into your project and merges new versions into your edits, like git.", Page: CliGuide },
  { href: "/docs/mcp", title: "AI agents (MCP)", description: "An MCP server that gives Claude Code, Cursor and other AI agents rdloom's props, usage rules and tested examples.", Page: McpGuide },
  { href: "/docs/figma", title: "Figma plugin", description: "Sync rdloom's design tokens and component variants into Figma, with Light and Dark modes.", Page: FigmaGuide },
  { href: "/docs/tokens", title: "Design tokens", description: "rdloom's semantic design tokens as CSS variables, with light and dark values.", Page: TokensGuide },
];

export interface Route {
  path: string;
  title: string;
  description: string;
  page: ReactNode;
  /** Pages with their own layout width (the home page). */
  wide?: boolean;
  notFound?: boolean;
}

const home: Omit<Route, "page"> = {
  path: "/",
  title: "rdloom: accessible React components you own",
  description:
    "Spec-driven, accessible React components: DateRangePicker, Combobox and a 100,000-row DataGrid. Copy the code, edit it, and still take upgrades. Works with AI agents and Figma.",
};

export function routeFor(rawPath: string): Route {
  const path = rawPath.replace(/\/+$/, "") || "/";
  if (path === "/") return { ...home, page: <Home />, wide: true };

  const guide = guides.find((g) => g.href === path);
  if (guide) return { path, title: `${guide.title} · rdloom`, description: guide.description, page: <guide.Page /> };

  const component = components.find((c) => `/components/${c.id}` === path);
  if (component) {
    const { spec } = component;
    return {
      path,
      title: `${spec.name}: accessible React ${spec.name === "DataGrid" ? "data grid" : "component"} · rdloom`,
      description: `${spec.description} Keyboard and screen reader support, ${component.examples.length} tested examples, and source you own.`,
      page: <ComponentPage key={component.id} component={component} />,
    };
  }

  return {
    path,
    title: "Page not found · rdloom",
    description: "This page doesn't exist.",
    notFound: true,
    page: (
      <PageTitle
        lead={
          <>
            There's nothing at {path}.{" "}
            <Link href="/" className="underline">
              Go to the home page
            </Link>
            .
          </>
        }
      >
        Page not found
      </PageTitle>
    ),
  };
}

/** Every real page, for prerendering and the sitemap. */
export const allPaths = ["/", ...guides.map((g) => g.href), ...components.map((c) => `/components/${c.id}`)];

/** For search in the header: every page with a group label. */
export const searchEntries = [
  ...guides.map((g) => ({ id: g.href, name: g.title, group: "Guides" })),
  ...components.map((c) => ({ id: `/components/${c.id}`, name: c.spec.name, group: "Components" })),
];

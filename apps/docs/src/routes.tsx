import type { ReactNode } from "react";
import { blocks, components, displayName, hrefOf, parts } from "./data";
import { BlocksIndex } from "./pages/blocks";
import { ComponentPage } from "./pages/component-page";
import { ComponentsIndex } from "./pages/components-index";
import { AiGuide, CliGuide, FigmaGuide, GettingStarted, McpGuide, TokensGuide } from "./pages/guides";
import { Home } from "./pages/home";
import { Link } from "./router";
import { PageTitle } from "./ui";

// Every page with its title and search-result description. The browser app
// and the prerender step (prerender.mjs) both read this list.

/**
 * Where the built docs site will be served from, e.g. https://docs.example.com.
 * Set SITE_URL when building; empty means "not hosted yet", which skips the
 * sitemap, robots.txt and canonical links rather than inventing a domain.
 */
export const siteUrl = (import.meta.env?.VITE_SITE_URL ?? "").replace(/\/$/, "");

/** What to show in install commands: the real address, or a clear stand-in. */
export const registryBase = siteUrl || "<your-docs-url>";

export const guides = [
  { href: "/docs/getting-started", title: "Getting started", description: "Add rdloom to a React 19 and Tailwind CSS v4 app: init, tokens, and your first components.", Page: GettingStarted },
  { href: "/docs/cli", title: "CLI and upgrades", description: "The rdloom CLI copies components into your project and merges new versions into your edits, like git.", Page: CliGuide },
  { href: "/docs/mcp", title: "AI agents (MCP)", description: "An MCP server that gives Claude Code, Cursor and other AI agents rdloom's props, usage rules and tested examples.", Page: McpGuide },
  { href: "/docs/ai", title: "AI interfaces", description: "Chat, streaming replies, tool steps, approvals, sources, tables and charts: components built around one message shape and for screen readers.", Page: AiGuide },
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
  /** As wide as the navigation bar (blocks show whole screens), not the narrower width of the home page. */
  full?: boolean;
  /** A page with no site chrome, for showing one example at the size of the window. */
  bare?: boolean;
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

  if (path === "/components") {
    return {
      path,
      title: `${parts.length} accessible React components · rdloom`,
      description: "Every rdloom component with live examples, props, keyboard and screen reader behaviour, and source you own.",
      page: <ComponentsIndex />,
    };
  }

  const guide = guides.find((g) => g.href === path);
  if (guide) return { path, title: `${guide.title} · rdloom`, description: guide.description, page: <guide.Page /> };

  if (path === "/blocks") {
    return {
      path,
      title: `${blocks.length} ready-made blocks for React · rdloom`,
      description: "Whole screens built from rdloom components: a dashboard shell, a customer table with charts. See each at full width and on a phone, then copy it into your project.",
      wide: true,
      full: true,
      page: <BlocksIndex />,
    };
  }

  const block = blocks.find((c) => `/blocks/${c.id}` === path);
  if (block) {
    return {
      path,
      title: `${displayName(block.spec.name)}: a React block · rdloom`,
      description: `${block.spec.description} See it at full width and on a phone, then copy it into your project.`,
      wide: true,
      full: true,
      page: <ComponentPage key={block.id} component={block} layout="block" />,
    };
  }

  // /preview/<block>/<example>: one example filling the window, opened from a block page.
  const preview = path.match(/^\/preview\/([^/]+)\/([^/]+)$/);
  if (preview) {
    const owner = components.find((c) => c.id === preview[1]);
    return { path, title: `${owner ? displayName(owner.spec.name) : preview[1]}, full screen · rdloom`, description: "One example at the size of the window.", bare: true, page: null };
  }

  const component = parts.find((c) => `/components/${c.id}` === path);
  if (component) {
    const { spec } = component;
    return {
      path,
      title: `${displayName(spec.name)}: accessible React ${spec.name === "DataGrid" ? "data grid" : "component"} · rdloom`,
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
export const allPaths = ["/", "/components", "/blocks", ...guides.map((g) => g.href), ...parts.map((c) => `/components/${c.id}`), ...blocks.map((c) => `/blocks/${c.id}`)];

/** The full-screen example pages: written as files so a link to one works, but kept out of the sitemap and the index of the docs. */
export const previewPaths = blocks.flatMap((c) => c.examples.map((e) => `/preview/${c.id}/${e.name}`));

/** For search in the header: every page with a group label. */
export const searchEntries = [
  ...guides.map((g) => ({ id: g.href, name: g.title, group: "Guides" })),
  { id: "/components", name: "All components", group: "Components" },
  ...parts.map((c) => ({ id: `/components/${c.id}`, name: displayName(c.spec.name), group: "Components", category: c.spec.category })),
  { id: "/blocks", name: "All blocks", group: "Blocks" },
  ...blocks.map((c) => ({ id: hrefOf(c), name: displayName(c.spec.name), group: "Blocks", category: c.spec.category })),
];

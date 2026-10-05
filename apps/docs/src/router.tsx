import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";

// A tiny History API router: the site has a handful of flat routes, so a
// dependency would add more than it saves. Every page is also prerendered
// to its own HTML file (prerender.mjs), so links work without JavaScript.

const PathContext = createContext("/");

export function usePath() {
  return useContext(PathContext);
}

export function navigate(to: string) {
  if (to === location.pathname + location.hash) return;
  history.pushState(null, "", to);
  dispatchEvent(new PopStateEvent("popstate"));
}

/** initialPath is for prerendering, where there's no location. */
export function RouterProvider({ children, initialPath }: { children: React.ReactNode; initialPath?: string }) {
  const [path, setPath] = useState(() => initialPath ?? location.pathname);
  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  return <PathContext.Provider value={path}>{children}</PathContext.Provider>;
}

export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const path = usePath();
  const internal = href.startsWith("/");
  return (
    <a
      {...rest}
      href={href}
      aria-current={rest["aria-current"] ?? (internal && path === href ? "page" : undefined)}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        // Let the browser handle new tabs, downloads and external links.
        if (!internal || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(href);
      }}
    />
  );
}

import { Suspense, useEffect, useState } from "react";
import { ToastRegion } from "@rdloom/react";
import { components } from "../data";

// /visual/<component>/<example>?theme=dark renders one example on its own,
// for the screenshot tests in tests/visual. Not linked from the site.
export function VisualPage({ id, name }: { id: string; name: string }) {
  const example = components.find((c) => c.id === id)?.examples.find((e) => e.name === name);
  const [ready, setReady] = useState(false);
  // ?fit=1 gives the example the width of the window, as a page of an app would, so a phone-width check is honest.
  const fit = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("fit") === "1";

  useEffect(() => {
    const theme = new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, []);

  if (!example) return <p>No example {id}/{name}</p>;
  return (
    // The components' own surface, not the site's, so screenshots track the
    // components and ignore site styling.
    <main className="min-h-screen bg-[var(--rd-color-surface-default)] p-6 text-[var(--rd-color-text-default)]">
      <div data-visual className={`${fit ? "flex w-full min-w-0" : "inline-flex min-w-40"} flex-wrap items-start p-4`}>
        <Suspense fallback={null}>
          <Loaded onReady={() => setReady(true)}>
            <example.Component />
          </Loaded>
        </Suspense>
      </div>
      {ready && <span data-visual-ready hidden />}
      <ToastRegion />
    </main>
  );
}

function Loaded({ children, onReady }: { children: React.ReactNode; onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return <>{children}</>;
}

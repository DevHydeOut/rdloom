import { useState } from "react";
import { PullToRefresh } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// On a touch screen, pull the list down at the top and let go past the line. Everyone else: Tab to the Refresh button.
// onRefresh loads the data and returns a promise; the indicator stays until it settles. The component fetches nothing.
// In a page that scrolls as a whole, pass scrollElement="window" and set overscroll-behavior-y: contain on the page.
export default function PullToRefreshBasicExample() {
  const [items, setItems] = useState(["Invoice 1042 was paid", "New comment from Ana", "Backup finished", "Ben joined the team", "Plan renews on the 1st", "Report is ready", "Two tasks are due today"]);
  return (
    <div className="mx-auto h-80 w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <PullToRefresh
        onRefresh={async () => {
          await wait(900);
          setItems((all) => [`Refreshed at ${new Date().toLocaleTimeString()}`, ...all]);
        }}
        className="h-full"
      >
        <ul className="divide-y divide-[var(--rd-color-border-default)]">
            {items.map((item) => (
              <li key={item} className="px-4 py-3 text-sm">
                {item}
              </li>
            ))}
          </ul>
      </PullToRefresh>
    </div>
  );
}

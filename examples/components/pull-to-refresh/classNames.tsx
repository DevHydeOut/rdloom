import { PullToRefresh } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const items = ["Invoice 1042 was paid", "New comment from Ana", "Backup finished", "Ben joined the team"];

// Slots: root, indicator, content, button. Your classes are added after the built-in ones.
export default function PullToRefreshClassNamesExample() {
  return (
    <div className="mx-auto h-80 w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <PullToRefresh
        onRefresh={() => wait(800)}
        classNames={{ root: "h-full", indicator: "bg-[var(--rd-color-surface-subtle)] font-medium", content: "rounded-t-xl" }}
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

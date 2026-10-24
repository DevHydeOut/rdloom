import { useState } from "react";
import { Button, PullToRefresh } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// isRefreshing shows the refreshing state when something else loads the data, here a button outside the list. A pull or the Refresh button
// still works, and while either runs a second refresh does not start.
export default function PullToRefreshControlledExample() {
  const [loading, setLoading] = useState(false);
  const [items] = useState(["Invoice 1042 was paid", "New comment from Ana", "Backup finished", "Ben joined the team"]);
  return (
    <div className="mx-auto flex w-[22rem] max-w-full flex-col gap-3">
      <div className="mx-auto h-80 w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
        <PullToRefresh isRefreshing={loading} onRefresh={() => wait(800)} className="h-full">
          <ul className="divide-y divide-[var(--rd-color-border-default)]">
            {items.map((item) => (
              <li key={item} className="px-4 py-3 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </PullToRefresh>
      </div>
      <Button
        size="sm"
        variant="secondary"
        isDisabled={loading}
        onPress={async () => {
          setLoading(true);
          await wait(1500);
          setLoading(false);
        }}
      >
        Load in the background
      </Button>
    </div>
  );
}

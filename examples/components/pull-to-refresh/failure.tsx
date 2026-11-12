import { useRef, useState } from "react";
import { PullToRefresh } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A rejected promise shows "Could not refresh" with a Try again button, and onError is called with the error.
// This one fails the first time and works the second.
export default function PullToRefreshFailureExample() {
  const attempts = useRef(0);
  const [items, setItems] = useState(["Invoice 1042 was paid", "New comment from Ana", "Backup finished", "Ben joined the team"]);
  const [log, setLog] = useState("");
  return (
    <div className="mx-auto w-[22rem] max-w-full">
      <div className="mx-auto h-80 w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
        <PullToRefresh
          onRefresh={async () => {
            await wait(600);
            attempts.current += 1;
            if (attempts.current === 1) throw new Error("offline");
            setItems((all) => ["Back online", ...all]);
          }}
          onError={(error) => setLog(`Last error: ${(error as Error).message}`)}
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
      <p role="status" className="mt-2 text-xs text-[var(--rd-color-text-muted)]">
        {log}
      </p>
    </div>
  );
}

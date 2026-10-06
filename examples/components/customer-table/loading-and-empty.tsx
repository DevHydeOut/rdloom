import { useState } from "react";
import { Button, CustomerTable } from "@rdloom/react";

// While data is on its way pass isLoading: rows turn into skeletons and the controls wait.
// With no customers the table says so in words and, when a filter hides everyone, offers to clear it.
export default function CustomerTableLoadingAndEmptyExample() {
  const [state, setState] = useState<"loading" | "empty" | "error">("loading");
  return (
    <div className="flex w-[60rem] max-w-full flex-col gap-4">
      <div role="group" aria-label="State to show" className="flex gap-2">
        {(["loading", "empty", "error"] as const).map((s) => (
          <Button key={s} size="sm" variant={state === s ? "primary" : "secondary"} onPress={() => setState(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>
      <CustomerTable
        customers={[]}
        insights="none"
        isLoading={state === "loading"}
        error={state === "error" ? "The server did not answer." : undefined}
        onRetry={() => setState("loading")}
      />
    </div>
  );
}

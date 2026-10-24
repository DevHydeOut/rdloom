import { useState } from "react";
import { Button, InvoicesTable, type Invoice } from "@rdloom/react";

// While data is on its way pass isLoading: rows and totals turn into skeletons and the controls wait.
// With no invoices the table says so in words; when a filter hides everything it offers to clear it.
export default function InvoicesTableStatesExample() {
  const [state, setState] = useState<"loading" | "empty" | "error">("loading");
  const invoices: Invoice[] = [];
  return (
    <div className="mx-auto flex w-[64rem] max-w-full flex-col gap-4">
      <div role="group" aria-label="State to show" className="flex gap-2">
        {(["loading", "empty", "error"] as const).map((s) => (
          <Button key={s} size="sm" variant={state === s ? "primary" : "secondary"} onPress={() => setState(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>
      <InvoicesTable
        invoices={invoices}
        summary={state === "loading" ? "auto" : "none"}
        isLoading={state === "loading"}
        error={state === "error" ? "The server did not answer." : undefined}
        onRetry={() => setState("loading")}
      />
    </div>
  );
}

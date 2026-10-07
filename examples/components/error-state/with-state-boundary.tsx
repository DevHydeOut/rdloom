import { useState } from "react";
import { Button, EmptyState, ErrorState, Skeleton, StateBoundary, type DataState } from "@rdloom/react";

const invoices = [
  { id: "2041", customer: "Brightwater Supplies", total: "$1,240.00" },
  { id: "2040", customer: "Harbor Mills", total: "$860.50" },
  { id: "2039", customer: "Northgate Foods", total: "$2,310.00" },
];

// StateBoundary picks what to show for a DataState: a skeleton while loading, an empty state, an
// error state with a retry, or your data. You supply the state from your own data layer.
export default function ErrorStateWithStateBoundaryExample() {
  const [state, setState] = useState<DataState>("ready");
  return (
    <div className="flex w-[40rem] max-w-full flex-col gap-4">
      <div role="group" aria-label="Pretend the data is" className="flex flex-wrap gap-2">
        {(["loading", "empty", "error", "ready"] as const).map((s) => (
          <Button key={s} size="sm" variant={state === s ? "primary" : "secondary"} aria-pressed={state === s} onPress={() => setState(s)}>
            {s}
          </Button>
        ))}
      </div>
      <StateBoundary
        state={state}
        loading={
          <div role="status" className="flex flex-col gap-3">
            <span className="sr-only">Loading invoices</span>
            <Skeleton variant="text" lines={3} />
          </div>
        }
        empty={<EmptyState size="sm" title="No invoices yet" description="Invoices you create show up here." />}
        error={
          <ErrorState
            title="We could not load your invoices"
            description="Try again in a moment."
            actions={<Button onPress={() => setState("loading")}>Try again</Button>}
          />
        }
      >
        <ul className="divide-y divide-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] text-sm">
          {invoices.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-[var(--rd-color-text-default)]">
                #{i.id} {i.customer}
              </span>
              <span className="text-[var(--rd-color-text-muted)]">{i.total}</span>
            </li>
          ))}
        </ul>
      </StateBoundary>
    </div>
  );
}

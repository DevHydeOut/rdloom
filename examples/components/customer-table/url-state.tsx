import { useState } from "react";
import {
  CustomerTable,
  customerQueryFromUrl,
  customerQuerySchema,
  customerQueryToUrl,
  useQueryState,
  type Customer,
} from "@rdloom/react";

const names = ["Ada Lovelace", "Grace Hopper", "Katherine Johnson", "Alan Turing", "Margaret Hamilton", "Dennis Ritchie", "Barbara Liskov", "Edsger Dijkstra", "Radia Perlman", "Donald Knuth", "Frances Allen", "Hedy Lamarr"];
const plans = ["Free", "Pro", "Team", "Enterprise"];
const price = [0, 29, 99, 499];
const statuses = ["active", "active", "trial", "overdue", "active", "churned"];

const customers: Customer[] = names.map((name, i) => ({
  id: `c${i + 1}`,
  name,
  email: `${name.split(" ")[0].toLowerCase()}@example.com`,
  plan: plans[i % 4],
  status: statuses[i % statuses.length],
  mrr: price[i % 4],
  joinedAt: `2026-${String(1 + (i % 9)).padStart(2, "0")}-${String(3 + ((i * 5) % 24)).padStart(2, "0")}`,
}));

// The search, filters, sort and page live in the address. Here the "address" is a string kept in state so the
// preview can show it; in your app pass useWindowQueryState(customerQuerySchema), or your router's search params.
export default function CustomerTableUrlStateExample() {
  const [search, setSearch] = useState("");
  const [state, setState] = useQueryState(customerQuerySchema, { search, onChange: setSearch });

  return (
    <div className="flex w-full justify-center">
      <div className="flex w-[60rem] max-w-full flex-col gap-4">
        <p className="rounded-[var(--rd-radius-control)] bg-[var(--rd-color-surface-subtle)] px-3 py-2 font-mono text-sm text-[var(--rd-color-text-muted)]">
          /customers{search ? `?${search}` : ""}
        </p>
        <CustomerTable
          customers={customers}
          pageSize={5}
          insights="none"
          query={customerQueryFromUrl(state, 5)}
          onQueryChange={(query) => setState(customerQueryToUrl(query))}
        />
      </div>
    </div>
  );
}

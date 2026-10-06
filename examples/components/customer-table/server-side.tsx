import { useEffect, useRef, useState } from "react";
import { CustomerTable, applyCustomerQuery, type Customer, type CustomerQuery } from "@rdloom/react";

const all: Customer[] = Array.from({ length: 240 }, (_, i) => ({
  id: `c${i + 1}`,
  name: `Customer ${String(i + 1).padStart(3, "0")}`,
  email: `customer${i + 1}@example.com`,
  plan: ["Free", "Pro", "Team"][i % 3],
  status: ["active", "trial", "overdue", "churned"][i % 4],
  mrr: [0, 29, 99][i % 3],
  joinedAt: `2026-0${1 + (i % 9)}-${String(1 + (i % 27)).padStart(2, "0")}`,
}));

// A stand-in for your API: it answers after a short wait. In your app, send the query to the server and
// return that page and the number of matches. (applyCustomerQuery is the same logic the table uses in memory.)
const fetchCustomers = (query: CustomerQuery) =>
  new Promise<{ rows: Customer[]; total: number }>((resolve) => {
    const { rows, total } = applyCustomerQuery(all, query);
    setTimeout(() => resolve({ rows, total }), 600);
  });

export default function CustomerTableServerSideExample() {
  const [page, setPage] = useState<{ rows: Customer[]; total: number }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const last = useRef<CustomerQuery | undefined>(undefined);

  const load = (query: CustomerQuery) => {
    last.current = query;
    setLoading(true);
    setError(undefined);
    fetchCustomers(query)
      .then((result) => last.current === query && setPage(result)) // ignore an answer that arrives late
      .catch(() => setError("The server did not answer."))
      .finally(() => last.current === query && setLoading(false));
  };
  useEffect(() => load({ search: "", status: [], plan: [], sort: null, page: 1, pageSize: 8 }), []);

  return (
    <div className="w-[60rem] max-w-full">
      <CustomerTable
        customers={page.rows}
        totalCount={page.total}
        pageSize={8}
        serverSide
        isLoading={loading}
        error={error}
        onRetry={() => last.current && load(last.current)}
        onQueryChange={load}
        // The cards above the table would only describe this one page: leave them out, or pass the totals your API returns.
        insights="none"
        onExport={(rows) => console.log(`Export ${rows.length} customers`)}
      />
    </div>
  );
}

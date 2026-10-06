import { useState } from "react";
import { Pagination } from "@rdloom/react";

// After the page changes, tell people what changed: here a polite live region.
export default function PaginationControlledExample() {
  const [page, setPage] = useState(3);
  const pageCount = 12;
  return (
    <div className="flex flex-col items-center gap-3">
      <p aria-live="polite" className="text-sm">
        Showing results {(page - 1) * 10 + 1} to {page * 10}
      </p>
      <Pagination pageCount={pageCount} page={page} onChange={setPage} size="sm" />
    </div>
  );
}

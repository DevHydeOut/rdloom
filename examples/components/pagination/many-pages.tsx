import { Pagination } from "@rdloom/react";

// Far from the ends, both sides collapse to an ellipsis.
export default function PaginationManyPagesExample() {
  return <Pagination pageCount={200} defaultPage={100} siblingCount={1} />;
}

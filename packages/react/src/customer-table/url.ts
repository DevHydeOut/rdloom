// Keeps the customer list's search, filters, sort and page in the address, so a link or the back
// button restores the same view. Use it with useWindowQueryState or useQueryState from utils/url-state.
// Page size is not kept in the address: it is a setting of the table, not of the view.

import type { QueryState, QuerySchema } from "../utils/url-state";
import { emptyQuery, type CustomerQuery, type CustomerSortColumn } from "./query";

export const customerQuerySchema = {
  q: { type: "string", default: "" },
  status: { type: "array", default: [] },
  plan: { type: "array", default: [] },
  sort: { type: "string", default: "" },
  page: { type: "number", default: 1, min: 1, integer: true },
} as const satisfies QuerySchema;

export type CustomerUrlState = QueryState<typeof customerQuerySchema>;

const COLUMNS: readonly CustomerSortColumn[] = ["name", "plan", "status", "mrr", "joinedAt"];

/** The address state as a query the table understands. Unknown sort values are ignored. */
export function customerQueryFromUrl(state: CustomerUrlState, pageSize = 10): CustomerQuery {
  const [column, direction] = state.sort.split(":");
  const sort: CustomerQuery["sort"] =
    COLUMNS.includes(column as CustomerSortColumn) && (direction === "ascending" || direction === "descending")
      ? { column: column as CustomerSortColumn, direction }
      : null;
  return { ...emptyQuery(pageSize), search: state.q, status: [...state.status], plan: [...state.plan], sort, page: state.page, pageSize };
}

/** The table's query as address state. */
export function customerQueryToUrl(query: CustomerQuery): CustomerUrlState {
  return {
    q: query.search,
    status: query.status,
    plan: query.plan,
    sort: query.sort ? `${query.sort.column}:${query.sort.direction}` : "",
    page: query.page,
  };
}

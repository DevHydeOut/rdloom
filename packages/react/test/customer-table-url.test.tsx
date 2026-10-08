import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  CustomerTable,
  customerQueryFromUrl,
  customerQuerySchema,
  customerQueryToUrl,
  parseQueryState,
  serializeQueryState,
  useQueryState,
  type Customer,
} from "../src";

const customers: Customer[] = Array.from({ length: 12 }, (_, i) => ({
  id: `c${i + 1}`,
  name: `Person ${String(i + 1).padStart(2, "0")}`,
  email: `p${i + 1}@example.com`,
  plan: ["Free", "Pro"][i % 2],
  status: ["active", "trial"][i % 2],
  mrr: i * 10,
  joinedAt: `2026-01-${String(i + 1).padStart(2, "0")}`,
}));

describe("customer query in the address", () => {
  it("round-trips the query through the address", () => {
    const query = { ...customerQueryFromUrl(parseQueryState("", customerQuerySchema), 5), search: "ada", plan: ["Pro"], page: 2, sort: { column: "mrr" as const, direction: "descending" as const } };
    const search = serializeQueryState(customerQueryToUrl(query), customerQuerySchema);
    expect(search).toBe("q=ada&plan=Pro&sort=mrr%3Adescending&page=2");
    expect(customerQueryFromUrl(parseQueryState(search, customerQuerySchema), 5)).toEqual(query);
  });

  it("ignores a sort it does not know", () => {
    const state = parseQueryState("sort=bogus%3Aup", customerQuerySchema);
    expect(customerQueryFromUrl(state).sort).toBeNull();
  });

  function Harness({ initial = "" }: { initial?: string }) {
    const [search, setSearch] = useState(initial);
    const [state, setState] = useQueryState(customerQuerySchema, { search, onChange: setSearch });
    return (
      <>
        <output data-testid="address">{search}</output>
        <CustomerTable customers={customers} pageSize={5} insights="none" query={customerQueryFromUrl(state, 5)} onQueryChange={(q) => setState(customerQueryToUrl(q))} />
      </>
    );
  }

  it("starts from the address", () => {
    render(<Harness initial="q=Person%2003" />);
    expect(screen.getByRole("searchbox")).toHaveValue("Person 03");
  });

  it("writes searching and paging to the address", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByTestId("address")).toHaveTextContent("page=2"));
    await user.type(screen.getByRole("searchbox"), "Person 07");
    await waitFor(() => expect(screen.getByTestId("address")).toHaveTextContent("q=Person+07"));
    expect(screen.getByTestId("address")).not.toHaveTextContent("page=");
  });
});

describe("a disabled open action", () => {
  it("stays focusable and says why", () => {
    const onOpen = vi.fn();
    render(<CustomerTable customers={customers} insights="none" onOpenCustomer={onOpen} permissions={{ open: { state: "disabled", reason: "Ask an admin for access" } }} />);
    const button = screen.getAllByRole("button", { name: "Person 01" })[0];
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription("Ask an admin for access");
    button.focus();
    expect(button).toHaveFocus();
  });
});

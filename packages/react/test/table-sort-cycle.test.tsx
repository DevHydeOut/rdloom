import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, type SortDescriptor } from "../src";

function Sortable() {
  const [sort, setSort] = useState<SortDescriptor | null>(null);
  return (
    <>
      <output data-testid="sort">{sort ? `${sort.column}:${sort.direction}` : "none"}</output>
      <Table label="Invoices" sortDescriptor={sort} onSortChange={setSort}>
        <TableHeader>
          <TableColumn id="name" isRowHeader allowsSorting>
            Name
          </TableColumn>
          <TableColumn id="amount" allowsSorting>
            Amount
          </TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow id="a">
            <TableCell>Acme</TableCell>
            <TableCell>10</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
}

describe("Table sorting cycles through three states", () => {
  it("goes ascending, descending, then back to no sort, and starts again on another column", async () => {
    const user = userEvent.setup();
    render(<Sortable />);
    const name = screen.getByRole("columnheader", { name: /name/i });
    await user.click(name);
    expect(screen.getByTestId("sort")).toHaveTextContent("name:ascending");
    await user.click(name);
    expect(screen.getByTestId("sort")).toHaveTextContent("name:descending");
    await user.click(name);
    expect(screen.getByTestId("sort")).toHaveTextContent("none");
    await user.click(name);
    expect(screen.getByTestId("sort")).toHaveTextContent("name:ascending");
    await user.click(screen.getByRole("columnheader", { name: /amount/i }));
    expect(screen.getByTestId("sort")).toHaveTextContent("amount:ascending");
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    render(<Sortable />);
    screen.getByRole("columnheader", { name: /name/i }).focus();
    await user.keyboard("{Enter}{Enter}{Enter}");
    expect(screen.getByTestId("sort")).toHaveTextContent("none");
  });
});

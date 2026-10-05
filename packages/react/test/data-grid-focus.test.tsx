import type { ColumnDef } from "@tanstack/react-table";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DataGrid } from "../src";

interface Person {
  id: string;
  name: string;
  city: string;
}

const people: Person[] = [
  { id: "p1", name: "Ada", city: "London" },
  { id: "p2", name: "Grace", city: "New York" },
];
const columns: ColumnDef<Person, any>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "city", header: "City" },
];

// Moving focus is a request ("focus the cell I just moved to") that the grid
// carries out after the move has rendered. An effect left over from an earlier
// render used to use up that request while the new cell was still on its way,
// so the arrow key moved the grid's state but not the focus. It depended on
// timing, so the same steps run many times.
describe("DataGrid focus follows the keyboard", () => {
  it.each(Array.from({ length: 12 }, (_, i) => i))("arrow keys right after tabbing in (run %i)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<DataGrid label="People" data={people} columns={columns} getRowId={(p) => p.id} />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(document.activeElement).toHaveTextContent("London"));
    await user.keyboard("{ArrowDown}{ArrowLeft}");
    await waitFor(() => expect(document.activeElement).toHaveTextContent("Grace"));
    unmount();
  });
});

import { useState } from "react";
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from "@rdloom/react";

const rows = [
  { id: "inv-1042", customer: "Ada Lovelace", total: "$120.50" },
  { id: "inv-1043", customer: "Grace Hopper", total: "$89.00" },
  { id: "inv-1044", customer: "Alan Turing", total: "$42.10" },
];

// The row stays a table row (elementType="tr"). Each row also has a visible Open link,
// so the menu adds shortcuts and removes nothing.
export default function ContextMenuOnATableRowExample() {
  const [last, setLast] = useState<string>();

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <table className="w-96 border-collapse text-sm">
        <caption className="pb-2 text-start text-[var(--rd-color-text-muted)]">Invoices</caption>
        <thead>
          <tr className="border-b border-[var(--rd-color-border-default)]">
            <th scope="col" className="py-2 text-start font-medium">
              Customer
            </th>
            <th scope="col" className="py-2 text-end font-medium">
              Total
            </th>
            <th scope="col" className="py-2 ps-4 text-start font-medium">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ContextMenu
              key={row.id}
              elementType="tr"
              label={`Actions for ${row.id}`}
              onAction={(key) => setLast(`${key} on ${row.id}`)}
              className="border-b border-[var(--rd-color-border-default)]"
              items={
                <>
                  <ContextMenuItem id="open">Open invoice</ContextMenuItem>
                  <ContextMenuItem id="send">Send reminder</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem id="void" variant="danger">
                    Void invoice
                  </ContextMenuItem>
                </>
              }
            >
              <td className="py-2">{row.customer}</td>
              <td className="py-2 text-end tabular-nums">{row.total}</td>
              <td className="py-2 ps-4">
                <a href={`#${row.id}`} className="underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]">
                  Open {row.id}
                </a>
              </td>
            </ContextMenu>
          ))}
        </tbody>
      </table>
      <p className="text-sm" aria-live="polite">
        {last ?? ""}
      </p>
    </div>
  );
}

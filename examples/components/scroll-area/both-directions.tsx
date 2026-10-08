import { ScrollArea } from "@rdloom/react";

const columns = ["Name", "Region", "Plan", "Seats", "Owner", "Created", "Renews", "Status"];
const rows = Array.from({ length: 16 }, (_, i) => i + 1);

export default function ScrollAreaBothDirectionsExample() {
  return (
    <div className="flex w-full justify-center">
      <ScrollArea label="Accounts table" orientation="both" className="h-56 w-full max-w-md border border-[var(--rd-color-border-default)]">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col" className="whitespace-nowrap px-4 py-2 text-start font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r} className="border-t border-[var(--rd-color-border-default)]">
                {columns.map((c) => (
                  <td key={c} className="whitespace-nowrap px-4 py-2">
                    {c} {r}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}

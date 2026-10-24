import { useState } from "react";
import { ArchiveIcon, SwipeableRow } from "@rdloom/react";

const people = [
  { id: "1", name: "Ana Ruiz", note: "Can we move the review to Thursday?" },
  { id: "2", name: "Ben Okafor", note: "Invoice 1042 is attached." },
  { id: "3", name: "Chen Wei", note: "Lunch tomorrow?" },
  { id: "4", name: "Dana Park", note: "Notes from the call are in the doc." },
];

// In a list keep one row open at a time: the open id lives in the parent and each row is controlled by it. The list scrolls normally.
export default function SwipeableRowInAListExample() {
  const [rows, setRows] = useState(people);
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="mx-auto max-h-72 w-[22rem] max-w-full overflow-y-auto rounded-xl border border-[var(--rd-color-border-default)]">
      <ul className="divide-y divide-[var(--rd-color-border-default)]">
        {rows.map((person) => (
          <li key={person.id}>
            <SwipeableRow
              open={openId === person.id ? "end" : null}
              onOpenChange={(side) => setOpenId(side ? person.id : null)}
              actionsLabel={`Actions for the message from ${person.name}`}
              endActions={[{ id: "archive", label: "Archive", icon: <ArchiveIcon />, onAction: () => setRows((all) => all.filter((p) => p.id !== person.id)) }]}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-sm font-semibold">
                  {person.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{person.name}</span>
                  <span className="block truncate text-sm text-[var(--rd-color-text-muted)]">{person.note}</span>
                </span>
              </div>
            </SwipeableRow>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="px-4 py-6 text-center text-sm text-[var(--rd-color-text-muted)]">Inbox zero.</p>}
    </div>
  );
}

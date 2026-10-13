import { SelvedgeBlur } from "@rdloom/react";

const lines = ["Quarterly review notes", "Invoices sent this week", "Stock reserved for orders", "Payments waiting on approval", "Refunds issued today", "New accounts created", "Support tickets closed"];

// The blur sits on the bottom edge of a positioned parent and softens what runs under it.
export default function SelvedgeBlurBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative h-48 w-72 overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-4">
        <ul className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <SelvedgeBlur position="bottom" />
      </div>
    </div>
  );
}

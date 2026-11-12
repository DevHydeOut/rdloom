import { useState } from "react";
import { ActionSheet, Button, DialogTrigger, FileIcon } from "@rdloom/react";

// tone="danger" draws the action in the danger color. confirm asks once more inside the sheet: it names the action, says what it does
// and has Back. Escape in that step goes back to the list instead of closing the sheet.
export default function ActionSheetDangerAndConfirmExample() {
  const [last, setLast] = useState("Nothing chosen yet.");
  return (
    <div className="flex flex-col items-center gap-3">
      <DialogTrigger>
        <Button variant="secondary">Invoice 1042</Button>
        <ActionSheet
          title="Invoice 1042"
          actions={[
            { id: "pdf", label: "Download PDF", icon: <FileIcon />, onAction: () => setLast("Downloaded the PDF") },
            {
              id: "void",
              label: "Void invoice",
              description: "Keeps it on record, marked void",
              onAction: () => setLast("Voided the invoice"),
              confirm: { description: "The customer will no longer owe this amount.", confirmLabel: "Void invoice" },
            },
            {
              id: "delete",
              label: "Delete invoice",
              tone: "danger",
              onAction: () => setLast("Deleted the invoice"),
              confirm: { description: "This cannot be undone.", confirmLabel: "Delete" },
            },
          ]}
        />
      </DialogTrigger>
      <p role="status" className="text-sm text-[var(--rd-color-text-muted)]">
        {last}
      </p>
    </div>
  );
}

import { useState } from "react";
import { ActionSheet, Button, CopyIcon, DialogTrigger, FileIcon, SendIcon } from "@rdloom/react";

// Open it with DialogTrigger, like a Drawer. Each action is a touch-sized button; Cancel is separate. Arrow keys move between the actions.
export default function ActionSheetBasicExample() {
  const [last, setLast] = useState("Nothing chosen yet.");
  return (
    <div className="flex flex-col items-center gap-3">
      <DialogTrigger>
        <Button variant="secondary">Invoice 1042</Button>
        <ActionSheet
          title="Invoice 1042"
          description="Northgate Foods, 2,310.00 USD"
          actions={[
            { id: "pdf", label: "Download PDF", icon: <FileIcon />, onAction: () => setLast("Downloaded the PDF") },
            { id: "link", label: "Copy link", icon: <CopyIcon />, onAction: () => setLast("Copied the link") },
            { id: "send", label: "Send to customer", description: "accounts@northgate.example", icon: <SendIcon />, onAction: () => setLast("Sent to the customer") },
          ]}
        />
      </DialogTrigger>
      <p role="status" className="text-sm text-[var(--rd-color-text-muted)]">
        {last}
      </p>
    </div>
  );
}

import { useState } from "react";
import { ActionSheet, Button, DialogTrigger, FileIcon, SendIcon } from "@rdloom/react";

// portalContainer draws the sheet and its backdrop inside an element instead of over the whole page: a phone frame, a preview, a framed app.
// The element must be positioned (relative) and clip its overflow.
export default function ActionSheetInsideAFrameExample() {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setFrame} className="relative mx-auto flex h-96 w-[22rem] max-w-full items-start justify-center overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] p-6">
      <DialogTrigger>
        <Button variant="secondary">Invoice 1042</Button>
        <ActionSheet
          portalContainer={frame}
          title="Invoice 1042"
          actions={[
            { id: "pdf", label: "Download PDF", icon: <FileIcon />, onAction: () => {} },
            { id: "send", label: "Send to customer", icon: <SendIcon />, onAction: () => {} },
            { id: "delete", label: "Delete invoice", tone: "danger", onAction: () => {}, confirm: { description: "This cannot be undone.", confirmLabel: "Delete" } },
          ]}
        />
      </DialogTrigger>
    </div>
  );
}

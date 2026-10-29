import { ActionSheet, Button, DialogTrigger } from "@rdloom/react";

// Slots: list, action, cancel, confirm, error. The Drawer behind it takes className for the dialog itself. Your classes are added after the built-in ones.
export default function ActionSheetClassNamesExample() {
  return (
    <DialogTrigger>
      <Button variant="secondary">Invoice 1042</Button>
      <ActionSheet
        title="Invoice 1042"
        actions={[
          { id: "pdf", label: "Download PDF", onAction: () => {} },
          { id: "send", label: "Send to customer", onAction: () => {} },
        ]}
        classNames={{ list: "gap-1", action: "rounded-xl", cancel: "uppercase tracking-wide" }}
      />
    </DialogTrigger>
  );
}

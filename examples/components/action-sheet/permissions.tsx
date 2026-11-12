import { ActionSheet, Button, DialogTrigger } from "@rdloom/react";

// Your app decides what each person may do and passes the answer on each action. A hidden action is not drawn; a disabled one stays
// focusable, does nothing and shows why. The server must check access again.
export default function ActionSheetPermissionsExample() {
  return (
    <DialogTrigger>
      <Button variant="secondary">Invoice 1042</Button>
      <ActionSheet
        title="Invoice 1042"
        actions={[
          { id: "pdf", label: "Download PDF", onAction: () => {} },
          { id: "void", label: "Void invoice", onAction: () => {}, permission: { state: "disabled", reason: "Only finance can void invoices" } },
          { id: "delete", label: "Delete invoice", tone: "danger", onAction: () => {}, permission: "hidden" },
        ]}
      />
    </DialogTrigger>
  );
}

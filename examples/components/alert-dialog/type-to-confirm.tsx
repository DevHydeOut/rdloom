import { AlertDialog, Button, DialogTrigger } from "@rdloom/react";

export default function AlertDialogTypeToConfirmExample() {
  return (
    <DialogTrigger>
      <Button variant="danger">Delete workspace</Button>
      <AlertDialog
        tone="danger"
        title="Delete the Northwind workspace?"
        description="All projects, invoices and members in this workspace are removed for good."
        confirmLabel="Delete workspace"
        confirmText="Northwind"
        onConfirm={() => {
          // Remove the workspace here.
        }}
      />
    </DialogTrigger>
  );
}

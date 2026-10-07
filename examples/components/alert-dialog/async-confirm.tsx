import { AlertDialog, Button, DialogTrigger } from "@rdloom/react";

export default function AlertDialogAsyncConfirmExample() {
  return (
    <DialogTrigger>
      <Button variant="danger">Archive invoices</Button>
      <AlertDialog
        tone="danger"
        title="Archive 24 invoices?"
        description="They move out of the active list. The dialog stays open until the request finishes."
        confirmLabel="Archive invoices"
        onConfirm={() => new Promise<void>((resolve) => setTimeout(resolve, 1500))}
      />
    </DialogTrigger>
  );
}

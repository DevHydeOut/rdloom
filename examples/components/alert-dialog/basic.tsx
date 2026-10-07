import { AlertDialog, Button, DialogTrigger } from "@rdloom/react";

export default function AlertDialogBasicExample() {
  return (
    <DialogTrigger>
      <Button variant="secondary">Discard draft</Button>
      <AlertDialog
        title="Discard this draft?"
        description="Your changes have not been saved and will be lost."
        confirmLabel="Discard draft"
        cancelLabel="Keep editing"
      />
    </DialogTrigger>
  );
}

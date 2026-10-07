import { AlertDialog, Button, DialogTrigger } from "@rdloom/react";

export default function AlertDialogDangerDeleteExample() {
  return (
    <DialogTrigger>
      <Button variant="danger">Delete user</Button>
      <AlertDialog
        tone="danger"
        title="Delete this user?"
        description="Asha Menon will lose access immediately. This cannot be undone."
        confirmLabel="Delete user"
        onConfirm={() => {
          // Remove the user here.
        }}
      />
    </DialogTrigger>
  );
}

import { Button, Dialog, DialogTrigger } from "@rdloom/react";

export default function DialogConfirmExample() {
  return (
    <DialogTrigger>
      <Button variant="secondary">Discard draft</Button>
      <Dialog title="Discard draft?" description="Your changes will be lost." size="sm">
        {({ close }) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onPress={close}>
              Keep editing
            </Button>
            <Button onPress={close}>Discard</Button>
          </div>
        )}
      </Dialog>
    </DialogTrigger>
  );
}

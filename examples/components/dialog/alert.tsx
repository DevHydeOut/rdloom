import { Button, Dialog, DialogTrigger } from "@rdloom/react";

export default function DialogAlertExample() {
  return (
    <DialogTrigger>
      <Button variant="danger">Delete project</Button>
      {/* alertdialog: screen readers announce it as urgent. Not dismissable by clicking outside. */}
      <Dialog title="Delete project?" description="This permanently removes the project and its data." role="alertdialog" size="sm">
        {({ close }) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
            <Button variant="danger" onPress={close}>
              Delete
            </Button>
          </div>
        )}
      </Dialog>
    </DialogTrigger>
  );
}

import { Button, Dialog, DialogTrigger, TextField } from "@rdloom/react";

export default function DialogFormExample() {
  return (
    <DialogTrigger>
      <Button>Invite member</Button>
      <Dialog title="Invite member" description="They'll get an email with a link.">
        {({ close }) => (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              close();
            }}
          >
            <TextField label="Email" type="email" isRequired autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                Cancel
              </Button>
              <Button type="submit">Send invite</Button>
            </div>
          </form>
        )}
      </Dialog>
    </DialogTrigger>
  );
}

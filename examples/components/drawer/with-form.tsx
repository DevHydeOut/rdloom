import { Button, DialogTrigger, Drawer, TextField } from "@rdloom/react";

export default function DrawerWithFormExample() {
  return (
    <div className="flex w-full justify-center">
      <DialogTrigger>
        <Button>Add a note</Button>
        <Drawer title="Add a note" description="Notes are visible to your team.">
          {({ close }) => (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                close();
              }}
            >
              <TextField label="Title" name="title" isRequired />
              <TextField label="Note" name="note" />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onPress={close}>
                  Cancel
                </Button>
                <Button type="submit">Save note</Button>
              </div>
            </form>
          )}
        </Drawer>
      </DialogTrigger>
    </div>
  );
}

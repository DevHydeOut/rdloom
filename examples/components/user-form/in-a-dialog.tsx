import { useState } from "react";
import { Button, Dialog, UserForm } from "@rdloom/react";

const roles = [
  { id: "viewer", label: "Viewer", description: "Can read everything, change nothing." },
  { id: "editor", label: "Editor", description: "Can create and change records." },
  { id: "admin", label: "Admin", description: "Can also manage members and billing." },
];

// The modal variant has only the essential fields and no danger zone: the dialog around it owns those decisions.
export default function UserFormInADialogExample() {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className="flex w-full justify-center">
      <Button onPress={() => setOpen(true)}>Edit Tomas Novak</Button>
      <Dialog title="Edit user" description="Changes apply when you save." isOpen={isOpen} onOpenChange={setOpen}>
        <UserForm
          variant="modal"
          mode="edit"
          roles={roles}
          defaultValues={{ name: "Tomas Novak", email: "tomas.novak@example.com", role: "viewer", status: "active" }}
          onSubmit={async () => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { Button, Sheet, UserForm } from "@rdloom/react";

const roles = [
  { id: "viewer", label: "Viewer" },
  { id: "editor", label: "Editor" },
  { id: "admin", label: "Admin" },
];

// The form asks "Discard changes?" itself, also for Escape, and calls onCancel only after the answer.
export default function UserFormInASheetExample() {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className="flex w-full justify-center">
      <Button onPress={() => setOpen(true)}>Edit Tomas Novak</Button>
      <Sheet title="Edit user" description="Changes apply when you save." isDismissable={false} isOpen={isOpen} onOpenChange={setOpen}>
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <UserForm
            layout="plain"
            mode="edit"
            roles={roles}
            defaultValues={{ name: "Tomas Novak", email: "tomas.novak@example.com", role: "viewer", status: "active" }}
            onSubmit={async () => {
              await new Promise((resolve) => setTimeout(resolve, 600));
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      </Sheet>
    </div>
  );
}

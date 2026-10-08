import { useState } from "react";
import { Button, Sheet, UserForm } from "@rdloom/react";

const roles = [
  { id: "viewer", label: "Viewer", description: "Can read everything, change nothing." },
  { id: "editor", label: "Editor", description: "Can create and change records." },
  { id: "admin", label: "Admin", description: "Can also manage members and billing." },
];
const teams = [
  { id: "support", label: "Support" },
  { id: "finance", label: "Finance" },
  { id: "operations", label: "Operations" },
];
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 700));

// Clicking the backdrop closes the sheet. The form's own Cancel and Escape ask "Discard changes?" first.
export default function UserFormInASheetExample() {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className="flex w-full justify-center">
      <Button onPress={() => setOpen(true)}>Edit Lena Fischer</Button>
      <Sheet title="Edit user" description="Changes apply when you save." isOpen={isOpen} onOpenChange={setOpen}>
        <UserForm
          variant="sheet"
          mode="edit"
          roles={roles}
          teams={teams}
          defaultValues={{
            name: "Lena Fischer",
            email: "lena.fischer@example.com",
            role: "editor",
            status: "active",
            team: "finance",
            jobTitle: "Finance lead",
            phoneCountry: "DE",
            phone: "30 1234 5678",
            street: "Torstrasse 112",
            apartment: "Floor 3",
            city: "Berlin",
            region: "Berlin",
            postalCode: "10119",
            country: "DE",
            timeZone: "Europe/Berlin",
            language: "de",
            bio: "Runs month-end close and keeps the books tidy.",
          }}
          onSubmit={async () => {
            await wait();
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
          onSuspend={wait}
          onDelete={async () => {
            await wait();
            setOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

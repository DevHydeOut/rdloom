import { Button, DialogTrigger, InviteDialog } from "@rdloom/react";

const roles = [
  { id: "viewer", label: "Viewer", description: "reads everything." },
  { id: "editor", label: "Editor", description: "changes records." },
  { id: "admin", label: "Admin", description: "manages members and billing." },
];

// Stands in for your own request.
async function sendInvites(invites: { email: string; role: string }[]) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  console.log("Invited", invites);
}

export default function InviteDialogManyPeopleExample() {
  return (
    <div className="flex w-full justify-center">
      <DialogTrigger>
        <Button>Invite people</Button>
        <InviteDialog
          roles={roles}
          defaultRole="viewer"
          maxVisibleRows={4}
          defaultInvites={[
            { email: "amara.okafor@example.com" },
            { email: "lena.fischer@example.com", role: "editor" },
            { email: "tomas.novak@example.com" },
            { email: "priya.raman@example.com" },
            { email: "diego.alvarez@example.com", role: "admin" },
            { email: "mei.tanaka@example.com" },
          ]}
          description="Six people, four rows in view: the list scrolls and the dialog stays on screen."
          onInvite={sendInvites}
        />
      </DialogTrigger>
    </div>
  );
}

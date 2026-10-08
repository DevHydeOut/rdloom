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

export default function InviteDialogBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <DialogTrigger>
        <Button>Invite people</Button>
        <InviteDialog
          roles={roles}
          defaultRole="viewer"
          existingEmails={["amara.okafor@example.com", "lena.fischer@example.com"]}
          description="They get an email with a link to join your workspace."
          onInvite={sendInvites}
        />
      </DialogTrigger>
    </div>
  );
}

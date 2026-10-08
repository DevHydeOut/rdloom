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

export default function InviteDialogWithMessageToggleExample() {
  return (
    <div className="flex w-full justify-center">
      <DialogTrigger>
        <Button>Invite people</Button>
        <InviteDialog
          roles={roles}
          defaultRole="editor"
          messageLabel="Message"
          description="The message is off until you switch it on."
          onInvite={sendInvites}
        />
      </DialogTrigger>
    </div>
  );
}

import { Button, DialogTrigger, InviteDialog } from "@rdloom/react";

const roles = [
  { id: "viewer", label: "Viewer" },
  { id: "editor", label: "Editor" },
];

// Stands in for your own request. The server knows one address already belongs to another workspace,
// and answers with the row it belongs to: names look like invites[1].email.
async function sendInvites(invites: { email: string; role: string }[]) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const index = invites.findIndex((invite) => invite.email.toLowerCase() === "tomas.novak@example.com");
  if (index >= 0) {
    return { fieldErrors: { [`invites[${index}].email`]: "tomas.novak@example.com belongs to another workspace." } };
  }
}

export default function InviteDialogWithServerErrorsExample() {
  return (
    <div className="flex w-full justify-center">
      <DialogTrigger>
        <Button>Invite people</Button>
        <InviteDialog
          roles={roles}
          maxInvites={5}
          description="Try tomas.novak@example.com to see an error from the server on its row."
          onInvite={sendInvites}
        />
      </DialogTrigger>
    </div>
  );
}

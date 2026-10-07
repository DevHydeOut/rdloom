import { Button, DialogTrigger, InviteDialog } from "@rdloom/react";

const roles = [
  { id: "viewer", label: "Viewer" },
  { id: "editor", label: "Editor" },
];

// Shown, but this person may not send: the button stays reachable and says why.
// The server must still refuse the request: UI permission is not security.
export default function InviteDialogPermissionsExample() {
  return (
    <div className="flex w-full justify-center">
      <DialogTrigger>
        <Button>Invite people</Button>
        <InviteDialog
          roles={roles}
          permissions={{ invite: { state: "disabled", reason: "Your plan allows 5 members. Ask an owner to upgrade." } }}
          onInvite={() => {}}
        />
      </DialogTrigger>
    </div>
  );
}

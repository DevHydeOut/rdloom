import { Button, DialogTrigger, InviteDialog } from "@rdloom/react";

const roles = [
  { id: "viewer", label: "Viewer", description: "reads everything." },
  { id: "editor", label: "Editor", description: "changes records." },
  { id: "admin", label: "Admin", description: "manages members and billing." },
];

const directory = [
  { id: "u1", name: "Amara Okafor", email: "amara.okafor@example.com" },
  { id: "u2", name: "Lena Fischer", email: "lena.fischer@example.com" },
  { id: "u3", name: "Tomas Novak", email: "tomas.novak@example.com" },
  { id: "u4", name: "Priya Raman", email: "priya.raman@example.com" },
  { id: "u5", name: "Diego Alvarez", email: "diego.alvarez@example.com" },
  { id: "u6", name: "Mei Tanaka", email: "mei.tanaka@example.com" },
  { id: "u7", name: "Noor Haddad", email: "noor.haddad@example.com" },
  { id: "u8", name: "Jonas Berg", email: "jonas.berg@example.com" },
  { id: "u9", name: "Sofia Rossi", email: "sofia.rossi@example.com" },
  { id: "u10", name: "Kwame Mensah", email: "kwame.mensah@example.com" },
  { id: "u11", name: "Ines Costa", email: "ines.costa@example.com" },
  { id: "u12", name: "Hiro Sato", email: "hiro.sato@example.com" },
];

// Stands in for your own request.
async function sendInvites(invites: { email: string; role: string }[]) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  console.log("Invited", invites);
}

export default function InviteDialogSearchDirectoryExample() {
  return (
    <div className="flex w-full justify-center">
      <DialogTrigger>
        <Button>Invite people</Button>
        <InviteDialog
          variant="search"
          roles={roles}
          defaultRole="viewer"
          people={directory}
          description="Search your directory, or type a full email to invite someone new."
          onInvite={sendInvites}
        />
      </DialogTrigger>
    </div>
  );
}

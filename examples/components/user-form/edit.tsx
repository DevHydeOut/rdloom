import { UserForm } from "@rdloom/react";

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

export default function UserFormEditExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-2xl">
        <UserForm
          mode="edit"
          variant="page"
          layout="card"
          title="Edit Lena Fischer"
          fields={{ address: false, preferences: false, bio: false }}
          roles={roles}
          teams={teams}
          defaultValues={{ name: "Lena Fischer", email: "lena.fischer@example.com", role: "editor", status: "active", team: "finance", jobTitle: "Finance lead", phoneCountry: "DE", phone: "30 1234 5678" }}
          onSubmit={wait}
          onCancel={() => {}}
          onSuspend={wait}
          onDelete={wait}
        />
      </div>
    </div>
  );
}

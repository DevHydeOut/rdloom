import { UserForm } from "@rdloom/react";

const roles = [
  { id: "viewer", label: "Viewer", description: "Can read everything, change nothing." },
  { id: "editor", label: "Editor", description: "Can create and change records." },
  { id: "admin", label: "Admin", description: "Can also manage members and billing." },
];
const teams = [
  { id: "support", label: "Support" },
  { id: "finance", label: "Finance" },
];

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 700));

export default function UserFormEditExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <UserForm
          mode="edit"
          title="Edit Lena Fischer"
          roles={roles}
          teams={teams}
          defaultValues={{ name: "Lena Fischer", email: "lena.fischer@example.com", role: "editor", status: "active", team: "finance" }}
          onSubmit={wait}
          onCancel={() => {}}
          onSuspend={wait}
          onDelete={wait}
        />
      </div>
    </div>
  );
}

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

// Stands in for your own request; it refuses one address so the server error shows.
async function createUser(values: { email: string }) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (values.email === "amara.okafor@example.com") {
    return { fieldErrors: { email: "A user with this email already exists." } };
  }
}

export default function UserFormCreateExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <UserForm
          mode="create"
          title="New user"
          roles={roles}
          teams={teams}
          defaultValues={{ role: "viewer" }}
          onSubmit={createUser}
          onCancel={() => {}}
        />
      </div>
    </div>
  );
}

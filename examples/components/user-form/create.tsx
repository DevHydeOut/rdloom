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

// Stands in for your own request; it refuses one address so the server error shows.
async function createUser(values: { email: string }) {
  await wait();
  if (values.email === "amara.okafor@example.com") {
    return { fieldErrors: { email: "A user with this email already exists." } };
  }
}

export default function UserFormCreateExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-2xl">
        <UserForm
          mode="create"
          variant="page"
          layout="card"
          title="New user"
          fields={{ address: false, preferences: false, bio: false }}
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

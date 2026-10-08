import { UserForm } from "@rdloom/react";

const roles = [
  { id: "viewer", label: "Viewer" },
  { id: "editor", label: "Editor" },
  { id: "admin", label: "Admin" },
];

// Only name, email, role and active: the modal variant inline, with the fields it shows by default.
export default function UserFormMinimalExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <UserForm
          mode="create"
          variant="modal"
          layout="card"
          title="Add a user"
          roles={roles}
          defaultValues={{ role: "viewer" }}
          onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 600))}
          onCancel={() => {}}
        />
      </div>
    </div>
  );
}

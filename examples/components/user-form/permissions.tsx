import { UserForm } from "@rdloom/react";

const roles = [
  { id: "viewer", label: "Viewer" },
  { id: "editor", label: "Editor" },
  { id: "admin", label: "Admin" },
];

// This person may edit details but not roles, and may not delete. The disabled parts stay reachable and say why.
// The server must still refuse those requests: UI permission is not security.
export default function UserFormPermissionsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <UserForm
          mode="edit"
          title="Edit Priya Raman"
          roles={roles}
          defaultValues={{ name: "Priya Raman", email: "priya.raman@example.com", role: "admin", status: "active" }}
          permissions={{
            changeRole: { state: "disabled", reason: "Only owners can change roles." },
            delete: { state: "disabled", reason: "Only owners can delete users." },
          }}
          onSubmit={() => {}}
          onCancel={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}

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

// The whole page: every section, two columns from the lg breakpoint, a sticky footer and the danger zone last.
export default function UserFormPageExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl">
        <UserForm
          mode="edit"
          variant="page"
          title="Edit Lena Fischer"
          roles={roles}
          teams={teams}
          defaultValues={{
            name: "Lena Fischer",
            email: "lena.fischer@example.com",
            role: "editor",
            status: "active",
            team: "finance",
            jobTitle: "Finance lead",
            phoneCountry: "DE",
            phone: "30 1234 5678",
            street: "Torstrasse 112",
            apartment: "Floor 3",
            city: "Berlin",
            region: "Berlin",
            postalCode: "10119",
            country: "DE",
            timeZone: "Europe/Berlin",
            language: "de",
            bio: "Runs month-end close and keeps the books tidy.",
          }}
          onSubmit={wait}
          onCancel={() => {}}
          onSuspend={wait}
          onDelete={wait}
        />
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  ActionButton,
  Avatar,
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  DataTable,
  DialogTrigger,
  InviteDialog,
  PageHeader,
  SegmentedControl,
  SegmentedControlItem,
  Sheet,
  UserForm,
  type DataTableColumn,
  type PermissionValue,
} from "@rdloom/react";

type User = { id: string; name: string; email: string; role: string; status: "active" | "invited" | "suspended"; lastActive: string };

const roles = [
  { id: "viewer", label: "Viewer", description: "Can read everything, change nothing." },
  { id: "editor", label: "Editor", description: "Can create and change records." },
  { id: "admin", label: "Admin", description: "Can also manage members and billing." },
];

const people = ["Amara Okafor", "Lena Fischer", "Tomas Novak", "Priya Raman", "Mateo Silva", "Hana Sato", "Jonas Berg", "Imani Brooks", "Noor Haddad", "Elif Demir", "Rafael Costa", "Sofia Lindqvist"];
const initialUsers: User[] = people.map((name, i) => ({
  id: `u${i + 1}`,
  name,
  email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
  role: roles[i % 3].id,
  status: (["active", "active", "invited", "active", "suspended"] as const)[i % 5],
  lastActive: `2026-10-${String(1 + ((i * 5) % 28)).padStart(2, "0")}`,
}));

const statusTone = { active: "success", invited: "info", suspended: "warning" } as const;
const day = (iso: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Viewer = "admin" | "manager" | "viewer";

// What each kind of person may do. The app decides; the blocks only receive the answers.
// The server must check every one of these again: what the page shows is not security.
function permissionsFor(viewer: Viewer) {
  const no = (reason: string): PermissionValue => ({ state: "disabled", reason });
  return {
    invite: viewer === "viewer" ? no("Only managers and admins can invite people") : true,
    edit: viewer === "viewer" ? "hidden" : true,
    suspend: viewer === "viewer" ? "hidden" : true,
    remove: viewer === "admin" ? true : viewer === "manager" ? no("Only admins can remove people") : ("hidden" as PermissionValue),
    select: viewer === "viewer" ? "hidden" : true,
  } as const;
}

export default function DataTableUserManagementExample() {
  const [users, setUsers] = useState(initialUsers);
  const [viewer, setViewer] = useState<Viewer>("admin");
  const [editing, setEditing] = useState<User | null>(null);
  const can = permissionsFor(viewer);

  const columns: DataTableColumn<User>[] = [
    {
      id: "name",
      header: "Name",
      sortable: true,
      cell: (u) => (
        <span className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" decorative />
          <span className="font-medium">{u.name}</span>
        </span>
      ),
    },
    { id: "email", header: "Email", hideOnMobile: true },
    { id: "role", header: "Role", sortable: true, cell: (u) => roles.find((r) => r.id === u.role)?.label ?? u.role },
    { id: "status", header: "Status", sortable: true, cell: (u) => <Badge variant={statusTone[u.status]} size="sm">{u.status}</Badge> },
    { id: "lastActive", header: "Last active", sortable: true, hideOnMobile: true, cell: (u) => day(u.lastActive) },
  ];

  const setStatus = (ids: string[], status: User["status"]) =>
    wait(500).then(() => setUsers((all) => all.map((u) => (ids.includes(u.id) ? { ...u, status } : u))));
  const remove = (ids: string[]) => wait(500).then(() => setUsers((all) => all.filter((u) => !ids.includes(u.id))));

  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[var(--rd-color-text-muted)]">View as</span>
          <SegmentedControl label="View as" size="sm" selectedKey={viewer} onChange={(key) => setViewer(String(key) as Viewer)}>
            <SegmentedControlItem id="admin">Admin</SegmentedControlItem>
            <SegmentedControlItem id="manager">Manager</SegmentedControlItem>
            <SegmentedControlItem id="viewer">Viewer</SegmentedControlItem>
          </SegmentedControl>
        </div>

        <PageHeader
          title="Users"
          description="Everyone with access to this workspace."
          breadcrumbs={
            <Breadcrumbs label="You are here">
              <BreadcrumbItem>Settings</BreadcrumbItem>
              <BreadcrumbItem>Users</BreadcrumbItem>
            </Breadcrumbs>
          }
          actions={
            viewer === "viewer" ? (
              <ActionButton permission={can.invite} onAction={() => {}}>
                Invite people
              </ActionButton>
            ) : (
              <DialogTrigger>
                <Button>Invite people</Button>
                <InviteDialog
                  roles={roles}
                  defaultRole="viewer"
                  existingEmails={users.map((u) => u.email)}
                  description="They get an email with a link to join your workspace."
                  onInvite={async (invites) => {
                    await wait(600);
                    setUsers((all) => [
                      ...invites.map((invite, i) => ({
                        id: `new-${Date.now()}-${i}`,
                        name: invite.email.split("@")[0].replace(".", " "),
                        email: invite.email,
                        role: invite.role,
                        status: "invited" as const,
                        lastActive: "2026-10-07",
                      })),
                      ...all,
                    ]);
                  }}
                />
              </DialogTrigger>
            )
          }
        />

        <DataTable
          label="Users"
          rows={users}
          columns={columns}
          getRowId={(u) => u.id}
          searchable={["name", "email"]}
          searchPlaceholder="Search people"
          filters={[
            { id: "role", label: "Role", options: roles.map((r) => r.label) },
            { id: "status", label: "Status", options: ["active", "invited", "suspended"] },
          ]}
          pageSize={8}
          selectionMode="multiple"
          permissions={{ select: can.select, rowActions: can.edit === "hidden" ? "hidden" : true }}
          bulkActions={[
            {
              id: "suspend",
              label: "Suspend",
              permission: can.suspend,
              confirm: { title: "Suspend the selected people?", confirmLabel: "Suspend" },
              onAction: (rows) => setStatus(rows.map((u) => u.id), "suspended"),
            },
            {
              id: "remove",
              label: "Remove",
              variant: "danger",
              permission: can.remove,
              confirm: { title: "Remove the selected people?", description: "They lose access right away.", confirmLabel: "Remove" },
              onAction: (rows) => remove(rows.map((u) => u.id)),
            },
          ]}
          rowActions={(user) => [
            { id: "edit", label: "Edit user", permission: can.edit, onAction: () => setEditing(user) },
            {
              id: "suspend",
              label: user.status === "suspended" ? "Reinstate" : "Suspend",
              permission: can.suspend,
              onAction: () => setStatus([user.id], user.status === "suspended" ? "active" : "suspended"),
            },
            {
              id: "remove",
              label: "Remove from workspace",
              variant: "danger",
              permission: can.remove,
              confirm: { title: `Remove ${user.name}?`, description: "They lose access right away.", confirmLabel: "Remove" },
              onAction: () => remove([user.id]),
            },
          ]}
          onRowOpen={(user) => can.edit !== "hidden" && setEditing(user)}
        />

        <Sheet title="Edit user" description="Changes apply when you save." isOpen={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
          {editing && (
            <UserForm
              variant="sheet"
              mode="edit"
              roles={roles}
              fields={{ address: false, preferences: false, bio: false, team: false }}
              defaultValues={{ name: editing.name, email: editing.email, role: editing.role, status: editing.status === "suspended" ? "suspended" : "active" }}
              onSubmit={async (values) => {
                await wait(600);
                setUsers((all) => all.map((u) => (u.id === editing.id ? { ...u, name: values.name, role: values.role, status: values.status } : u)));
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
              onSuspend={async (suspended) => {
                await setStatus([editing.id], suspended ? "suspended" : "active");
              }}
              onDelete={async () => {
                await remove([editing.id]);
                setEditing(null);
              }}
              permissions={{ delete: can.remove, suspend: can.suspend }}
            />
          )}
        </Sheet>
      </div>
    </div>
  );
}

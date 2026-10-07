import { ApiKeyList } from "@rdloom/react";

const scopes = [{ id: "read", label: "Read" }, { id: "write", label: "Write" }];

// Create key and Revoke are shown but not allowed: they stay reachable and say why.
// The server must still refuse the request: UI permission is not security.
export default function ApiKeyListPermissionsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-3xl">
        <ApiKeyList
          keys={[{ id: "k1", name: "Deploy script", prefix: "rk_demo_8f2a", scopes: ["read"], createdAt: "2027-01-03", lastUsedAt: "2027-02-12" }]}
          scopes={scopes}
          onCreate={async () => ({ secret: "rk_demo_example" })}
          onRevoke={() => {}}
          permissions={{
            create: { state: "disabled", reason: "Only admins can create keys." },
            revoke: { state: "disabled", reason: "Only admins can revoke keys." },
          }}
        />
      </div>
    </div>
  );
}

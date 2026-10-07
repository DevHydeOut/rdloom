import { useState } from "react";
import { ApiKeyList } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const scopes = [
  { id: "read", label: "Read", description: "Read records and reports." },
  { id: "write", label: "Write", description: "Create and change records." },
  { id: "billing", label: "Billing", description: "Read invoices and usage." },
];

type Key = { id: string; name: string; prefix: string; scopes: string[]; createdAt: string; lastUsedAt: string | null };

const start: Key[] = [
  { id: "k1", name: "Deploy script", prefix: "rk_demo_8f2a", scopes: ["read", "write"], createdAt: "2027-01-03", lastUsedAt: "2027-02-12" },
  { id: "k2", name: "Reporting job", prefix: "rk_demo_c41d", scopes: ["read"], createdAt: "2026-11-09", lastUsedAt: null },
];

// Create a key to see the secret shown once; revoke one by typing its name. Your server makes and stores the key.
export default function ApiKeyListBasicExample() {
  const [keys, setKeys] = useState(start);
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-3xl">
        <ApiKeyList
          keys={keys}
          scopes={scopes}
          onCreate={async (name, chosen) => {
            await wait(600);
            const secret = "rk_demo_4f9c2d71a8b34e5f9a60c1d2e3b4a5f6";
            setKeys((current) => [{ id: `k${current.length + 3}`, name, prefix: secret.slice(0, 12), scopes: chosen, createdAt: "2027-03-01", lastUsedAt: null }, ...current]);
            return { secret };
          }}
          onRevoke={async (key) => {
            await wait(500);
            setKeys((current) => current.filter((k) => k.id !== key.id));
          }}
        />
      </div>
    </div>
  );
}

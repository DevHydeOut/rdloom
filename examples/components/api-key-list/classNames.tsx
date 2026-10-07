import { ApiKeyList } from "@rdloom/react";

const scopes = [{ id: "read", label: "Read" }, { id: "write", label: "Write" }];

// Restyle single parts without editing the file.
export default function ApiKeyListClassNamesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-3xl">
        <ApiKeyList
          keys={[{ id: "k1", name: "Deploy script", prefix: "rk_demo_8f2a", scopes: ["read", "write"], createdAt: "2027-01-03", lastUsedAt: null }]}
          scopes={scopes}
          onCreate={async () => ({ secret: "rk_demo_example" })}
          onRevoke={() => {}}
          classNames={{ root: "[box-shadow:none]", title: "tracking-tight", prefix: "font-mono", scope: "uppercase", item: "bg-[var(--rd-color-surface-subtle)]" }}
        />
      </div>
    </div>
  );
}

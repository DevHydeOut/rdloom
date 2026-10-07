import { ApiKeyList } from "@rdloom/react";

const scopes = [{ id: "read", label: "Read" }];
const create = async () => ({ secret: "rk_demo_example" });

// Loading, no keys yet, and a failed load with a retry. Pass the state your data layer is in.
export default function ApiKeyListStatesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <ApiKeyList keys={[]} scopes={scopes} state="loading" onCreate={create} onRevoke={() => {}} />
        <ApiKeyList keys={[]} scopes={scopes} onCreate={create} onRevoke={() => {}} />
        <ApiKeyList keys={[]} scopes={scopes} state="error" onRetry={() => {}} onCreate={create} onRevoke={() => {}} />
      </div>
    </div>
  );
}

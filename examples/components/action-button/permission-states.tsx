import { ActionButton } from "@rdloom/react";

// The server must still check every action: these only change what people see.
export default function ActionButtonPermissionStatesExample() {
  const act = async () => {};
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ActionButton permission="allow" onAction={act}>
        Allowed
      </ActionButton>
      <ActionButton permission={{ state: "disabled", reason: "Only admins can export" }} variant="secondary" onAction={act}>
        Export (disabled with reason)
      </ActionButton>
      <ActionButton permission="hidden" onAction={act}>
        Hidden
      </ActionButton>
    </div>
  );
}

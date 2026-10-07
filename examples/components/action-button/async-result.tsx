import { useState } from "react";
import { ActionButton, type ActionState } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ActionButtonAsyncResultExample() {
  const [log, setLog] = useState("Nothing yet");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <ActionButton
          onAction={async () => {
            await wait(1000);
            return "Saved";
          }}
          successMessage="Saved"
          onSuccess={(result) => setLog(`Success: ${String(result)}`)}
          onStateChange={(state: ActionState) => {
            if (state === "pending") setLog("Working");
          }}
        >
          Save changes
        </ActionButton>
        <ActionButton
          variant="secondary"
          onAction={async () => {
            await wait(1000);
            throw new Error("The server said no");
          }}
          errorMessage="Could not sync"
          onError={(error) => setLog(`Error: ${(error as Error).message}`)}
        >
          Sync (fails)
        </ActionButton>
      </div>
      <p className="text-sm text-[var(--rd-color-text-muted)]">{log}</p>
    </div>
  );
}

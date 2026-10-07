import { UsageMeter } from "@rdloom/react";

// The upgrade button is shown but not allowed: it stays reachable and says why.
// The server must still refuse the request: UI permission is not security.
export default function UsageMeterPermissionsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <UsageMeter
          label="Storage"
          value={4.6}
          limit={5}
          unit="GB"
          onUpgrade={() => {}}
          permissions={{ upgrade: { state: "disabled", reason: "Ask a billing owner to upgrade the plan." } }}
        />
      </div>
    </div>
  );
}

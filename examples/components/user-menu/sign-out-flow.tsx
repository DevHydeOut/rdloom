import { useState } from "react";
import { UserMenu } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Sign out asks first, shows "Signing out..." while it works, then says how it went from a status region
// that stays on the page. Turn on "fail" to see the error message.
export default function UserMenuSignOutFlowExample() {
  const [fail, setFail] = useState(false);
  const [log, setLog] = useState("Signed in");
  return (
    <div className="flex flex-col items-center gap-4 p-8 pb-48">
      <UserMenu
        user={{ name: "Ada Lovelace", email: "ada@example.com" }}
        confirm={{ title: "Sign out of Loomworks?", description: "You will need to sign in again to see your workspace." }}
        onSignOut={async () => {
          await wait(1200);
          if (fail) throw new Error("The server did not answer");
        }}
        signedOutMessage="You have signed out of Loomworks"
        errorMessage="Could not sign out. Try again."
        onSignedOut={() => setLog("Signed out: now go to your sign-in page")}
        onError={() => setLog("Sign-out failed")}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={fail} onChange={(event) => setFail(event.target.checked)} />
        Make the sign-out fail
      </label>
      <p className="text-sm text-[var(--rd-color-text-muted)]">{log}</p>
    </div>
  );
}

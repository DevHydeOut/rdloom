import { useState } from "react";
import { Bubble, Marker } from "@rdloom/react";

export default function MarkerUnreadExample() {
  const [jumped, setJumped] = useState(false);
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-md flex-col gap-3">
        <Bubble>Thanks for the update.</Bubble>
        <Marker variant="unread" label="New messages" jumpLabel="Jump to first new message" onJump={() => setJumped(true)} />
        <Bubble>Can you review the draft?</Bubble>
        {jumped && (
          <p role="status" className="text-center text-xs text-[var(--rd-color-text-muted)]">
            Jumped to the first new message
          </p>
        )}
      </div>
    </div>
  );
}

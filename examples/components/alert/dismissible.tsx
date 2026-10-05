import { useState } from "react";
import { Alert, Button } from "@rdloom/react";

// onDismiss shows the close button; you decide what dismissing does.
export default function AlertDismissibleExample() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex w-[28rem] max-w-full flex-col items-start gap-3">
      {open ? (
        <Alert variant="info" title="New: keyboard shortcuts" onDismiss={() => setOpen(false)}>
          Press ? anywhere to see them all.
        </Alert>
      ) : (
        <Button variant="secondary" size="sm" onPress={() => setOpen(true)}>
          Show the message again
        </Button>
      )}
    </div>
  );
}

import { useRef, useState } from "react";
import { ActionSheet, Button, DialogTrigger } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// onAction can return a promise. The action shows it is working, the others wait, and the sheet closes when it succeeds.
// When it fails the sheet stays open with a message, so the person can try again or cancel; onError gets the error.
// This one fails the first time and works the second.
export default function ActionSheetAsyncAndErrorExample() {
  const attempts = useRef(0);
  const [last, setLast] = useState("Nothing sent yet.");
  return (
    <div className="flex flex-col items-center gap-3">
      <DialogTrigger>
        <Button variant="secondary">Send reminder</Button>
        <ActionSheet
          title="Invoice 1042 is overdue"
          onError={() => setLast("The reminder could not be sent.")}
          actions={[
            {
              id: "remind",
              label: "Send reminder",
              onAction: async () => {
                await wait(900);
                attempts.current += 1;
                if (attempts.current === 1) throw new Error("offline");
                setLast("Reminder sent.");
              },
            },
            { id: "snooze", label: "Snooze for a week", onAction: () => wait(600) },
          ]}
        />
      </DialogTrigger>
      <p role="status" className="text-sm text-[var(--rd-color-text-muted)]">
        {last}
      </p>
    </div>
  );
}

import { useState } from "react";
import { Button, Confetti } from "@rdloom/react";

export default function ConfettiOnActiveExample() {
  const [done, setDone] = useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Confetti isActive={done} particleCount={60} onComplete={() => setDone(false)} />
      <Button onPress={() => setDone(true)}>Finish the task</Button>
      <p role="status" className="text-sm text-[var(--rd-color-text-muted)]">
        {done ? "Task complete" : "Press the button when you are done"}
      </p>
    </div>
  );
}

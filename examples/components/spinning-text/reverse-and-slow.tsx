import { useState } from "react";
import { Button, SpinningText } from "@rdloom/react";

// Turning the other way, slowly, with a switch to hold it still.
export default function SpinningTextReverseAndSlowExample() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="text-sm font-medium uppercase tracking-widest">
        <SpinningText reverse duration={40} isPaused={paused} radius={64}>
          {"slow down • breathe in • breathe out • "}
        </SpinningText>
      </div>
      <Button variant="ghost" size="sm" onPress={() => setPaused((p) => !p)} aria-pressed={paused}>
        {paused ? "Resume motion" : "Pause motion"}
      </Button>
    </div>
  );
}

import { useState } from "react";
import { Button, ShinyButton } from "@rdloom/react";

// Anything that keeps moving should be stoppable: isPaused freezes the effect.
export default function ShinyButtonPausedExample() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex w-full items-center justify-center gap-3">
      <ShinyButton isPaused={paused}>Get started</ShinyButton>
      <Button variant="ghost" size="sm" onPress={() => setPaused((p) => !p)} aria-pressed={paused}>
        {paused ? "Resume motion" : "Pause motion"}
      </Button>
    </div>
  );
}

import { useState } from "react";
import { Button, RainbowButton } from "@rdloom/react";

// Anything that keeps moving should be stoppable: isPaused freezes the effect.
export default function RainbowButtonPausedExample() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex w-full items-center justify-center gap-3">
      <RainbowButton isPaused={paused}>Get started</RainbowButton>
      <Button variant="ghost" size="sm" onPress={() => setPaused((p) => !p)} aria-pressed={paused}>
        {paused ? "Resume motion" : "Pause motion"}
      </Button>
    </div>
  );
}

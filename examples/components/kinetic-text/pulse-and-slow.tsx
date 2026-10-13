import { useState } from "react";
import { Button, KineticText } from "@rdloom/react";

// A slow pulse, with a switch to stop it.
export default function KineticTextPulseAndSlowExample() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <KineticText effect="pulse" duration={3} stagger={0.15} isPaused={paused} className="text-2xl font-semibold">
        Heartbeat
      </KineticText>
      <Button variant="ghost" size="sm" onPress={() => setPaused((p) => !p)} aria-pressed={paused}>
        {paused ? "Resume motion" : "Pause motion"}
      </Button>
    </div>
  );
}

import { useState } from "react";
import { Button, ShimmerButton } from "@rdloom/react";

// Anything that keeps moving should be stoppable: isPaused freezes the shimmer.
export default function ShimmerButtonPausedExample() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <ShimmerButton isPaused={paused}>Upgrade</ShimmerButton>
      <Button variant="ghost" size="sm" onPress={() => setPaused((p) => !p)} aria-pressed={paused}>
        {paused ? "Resume motion" : "Pause motion"}
      </Button>
    </div>
  );
}

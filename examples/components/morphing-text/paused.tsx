import { useState } from "react";
import { Button, MorphingText } from "@rdloom/react";

// Anything that keeps moving should be stoppable: isPaused holds the current phrase.
export default function MorphingTextPausedExample() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="text-3xl font-semibold">
        <MorphingText texts={["Plan", "Draft", "Review", "Publish"]} isPaused={paused} />
      </div>
      <Button variant="ghost" size="sm" onPress={() => setPaused((p) => !p)} aria-pressed={paused}>
        {paused ? "Resume motion" : "Pause motion"}
      </Button>
    </div>
  );
}

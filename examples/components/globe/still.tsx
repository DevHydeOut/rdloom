import { useState } from "react";
import { Button, Globe } from "@rdloom/react";

export default function GlobeStillExample() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full max-w-xs">
        <Globe label="Globe" description="A globe of dots that can be held still." isPaused={paused} />
      </div>
      <Button variant="secondary" onPress={() => setPaused((p) => !p)}>
        {paused ? "Turn the globe" : "Hold the globe still"}
      </Button>
    </div>
  );
}

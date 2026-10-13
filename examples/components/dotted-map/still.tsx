import { useState } from "react";
import { Button, DottedMap } from "@rdloom/react";

// Defined once, outside the component, so a re-render does not restart the map.
const places = [
  { lat: -23.5, lng: -46.6, label: "Sao Paulo" },
  { lat: 48.9, lng: 2.4, label: "Paris" },
];
const routes = [{ from: "Sao Paulo", to: "Paris" }];

export default function DottedMapStillExample() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full max-w-xl">
        <DottedMap
          label="Routes"
          description="Two cities joined by an arc."
          markers={places}
          connections={routes}
          dotSpacing={10}
          isPaused={paused}
        />
      </div>
      <Button variant="secondary" onPress={() => setPaused((p) => !p)}>
        {paused ? "Play the arcs" : "Hold the map still"}
      </Button>
    </div>
  );
}

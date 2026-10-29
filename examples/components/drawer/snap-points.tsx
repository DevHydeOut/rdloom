import { useState } from "react";
import { Button, DialogTrigger, Drawer } from "@rdloom/react";

const places = ["Harbor Mills", "Northgate Foods", "Brightwater Supplies", "Lindqvist Textiles", "Orchard Row Cafe", "Kestrel Logistics", "Mill Street Books", "Pine & Co."];

// snapPoints are shares of the available height: this drawer rests at 35%, 60% or 92% of the frame. Drag the handle or header up and
// down to move between them; a drag down from the lowest one closes it. Tab to the Expand button for the keyboard way.
// portalContainer draws it inside the frame, so the shares are of the frame; leave it out to use the screen.
export default function DrawerSnapPointsExample() {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setFrame} className="relative mx-auto flex h-[28rem] w-[22rem] max-w-full items-start justify-center overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] p-6">
      <DialogTrigger>
        <Button variant="secondary">Nearby places</Button>
        <Drawer portalContainer={frame} snapPoints={[0.35, 0.6, 0.92]} defaultSnap={0} title="Nearby places" description="Drag up to see more.">
          <ul className="divide-y divide-[var(--rd-color-border-default)]">
            {places.map((place) => (
              <li key={place} className="py-3 text-sm">
                {place}
              </li>
            ))}
          </ul>
        </Drawer>
      </DialogTrigger>
    </div>
  );
}

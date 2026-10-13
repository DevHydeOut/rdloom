import { Globe, type WorldMarker } from "@rdloom/react";

const offices: WorldMarker[] = [
  { lat: 51.5, lng: -0.1, label: "London office" },
  { lat: 40.7, lng: -74, label: "New York office" },
  { lat: 1.35, lng: 103.8, label: "Singapore office" },
  { lat: -33.9, lng: 151.2, label: "Sydney office" },
];

export default function GlobeMarkersExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xs">
        <Globe
          label="Our offices"
          description="A globe with a glowing dot at each of our four offices."
          markers={offices}
          markerColor="var(--rd-color-action-primary)"
          speed={1.5}
        />
      </div>
    </div>
  );
}

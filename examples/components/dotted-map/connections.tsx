import { DottedMap, type WorldConnection, type WorldMarker } from "@rdloom/react";

const places: WorldMarker[] = [
  { lat: 37.8, lng: -122.4, label: "San Francisco" },
  { lat: 51.5, lng: -0.1, label: "London" },
  { lat: 19.1, lng: 72.9, label: "Mumbai" },
  { lat: 35.7, lng: 139.7, label: "Tokyo" },
];

const routes: WorldConnection[] = [
  { from: "San Francisco", to: "London" },
  { from: "London", to: "Mumbai" },
  { from: "Mumbai", to: "Tokyo" },
];

export default function DottedMapConnectionsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xl">
        <DottedMap
          label="Data centre links"
          description="Four cities linked in a chain by pulsing arcs."
          markers={places}
          connections={routes}
        />
      </div>
    </div>
  );
}

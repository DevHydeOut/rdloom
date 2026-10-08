import { Marker } from "@rdloom/react";

export default function MarkerEventsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-md flex-col gap-2">
        <Marker variant="event" label="Alex joined" />
        <Marker variant="event" label="Topic changed to Launch plan" />
        <Marker variant="event" label="Sam left" />
      </div>
    </div>
  );
}

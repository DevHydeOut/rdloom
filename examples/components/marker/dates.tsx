import { Bubble, Marker } from "@rdloom/react";

export default function MarkerDatesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-md flex-col gap-3">
        <Marker label="Yesterday" dateTime="2026-10-07" />
        <Bubble from="user">See you tomorrow.</Bubble>
        <Marker label="Today" dateTime="2026-10-08" />
        <Bubble>Morning! Ready when you are.</Bubble>
      </div>
    </div>
  );
}

import { UsageMeter } from "@rdloom/react";

// role="meter": a screen reader hears "Seats, 6 of 10 seats".
export default function UsageMeterBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <UsageMeter label="Seats" value={6} limit={10} unit="seats" description="Add people in Members." />
      </div>
    </div>
  );
}

import { UsageMeter } from "@rdloom/react";

// Restyle single parts without editing the file: a thinner track and a bolder label.
export default function UsageMeterClassNamesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <UsageMeter
          label="Storage"
          value={4.2}
          limit={5}
          unit="GB"
          classNames={{ label: "font-semibold", track: "h-1.5", value: "font-medium" }}
        />
      </div>
    </div>
  );
}

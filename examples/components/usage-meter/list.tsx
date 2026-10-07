import { UsageMeterList } from "@rdloom/react";

export default function UsageMeterListExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <UsageMeterList
          label="Usage this period"
          meters={[
            { label: "Seats", value: 8, limit: 10, unit: "seats" },
            { label: "Storage", value: 4.2, limit: 5, unit: "GB", onUpgrade: () => {} },
            { label: "API calls", value: 6200, limit: 10000, description: "Resets on 1 March." },
          ]}
        />
      </div>
    </div>
  );
}

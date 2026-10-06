import { Stat } from "@rdloom/react";

export default function StatWithSparklineExample() {
  return (
    <div className="w-72">
      <Stat
        label="Signups"
        value={1284}
        trend={{ change: 8, label: "vs last week" }}
        data={[12, 18, 14, 22, 19, 27, 31, 28, 36]}
        description="Across all plans"
      />
    </div>
  );
}

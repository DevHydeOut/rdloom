import { Stat } from "@rdloom/react";

// The card look: the trend as a pill at the top right, the number big, a headline, then a note.
export default function StatCardExample() {
  return (
    <div className="w-72 max-w-full">
      <Stat
        variant="card"
        label="Total revenue"
        value="$1,250.00"
        trend={{ change: 12.5 }}
        summary="Trending up this month"
        description="Visitors for the last 6 months"
      />
    </div>
  );
}

import { Stat } from "@rdloom/react";

// A row of cards. The columns follow the space they have: four across, then two, then one.
export default function StatCardsRowExample() {
  return (
    <div className="grid w-[56rem] max-w-full grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),1fr))] gap-4">
      <Stat variant="card" label="Total revenue" value="$1,250.00" trend={{ change: 12.5 }} summary="Trending up this month" description="Visitors for the last 6 months" />
      <Stat variant="card" label="New customers" value={1234} trend={{ change: -20 }} summary="Down 20% this period" description="Acquisition needs attention" />
      <Stat variant="card" label="Active accounts" value={45678} trend={{ change: 12.5 }} summary="Strong user retention" description="Engagement exceeds targets" />
      <Stat variant="card" label="Growth rate" value="4.5%" trend={{ change: 4.5 }} summary="Steady performance increase" description="Meets growth projections" />
    </div>
  );
}

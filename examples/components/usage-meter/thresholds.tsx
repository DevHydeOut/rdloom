import { UsageMeter } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Near the limit (80 percent) and at the limit (100 percent) are said in words with an icon, not only shown in color.
// The upgrade button appears only when it is useful.
export default function UsageMeterThresholdsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-md flex-col gap-6">
        <UsageMeter label="Seats" value={6} limit={10} unit="seats" onUpgrade={() => wait(400)} />
        <UsageMeter label="Storage" value={4.2} limit={5} unit="GB" onUpgrade={() => wait(400)} />
        <UsageMeter label="Projects" value={10} limit={10} onUpgrade={() => wait(400)} />
        <UsageMeter label="API calls" value={11200} limit={10000} onUpgrade={() => wait(400)} />
      </div>
    </div>
  );
}

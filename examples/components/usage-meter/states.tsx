import { UsageMeter, UsageMeterList } from "@rdloom/react";

// A meter loads as a skeleton; the list also has empty and error states.
export default function UsageMeterStatesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-md flex-col gap-8">
        <UsageMeter label="Seats" value={0} limit={10} state="loading" />
        <UsageMeterList meters={[]} state="empty" />
        <UsageMeterList meters={[]} state="error" onRetry={() => {}} />
      </div>
    </div>
  );
}

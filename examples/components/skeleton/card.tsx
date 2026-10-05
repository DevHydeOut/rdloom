import { Skeleton } from "@rdloom/react";

// The loading region says it is busy; the placeholders themselves are silent.
export default function SkeletonCardExample() {
  return (
    <div aria-busy="true" className="flex w-80 max-w-full flex-col gap-3">
      <span role="status" className="sr-only">
        Loading project
      </span>
      <Skeleton variant="rect" height={120} />
      <Skeleton variant="text" lines={2} />
    </div>
  );
}

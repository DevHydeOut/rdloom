import { Skeleton } from "@rdloom/react";

export default function SkeletonTextExample() {
  return (
    <div className="w-80 max-w-full">
      <Skeleton variant="text" lines={3} />
    </div>
  );
}

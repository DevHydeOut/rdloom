import { Skeleton } from "@rdloom/react";

export default function SkeletonAvatarRowExample() {
  return (
    <div aria-busy="true" className="flex w-80 max-w-full items-center gap-3">
      <span role="status" className="sr-only">
        Loading contact
      </span>
      <Skeleton variant="circle" width={40} />
      <div className="flex-1">
        <Skeleton variant="text" lines={2} />
      </div>
    </div>
  );
}

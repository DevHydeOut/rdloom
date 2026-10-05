import { EmptyState } from "@rdloom/react";

export default function EmptyStateCompactExample() {
  return (
    <div className="w-72">
      <EmptyState size="sm" headingLevel={4} title="No comments" description="Be the first to reply." />
    </div>
  );
}

import { Button, EmptyState } from "@rdloom/react";

const FolderIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M2.75 5.5A1.5 1.5 0 0 1 4.25 4h3.4l1.6 1.75h6.5a1.5 1.5 0 0 1 1.5 1.5v6.75a1.5 1.5 0 0 1-1.5 1.5H4.25a1.5 1.5 0 0 1-1.5-1.5V5.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export default function EmptyStateBasicExample() {
  return (
    <div className="w-[28rem] max-w-full">
      <EmptyState icon={<FolderIcon />} title="No projects yet" description="Projects keep your files, tasks and people in one place. Create your first to get started.">
        <Button>Create project</Button>
        <Button variant="ghost">Import</Button>
      </EmptyState>
    </div>
  );
}

import { Button, SectionHeader } from "@rdloom/react";

export default function SectionHeaderBasicExample() {
  return (
    <div className="flex min-h-[12rem] w-full items-center justify-center">
      <div className="w-full max-w-3xl">
        <SectionHeader title="Recent invoices" description="The last ten, newest first." actions={<Button variant="secondary" size="sm">View all</Button>} />
      </div>
    </div>
  );
}

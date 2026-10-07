import { Button, SectionHeader } from "@rdloom/react";

export default function SectionHeaderBasicExample() {
  return (
    <div className="w-[40rem] max-w-full">
      <SectionHeader title="Recent invoices" description="The last ten, newest first." actions={<Button variant="secondary" size="sm">View all</Button>} />
    </div>
  );
}

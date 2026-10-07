import { Badge, Button, PageHeader } from "@rdloom/react";

export default function PageHeaderBasicExample() {
  return (
    <div className="w-[56rem] max-w-full p-4">
      <PageHeader
        title="Invoice 2041"
        meta={<Badge variant="success">Paid</Badge>}
        description="Issued 3 March to Brightwater Supplies. Paid by bank transfer."
        actions={
          <>
            <Button variant="secondary">Download</Button>
            <Button>Send reminder</Button>
          </>
        }
        border
      />
    </div>
  );
}

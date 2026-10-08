import { Badge, Button, PageHeader } from "@rdloom/react";

export default function PageHeaderBasicExample() {
  return (
    <div className="flex min-h-[12rem] w-full items-center justify-center">
      <div className="w-full max-w-4xl">
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
    </div>
  );
}

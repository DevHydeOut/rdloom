import { Button, PageHeader } from "@rdloom/react";

// While the title is not known yet, isLoading shows skeletons and marks the header busy.
export default function PageHeaderLoadingExample() {
  return (
    <div className="w-[56rem] max-w-full p-4">
      <PageHeader title="Customer" description="Loading the details." isLoading actions={<Button isDisabled>Edit customer</Button>} />
    </div>
  );
}

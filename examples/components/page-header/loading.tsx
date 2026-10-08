import { Button, PageHeader } from "@rdloom/react";

// While the title is not known yet, isLoading shows skeletons and marks the header busy.
export default function PageHeaderLoadingExample() {
  return (
    <div className="flex min-h-[12rem] w-full items-center justify-center">
      <div className="w-full max-w-4xl">
        <PageHeader title="Customer" description="Loading the details." isLoading actions={<Button isDisabled>Edit customer</Button>} />
      </div>
    </div>
  );
}

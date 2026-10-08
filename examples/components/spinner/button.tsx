import { Button, Spinner } from "@rdloom/react";

export default function SpinnerButtonExample() {
  return (
    <div className="flex w-full justify-center">
      <Button variant="secondary" isDisabled>
        <Spinner size="sm" decorative className="text-current" />
        Saving changes
      </Button>
    </div>
  );
}

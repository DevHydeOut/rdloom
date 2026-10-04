import { Button } from "@rdloom/react";

export default function ButtonDisabledExample() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button isDisabled>Publish</Button>
      <Button variant="secondary" isDisabled>
        Archive
      </Button>
    </div>
  );
}

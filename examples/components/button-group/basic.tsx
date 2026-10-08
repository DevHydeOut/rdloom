import { Button, ButtonGroup } from "@rdloom/react";

export default function ButtonGroupBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <ButtonGroup label="Calendar view">
        <Button variant="secondary">Day</Button>
        <Button variant="secondary">Week</Button>
        <Button variant="secondary">Month</Button>
      </ButtonGroup>
    </div>
  );
}

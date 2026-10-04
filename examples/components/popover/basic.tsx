import { Button, Checkbox, Popover, PopoverTrigger } from "@rdloom/react";

export default function PopoverBasicExample() {
  return (
    <PopoverTrigger>
      <Button variant="secondary">Filters</Button>
      <Popover label="Filters">
        <div className="flex w-56 flex-col gap-3">
          <Checkbox defaultSelected>Active</Checkbox>
          <Checkbox>Archived</Checkbox>
        </div>
      </Popover>
    </PopoverTrigger>
  );
}

import { Button, Checkbox, DialogTrigger, Sheet, Slider } from "@rdloom/react";

export default function SheetFiltersExample() {
  return (
    <DialogTrigger>
      <Button variant="secondary">Filters</Button>
      <Sheet title="Filters" description="Narrow down the orders list.">
        {({ close }) => (
          <div className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-2">
              <legend className="pb-2 text-sm font-medium">Status</legend>
              <Checkbox defaultSelected>Paid</Checkbox>
              <Checkbox>Shipped</Checkbox>
              <Checkbox>Refunded</Checkbox>
            </fieldset>
            <Slider label="Total" defaultValue={[50, 500]} maxValue={1000} step={10} formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                Cancel
              </Button>
              <Button onPress={close}>Apply</Button>
            </div>
          </div>
        )}
      </Sheet>
    </DialogTrigger>
  );
}

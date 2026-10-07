import { useState } from "react";
import { Button, Collapsible } from "@rdloom/react";

export default function CollapsibleControlledExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Button variant="secondary" size="sm" onPress={() => setOpen((v) => !v)}>
        {open ? "Close details" : "Open details"}
      </Button>
      <Collapsible title="Delivery details" isExpanded={open} onExpandedChange={setOpen}>
        <p>Delivered by courier on weekdays between 9:00 and 17:00. Someone must be there to sign.</p>
      </Collapsible>
    </div>
  );
}

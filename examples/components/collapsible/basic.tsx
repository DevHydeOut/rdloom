import { Collapsible } from "@rdloom/react";

export default function CollapsibleBasicExample() {
  return (
    <div className="w-full max-w-md">
      <Collapsible title="Advanced options">
        <p>Retries, timeouts and the region used for this request. Most people never need to change these.</p>
      </Collapsible>
    </div>
  );
}

import { Button } from "@rdloom/react";

export default function ButtonVariantsExample() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button>Save</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="danger">Delete</Button>
    </div>
  );
}

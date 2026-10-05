import { Badge } from "@rdloom/react";

export default function BadgeVariantsExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Draft</Badge>
      <Badge variant="info">In review</Badge>
      <Badge variant="success">Paid</Badge>
      <Badge variant="warning">Due soon</Badge>
      <Badge variant="danger">Overdue</Badge>
    </div>
  );
}

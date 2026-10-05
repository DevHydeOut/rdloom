import { Button, Card } from "@rdloom/react";

export default function CardWithFooterExample() {
  return (
    <div className="w-80 max-w-full">
      <Card
        title="Delete project"
        description="This can't be undone."
        footer={
          <>
            <Button variant="danger" size="sm">
              Delete
            </Button>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </>
        }
      >
        <p>All files and comments in &quot;Website redesign&quot; will be removed for everyone.</p>
      </Card>
    </div>
  );
}

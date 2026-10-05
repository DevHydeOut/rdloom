import { Alert, Button } from "@rdloom/react";

export default function AlertWithActionExample() {
  return (
    <div className="w-[28rem] max-w-full">
      <Alert variant="danger" title="Sync failed">
        <p>We couldn&apos;t reach the server. Your changes are saved on this device.</p>
        <div className="mt-2">
          <Button size="sm" variant="secondary">
            Try again
          </Button>
        </div>
      </Alert>
    </div>
  );
}

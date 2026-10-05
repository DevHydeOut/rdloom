import { Alert } from "@rdloom/react";

export default function AlertVariantsExample() {
  return (
    <div className="flex w-[28rem] max-w-full flex-col gap-3">
      <Alert title="Heads up">Reports are generated once a day, at 02:00 UTC.</Alert>
      <Alert variant="success" title="Saved">
        Your changes are live.
      </Alert>
      <Alert variant="warning" title="Storage almost full">
        You have used 92% of your plan. Uploads stop at 100%.
      </Alert>
      <Alert variant="danger" title="Payment failed">
        Your card was declined. Update it to keep your subscription.
      </Alert>
    </div>
  );
}

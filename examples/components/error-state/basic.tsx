import { Button, ErrorState } from "@rdloom/react";

export default function ErrorStateBasicExample() {
  return (
    <div className="w-[40rem] max-w-full">
      <ErrorState
        title="We could not load your invoices"
        description="Check your connection and try again. If it keeps happening, tell your administrator."
        actions={
          <>
            <Button variant="secondary">Back to dashboard</Button>
            <Button>Try again</Button>
          </>
        }
      />
    </div>
  );
}

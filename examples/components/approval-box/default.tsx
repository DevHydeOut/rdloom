import { useState } from "react";
import { ApprovalBox } from "@rdloom/react";

export default function ApprovalBoxExample() {
  const [answer, setAnswer] = useState<string | null>(null);
  return (
    <div className="flex w-[30rem] max-w-full flex-col gap-3">
      {answer ? (
        <p className="text-sm">You chose: {answer}</p>
      ) : (
        <ApprovalBox
          summary="Send this report to finance@example.com"
          risk="medium"
          reversible={false}
          approveLabel="Send report"
          onApprove={() => setAnswer("send")}
          onDeny={() => setAnswer("don't send")}
        >
          Q3 revenue summary, 2 pages.
        </ApprovalBox>
      )}
    </div>
  );
}

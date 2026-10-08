import { useState } from "react";
import { Bubble, BubbleList } from "@rdloom/react";

export default function BubbleFailedRetryExample() {
  const [status, setStatus] = useState<"failed" | "sending" | "sent">("failed");
  const retry = () => {
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 1200);
  };
  return (
    <div className="flex w-full justify-center">
      <BubbleList className="w-[28rem] max-w-full">
        <Bubble from="user" status={status} onRetry={retry} timestamp="2026-10-08T14:02:00" timestampText="14:02">
          Please move the call to Friday.
        </Bubble>
      </BubbleList>
    </div>
  );
}

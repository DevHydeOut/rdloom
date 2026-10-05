import { useEffect, useState } from "react";
import { Button, Response } from "@rdloom/react";

const reply = "Checking the numbers now. **Sales rose in March**, and the biggest gain came from the new annual plan:\n\n- Annual plans: up 18%\n- Monthly plans: flat\n\n```sql\nSELECT month, SUM(total) FROM orders GROUP BY month;\n```";

// The text arrives a few characters at a time. Pass isStreaming while it does: the caret shows, and
// a screen reader waits for the finished text instead of reading every fragment.
export default function ResponseStreamingExample() {
  const [shown, setShown] = useState(0);
  const [run, setRun] = useState(0);
  const done = shown >= reply.length;

  useEffect(() => {
    setShown(0);
    const id = setInterval(() => setShown((n) => (n >= reply.length ? n : n + 3)), 40);
    return () => clearInterval(id);
  }, [run]);

  return (
    <div className="flex w-[34rem] max-w-full flex-col items-start gap-3">
      <Response isStreaming={!done}>{reply.slice(0, shown)}</Response>
      <Button variant="secondary" size="sm" onPress={() => setRun((n) => n + 1)}>
        Replay
      </Button>
    </div>
  );
}

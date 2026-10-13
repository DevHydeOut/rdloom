import { useState } from "react";
import { AnimatedList, Button } from "@rdloom/react";

const events = ["New sign-up from Lisbon", "Order 1042 shipped", "Refund issued for order 1037", "Comment on the roadmap page", "Backup finished"];

export default function AnimatedListLiveFeedExample() {
  const [count, setCount] = useState(2);
  const shown = events.slice(0, count).reverse();
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Button variant="secondary" isDisabled={count >= events.length} onPress={() => setCount((n) => n + 1)}>
        Add an event
      </Button>
      <AnimatedList announce className="w-full max-w-sm" aria-label="Recent events">
        {shown.map((text) => (
          <div
            key={text}
            className="rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] px-4 py-3 text-sm text-[var(--rd-color-text-default)]"
          >
            {text}
          </div>
        ))}
      </AnimatedList>
    </div>
  );
}

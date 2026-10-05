import { Response } from "@rdloom/react";

const reply = `## Quarterly summary

Revenue grew **12%** over last quarter, driven by _new subscriptions_. The three biggest changes:

1. Annual plans rose to \`38%\` of sign-ups
2. Churn fell below 2%
3. Support tickets per customer dropped

| Region | Revenue | Change |
| :----- | ------: | -----: |
| Europe | $412K | +9% |
| Americas | $655K | +14% |

> Numbers are preliminary until the books close.

\`\`\`ts
const growth = (now: number, before: number) => (now - before) / before;
\`\`\`

See the [full report](https://example.com/report) for details.`;

export default function ResponseMarkdownExample() {
  return (
    <div className="w-[34rem] max-w-full">
      <Response>{reply}</Response>
    </div>
  );
}

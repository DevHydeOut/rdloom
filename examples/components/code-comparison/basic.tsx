import { CodeComparison } from "@rdloom/react";

const before = `function total(items) {
  let sum = 0;
  for (const item of items) {
    sum += item.price;
  }
  return sum;
}`;

const after = `function total(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}`;

export default function CodeComparisonBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <CodeComparison className="w-full max-w-5xl" before={before} after={after} language="javascript" />
    </div>
  );
}

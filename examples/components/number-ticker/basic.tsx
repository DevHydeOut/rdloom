import { NumberTicker } from "@rdloom/react";

export default function NumberTickerBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <NumberTicker value={12840} className="text-4xl font-semibold" />
    </div>
  );
}

import { NumberTicker } from "@rdloom/react";

export default function NumberTickerDecimalsExample() {
  return (
    <div className="flex w-full justify-center">
      <NumberTicker value={99.95} from={80} decimals={2} className="text-4xl font-semibold" />
    </div>
  );
}

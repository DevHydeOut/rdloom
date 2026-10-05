// What a fill writes: the next values after a run of source values, the way a
// spreadsheet continues them.
//
//   numbers          2, 4          -> 6, 8, 10      (a steady step continues)
//   text + number    Item 1        -> Item 2, Item 3 (also ORD-0009 -> ORD-0010)
//   ISO dates        2026-01-30    -> 2026-01-31 ... (one date counts up a day; a steady step continues)
//   anything else    a, b          -> a, b, a, b     (the run repeats)
//
// A single plain number is copied, not counted up, as in a spreadsheet; a single
// date or "Item 1" does count up.

const TRAILING_NUMBER = /^([\s\S]*?)(\d+)$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;

const round = (n: number) => Math.round(n * 1e10) / 1e10;
const steady = (numbers: readonly number[], step: number) => numbers.every((n, i) => i === 0 || Math.abs(n - numbers[i - 1] - step) < 1e-9);

/**
 * The `count` values that follow `source`. With `series` off, the run just repeats
 * (what Ctrl+D and Ctrl+R do).
 */
export function extendValues(source: readonly unknown[], count: number, series = true): unknown[] {
  if (count <= 0 || source.length === 0) return [];
  const repeat = () => Array.from({ length: count }, (_, i) => source[i % source.length]);
  if (!series) return repeat();

  if (source.every((v) => typeof v === "number" && Number.isFinite(v))) {
    const numbers = source as number[];
    if (numbers.length < 2) return repeat();
    const step = numbers[1] - numbers[0];
    if (!steady(numbers, step)) return repeat();
    const last = numbers[numbers.length - 1];
    return Array.from({ length: count }, (_, i) => round(last + step * (i + 1)));
  }

  if (source.every((v) => typeof v === "string")) {
    const text = source as string[];

    if (text.every((t) => ISO_DATE.test(t) && !Number.isNaN(Date.parse(t)))) {
      const days = text.map((t) => Date.parse(t) / DAY);
      const step = days.length === 1 ? 1 : days[1] - days[0]; // a lone date counts up a day at a time, as in a spreadsheet
      if (!steady(days, step)) return repeat();
      const last = days[days.length - 1];
      return Array.from({ length: count }, (_, i) => new Date((last + step * (i + 1)) * DAY).toISOString().slice(0, 10));
    }

    const parts = text.map((t) => TRAILING_NUMBER.exec(t));
    if (parts.every((p) => p !== null && p[1] === parts[0]![1])) {
      const digits = parts.map((p) => p![2]);
      const numbers = digits.map(Number);
      const step = numbers.length === 1 ? 1 : numbers[1] - numbers[0];
      const last = numbers[numbers.length - 1];
      const lastDigits = digits[digits.length - 1];
      const padded = /^0\d/.test(lastDigits); // ORD-0009 keeps its width
      const results = Array.from({ length: count }, (_, i) => last + step * (i + 1));
      const safe = steady(numbers, step) && numbers.every(Number.isSafeInteger) && results.every((n) => Number.isSafeInteger(n) && n >= 0);
      if (safe) {
        return results.map((n) => parts[0]![1] + (padded ? String(n).padStart(lastDigits.length, "0") : String(n)));
      }
    }
  }
  return repeat();
}

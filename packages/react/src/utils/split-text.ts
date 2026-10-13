/** Splits text into the units a text effect animates one after another. */
export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function splitLines(text: string): string[] {
  return text.split(/\r?\n/).filter((line) => line.trim() !== "");
}

import tokens from "../../tokens/dist/tokens.json";

// WCAG contrast for every foreground/background pairing the components use,
// in every mode, including hover states a page scan would never see.
// 4.5:1 for text (1.4.3), 3:1 for UI parts like borders and focus rings (1.4.11).

type Mode = keyof typeof tokens.modes;

const pairs: Array<[fg: string, bg: string, min: number, where: string]> = [
  ["color.action.on-primary", "color.action.primary", 4.5, "primary button"],
  ["color.action.on-primary", "color.action.primary-hover", 4.5, "primary button, hover"],
  ["color.action.on-primary", "color.action.danger", 4.5, "danger button"],
  ["color.action.on-primary", "color.action.danger-hover", 4.5, "danger button, hover"],
  ["color.text.default", "color.surface.default", 4.5, "body text"],
  ["color.text.default", "color.surface.subtle", 4.5, "ghost/secondary button, hover"],
  ["color.text.default", "color.surface.raised", 4.5, "dialog, popover, toast text"],
  ["color.text.muted", "color.surface.default", 4.5, "help text, placeholder, tabs"],
  ["color.text.muted", "color.surface.raised", 4.5, "dialog description, toast detail"],
  ["color.text.muted", "color.surface.subtle", 4.5, "unselected pill tab"],
  ["color.text.default", "color.surface.selected", 4.5, "selected grid row"],
  ["color.text.muted", "color.surface.selected", 4.5, "secondary text in a selected row"],
  ["color.feedback.danger", "color.surface.default", 4.5, "error message"],
  ["color.surface.default", "color.text.default", 4.5, "tooltip (inverted)"],
  ["color.border.strong", "color.surface.default", 3, "checkbox/radio border"],
  ["color.action.primary", "color.surface.default", 3, "selected checkbox/radio/switch"],
  ["color.focus.ring", "color.surface.default", 3, "focus ring"],
];

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function value(mode: Mode, path: string): string {
  const token = (tokens.modes[mode] as Record<string, { value: string }>)[path]
    ?? (tokens.modes.light as Record<string, { value: string }>)[path]; // dark falls back to light
  if (!token) throw new Error(`Unknown token ${path}`);
  return token.value;
}

describe.each(Object.keys(tokens.modes) as Mode[])("%s mode contrast", (mode) => {
  it.each(pairs)("%s on %s ≥ %s (%s)", (fg, bg, min) => {
    const ratio = contrast(value(mode, fg), value(mode, bg));
    expect(Number(ratio.toFixed(2))).toBeGreaterThanOrEqual(min);
  });
});

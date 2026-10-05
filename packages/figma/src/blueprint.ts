import type { Combo, ComponentData } from "./plan.ts";

// What each variant looks like in Figma, as data: a small tree of auto-layout
// frames, text and shapes whose colors and radii reference tokens (bound to
// the variables when drawn by sync.ts). Pure, so it's unit-tested without
// Figma. These are starting points that match the components' structure;
// designers refine them, and the plugin never restyles an existing variant.

type Token = string; // e.g. "color.action.primary"

export interface BpFrame {
  kind: "frame";
  name?: string;
  dir?: "row" | "col";
  gap?: number;
  /** Padding: all sides, or [vertical, horizontal]. */
  pad?: number | [number, number];
  fill?: Token;
  stroke?: Token;
  radius?: Token | number;
  /** Fixed width, "fill" the parent, or hug the content (default). */
  w?: number | "fill";
  h?: number;
  align?: "start" | "center" | "end" | "between";
  cross?: "start" | "center" | "end";
  opacity?: number;
  children: BpNode[];
}

export interface BpText {
  kind: "text";
  text: string;
  size: number;
  weight?: "Regular" | "Medium" | "Semi Bold";
  color: Token;
  w?: "fill";
}

export interface BpBox {
  kind: "box";
  name?: string;
  w: number | "fill";
  h: number;
  fill?: Token;
  stroke?: Token;
  radius?: Token | number;
}

export type BpNode = BpFrame | BpText | BpBox;

export const FONT_WEIGHTS = ["Regular", "Medium", "Semi Bold"] as const;

// --- Building blocks -----------------------------------------------------------

const frame = (props: Omit<BpFrame, "kind" | "children">, children: BpNode[]): BpFrame => ({ kind: "frame", ...props, children });
const text = (t: string, size = 14, color: Token = "color.text.default", weight: BpText["weight"] = "Regular", w?: "fill"): BpText => ({
  kind: "text",
  text: t,
  size,
  color,
  weight,
  ...(w ? { w } : {}),
});
const box = (w: number | "fill", h: number, props: Omit<BpBox, "kind" | "w" | "h"> = {}): BpBox => ({ kind: "box", w, h, ...props });

const HEIGHTS: Record<string, number> = { sm: 32, md: 40, lg: 48 };
const FONT: Record<string, number> = { sm: 13, md: 14, lg: 16 };
const PILL = 999;

const on = (combo: Combo, prop: string) => combo[prop] === "true";

/** Label, control box, and an error message when invalid: TextField, Select, pickers. */
function field(label: string, combo: Combo, inner: BpNode[], opts: { h?: number; top?: boolean } = {}): BpFrame {
  const size = combo.size ?? "md";
  const invalid = on(combo, "isInvalid");
  return frame({ name: "field", dir: "col", gap: 6, w: 240, opacity: on(combo, "isDisabled") ? 0.5 : undefined }, [
    text(label, 14, "color.text.default", "Medium"),
    frame(
      {
        name: "control",
        dir: "row",
        gap: 8,
        // Multiline text starts at the top, so it needs top padding too.
        pad: opts.top ? [10, 12] : [0, 12],
        w: "fill",
        h: opts.h ?? HEIGHTS[size] ?? 40,
        cross: opts.top ? "start" : "center",
        fill: "color.surface.default",
        stroke: invalid ? "color.feedback.danger" : "color.border.default",
        radius: "radius.control",
      },
      inner,
    ),
    ...(invalid ? [text("Error message", 12, "color.feedback.danger")] : []),
  ]);
}

const placeholder = (t: string, combo: Combo) => text(t, FONT[combo.size ?? "md"] ?? 14, "color.text.muted", "Regular", "fill");
const chevron = () => text("⌄", 14, "color.text.muted");
const calendarIcon = () => box(14, 14, { stroke: "color.text.muted", radius: 3, name: "calendar icon" });

function button(label: string, variant: "primary" | "secondary" | "ghost" | "danger", size = "md"): BpFrame {
  const filled = variant === "primary" || variant === "danger";
  return frame(
    {
      name: "button",
      dir: "row",
      pad: [0, 16],
      h: HEIGHTS[size] ?? 40,
      align: "center",
      cross: "center",
      radius: "radius.control",
      fill: variant === "primary" ? "color.action.primary" : variant === "danger" ? "color.action.danger" : variant === "secondary" ? "color.surface.subtle" : "color.surface.default",
      stroke: variant === "secondary" ? "color.border.default" : undefined,
    },
    [text(label, FONT[size] ?? 14, filled ? "color.action.on-primary" : "color.text.default", "Medium")],
  );
}

const panel = (props: Omit<BpFrame, "kind" | "children">, children: BpNode[]) =>
  frame({ fill: "color.surface.raised", stroke: "color.border.default", radius: "radius.overlay", ...props }, children);

// --- Per component -------------------------------------------------------------

type Blueprint = (combo: Combo) => BpFrame;

const blueprints: Record<string, Blueprint> = {
  Button: (c) => {
    const b = button("Button", (c.variant as "primary") ?? "primary", c.size);
    return { ...b, opacity: on(c, "isDisabled") ? 0.5 : undefined };
  },

  TextField: (c) =>
    field("Label", c, [placeholder(on(c, "multiline") ? "Write something…" : "Placeholder", c)], on(c, "multiline") ? { h: 88, top: true } : {}),

  Select: (c) => field("Label", c, [placeholder("Select an option", c), chevron()]),

  Combobox: (c) =>
    field("Label", c, [
      ...(c.selectionMode === "multiple"
        ? [1, 2].map((i) => frame({ name: "tag", dir: "row", pad: [2, 8], fill: "color.surface.subtle", radius: "radius.control" }, [text(`Tag ${i}`, 12)]))
        : []),
      placeholder("Search…", c),
      chevron(),
    ]),

  DatePicker: (c) => field("Date", c, [placeholder("mm / dd / yyyy", c), calendarIcon()]),

  DateRangePicker: (c) => ({ ...field("Date range", c, [placeholder("mm/dd/yyyy – mm/dd/yyyy", c), calendarIcon()]), w: 300 }),

  Checkbox: (c) => {
    const checked = on(c, "isIndeterminate");
    return frame({ name: "checkbox", dir: "row", gap: 8, cross: "center", opacity: on(c, "isDisabled") ? 0.5 : undefined }, [
      frame(
        {
          name: "box",
          dir: "row",
          w: 16,
          h: 16,
          align: "center",
          cross: "center",
          radius: 4,
          fill: checked ? "color.action.primary" : "color.surface.default",
          stroke: on(c, "isInvalid") ? "color.feedback.danger" : checked ? undefined : "color.border.strong",
        },
        checked ? [box(8, 2, { fill: "color.action.on-primary", radius: 1, name: "dash" })] : [],
      ),
      text("Checkbox label"),
    ]);
  },

  Switch: (c) => {
    const sm = c.size === "sm";
    return frame({ name: "switch", dir: "row", gap: 8, cross: "center", opacity: on(c, "isDisabled") ? 0.5 : undefined }, [
      frame({ name: "track", dir: "row", pad: 2, w: sm ? 28 : 36, h: sm ? 16 : 20, cross: "center", fill: "color.surface.subtle", stroke: "color.border.strong", radius: PILL }, [
        box(sm ? 12 : 16, sm ? 12 : 16, { fill: "color.surface.raised", radius: PILL, name: "thumb" }),
      ]),
      text("Switch label", sm ? 13 : 14),
    ]);
  },

  Badge: (c) => {
    const sm = c.size === "sm";
    const tone = c.variant ?? "neutral";
    const subtle = tone === "neutral" ? "color.surface.subtle" : `color.feedback.${tone}-subtle`;
    const dot = tone === "neutral" ? "color.text.muted" : `color.feedback.${tone}`;
    return frame(
      { name: "badge", dir: "row", gap: sm ? 4 : 6, pad: sm ? [1, 6] : [2, 8], cross: "center", fill: subtle, stroke: tone === "neutral" ? "color.border.default" : undefined, radius: PILL },
      [box(6, 6, { fill: dot, radius: PILL, name: "dot" }), text("Badge", sm ? 12 : 14, "color.text.default", "Medium")],
    );
  },

  Alert: (c) => {
    const tone = c.variant ?? "info";
    return frame(
      { name: "alert", dir: "row", gap: 12, pad: 12, w: 400, cross: "start", fill: `color.feedback.${tone}-subtle`, stroke: "color.border.default", radius: "radius.overlay" },
      [
        box(20, 20, { stroke: `color.feedback.${tone}`, radius: PILL, name: "icon" }),
        frame({ name: "content", dir: "col", gap: 2, w: "fill" }, [
          text("Alert title", 14, "color.text.default", "Medium"),
          text("What happened and what to do next.", 14, "color.text.default", "Regular", "fill"),
        ]),
      ],
    );
  },

  Card: (c) => {
    const variant = c.variant ?? "outlined";
    const pad = c.padding === "sm" ? 12 : c.padding === "lg" ? 24 : 16;
    return frame(
      {
        name: "card",
        dir: "col",
        gap: pad > 16 ? 16 : 12,
        pad,
        w: 320,
        fill: variant === "subtle" ? "color.surface.subtle" : variant === "raised" ? "color.surface.raised" : "color.surface.default",
        stroke: variant === "subtle" ? undefined : "color.border.default",
        radius: "radius.overlay",
      },
      [
        frame({ name: "header", dir: "col", gap: 2, w: "fill" }, [
          text("Card title", 16, "color.text.default", "Semi Bold"),
          text("Supporting description", 14, "color.text.muted"),
        ]),
        text("Card content goes here.", 14, "color.text.default", "Regular", "fill"),
      ],
    );
  },

  Avatar: (c) => {
    const px: Record<string, number> = { xs: 24, sm: 32, md: 40, lg: 56 };
    const size = px[c.size ?? "md"] ?? 40;
    return frame(
      { name: "avatar", dir: "row", w: size, h: size, align: "center", cross: "center", fill: "color.surface.subtle", stroke: "color.border.default", radius: c.shape === "square" ? "radius.control" : PILL },
      [text("AL", Math.round(size / 3), "color.text.default", "Medium")],
    );
  },

  Progress: (c) => {
    const tone = c.variant ?? "default";
    const bar = tone === "default" ? "color.action.primary" : `color.feedback.${tone}`;
    const h = c.size === "sm" ? 6 : 10;
    const indeterminate = on(c, "isIndeterminate");
    return frame({ name: "progress", dir: "col", gap: 6, w: 320 }, [
      frame({ name: "label row", dir: "row", align: "between", w: "fill" }, [
        text("Uploading report.pdf", 14, "color.text.default", "Medium"),
        ...(indeterminate ? [] : [text("64%", 14, "color.text.muted")]),
      ]),
      frame({ name: "track", dir: "row", w: "fill", h, fill: "color.border.default", radius: PILL }, [
        box(indeterminate ? "fill" : 205, h, { fill: bar, radius: PILL, name: "bar" }),
      ]),
    ]);
  },

  Skeleton: (c) => {
    if (c.variant === "circle") return frame({ name: "skeleton", dir: "row" }, [box(40, 40, { fill: "color.surface.subtle", radius: PILL, name: "shape" })]);
    if (c.variant === "text") {
      return frame({ name: "skeleton", dir: "col", gap: 8, w: 320 }, [
        box("fill", 14, { fill: "color.surface.subtle", radius: "radius.control" }),
        box("fill", 14, { fill: "color.surface.subtle", radius: "radius.control" }),
        box(192, 14, { fill: "color.surface.subtle", radius: "radius.control" }),
      ]);
    }
    return frame({ name: "skeleton", dir: "row" }, [box(320, 96, { fill: "color.surface.subtle", radius: "radius.control", name: "shape" })]);
  },

  RadioGroup: (c) => {
    const invalid = on(c, "isInvalid");
    const radio = (label: string, selected: boolean) =>
      frame({ name: "radio", dir: "row", gap: 8, cross: "center" }, [
        frame(
          { name: "circle", dir: "row", w: 16, h: 16, align: "center", cross: "center", radius: PILL, fill: "color.surface.default", stroke: invalid ? "color.feedback.danger" : selected ? "color.action.primary" : "color.border.strong" },
          selected ? [box(8, 8, { fill: "color.action.primary", radius: PILL, name: "dot" })] : [],
        ),
        text(label),
      ]);
    return frame({ name: "radio group", dir: "col", gap: 8, opacity: on(c, "isDisabled") ? 0.5 : undefined }, [
      text("Group label", 14, "color.text.default", "Medium"),
      frame({ dir: c.orientation === "horizontal" ? "row" : "col", gap: c.orientation === "horizontal" ? 16 : 8 }, [radio("Option one", true), radio("Option two", false)]),
      ...(invalid ? [text("Error message", 12, "color.feedback.danger")] : []),
    ]);
  },

  Tabs: (c) => {
    const vertical = c.orientation === "vertical";
    const labels = ["Overview", "Activity", "Settings"];
    if (c.variant === "pill") {
      return frame({ name: "tab list", dir: vertical ? "col" : "row", gap: 4, pad: 4, fill: "color.surface.subtle", radius: "radius.control" }, labels.map((l, i) =>
        frame({ name: "tab", dir: "row", pad: [6, 12], radius: "radius.control", fill: i === 0 ? "color.surface.raised" : undefined }, [text(l, 14, i === 0 ? "color.text.default" : "color.text.muted", "Medium")]),
      ));
    }
    return frame({ name: "tab list", dir: vertical ? "col" : "row", gap: vertical ? 4 : 20 }, labels.map((l, i) =>
      frame({ name: "tab", dir: vertical ? "row" : "col", gap: vertical ? 8 : 6, cross: vertical ? "center" : "start" }, [
        ...(vertical ? [box(2, 20, { fill: i === 0 ? "color.action.primary" : undefined, name: "indicator" })] : []),
        text(l, 14, i === 0 ? "color.text.default" : "color.text.muted", "Medium"),
        ...(!vertical ? [box("fill", 2, { fill: i === 0 ? "color.action.primary" : undefined, name: "indicator" })] : []),
      ]),
    ));
  },

  Slider: (c) =>
    frame({ name: "slider", dir: "col", gap: 8, w: 240 }, [
      frame({ dir: "row", w: "fill", align: "between" }, [
        text("Label", 14, on(c, "isDisabled") ? "color.text.muted" : "color.text.default", "Medium"),
        text("40", 14, "color.text.muted"),
      ]),
      frame({ name: "track", dir: "row", w: "fill", h: 24, cross: "center", opacity: on(c, "isDisabled") ? 0.5 : undefined }, [
        box(88, 6, { fill: "color.action.primary", radius: PILL, name: "fill" }),
        box(24, 24, { fill: "color.surface.raised", stroke: "color.action.primary", radius: PILL, name: "thumb" }),
        box("fill", 6, { fill: "color.surface.subtle", radius: PILL, name: "rest" }),
      ]),
    ]),

  Dialog: (c) =>
    panel({ name: "dialog", dir: "col", gap: 16, pad: 24, w: c.size === "sm" ? 384 : c.size === "lg" ? 672 : 512 }, [
      frame({ dir: "col", gap: 4, w: "fill" }, [
        text(c.role === "alertdialog" ? "Delete project?" : "Dialog title", 18, "color.text.default", "Semi Bold"),
        text("Supporting text that explains what happens next.", 14, "color.text.muted", "Regular", "fill"),
      ]),
      frame({ dir: "row", gap: 8, w: "fill", align: "end" }, [
        button("Cancel", "secondary"),
        button(c.role === "alertdialog" ? "Delete" : "Continue", c.role === "alertdialog" ? "danger" : "primary"),
      ]),
    ]),

  Sheet: (c) => {
    const bottom = c.side === "bottom";
    const width = bottom ? 480 : c.size === "sm" ? 320 : c.size === "lg" ? 672 : 448;
    const height = bottom ? (c.size === "sm" ? 200 : c.size === "lg" ? 360 : 280) : 480;
    return panel({ name: `sheet (${c.side ?? "end"})`, dir: "col", w: width, h: height }, [
      frame({ name: "header", dir: "row", pad: 20, gap: 16, w: "fill", align: "between", cross: "start" }, [
        frame({ dir: "col", gap: 4 }, [text("Sheet title", 18, "color.text.default", "Semi Bold"), text("Supporting text", 14, "color.text.muted")]),
        text("✕", 16, "color.text.muted"),
      ]),
      box("fill", 1, { fill: "color.border.default", name: "divider" }),
      frame({ name: "body", dir: "col", gap: 8, pad: 20, w: "fill" }, [text("Content", 14, "color.text.muted")]),
    ]);
  },

  Popover: (c) => {
    const arrow = on(c, "showArrow") ? [box(12, 6, { fill: "color.surface.raised", name: "arrow" })] : [];
    const top = c.placement === "top";
    const body = panel({ name: "popover", dir: "col", gap: 8, pad: 12, w: 240 }, [text("Popover title", 14, "color.text.default", "Semi Bold"), text("Extra controls or details.", 14, "color.text.muted", "Regular", "fill")]);
    return frame({ name: `popover (${c.placement ?? "bottom"})`, dir: "col", cross: "center" }, top ? [body, ...arrow] : [...arrow, body]);
  },

  Tooltip: (c) => {
    const arrow = on(c, "showArrow") ? [box(10, 5, { fill: "color.text.default", name: "arrow" })] : [];
    const tip = frame({ name: "tooltip", dir: "row", pad: [6, 10], fill: "color.text.default", radius: "radius.control" }, [text("Tooltip", 12, "color.surface.default")]);
    return frame({ name: `tooltip (${c.placement ?? "top"})`, dir: "col", cross: "center" }, c.placement === "bottom" ? [...arrow, tip] : [tip, ...arrow]);
  },

  Toast: (c) =>
    panel(
      {
        name: "toast",
        dir: "row",
        gap: 12,
        pad: [12, 16],
        w: 320,
        cross: "start",
        stroke: c.variant === "danger" ? "color.feedback.danger" : c.variant === "success" ? "color.feedback.success" : "color.border.default",
      },
      [
        frame({ dir: "col", gap: 2, w: "fill" }, [
          text(c.variant === "danger" ? "Upload failed" : c.variant === "success" ? "Changes saved" : "Notification", 14, "color.text.default", "Semi Bold"),
          text("A short description.", 14, "color.text.muted"),
        ]),
        text("✕", 14, "color.text.muted"),
      ],
    ),

  Menu: (c) => {
    const selectable = c.selectionMode && c.selectionMode !== "none";
    const item = (label: string, i: number, danger = false) =>
      frame({ name: "item", dir: "row", gap: 8, pad: [6, 10], w: "fill", radius: "radius.control", fill: i === 0 ? "color.surface.subtle" : undefined }, [
        ...(selectable ? [text(i === 0 ? "✓" : " ", 12, "color.text.default")] : []),
        text(label, 14, danger ? "color.feedback.danger" : "color.text.default", "Regular", "fill"),
        ...(!selectable && i === 0 ? [text("⌘E", 12, "color.text.muted")] : []),
      ]);
    return panel({ name: "menu", dir: "col", pad: 4, w: 200 }, [item("Edit", 0), item("Duplicate", 1), box("fill", 1, { fill: "color.border.default", name: "separator" }), item("Delete", 2, !selectable)]);
  },

  Accordion: (c) => {
    const multiple = on(c, "allowsMultipleExpanded");
    const section = (title: string, open: boolean): BpNode[] => [
      frame({ name: "item", dir: "col", gap: 8, pad: [16, 0], w: "fill" }, [
        frame({ name: "trigger", dir: "row", w: "fill", align: "between", cross: "center" }, [text(title, 14, "color.text.default", "Medium"), text(open ? "⌃" : "⌄", 14, "color.text.muted")]),
        ...(open ? [text("Answer text for this section.", 14, "color.text.muted", "Regular", "fill")] : []),
      ]),
      box("fill", 1, { fill: "color.border.default", name: "divider" }),
    ];
    return frame({ name: "accordion", dir: "col", w: 360 }, [
      box("fill", 1, { fill: "color.border.default", name: "divider" }),
      ...section("First question", true),
      ...section("Second question", multiple),
      ...section("Third question", false),
    ]);
  },

  Calendar: (c) => {
    const cell = (d: number | null) =>
      frame({ name: "day", dir: "row", w: 32, h: 32, align: "center", cross: "center", radius: "radius.control", fill: d === 15 ? "color.action.primary" : undefined }, d ? [text(String(d), 13, d === 15 ? "color.action.on-primary" : "color.text.default")] : []);
    const weeks: Array<Array<number | null>> = [];
    let day = 1;
    for (let w = 0; w < 5; w++) weeks.push(Array.from({ length: 7 }, () => (day <= 31 ? day++ : null)));
    return panel({ name: "calendar", dir: "col", gap: 8, pad: 12, opacity: on(c, "isDisabled") ? 0.5 : undefined }, [
      frame({ dir: "row", w: "fill", align: "between", cross: "center" }, [text("‹", 16, "color.text.muted"), text("March 2026", 14, "color.text.default", "Semi Bold"), text("›", 16, "color.text.muted")]),
      frame({ dir: "row" }, ["S", "M", "T", "W", "T", "F", "S"].map((d) => frame({ dir: "row", w: 32, h: 24, align: "center", cross: "center" }, [text(d, 12, "color.text.muted")]))),
      ...weeks.map((w) => frame({ name: "week", dir: "row" }, w.map(cell))),
    ]);
  },

  DataGrid: (c) => {
    const rowH = c.density === "compact" ? 32 : c.density === "comfortable" ? 48 : 40;
    const select = c.selectionMode && c.selectionMode !== "none";
    const cols: Array<[string, number]> = [["Name", 140], ["Status", 110], ["Total", 90]];
    const check = () => frame({ dir: "row", w: 36, cross: "center" }, [box(16, 16, { stroke: "color.border.strong", radius: 4, fill: "color.surface.default", name: "checkbox" })]);
    const rowOf = (cells: string[], header: boolean) =>
      frame({ name: header ? "header" : "row", dir: "row", pad: [0, 12], h: header ? 40 : rowH, w: "fill", cross: "center", fill: header ? "color.surface.subtle" : undefined }, [
        ...(select ? [check()] : []),
        ...cells.map((t, i) => frame({ dir: "row", w: cols[i][1], cross: "center" }, [text(t, 14, header ? "color.text.muted" : "color.text.default", header ? "Medium" : "Regular")])),
      ]);
    const data = [["Ada Lovelace", "Paid", "$120.50"], ["Grace Hopper", "Shipped", "$89.00"], ["Alan Turing", "Pending", "$42.10"]];
    return panel({ name: "data grid", dir: "col" }, [rowOf(cols.map((c2) => c2[0]), true), ...data.flatMap((r) => [box("fill", 1, { fill: "color.border.default", name: "divider" }), rowOf(r, false)])]);
  },
};

/** The blueprint for one variant. Unknown components get a labelled box. */
export function blueprintFor(component: ComponentData, combo: Combo): BpFrame {
  const bp = blueprints[component.name];
  if (bp) return bp(combo);
  return panel({ dir: "row", pad: [0, 16], h: 40, cross: "center" }, [text(component.name)]);
}

/** Every token a blueprint references, for checks. */
export function tokensIn(node: BpNode, out = new Set<string>()): Set<string> {
  const add = (t: unknown) => typeof t === "string" && out.add(t);
  if (node.kind === "text") add(node.color);
  else {
    add(node.fill);
    add(node.stroke);
    add(node.radius);
  }
  if (node.kind === "frame") node.children.forEach((c) => tokensIn(c, out));
  return out;
}

export const hasBlueprint = (name: string) => name in blueprints;

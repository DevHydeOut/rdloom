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

/** A Button as the motion buttons draw it: same shape, the label differs. */
function buttonBlueprint(c: Combo, label: string): BpFrame {
  return button(label, (c.variant as "primary" | "secondary" | "ghost" | "danger") ?? "primary", c.size ?? "md");
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
    if (c.layout === "overlay") {
      // Full-image card: picture fills the frame, a scrim and the text sit over its bottom.
      return frame(
        { name: "card overlay", dir: "col", pad: 6, w: 320, h: 420, fill: "color.surface.raised", radius: c.rounded === "large" ? "radius.media" : "radius.overlay" },
        [
          frame({ name: "media", dir: "col", w: "fill", h: 408, align: "end", pad: 16, gap: 12, fill: "color.overlay.backdrop", radius: "radius.media" }, [
            text("Destination", 24, "color.action.on-primary", "Semi Bold"),
            text("Economy", 14, "color.action.on-primary"),
            frame({ name: "button", dir: "row", w: "fill", h: 40, align: "center", cross: "center", fill: "color.surface.default", radius: PILL }, [text("Search flight", 14, "color.text.default", "Semi Bold")]),
          ]),
        ],
      );
    }
    const pad = c.padding === "none" ? 0 : c.padding === "sm" ? 12 : c.padding === "lg" ? 24 : 16;
    return frame(
      {
        name: "card",
        dir: "col",
        gap: pad > 16 ? 16 : 12,
        pad,
        w: 320,
        fill: variant === "subtle" ? "color.surface.subtle" : variant === "raised" || variant === "floating" ? "color.surface.raised" : "color.surface.default",
        stroke: variant === "subtle" || variant === "floating" ? undefined : "color.border.default",
        radius: c.rounded === "large" ? "radius.media" : "radius.overlay",
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

  Collapsible: (c) => {
    return frame({ name: "collapsible", dir: "col", w: 360, stroke: "color.border.default", radius: "radius.control", opacity: on(c, "isDisabled") ? 0.5 : undefined }, [
      frame({ name: "trigger", dir: "row", pad: [12, 16], w: "fill", align: "between", cross: "center" }, [
        frame({ dir: "col", gap: 2 }, [text("Advanced options", 14, "color.text.default", "Medium"), text("3 settings changed", 14, "color.text.muted")]),
        text("v", 14, "color.text.muted"),
      ]),
    ]);
  },

  Separator: (c) => {
    if (c.orientation === "vertical") return frame({ name: "separator", dir: "row", h: 24 }, [box(1, 24, { fill: "color.border.default", name: "line" })]);
    return frame({ name: "separator", dir: "row", w: 320, gap: 12, cross: "center" }, [
      box("fill", 1, { fill: "color.border.default", name: "line" }),
      text("or", 14, "color.text.muted"),
      box("fill", 1, { fill: "color.border.default", name: "line" }),
    ]);
  },

  ToggleButton: (c) => {
    const h = c.size === "sm" ? 28 : c.size === "lg" ? 44 : 36;
    const outline = c.variant === "outline";
    const button = (label: string, pressed: boolean) =>
      frame(
        {
          name: pressed ? "pressed button" : "button",
          dir: "row",
          pad: [0, c.size === "sm" ? 10 : 14],
          h,
          align: "center",
          cross: "center",
          fill: pressed ? (outline ? "color.surface.subtle" : "color.action.primary") : undefined,
          stroke: outline ? (pressed ? "color.action.primary" : "color.border.default") : undefined,
          radius: "radius.control",
        },
        [text(label, c.size === "lg" ? 16 : 14, pressed && !outline ? "color.action.on-primary" : "color.text.default", pressed ? "Semi Bold" : "Medium")],
      );
    return frame({ name: "toggle button group", dir: "row", gap: 4, cross: "center" }, [button("Bold", true), button("Italic", false), button("Underline", false)]);
  },

  AvatarGroup: (c) => {
    const px: Record<string, number> = { xs: 24, sm: 32, md: 40, lg: 56 };
    const size = px[c.size ?? "md"] ?? 40;
    const chip = (label: string, name: string) =>
      frame({ name, dir: "row", w: size, h: size, align: "center", cross: "center", fill: "color.surface.subtle", stroke: "color.border.default", radius: PILL }, [
        text(label, Math.round(size / 3), "color.text.default", "Medium"),
      ]);
    return frame({ name: "avatar group", dir: "row", gap: -Math.round(size / 4), cross: "center" }, [chip("AL", "avatar"), chip("GH", "avatar"), chip("KJ", "avatar"), chip("+3", "overflow")]);
  },

  ActionButton: (c) => buttonBlueprint(c, "Delete user"),

  AlertDialog: (c) => {
    const danger = c.tone === "danger";
    return panel({ name: "alert dialog", dir: "col", gap: 16, pad: 24, w: 448 }, [
      frame({ dir: "col", gap: 4, w: "fill" }, [
        text(danger ? "Delete this user?" : "Confirm this action?", 18, "color.text.default", "Semi Bold"),
        text("Say what will happen and whether it can be undone.", 14, "color.text.muted", "Regular", "fill"),
      ]),
      frame({ dir: "row", gap: 8, w: "fill", align: "end" }, [button("Cancel", "secondary"), button(danger ? "Delete user" : "Confirm", danger ? "danger" : "primary")]),
    ]);
  },

  InputOTP: () =>
    frame({ name: "input otp", dir: "col", gap: 6 }, [
      text("Verification code", 14, "color.text.default", "Medium"),
      frame({ name: "cells", dir: "row", gap: 8 }, [0, 1, 2, 3, 4, 5].map((i) =>
        frame({ name: `cell ${i + 1}`, dir: "row", w: 44, h: 48, align: "center", cross: "center", fill: "color.surface.default", stroke: i === 0 ? "color.focus.ring" : "color.border.default", radius: "radius.control" }, [text(i < 2 ? String(i + 4) : "", 18, "color.text.default", "Medium")]),
      )),
      text("We sent a 6-digit code to your phone.", 12, "color.text.muted"),
    ]),

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

  Breadcrumbs: (c) =>
    frame({ name: "breadcrumbs", dir: "row", gap: 6, cross: "center", opacity: on(c, "isDisabled") ? 0.5 : undefined }, [
      text("Home", 14, "color.text.muted"),
      text("›", 14, "color.text.muted"),
      text("Projects", 14, "color.text.muted"),
      text("›", 14, "color.text.muted"),
      text("Current page", 14, "color.text.default", "Medium"),
    ]),

  Pagination: (c) => {
    const px = c.size === "sm" ? 32 : 40;
    const cell = (label: string, current = false) =>
      frame(
        {
          name: current ? "current page" : "page",
          dir: "row",
          w: px,
          h: px,
          align: "center",
          cross: "center",
          fill: current ? "color.action.primary" : "color.surface.default",
          stroke: current ? undefined : "color.border.default",
          radius: "radius.control",
        },
        [text(label, 14, current ? "color.action.on-primary" : "color.text.default", current ? "Semi Bold" : "Regular")],
      );
    return frame({ name: "pagination", dir: "row", gap: 4, cross: "center", opacity: on(c, "isDisabled") ? 0.5 : undefined }, [
      cell("‹"),
      cell("1"),
      cell("2", true),
      cell("3"),
      text("…", 14, "color.text.muted"),
      cell("10"),
      cell("›"),
    ]);
  },

  SegmentedControl: (c) => {
    const h = c.size === "sm" ? 28 : 36;
    const item = (label: string, selected: boolean) =>
      frame(
        { name: selected ? "selected item" : "item", dir: "row", pad: [0, c.size === "sm" ? 10 : 14], h, align: "center", cross: "center", fill: selected ? "color.action.primary" : undefined, radius: "radius.control" },
        [text(label, 14, selected ? "color.action.on-primary" : "color.text.default", selected ? "Semi Bold" : "Medium")],
      );
    return frame(
      { name: "segmented control", dir: "row", gap: 2, pad: 2, fill: "color.surface.subtle", stroke: "color.border.default", radius: "radius.control", opacity: on(c, "isDisabled") ? 0.5 : undefined },
      [item("List", true), item("Board", false), item("Calendar", false)],
    );
  },

  Table: (c) => {
    const h = c.density === "compact" ? 32 : c.density === "comfortable" ? 52 : 40;
    const selectable = c.selectionMode !== undefined && c.selectionMode !== "none";
    const row = (cells: string[], opts: { header?: boolean; selected?: boolean } = {}) =>
      frame(
        {
          name: opts.header ? "header row" : "row",
          dir: "row",
          pad: [0, 12],
          h,
          w: "fill",
          gap: 12,
          cross: "center",
          fill: opts.header ? "color.surface.subtle" : opts.selected ? "color.surface.selected" : undefined,
        },
        [
          ...(selectable ? [box(16, 16, { stroke: "color.border.strong", fill: opts.selected ? "color.action.primary" : undefined, radius: 4, name: "checkbox" })] : []),
          ...cells.map((t, i) => text(t, 14, opts.header ? "color.text.muted" : "color.text.default", opts.header ? "Medium" : "Regular", i === 0 ? "fill" : undefined)),
        ],
      );
    return frame({ name: "table", dir: "col", w: 440, fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
      row(["Name", "Role", "City"], { header: true }),
      row(["Ada Lovelace", "Mathematician", "London"], { selected: selectable }),
      row(["Grace Hopper", "Rear admiral", "New York"]),
    ]);
  },

  NumberField: (c) => {
    const size = c.size ?? "md";
    return field("Quantity", c, [text("1", FONT[size] ?? 14, "color.text.default", "Regular", "fill"), text("−", 16, "color.text.muted"), text("+", 16, "color.text.muted")]);
  },

  CommandPalette: () =>
    frame({ name: "command palette", dir: "col", w: 560, fill: "color.surface.raised", stroke: "color.border.default", radius: "radius.overlay" }, [
      frame({ name: "search", dir: "row", gap: 12, pad: [0, 16], h: 56, w: "fill", cross: "center" }, [
        box(18, 18, { stroke: "color.text.muted", radius: 999, name: "search icon" }),
        text("Search commands…", 16, "color.text.muted", "Regular", "fill"),
        text("Esc", 12, "color.text.muted"),
      ]),
      box("fill", 1, { fill: "color.border.default", name: "divider" }),
      frame({ name: "results", dir: "col", gap: 2, pad: 8, w: "fill" }, [
        text("Go to", 11, "color.text.muted", "Semi Bold"),
        frame({ name: "item selected", dir: "row", gap: 12, pad: [10, 12], w: "fill", cross: "center", fill: "color.surface.subtle", radius: "radius.control" }, [
          text("Projects", 14, "color.text.default", "Regular", "fill"),
          text("G P", 12, "color.text.muted"),
        ]),
        frame({ name: "item", dir: "row", gap: 12, pad: [10, 12], w: "fill", cross: "center", radius: "radius.control" }, [
          text("Settings", 14, "color.text.default", "Regular", "fill"),
          text("G S", 12, "color.text.muted"),
        ]),
      ]),
    ]),

  FileUpload: (c) =>
    frame({ name: "file upload", dir: "col", gap: 8, w: 400, opacity: on(c, "isDisabled") ? 0.5 : undefined }, [
      text("Attachments", 14, "color.text.default", "Medium"),
      frame({ name: "dropzone", dir: "col", gap: 12, pad: 32, w: "fill", align: "center", cross: "center", fill: "color.surface.subtle", stroke: "color.border.strong", radius: "radius.overlay" }, [
        box(44, 44, { fill: "color.surface.default", stroke: "color.border.default", radius: 999, name: "icon" }),
        text("Drag files here, or", 14, "color.text.default"),
        button("Browse files", "secondary", "sm"),
      ]),
      text("Up to 5 files, 5 MB each.", 12, "color.text.muted"),
    ]),

  TimeField: (c) => {
    const size = c.size ?? "md";
    return field("Start time", c, [text("09", FONT[size] ?? 14), text(":", FONT[size] ?? 14, "color.text.muted"), text("30", FONT[size] ?? 14), text("AM", FONT[size] ?? 14, "color.text.muted")]);
  },

  TagInput: (c) => {
    const tag = (label: string) =>
      frame({ name: "tag", dir: "row", gap: 4, pad: [2, 10], cross: "center", fill: "color.surface.subtle", stroke: "color.border.default", radius: 999 }, [
        text(label, 14),
        text("×", 14, "color.text.muted"),
      ]);
    return frame({ name: "tag input", dir: "col", gap: 6, w: 360, opacity: on(c, "isDisabled") ? 0.5 : undefined }, [
      text("Keywords", 14, "color.text.default", "Medium"),
      frame(
        { name: "field", dir: "row", gap: 6, pad: 6, w: "fill", cross: "center", fill: "color.surface.default", stroke: on(c, "isInvalid") ? "color.feedback.danger" : "color.border.default", radius: "radius.control" },
        [tag("design"), tag("accessibility"), text("Add a keyword", 14, "color.text.muted")],
      ),
      ...(on(c, "isInvalid") ? [text("Error message", 12, "color.feedback.danger")] : []),
    ]);
  },

  // --- AI interface components -------------------------------------------------

  Response: () =>
    frame({ name: "response", dir: "col", gap: 8, w: 440 }, [
      text("Summary", 16, "color.text.default", "Semi Bold"),
      text("Revenue grew 12% over last quarter, led by new annual plans [1].", 14, "color.text.default", "Regular", "fill"),
      frame({ name: "code", dir: "col", pad: 12, w: "fill", fill: "color.surface.subtle", stroke: "color.border.default", radius: "radius.control" }, [
        text("const growth = (now - before) / before;", 13, "color.text.default"),
      ]),
    ]),

  Citation: () =>
    frame({ name: "citation", dir: "row", gap: 6, cross: "center" }, [
      text("Refunds take five days", 14),
      frame({ name: "marker", dir: "row", w: 20, h: 20, align: "center", cross: "center", fill: "color.surface.subtle", stroke: "color.border.strong", radius: PILL }, [
        text("1", 11, "color.text.default", "Medium"),
      ]),
    ]),

  Sources: () => {
    const entry = (n: string, title: string, host: string) =>
      frame({ name: "source", dir: "row", gap: 10, cross: "start" }, [
        frame({ name: "number", dir: "row", w: 20, h: 20, align: "center", cross: "center", stroke: "color.border.strong", radius: PILL }, [text(n, 11, "color.text.default")]),
        frame({ name: "text", dir: "col", gap: 2 }, [text(title, 14, "color.text.default", "Medium"), text(host, 12, "color.text.muted")]),
      ]);
    return frame({ name: "sources", dir: "col", gap: 8, w: 320 }, [
      text("SOURCES", 12, "color.text.muted", "Semi Bold"),
      entry("1", "Refund policy", "example.com"),
      entry("2", "Operations handbook", "example.com"),
    ]);
  },

  ApprovalBox: (c) => {
    const high = c.risk === "high";
    return frame(
      { name: "approval box", dir: "col", gap: 12, pad: 16, w: 400, fill: high ? "color.feedback.danger-subtle" : "color.surface.subtle", stroke: high ? "color.feedback.danger" : "color.border.strong", radius: "radius.overlay" },
      [
        frame({ name: "message", dir: "row", gap: 12, cross: "start" }, [
          box(20, 20, { stroke: high ? "color.feedback.danger" : "color.feedback.info", radius: PILL, name: "icon" }),
          frame({ name: "text", dir: "col", gap: 4, w: "fill" }, [
            text(high ? "Delete 12 draft invoices" : "Send this report to finance", 14, "color.text.default", "Semi Bold"),
            text(high ? "High risk · Can't be undone" : c.risk === "low" ? "Low risk · Can be undone" : "Medium risk", 12, "color.text.muted"),
          ]),
        ]),
        frame({ name: "actions", dir: "row", gap: 8, w: "fill", align: "end" }, [button("Deny", "secondary", "sm"), button(high ? "Delete invoices" : "Approve", high ? "danger" : "primary", "sm")]),
      ],
    );
  },

  ToolCall: () =>
    frame({ name: "tool call", dir: "row", gap: 10, pad: [8, 12], w: 400, cross: "center", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" }, [
      box(16, 16, { stroke: "color.feedback.success", radius: PILL, name: "icon" }),
      text("Searching your sales data", 14, "color.text.default", "Medium", "fill"),
      text("Done · 2.4 s", 12, "color.text.muted"),
    ]),

  AgentActivity: () => {
    const step = (label: string, state: string, tone: string) =>
      frame({ name: "step", dir: "row", gap: 10, pad: [8, 12], w: 400, cross: "center", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" }, [
        box(16, 16, { stroke: tone, radius: PILL, name: "icon" }),
        text(label, 14, "color.text.default", "Medium", "fill"),
        text(state, 12, "color.text.muted"),
      ]);
    return frame({ name: "agent activity", dir: "col", gap: 8 }, [
      text("Working: 1 of 3 steps done", 14, "color.text.muted"),
      step("Searching the knowledge base", "Done", "color.feedback.success"),
      step("Reading 3 documents", "Running", "color.action.primary"),
      step("Writing the summary", "Waiting", "color.border.strong"),
    ]);
  },

  GeneratedTable: () => {
    const row = (cells: string[], head = false) =>
      frame(
        { name: head ? "header" : "row", dir: "row", gap: 0, w: "fill", pad: [8, 12], stroke: "color.border.default" },
        cells.map((cell, i) => text(cell, 14, head ? "color.text.muted" : "color.text.default", head ? "Medium" : "Regular", i === 0 ? "fill" : undefined)),
      );
    return frame({ name: "generated table", dir: "col", gap: 8, w: 400 }, [
      frame({ name: "title", dir: "row", w: "fill", align: "between", cross: "center" }, [
        frame({ name: "text", dir: "col", gap: 2 }, [text("Sales by region", 14, "color.text.default", "Semi Bold"), text("4 rows, 3 columns", 12, "color.text.muted")]),
        button("Download CSV", "secondary", "sm"),
      ]),
      frame({ name: "table", dir: "col", w: "fill", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
        row(["Region", "Orders", "Revenue"], true),
        row(["Europe", "1,240", "412,000"]),
        row(["Americas", "1,985", "655,000"]),
        row(["Asia Pacific", "870", "281,500"]),
      ]),
    ]);
  },

  GeneratedChart: (c) => {
    const bars = [90, 130, 110, 160, 190, 150];
    return frame({ name: "generated chart", dir: "col", gap: 8, w: 400 }, [
      frame({ name: "title", dir: "row", w: "fill", align: "between", cross: "start" }, [
        frame({ name: "text", dir: "col", gap: 2 }, [text("Revenue by month", 14, "color.text.default", "Semi Bold"), text("Revenue grew every month but April.", 12, "color.text.muted")]),
        button("View as table", "secondary", "sm"),
      ]),
      frame(
        { name: "plot", dir: "row", gap: 12, pad: 12, w: "fill", h: 220, cross: "end", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" },
        c.type === "line"
          ? [box(8, 8, { fill: "color.action.primary", radius: PILL }), box(8, 8, { fill: "color.action.primary", radius: PILL }), box(8, 8, { fill: "color.action.primary", radius: PILL })]
          : bars.map((h) => box(40, h, { fill: "color.action.primary", radius: 2, name: "bar" })),
      ),
    ]);
  },

  Message: () =>
    frame({ name: "messages", dir: "col", gap: 16, w: 440 }, [
      frame({ name: "you", dir: "row", w: "fill", align: "end" }, [
        frame({ name: "bubble", dir: "row", pad: [8, 14], fill: "color.surface.selected", radius: "radius.overlay" }, [text("How do refunds work?", 14)]),
      ]),
      frame({ name: "assistant", dir: "row", gap: 12, cross: "start" }, [
        box(28, 28, { fill: "color.surface.subtle", stroke: "color.border.default", radius: PILL, name: "avatar" }),
        text("Refunds are issued within 5 business days.", 14, "color.text.default", "Regular", "fill"),
      ]),
    ]),

  PromptInput: () =>
    frame({ name: "prompt input", dir: "row", gap: 8, pad: 8, w: 440, cross: "center", fill: "color.surface.subtle", stroke: "color.border.default", radius: 28 }, [
      box(40, 40, { name: "plus", radius: PILL, stroke: "color.border.default" }),
      text("Ask anything", 15, "color.text.muted", "Regular", "fill"),
      box(40, 40, { name: "mic", radius: PILL, stroke: "color.border.default" }),
      box(40, 40, { fill: "color.action.primary", radius: PILL, name: "send" }),
    ]),

  Chat: () =>
    frame({ name: "chat", dir: "col", gap: 16, pad: 16, w: 480, h: 360, fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
      frame({ name: "messages", dir: "col", gap: 12, w: "fill" }, [
        frame({ name: "you", dir: "row", w: "fill", align: "end" }, [
          frame({ name: "bubble", dir: "row", pad: [8, 14], fill: "color.surface.selected", radius: "radius.overlay" }, [text("Show me sales from last month", 14)]),
        ]),
        frame({ name: "assistant", dir: "row", gap: 12, cross: "start" }, [
          box(28, 28, { fill: "color.surface.subtle", stroke: "color.border.default", radius: PILL, name: "avatar" }),
          frame({ name: "reply", dir: "col", gap: 8, w: "fill" }, [
            frame({ name: "tool", dir: "row", gap: 8, pad: [6, 10], cross: "center", stroke: "color.border.default", radius: "radius.control" }, [
              box(14, 14, { stroke: "color.feedback.success", radius: PILL, name: "icon" }),
              text("Searching your sales data · Done", 13, "color.text.default"),
            ]),
            text("Sales were up 12% last month.", 14, "color.text.default", "Regular", "fill"),
          ]),
        ]),
      ]),
      frame({ name: "input", dir: "row", gap: 8, pad: 8, w: "fill", cross: "center", fill: "color.surface.subtle", stroke: "color.border.default", radius: 28 }, [
        box(40, 40, { name: "plus", radius: PILL, stroke: "color.border.default" }),
        text("Ask anything", 15, "color.text.muted", "Regular", "fill"),
        box(40, 40, { fill: "color.action.primary", radius: PILL, name: "send" }),
      ]),
    ]),

  // --- Charts, stats and the customer block ------------------------------------

  Chart: (c) => {
    const bars = [90, 130, 110, 160, 190, 150];
    const donut = c.type === "donut";
    return frame({ name: "chart", dir: "col", gap: 8, w: 440 }, [
      frame({ name: "title", dir: "row", w: "fill", align: "between", cross: "start" }, [
        frame({ name: "text", dir: "col", gap: 2 }, [text("Revenue by month", 14, "color.text.default", "Semi Bold"), text("Revenue grew every month but April.", 12, "color.text.muted")]),
        button("View as table", "secondary", "sm"),
      ]),
      frame(
        { name: "plot", dir: "row", gap: 12, pad: 12, w: "fill", h: 240, cross: "end", align: donut ? "center" : undefined, fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" },
        donut
          ? [box(160, 160, { stroke: "color.chart.1", radius: 999, name: "donut" })]
          : c.type === "line" || c.type === "area"
            ? [box(10, 10, { fill: "color.chart.1", radius: 999 }), box(10, 10, { fill: "color.chart.1", radius: 999 }), box(10, 10, { fill: "color.chart.1", radius: 999 }), box(10, 10, { fill: "color.chart.1", radius: 999 })]
            : bars.map((h) => box(44, h, { fill: "color.chart.1", radius: 3, name: "bar" })),
      ),
      frame({ name: "legend", dir: "row", gap: 16 }, [
        frame({ name: "series 1", dir: "row", gap: 6, cross: "center" }, [box(10, 10, { fill: "color.chart.1", radius: 2 }), text("Revenue", 12)]),
        frame({ name: "series 2", dir: "row", gap: 6, cross: "center" }, [box(10, 10, { fill: "color.chart.2", radius: 2 }), text("Cost", 12)]),
      ]),
    ]);
  },

  Sparkline: (c) =>
    frame({ name: "sparkline", dir: "row", gap: 3, w: 96, h: 32, cross: "end" },
      c.type === "bar"
        ? [10, 16, 12, 22, 18, 26, 30].map((h) => box(8, h, { fill: "color.chart.1", radius: 2, name: "bar" }))
        : [box(10, 10, { fill: "color.chart.1", radius: 999 }), box(10, 14, { fill: "color.chart.1", radius: 999 }), box(10, 22, { fill: "color.chart.1", radius: 999 }), box(10, 28, { fill: "color.chart.1", radius: 999 })]),

  Stat: (c) => {
    const big = c.size === "lg" ? 36 : c.size === "sm" ? 22 : 28;
    return frame({ name: "stat", dir: "col", gap: 6, w: 220 }, [
      text("Monthly revenue", 13, "color.text.muted"),
      text("$48,200", big, "color.text.default", "Semi Bold"),
      frame({ name: "trend", dir: "row", gap: 6, pad: [2, 8], cross: "center", fill: "color.feedback.success-subtle", radius: 999 }, [
        text("↑ +12%", 12, "color.text.default", "Medium"),
        text("vs last month", 12, "color.text.muted"),
      ]),
    ]);
  },

  CustomerTable: () => {
    const cell = (label: string, w: number | "fill", head = false, right = false) =>
      frame({ name: head ? "head" : "cell", dir: "row", w, pad: [10, 12], align: right ? "end" : "start", cross: "center" }, [text(label, head ? 12 : 14, head ? "color.text.muted" : "color.text.default", head ? "Semi Bold" : "Regular", right ? undefined : undefined)]);
    const row = (name: string, plan: string, status: string, tone: string, mrr: string) =>
      frame({ name: "row", dir: "row", w: "fill", cross: "center", stroke: "color.border.default" }, [
        frame({ name: "customer", dir: "row", gap: 10, w: 220, pad: [10, 12], cross: "center" }, [
          box(28, 28, { fill: "color.surface.subtle", radius: 999, name: "avatar" }),
          frame({ name: "who", dir: "col" }, [text(name, 14, "color.text.default", "Medium"), text("name@example.com", 12, "color.text.muted")]),
        ]),
        cell(plan, 90),
        frame({ name: "status", dir: "row", w: 110, pad: [10, 12], cross: "center" }, [
          frame({ name: "badge", dir: "row", gap: 6, pad: [2, 8], cross: "center", fill: `color.feedback.${tone}-subtle`, radius: 999 }, [box(6, 6, { fill: `color.feedback.${tone}`, radius: 999 }), text(status, 12, "color.text.default", "Medium")]),
        ]),
        cell(mrr, "fill", false, true),
      ]);
    return frame({ name: "customer table", dir: "col", gap: 16, w: 720 }, [
      frame({ name: "insights", dir: "row", gap: 12, w: "fill" }, [
        frame({ name: "stat card", dir: "col", gap: 6, pad: 16, w: 160, fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [text("Customers", 13, "color.text.muted"), text("24", 28, "color.text.default", "Semi Bold")]),
        frame({ name: "stat card", dir: "col", gap: 6, pad: 16, w: 160, fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [text("Monthly revenue", 13, "color.text.muted"), text("$2,376", 28, "color.text.default", "Semi Bold")]),
        frame({ name: "chart card", dir: "row", gap: 10, pad: 16, w: "fill", h: 96, cross: "end", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
          box(36, 40, { fill: "color.chart.1", radius: 3 }),
          box(36, 64, { fill: "color.chart.1", radius: 3 }),
          box(36, 50, { fill: "color.chart.1", radius: 3 }),
        ]),
      ]),
      frame({ name: "toolbar", dir: "row", gap: 8, w: "fill", cross: "center" }, [
        frame({ name: "search", dir: "row", gap: 8, pad: [0, 12], w: "fill", h: 40, cross: "center", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" }, [text("Search by name, email or company", 14, "color.text.muted")]),
        frame({ name: "filter", dir: "row", gap: 8, pad: [0, 12], w: 140, h: 40, cross: "center", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" }, [text("All statuses", 14, "color.text.muted")]),
        frame({ name: "filter", dir: "row", gap: 8, pad: [0, 12], w: 140, h: 40, cross: "center", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" }, [text("All plans", 14, "color.text.muted")]),
        button("Export CSV", "secondary"),
      ]),
      frame({ name: "table", dir: "col", w: "fill", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
        frame({ name: "header", dir: "row", w: "fill", fill: "color.surface.subtle" }, [cell("CUSTOMER", 220, true), cell("PLAN", 90, true), cell("STATUS", 110, true), cell("MONTHLY REVENUE", "fill", true, true)]),
        row("Ada Lovelace", "Pro", "active", "success", "$99"),
        row("Grace Hopper", "Team", "active", "success", "$499"),
        row("Alan Turing", "Free", "trial", "info", "$0"),
        row("Margaret Hamilton", "Team", "overdue", "warning", "$499"),
      ]),
      frame({ name: "footer", dir: "row", w: "fill", align: "between", cross: "center" }, [text("Showing 1 to 4 of 24", 14, "color.text.muted"), button("1  2  3  ›", "secondary", "sm")]),
    ]);
  },

  DataTable: () => {
    const cell = (label: string, w: number | "fill", head = false, right = false) =>
      frame({ name: head ? "head" : "cell", dir: "row", w, pad: [10, 12], align: right ? "end" : "start", cross: "center" }, [text(label, head ? 12 : 14, head ? "color.text.muted" : "color.text.default", head ? "Semi Bold" : "Regular")]);
    const check = () => frame({ name: "select", dir: "row", w: 44, pad: [10, 12], cross: "center" }, [box(16, 16, { stroke: "color.border.strong", radius: 4, name: "checkbox" })]);
    const row = (order: string, customer: string, status: string, tone: string, total: string) =>
      frame({ name: "row", dir: "row", w: "fill", cross: "center", stroke: "color.border.default" }, [
        check(),
        cell(order, 110),
        cell(customer, 200),
        frame({ name: "status", dir: "row", w: 110, pad: [10, 12], cross: "center" }, [
          frame({ name: "badge", dir: "row", gap: 6, pad: [2, 8], cross: "center", fill: `color.feedback.${tone}-subtle`, radius: 999 }, [box(6, 6, { fill: `color.feedback.${tone}`, radius: 999 }), text(status, 12, "color.text.default", "Medium")]),
        ]),
        cell(total, "fill", false, true),
        frame({ name: "more", dir: "row", w: 44, pad: [10, 12], cross: "center" }, [text("...", 14, "color.text.muted")]),
      ]);
    const filter = (label: string) => frame({ name: "filter", dir: "row", gap: 8, pad: [0, 12], w: 140, h: 40, cross: "center", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" }, [text(label, 14, "color.text.muted")]);
    return frame({ name: "data table", dir: "col", gap: 12, w: 760 }, [
      frame({ name: "toolbar", dir: "row", gap: 8, w: "fill", cross: "center" }, [
        frame({ name: "search", dir: "row", gap: 8, pad: [0, 12], w: "fill", h: 40, cross: "center", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" }, [text("Search", 14, "color.text.muted")]),
        filter("Status: all"),
        filter("Region: all"),
        button("Export CSV", "secondary"),
      ]),
      frame({ name: "table", dir: "col", w: "fill", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
        frame({ name: "header row", dir: "row", w: "fill", fill: "color.surface.subtle" }, [check(), cell("ORDER", 110, true), cell("CUSTOMER", 200, true), cell("STATUS", 110, true), cell("TOTAL", "fill", true, true), cell("", 44, true)]),
        row("#1042", "Northgate Foods", "Paid", "success", "$2,310"),
        row("#1041", "Harbor Mills", "Pending", "warning", "$860"),
        row("#1040", "Brightwater Supplies", "Paid", "success", "$1,240"),
        row("#1039", "Lindqvist Textiles", "Refunded", "info", "$415"),
      ]),
      frame({ name: "pagination", dir: "row", w: "fill", align: "between", cross: "center" }, [text("Showing 1 to 4 of 48", 14, "color.text.muted"), button("1  2  3  ›", "secondary", "sm")]),
    ]);
  },

  Sidebar: (c) => {
    const appearance = String(c.appearance ?? "bordered");
    const item = (label: string, current = false, badge?: string) =>
      frame({ name: current ? "item current" : "item", dir: "row", gap: 12, pad: [0, 12], w: "fill", h: 36, cross: "center", fill: current ? "color.surface.selected" : undefined, radius: "radius.control" }, [
        box(16, 16, { stroke: current ? "color.action.primary" : "color.text.muted", radius: 4, name: "icon" }),
        text(label, 14, current ? "color.text.default" : "color.text.muted", current ? "Medium" : "Regular", "fill"),
        ...(badge ? [frame({ name: "badge", dir: "row", pad: [0, 6], cross: "center", fill: "color.surface.subtle", radius: 999 }, [text(badge, 11, "color.text.default", "Medium")])] : []),
      ]);
    return frame(
      {
        name: `sidebar ${appearance}`,
        dir: "col",
        gap: 4,
        pad: 12,
        w: 256,
        h: 520,
        fill: appearance === "subtle" ? "color.surface.subtle" : appearance === "floating" ? "color.surface.raised" : appearance === "inset" ? undefined : "color.surface.default",
        stroke: appearance === "subtle" || appearance === "inset" ? undefined : "color.border.default",
        radius: appearance === "floating" ? "radius.overlay" : undefined,
      },
      [
        frame({ name: "brand", dir: "row", w: "fill", h: 44, pad: [0, 4], cross: "center" }, [text("Acme Cloud", 15, "color.text.default", "Semi Bold")]),
        item("Dashboard", true),
        item("Customers", false, "24"),
        item("Revenue"),
        item("Inbox", false, "3"),
        frame({ name: "spacer", dir: "col", w: "fill", h: 190 }, []),
        item("Collapse"),
        frame({ name: "account", dir: "row", gap: 10, pad: 8, w: "fill", cross: "center", stroke: "color.border.default", radius: "radius.control" }, [
          box(28, 28, { fill: "color.surface.subtle", radius: 999, name: "avatar" }),
          frame({ name: "who", dir: "col" }, [text("Ada Lovelace", 14, "color.text.default", "Medium"), text("ada@example.com", 12, "color.text.muted")]),
        ]),
      ],
    );
  },

  DashboardShell: () => {
    const item =(label: string, current = false, badge?: string) =>
      frame({ name: current ? "item current" : "item", dir: "row", gap: 12, pad: [0, 12], w: "fill", h: 36, cross: "center", fill: current ? "color.surface.selected" : undefined, radius: "radius.control" }, [
        box(16, 16, { stroke: current ? "color.action.primary" : "color.text.muted", radius: 4, name: "icon" }),
        text(label, 14, current ? "color.text.default" : "color.text.muted", current ? "Medium" : "Regular", "fill"),
        ...(badge ? [frame({ name: "badge", dir: "row", pad: [0, 6], cross: "center", fill: "color.surface.subtle", radius: 999 }, [text(badge, 11, "color.text.default", "Medium")])] : []),
      ]);
    return frame({ name: "dashboard shell", dir: "row", w: 880, h: 480, fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
      frame({ name: "sidebar", dir: "col", gap: 4, pad: 12, w: 240, h: 480, stroke: "color.border.default" }, [
        frame({ name: "brand", dir: "row", w: "fill", h: 44, pad: [0, 4], align: "between", cross: "center" }, [text("Acme Cloud", 15, "color.text.default", "Semi Bold"), box(28, 28, { stroke: "color.border.default", radius: "radius.control", name: "collapse" })]),
        item("Overview", true),
        item("Customers", false, "24"),
        item("Revenue"),
        item("Inbox", false, "3"),
        frame({ name: "spacer", dir: "col", w: "fill", h: 150 }, []),
        frame({ name: "account", dir: "row", gap: 10, pad: 8, w: "fill", cross: "center", stroke: "color.border.default", radius: "radius.control" }, [
          box(28, 28, { fill: "color.surface.subtle", radius: 999, name: "avatar" }),
          frame({ name: "who", dir: "col" }, [text("Ada Lovelace", 14, "color.text.default", "Medium"), text("ada@example.com", 12, "color.text.muted")]),
        ]),
      ]),
      frame({ name: "main", dir: "col", w: "fill", h: 480 }, [
        frame({ name: "header", dir: "row", gap: 12, pad: [0, 16], w: "fill", h: 56, cross: "center", stroke: "color.border.default" }, [
          text("Overview", 15, "color.text.default", "Semi Bold", "fill"),
          frame({ name: "search", dir: "row", pad: [0, 12], w: 200, h: 36, cross: "center", stroke: "color.border.default", radius: "radius.control" }, [text("Search", 14, "color.text.muted")]),
          button("New report", "primary", "sm"),
        ]),
        frame({ name: "page", dir: "col", gap: 16, pad: 24, w: "fill" }, [
          text("Overview", 24, "color.text.default", "Semi Bold"),
          frame({ name: "stats", dir: "row", gap: 12, w: "fill" }, [0, 1, 2].map(() => frame({ name: "stat card", dir: "col", gap: 4, pad: 14, w: "fill", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [text("Monthly revenue", 12, "color.text.muted"), text("$48,200", 22, "color.text.default", "Semi Bold")]))),
        ]),
      ]),
    ]);
  },

  Form: () =>
    frame({ name: "form", dir: "col", gap: 16, w: 320 }, [
      field("Email", { size: "md" }, [placeholder("name@example.com", { size: "md" })]),
      field("Password", { size: "md" }, [placeholder("Password", { size: "md" })]),
      button("Sign in", "primary"),
    ]),

  ErrorSummary: () =>
    frame({ name: "error summary", dir: "row", gap: 12, pad: 14, w: 360, fill: "color.feedback.danger-subtle", stroke: "color.feedback.danger", radius: "radius.overlay" }, [
      box(20, 20, { stroke: "color.feedback.danger", radius: 999, name: "icon" }),
      frame({ name: "message", dir: "col", gap: 6, w: "fill" }, [
        text("There is a problem", 14, "color.text.default", "Medium"),
        text("Email: Enter a valid address", 14, "color.text.default"),
        text("Password: Password is required", 14, "color.text.default"),
      ]),
    ]),

  FieldArray: (c) => {
    const iconButton = (name: string) => box(32, 32, { stroke: "color.border.default", radius: "radius.control", name });
    const row = (n: number) =>
      frame({ name: `row ${n}`, dir: "row", gap: 12, pad: 12, w: "fill", cross: "start", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
        frame({ name: "fields", dir: "row", gap: 12, w: "fill" }, [
          frame({ name: "description", dir: "col", gap: 6, w: "fill" }, [
            text("Description", 14, "color.text.default", "Medium"),
            frame({ name: "control", dir: "row", pad: [0, 12], w: "fill", h: 40, cross: "center", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" }, [text("Design work", 14, "color.text.default")]),
          ]),
          frame({ name: "qty", dir: "col", gap: 6, w: 96 }, [
            text("Qty", 14, "color.text.default", "Medium"),
            frame({ name: "control", dir: "row", pad: [0, 12], w: "fill", h: 40, cross: "center", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.control" }, [text("1", 14, "color.text.default")]),
          ]),
        ]),
        frame({ name: "actions", dir: "row", gap: 2 }, [
          ...(on(c, "allowReorder") ? [iconButton("move up"), iconButton("move down")] : []),
          ...(on(c, "allowInsert") ? [iconButton("insert below")] : []),
          iconButton("remove"),
        ]),
      ]);
    return frame({ name: "field array", dir: "col", gap: 12, w: 560 }, [text("Invoice lines", 14, "color.text.default", "Medium"), row(1), row(2), button("Add line", "secondary", "sm")]);
  },

  DashboardPage: () =>
    frame({ name: "dashboard page", dir: "col", gap: 20, pad: 24, w: 720 }, [
      frame({ name: "title", dir: "row", w: "fill", align: "between", cross: "start" }, [
        frame({ name: "text", dir: "col", gap: 4 }, [text("Customers", 24, "color.text.default", "Semi Bold"), text("Everyone on a plan, with what they pay.", 14, "color.text.muted")]),
        frame({ name: "actions", dir: "row", gap: 8 }, [button("Export", "secondary"), button("Add customer", "primary")]),
      ]),
      frame({ name: "stats", dir: "row", gap: 12, w: "fill" }, [0, 1, 2, 3].map(() => frame({ name: "stat card", dir: "col", gap: 4, pad: 14, w: "fill", fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [text("Customers", 12, "color.text.muted"), text("1,284", 22, "color.text.default", "Semi Bold")]))),
    ]),

  PageHeader: (c) => {
    const compact = c.size === "compact";
    return frame({ name: "page header", dir: "col", gap: compact ? 8 : 12, w: 720, stroke: c.border ? "color.border.default" : undefined }, [
      text("Home / Customers / Brightwater", 13, "color.text.muted"),
      frame({ name: "title row", dir: "row", w: "fill", align: "between", cross: "start" }, [
        frame({ name: "text", dir: "col", gap: 4 }, [text("Brightwater Supplies", compact ? 18 : 24, "color.text.default", "Semi Bold"), text("Customer since 2022.", 14, "color.text.muted")]),
        frame({ name: "actions", dir: "row", gap: 8 }, [button("Edit customer", "primary")]),
      ]),
    ]);
  },

  SectionHeader: (c) => {
    const compact = c.size === "compact";
    return frame({ name: "section header", dir: "row", w: 560, align: "between", cross: "start", stroke: c.divider ? "color.border.default" : undefined }, [
      frame({ name: "text", dir: "col", gap: 2 }, [text("Recent invoices", compact ? 16 : 18, "color.text.default", "Semi Bold"), text("The last ten, newest first.", 14, "color.text.muted")]),
      button("View all", "secondary", "sm"),
    ]);
  },

  AppFooter: (c) => {
    const col = (title: string) => frame({ name: "group", dir: "col", gap: 8 }, [text(title, 14, "color.text.default", "Semi Bold"), text("Features", 14, "color.text.muted"), text("Pricing", 14, "color.text.muted")]);
    const columns = c.layout === "columns";
    return frame({ name: "app footer", dir: "col", gap: 24, pad: 32, w: 800, fill: "color.surface.default", stroke: "color.border.default" }, [
      ...(columns ? [frame({ name: "groups", dir: "row", gap: 48 }, [col("Product"), col("Company"), col("Legal")])] : []),
      frame({ name: "bottom", dir: "row", w: "fill", align: "between", cross: "center" }, [
        text("© 2026 rdloom. All rights reserved.", 14, "color.text.muted"),
        ...(columns ? [] : [frame({ name: "links", dir: "row", gap: 24 }, [text("Privacy", 14, "color.text.muted"), text("Terms", 14, "color.text.muted")])]),
      ]),
    ]);
  },

  ErrorState: (c) => {
    const page = c.variant === "page";
    return frame({ name: "error state", dir: "col", gap: 12, pad: page ? [64, 24] : [40, 24], w: page ? 480 : 400, align: "center", cross: "center", stroke: page ? undefined : "color.border.default", radius: page ? undefined : "radius.overlay" }, [
      box(48, 48, { fill: "color.surface.subtle", stroke: "color.border.default", radius: 999, name: "icon" }),
      text("We could not load your invoices", page ? 24 : 16, "color.text.default", "Semi Bold"),
      text("Check your connection and try again.", 14, "color.text.muted"),
      button("Try again", "primary"),
    ]);
  },

  AuthCard: (c) => {
    const w = c.size === "lg" ? 512 : c.size === "sm" ? 352 : 416;
    const field = (label: string) => frame({ name: "field", dir: "col", gap: 6, w: "fill" }, [text(label, 14, "color.text.default", "Medium"), frame({ name: "input", dir: "row", w: "fill", h: 40, stroke: "color.border.default", radius: "radius.control" }, [])]);
    return frame({ name: "auth card", dir: "col", gap: 20, pad: 32, w, fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
      text("rdloom", 18, "color.text.default", "Semi Bold"),
      frame({ name: "header", dir: "col", gap: 6 }, [text("Sign in to your account", 24, "color.text.default", "Semi Bold"), text("Welcome back. Enter your details to continue.", 14, "color.text.muted")]),
      field("Email"),
      field("Password"),
      button("Sign in", "primary"),
      text("Create an account", 14, "color.text.muted"),
    ]);
  },

  InviteDialog: () => {
    const input = (label: string, value: string, w: number | "fill") =>
      frame({ name: "field", dir: "col", gap: 6, w }, [
        text(label, 14, "color.text.default", "Medium"),
        frame({ name: "input", dir: "row", w: "fill", h: 40, pad: 12, cross: "center", stroke: "color.border.default", radius: "radius.control" }, [text(value, 14, "color.text.default")]),
      ]);
    const row = (n: number, email: string, role: string) =>
      frame({ name: `invitation ${n}`, dir: "row", gap: 12, pad: 12, w: "fill", stroke: "color.border.default", radius: "radius.overlay", fill: "color.surface.default" }, [
        input("Email", email, "fill"),
        input("Role", role, 160),
      ]);
    return frame({ name: "invite dialog", dir: "col", gap: 16, pad: 24, w: 672, fill: "color.surface.raised", stroke: "color.border.default", radius: "radius.overlay" }, [
      frame({ name: "header", dir: "col", gap: 4 }, [text("Invite people", 18, "color.text.default", "Semi Bold"), text("They get an email with a link to join your workspace.", 14, "color.text.muted")]),
      row(1, "amara.okafor@example.com", "Editor"),
      row(2, "lena.fischer@example.com", "Viewer"),
      button("Add another", "secondary"),
      frame({ name: "actions", dir: "row", gap: 8, w: "fill", align: "end" }, [button("Cancel", "secondary"), button("Send 2 invitations", "primary")]),
    ]);
  },

  UserForm: (c) => {
    const edit = c.mode === "edit";
    const input = (label: string, value: string, hint?: string) =>
      frame({ name: "field", dir: "col", gap: 6, w: "fill" }, [
        text(label, 14, "color.text.default", "Medium"),
        frame({ name: "input", dir: "row", w: "fill", h: 40, pad: 12, cross: "center", stroke: "color.border.default", radius: "radius.control" }, [text(value, 14, "color.text.default")]),
        ...(hint ? [text(hint, 12, "color.text.muted")] : []),
      ]);
    return frame({ name: "user form", dir: "col", gap: 20, pad: 24, w: 448, fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
      text(edit ? "Edit Lena Fischer" : "New user", 18, "color.text.default", "Semi Bold"),
      input("Name", edit ? "Lena Fischer" : "Full name"),
      input("Email", edit ? "lena.fischer@example.com" : "name@example.com", edit ? "Email cannot be changed here." : undefined),
      input("Role", "Editor", "Can create and change records."),
      frame({ name: "status", dir: "col", gap: 4 }, [text("Active", 14, "color.text.default", "Medium"), text("Suspended users cannot sign in.", 12, "color.text.muted")]),
      frame({ name: "actions", dir: "row", gap: 8, w: "fill", align: "end" }, [button("Cancel", "secondary"), button(edit ? "Save changes" : "Create user", "primary")]),
      ...(edit ? [frame({ name: "danger zone", dir: "row", gap: 8, w: "fill" }, [button("Suspend", "secondary"), button("Delete user", "danger")])] : []),
    ]);
  },

  Steps: (c) => {
    const vertical = c.orientation === "vertical";
    const marker = (n: string, state: "done" | "current" | "todo") =>
      frame(
        {
          name: `step ${state}`,
          dir: "row",
          w: 28,
          h: 28,
          align: "center",
          cross: "center",
          fill: state === "done" ? "color.action.primary" : "color.surface.default",
          stroke: state === "done" ? undefined : state === "current" ? "color.action.primary" : "color.border.strong",
          radius: 999,
        },
        [text(state === "done" ? "✓" : n, 12, state === "done" ? "color.action.on-primary" : state === "current" ? "color.action.primary" : "color.text.muted", "Semi Bold")],
      );
    const step = (n: string, title: string, state: "done" | "current" | "todo") =>
      frame({ name: "step", dir: vertical ? "row" : "col", gap: vertical ? 12 : 8, cross: "center" }, [
        marker(n, state),
        text(title, 14, state === "todo" ? "color.text.muted" : "color.text.default", "Medium"),
      ]);
    return frame({ name: "steps", dir: vertical ? "col" : "row", gap: vertical ? 20 : 48 }, [
      step("1", "Cart", "done"),
      step("2", "Payment", "current"),
      step("3", "Review", "todo"),
    ]);
  },

  Tree: (c) => {
    const item = (label: string, depth: number, opts: { open?: boolean; selected?: boolean; parent?: boolean } = {}) =>
      frame(
        { name: "item", dir: "row", gap: 4, pad: [0, 8], h: 32, w: "fill", cross: "center", fill: opts.selected ? "color.surface.selected" : undefined, radius: "radius.control" },
        [
          box(depth * 18, 1, { name: "indent" }),
          text(opts.parent ? (opts.open ? "⌄" : "›") : " ", 14, "color.text.muted"),
          text(label, 14),
        ],
      );
    return frame({ name: "tree", dir: "col", gap: 2, pad: 6, w: 280, fill: "color.surface.default", stroke: "color.border.default", radius: "radius.overlay" }, [
      item("src", 0, { parent: true, open: true }),
      item("components", 1, { parent: true, open: true }),
      item("button.tsx", 2, { selected: c.selectionMode !== undefined && c.selectionMode !== "none" }),
      item("index.ts", 1),
      item("package.json", 0),
    ]);
  },

  EmptyState: (c) => {
    const sm = c.size === "sm";
    return frame({ name: "empty state", dir: "col", gap: sm ? 8 : 12, pad: sm ? [24, 16] : [48, 24], w: sm ? 288 : 448, align: "center", cross: "center", stroke: "color.border.default", radius: "radius.overlay" }, [
      box(sm ? 40 : 48, sm ? 40 : 48, { fill: "color.surface.subtle", stroke: "color.border.default", radius: 999, name: "icon" }),
      text("No projects yet", sm ? 14 : 16, "color.text.default", "Semi Bold"),
      text("Create your first to get started.", 14, "color.text.muted"),
      ...(sm ? [] : [button("Create project", "primary")]),
    ]);
  },

  Kbd: (c) => {
    const sm = c.size === "sm";
    return frame({ name: "kbd", dir: "row", w: sm ? 20 : 24, h: sm ? 20 : 24, align: "center", cross: "center", fill: "color.surface.subtle", stroke: "color.border.default", radius: "radius.control" }, [
      text("K", sm ? 11 : 12, "color.text.muted", "Medium"),
    ]);
  },

  ShimmerButton: (c) => buttonBlueprint(c, "Start free trial"),
  RippleButton: (c) => buttonBlueprint(c, "Press me"),
  PulseButton: (c) => buttonBlueprint(c, "Claim offer"),
  RevealButton: (c) => buttonBlueprint(c, "Read more →"),
  GradientButton: (c) =>
    frame({ name: "gradient edge", dir: "row", pad: 2, fill: "color.action.primary", radius: "radius.control" }, [
      frame({ name: "button", dir: "row", pad: [0, 16], h: HEIGHTS[c.size ?? "md"] ?? 40, align: "center", cross: "center", fill: "color.surface.default", radius: "radius.control" }, [
        text("Try the new editor", FONT[c.size ?? "md"] ?? 14, "color.text.default", "Medium"),
      ]),
    ]),

  ShuttleBorder: () =>
    frame({ name: "shuttle border", dir: "col", gap: 4, pad: 20, w: 288, fill: "color.surface.default", stroke: "color.action.primary", radius: "radius.overlay" }, [
      text("Pro plan", 16, "color.text.default", "Semi Bold"),
      text("Unlimited projects and priority support.", 14, "color.text.muted"),
    ]),

  ShineBorder: () =>
    frame({ name: "shine border", dir: "col", gap: 4, pad: 20, w: 288, fill: "color.surface.default", stroke: "color.feedback.warning", radius: "radius.overlay" }, [
      text("Team plan", 16, "color.text.default", "Semi Bold"),
      text("Shared workspaces and single sign-on.", 14, "color.text.muted"),
    ]),

  TextShimmer: () => frame({ name: "text shimmer", dir: "row" }, [text("Thinking…", 18, "color.text.muted", "Medium")]),
  GradientText: () => frame({ name: "gradient text", dir: "row" }, [text("Build faster", 28, "color.action.primary", "Semi Bold")]),

  BlurFade: () =>
    frame({ name: "blur fade", dir: "col", gap: 8 }, [
      text("Accessible by default", 18),
      text("Copy it, own it", 18, "color.text.muted"),
      text("Upgrades that keep your edits", 18, "color.text.muted"),
    ]),

  Ripple: () =>
    frame({ name: "ripple", dir: "col", w: 320, h: 200, align: "center", cross: "center", stroke: "color.border.default", radius: "radius.overlay" }, [
      box(120, 120, { stroke: "color.border.strong", radius: 999, name: "ring" }),
    ]),

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

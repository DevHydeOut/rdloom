import type { ReactNode } from "react";

// One icon family. Every icon is drawn on the same 16-unit grid with the same line: 1.5 px, round
// ends and corners, no fill (a few small marks are solid). The line is a fixed width on screen
// (non-scaling-stroke), so an icon looks equally crisp at 12 px or 20 px, and icons side by side
// never look heavier or lighter than each other. Status icons keep distinct shapes (circle with i,
// circle with tick, triangle, octagon) so a tone never depends on color alone.
//
// All icons are decorative (aria-hidden): the control that holds one carries the accessible name.
// Color comes from the text color around it (currentColor).

interface IconProps {
  className?: string;
  /** Line width in px. The family default is 1.5; small marks (a tick in a 12 px box) use 2. */
  strokeWidth?: number;
}

function Icon({ className, strokeWidth = 1.5, children, solid }: IconProps & { children: ReactNode; solid?: boolean }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" className={className} fill={solid ? "currentColor" : "none"}>
      <g stroke={solid ? "none" : "currentColor"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

// `vectorEffect` has to be on each shape to take effect, so shapes go through these two helpers.
const P = (props: { d: string; fill?: string }) => <path {...props} vectorEffect="non-scaling-stroke" />;
const C = (props: { cx: number; cy: number; r: number; fill?: string }) => <circle {...props} vectorEffect="non-scaling-stroke" />;
const R = (props: { x: number; y: number; width: number; height: number; rx?: number }) => <rect {...props} vectorEffect="non-scaling-stroke" />;

// --- Marks and arrows

export function CheckIcon({ className = "size-4 shrink-0 text-[var(--rd-color-action-primary)]", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M3.5 8.5l3 3 6-7" />
    </Icon>
  );
}

export function MinusIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M3.5 8h9" />
    </Icon>
  );
}

export function PlusIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M3.5 8h9M8 3.5v9" />
    </Icon>
  );
}

export function CloseIcon({ className = "size-3", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M4 4l8 8M12 4l-8 8" />
    </Icon>
  );
}

export function ChevronDownIcon({ className = "size-4 shrink-0 text-[var(--rd-color-text-muted)]", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M4 6l4 4 4-4" />
    </Icon>
  );
}

export function ChevronUpIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M4 10l4-4 4 4" />
    </Icon>
  );
}

export function ChevronRightIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M6 4l4 4-4 4" />
    </Icon>
  );
}

export function ChevronLeftIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M10 4L6 8l4 4" />
    </Icon>
  );
}

export function ArrowRightIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M3 8h10M9 4l4 4-4 4" />
    </Icon>
  );
}

export function ArrowUpIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M8 13V3M4 7l4-4 4 4" />
    </Icon>
  );
}

export function ArrowDownIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M8 3v10M4 9l4 4 4-4" />
    </Icon>
  );
}

// --- Things

export function SearchIcon({ className = "size-5 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <C cx={7.25} cy={7.25} r={4.5} />
      <P d="M10.75 10.75L13.5 13.5" />
    </Icon>
  );
}

export function CalendarIcon({ className = "size-4", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <R x={2.5} y={3.5} width={11} height={10} rx={2} />
      <P d="M2.5 6.75h11M5.5 2v2.5M10.5 2v2.5" />
    </Icon>
  );
}

export function ClockIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <C cx={8} cy={8} r={5.75} />
      <P d="M8 4.75V8l2.25 1.5" />
    </Icon>
  );
}

export function UploadIcon({ className = "size-5 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M8 10.5V3M5 5.75L8 2.75l3 3" />
      <P d="M2.75 10v2.25c0 .69.56 1.25 1.25 1.25h8c.69 0 1.25-.56 1.25-1.25V10" />
    </Icon>
  );
}

export function FileIcon({ className = "size-5 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M4.5 2h4.75L12.5 5.25v8a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-10.5A.75.75 0 0 1 4.5 2z" />
      <P d="M9 2v3.5h3.5" />
    </Icon>
  );
}

export function CopyIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <R x={5.5} y={5.5} width={8} height={8} rx={1.75} />
      <P d="M10.5 3.5A1.5 1.5 0 0 0 9 2H4A1.5 1.5 0 0 0 2.5 3.5v5A1.5 1.5 0 0 0 4 10" />
    </Icon>
  );
}

export function SparkleIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M7 2.5l1.2 3.3L11.5 7 8.2 8.2 7 11.5 5.8 8.2 2.5 7l3.3-1.2L7 2.5z" />
      <P d="M12.25 10.25v3M10.75 11.75h3" />
    </Icon>
  );
}

/** A column's sort mark: up and down chevrons, with the active direction drawn strongly and the other faint. */
export function SortIcon({ direction, className = "size-3.5 shrink-0" }: { direction?: "asc" | "desc" | false; className?: string }) {
  return (
    <Icon className={className}>
      <path d="M5 6.25L8 3.5l3 2.75" opacity={direction === "asc" || !direction ? 1 : 0.3} vectorEffect="non-scaling-stroke" />
      <path d="M5 9.75l3 2.75 3-2.75" opacity={direction === "desc" || !direction ? 1 : 0.3} vectorEffect="non-scaling-stroke" />
    </Icon>
  );
}

export function HomeIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M2.5 7.25L8 2.75l5.5 4.5V13a.75.75 0 0 1-.75.75H3.25A.75.75 0 0 1 2.5 13V7.25z" />
      <P d="M6.5 13.75V9.5h3v4.25" />
    </Icon>
  );
}

export function UsersIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <C cx={6} cy={5.5} r={2.5} />
      <P d="M1.75 13.25c.4-2.25 2.1-3.5 4.25-3.5s3.85 1.25 4.25 3.5" />
      <P d="M10.5 3.2a2.5 2.5 0 0 1 0 4.6M12 9.9c1.2.5 2 1.6 2.25 3.35" />
    </Icon>
  );
}

export function ChartIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M2.5 2.5v11h11" />
      <P d="M5.5 10.5V8M8.25 10.5V5.5M11 10.5V7" />
    </Icon>
  );
}

export function SettingsIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <C cx={8} cy={8} r={2} />
      <P d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.6 3.6l1.05 1.05M11.35 11.35l1.05 1.05M3.6 12.4l1.05-1.05M11.35 4.65l1.05-1.05" />
    </Icon>
  );
}

export function InboxIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M2.5 9.25l1.6-5.2a1 1 0 0 1 .95-.7h5.9a1 1 0 0 1 .95.7l1.6 5.2" />
      <P d="M2.5 9.25V12a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.25h-3.25L9.75 10.75h-3.5L5.75 9.25H2.5z" />
    </Icon>
  );
}

export function CreditCardIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <R x={1.75} y={3.5} width={12.5} height={9} rx={2} />
      <P d="M1.75 6.75h12.5M4.5 10h2.5" />
    </Icon>
  );
}

export function BellIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M3.75 11.25h8.5l-1.1-1.6V6.5a3.15 3.15 0 0 0-6.3 0v3.15l-1.1 1.6z" />
      <P d="M6.75 13.25a1.4 1.4 0 0 0 2.5 0" />
    </Icon>
  );
}

export function MenuIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </Icon>
  );
}

export function SidebarIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <R x={1.75} y={2.75} width={12.5} height={10.5} rx={2} />
      <P d="M6 2.75v10.5" />
    </Icon>
  );
}

// --- Drag and more

export function DotsIcon({ className = "size-4" }: Pick<IconProps, "className">) {
  return (
    <Icon className={className} solid>
      <circle cx={8} cy={3.25} r={1.25} />
      <circle cx={8} cy={8} r={1.25} />
      <circle cx={8} cy={12.75} r={1.25} />
    </Icon>
  );
}

export function GripIcon({ className = "size-4" }: Pick<IconProps, "className">) {
  return (
    <Icon className={className} solid>
      {[4, 8, 12].flatMap((y) => [6, 10].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.1} />))}
    </Icon>
  );
}

// --- Status: four shapes, so tone never depends on color alone

export function InfoIcon({ className = "size-5 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <C cx={8} cy={8} r={6} />
      <P d="M8 7.25v3.5M8 5.25v.01" />
    </Icon>
  );
}

export function SuccessIcon({ className = "size-5 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <C cx={8} cy={8} r={6} />
      <P d="M5.5 8.25l1.85 1.85 3.25-3.7" />
    </Icon>
  );
}

export function WarningIcon({ className = "size-5 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M8 2.25l6.25 11H1.75L8 2.25z" />
      <P d="M8 6.75v3M8 11.9v.01" />
    </Icon>
  );
}

export function ErrorIcon({ className = "size-5 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M5.5 2h5L14 5.5v5L10.5 14h-5L2 10.5v-5L5.5 2z" />
      <P d="M6 6l4 4M10 6l-4 4" />
    </Icon>
  );
}

export function BanIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <C cx={8} cy={8} r={5.75} />
      <P d="M3.9 12.1l8.2-8.2" />
    </Icon>
  );
}

export function MicIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <R x={5.75} y={1.75} width={4.5} height={7.5} rx={2.25} />
      <P d="M3.5 7.75a4.5 4.5 0 0 0 9 0M8 12.25v2" />
    </Icon>
  );
}

export function PaperclipIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <P d="M12.9 7.4l-4.6 4.6a3 3 0 0 1-4.25-4.25l5-5a2 2 0 0 1 2.85 2.85l-5 5a1 1 0 0 1-1.4-1.4l4.4-4.4" />
    </Icon>
  );
}

export function ImageIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <R x={2} y={2.75} width={12} height={10.5} rx={2} />
      <C cx={5.75} cy={6.25} r={1.1} />
      <P d="M2.5 11.5l3.25-3 2.5 2.25 2-1.75 3.25 2.75" />
    </Icon>
  );
}

export function GlobeIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      <C cx={8} cy={8} r={6} />
      <P d="M2 8h12M8 2c1.75 1.75 2.5 3.75 2.5 6S9.75 12.25 8 14c-1.75-1.75-2.5-3.75-2.5-6S6.25 3.75 8 2z" />
    </Icon>
  );
}

// --- Chat

export function SendIcon({ className = "size-4 shrink-0", strokeWidth }: IconProps) {
  return (
    <Icon className={className} strokeWidth={strokeWidth ?? 1.75}>
      <P d="M8 12.5V3.5M4.25 7.25L8 3.5l3.75 3.75" />
    </Icon>
  );
}

export function StopIcon({ className = "size-4 shrink-0" }: Pick<IconProps, "className">) {
  return (
    <Icon className={className} solid>
      <rect x={4} y={4} width={8} height={8} rx={1.75} />
    </Icon>
  );
}

// --- Progress

export function Spinner({ className = "size-4" }: Pick<IconProps, "className">) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" className={`${className} animate-spin`} fill="none">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.75" opacity="0.25" vectorEffect="non-scaling-stroke" />
      <path d="M14.25 8A6.25 6.25 0 0 0 8 1.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

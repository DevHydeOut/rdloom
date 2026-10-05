export function CheckIcon({ className = "size-4 shrink-0 text-[var(--rd-color-action-primary)]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={className} fill="none">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 text-[var(--rd-color-text-muted)]" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={className} fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`${className} animate-spin`} fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// Status icons for Alert. Each tone has its own shape (circle with i, check,
// triangle, octagon) so the tone never depends on color alone.
const statusIcon = "size-5 shrink-0";

export function InfoIcon({ className = statusIcon }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9v5M10 6.25v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SuccessIcon({ className = statusIcon }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 10.25l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WarningIcon({ className = statusIcon }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <path d="M10 2.75l8 14H2l8-14z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 8v4M10 14.25v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ErrorIcon({ className = statusIcon }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <path d="M7 2.5h6l4.5 4.5v6L13 17.5H7L2.5 13V7L7 2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ className = "size-5 shrink-0" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <circle cx="9" cy="9" r="5.75" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function UploadIcon({ className = "size-5 shrink-0" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <path d="M10 13V3.5M6.25 7L10 3.25 13.75 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 12.5v2.25c0 .83.67 1.5 1.5 1.5h10c.83 0 1.5-.67 1.5-1.5V12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function FileIcon({ className = "size-5 shrink-0" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <path d="M5.5 2.75h5.25L15 7v9.5a.75.75 0 0 1-.75.75h-8.5A.75.75 0 0 1 5 16.5v-13a.75.75 0 0 1 .5-.75z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10.5 2.75V7H15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={className} fill="none">
      <path d="M6 3.5l4.5 4.5L6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

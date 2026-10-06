import type { SVGProps } from "react";

// rdloom's own icons, drawn for the docs. One family: a 20px grid, 1.5px lines,
// square ends and mitred corners, like thread cut square. Decorative: each is
// hidden from assistive technology, and the button or link around it has the name.

function Icon({ children, size = 18, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      {...rest}
    >
      {children}
    </svg>
  );
}

type P = { size?: number; className?: string };

export const CopyIcon = (p: P) => (
  <Icon {...p}>
    <path d="M7.5 7.5h8v8h-8z" />
    <path d="M12.5 7.5v-4h-8v8h3" />
  </Icon>
);

export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 10.5l4 4 8-9" />
  </Icon>
);

export const ArrowLeftIcon = (p: P) => (
  <Icon {...p}>
    <path d="M16 10H4M9 5l-5 5 5 5" />
  </Icon>
);

export const ArrowRightIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 10h12M11 5l5 5-5 5" />
  </Icon>
);

/** Three threads of different lengths. */
export const MenuIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3.5 5.5h13M3.5 10h9M3.5 14.5h13" />
  </Icon>
);

export const SearchIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3.5 3.5h9v9h-9z" transform="rotate(45 8 8) translate(1.5 1.5) scale(0.82)" />
    <path d="M12.5 12.5l4 4" />
  </Icon>
);

export const FileIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 2.5h6.5l3.5 3.5v11.5H5z" />
    <path d="M11.5 2.5V6H15" />
  </Icon>
);

export const ChevronRightIcon = (p: P) => (
  <Icon {...p}>
    <path d="M7.5 4l6 6-6 6" />
  </Icon>
);

export const SunIcon = (p: P) => (
  <Icon {...p} className={`theme-sun ${p.className ?? ""}`}>
    <path d="M7 7h6v6H7z" transform="rotate(45 10 10)" />
    <path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.8 1.8M14.2 14.2L16 16M16 4l-1.8 1.8M5.8 14.2L4 16" />
  </Icon>
);

export const MoonIcon = (p: P) => (
  <Icon {...p} className={`theme-moon ${p.className ?? ""}`}>
    <path d="M16.5 11.5A7 7 0 0 1 8.5 3.5 7 7 0 1 0 16.5 11.5z" />
  </Icon>
);

export const DoIcon = (p: P) => (
  <Icon {...p} strokeWidth={1.75}>
    <path d="M4 10.5l4 4 8-9" />
  </Icon>
);

export const DontIcon = (p: P) => (
  <Icon {...p} strokeWidth={1.75}>
    <path d="M5 5l10 10M15 5L5 15" />
  </Icon>
);

export const LinkIcon = (p: P) => (
  <Icon {...p}>
    <path d="M8.5 11.5l3-3M7.25 5.9l.9-.9a3 3 0 0 1 4.25 4.25l-.9.9M12.75 14.1l-.9.9A3 3 0 0 1 7.6 10.75l.9-.9" />
  </Icon>
);

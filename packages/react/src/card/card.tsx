"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { cardDefaults, type CardSpecProps } from "../generated/card.types";
import { cx } from "../utils/cx";

export interface CardProps
  extends CardSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof CardSpecProps | "className" | "title"> {
  className?: string;
}

type Rounded = NonNullable<CardSpecProps["rounded"]>;
type Layout = NonNullable<CardSpecProps["layout"]>;
type OverlayTone = "dark" | "light";

interface CardContextValue {
  headingLevel: number;
  layout: Layout;
  rounded: Rounded;
  tone: OverlayTone | null;
  titleId: string;
  registerTitle: () => void;
}

const CardContext = createContext<CardContextValue | null>(null);

const variants: Record<NonNullable<CardSpecProps["variant"]>, string> = {
  outlined: "bg-[var(--rd-color-surface-default)] border border-[var(--rd-color-border-default)]",
  raised: "bg-[var(--rd-color-surface-raised)] border border-[var(--rd-color-border-default)] [box-shadow:var(--rd-elevation-raised)]",
  subtle: "bg-[var(--rd-color-surface-subtle)] border border-transparent",
  floating: "bg-[var(--rd-color-surface-raised)] border border-transparent [box-shadow:var(--rd-elevation-floating)]",
};

const paddings: Record<NonNullable<CardSpecProps["padding"]>, string> = {
  none: "p-0",
  sm: "p-3 gap-2",
  md: "p-4 gap-3",
  lg: "p-6 gap-4",
};

const radii: Record<Rounded, string> = {
  default: "rounded-[var(--rd-radius-overlay)]",
  large: "rounded-[var(--rd-radius-media)]",
};

// Inner radius for a picture sitting 6 px (overlay frame) or 8 px (stack margin) inside the card edge.
const mediaRadii: Record<Rounded, string> = {
  default: "rounded-[var(--rd-radius-control)]",
  large: "rounded-[calc(var(--rd-radius-media)-0.5rem)]",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    title,
    description,
    footer,
    headingLevel = cardDefaults.headingLevel,
    variant = cardDefaults.variant,
    padding = cardDefaults.padding,
    rounded = cardDefaults.rounded,
    layout = cardDefaults.layout,
    className,
    ...rest
  },
  ref,
) {
  const titleId = useId();
  const [partTitle, setPartTitle] = useState(false);
  const level = Math.min(6, Math.max(2, Math.round(headingLevel)));
  const Heading = `h${level}` as "h2";
  const overlay = layout === "overlay";
  const named = Boolean(title) || partTitle;
  const ctx: CardContextValue = {
    headingLevel: level,
    layout,
    rounded,
    tone: null,
    titleId,
    registerTitle: () => setPartTitle(true),
  };
  return (
    <CardContext.Provider value={ctx}>
      <div
        {...rest}
        ref={ref}
        role={named ? "group" : undefined}
        aria-labelledby={named ? titleId : undefined}
        className={cx(
          "flex flex-col text-sm text-[var(--rd-color-text-default)]",
          radii[rounded],
          variants[variant],
          overlay ? "relative isolate min-h-80 overflow-hidden p-1.5" : paddings[padding],
          padding === "none" && !overlay && "overflow-hidden",
          className,
        )}
      >
        {overlay ? (
          <div className={cx("relative flex flex-1 flex-col overflow-hidden", mediaRadii[rounded])}>{children}</div>
        ) : (
          <>
            {(title || description) && (
              <div className="flex flex-col gap-0.5">
                {title && (
                  <Heading id={titleId} className="text-base font-semibold">
                    {title}
                  </Heading>
                )}
                {description && <p className="text-[var(--rd-color-text-muted)]">{description}</p>}
              </div>
            )}
            <div>{children}</div>
            {footer && <CardFooter>{footer}</CardFooter>}
          </>
        )}
      </div>
    </CardContext.Provider>
  );
});

function useCard() {
  return useContext(CardContext);
}

// --- Media

const ratios: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[21/9]",
  portrait: "aspect-[4/5]",
  photo: "aspect-[4/3]",
};

type MediaA11y = { alt: string; decorative?: false } | { decorative: true; alt?: undefined };

export type CardMediaProps = MediaA11y & {
  /** Image URL. Leave out to draw the picture yourself from `children` or `style`. */
  src?: string;
  aspectRatio?: "square" | "video" | "wide" | "portrait" | "photo";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  loading?: "lazy" | "eager";
};

/**
 * The picture of a card. Give it alt text, or set `decorative` when the picture adds nothing
 * the text does not already say. In an overlay card it fills the whole card.
 */
export function CardMedia({ src, alt, decorative, aspectRatio = "photo", className, style, children, loading = "lazy" }: CardMediaProps) {
  const card = useCard();
  const overlay = card?.layout === "overlay";
  const shape = cx(
    "block w-full overflow-hidden bg-[var(--rd-color-surface-subtle)]",
    overlay ? "absolute inset-0 h-full" : cx("relative", ratios[aspectRatio], mediaRadii[card?.rounded ?? "default"]),
    className,
  );
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={decorative ? "" : alt} loading={loading} className={cx(shape, "object-cover")} style={style} />
    );
  }
  return (
    <div
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : alt}
      aria-hidden={decorative ? true : undefined}
      className={shape}
      style={style}
    >
      {children}
    </div>
  );
}

// --- Overlay

// Two stacked layers of the backdrop colour give a solid dark zone behind the text and a soft fade above it.
const darkScrim =
  "[background:linear-gradient(to_top,var(--rd-color-overlay-backdrop)_55%,transparent),linear-gradient(to_top,var(--rd-color-overlay-backdrop)_55%,transparent)]";
const lightScrim = "[background:linear-gradient(to_top,var(--rd-color-surface-raised)_60%,transparent)]";

export interface CardOverlayProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  /** dark: white text over a dark scrim. light: default text over a fade to the card surface. */
  tone?: OverlayTone;
  className?: string;
}

/** Content laid over the bottom of a full-bleed picture, on a scrim that keeps the text readable. */
export function CardOverlay({ tone = "dark", className, children, ...rest }: CardOverlayProps) {
  const card = useCard();
  const value: CardContextValue = { ...(card as CardContextValue), tone };
  return (
    <CardContext.Provider value={value}>
      <div
        {...rest}
        className={cx(
          "relative z-10 mt-auto flex flex-col gap-3 px-4 pb-4 pt-28",
          tone === "dark" ? "text-white" : "text-[var(--rd-color-text-default)]",
          className,
        )}
      >
        <span aria-hidden="true" className={cx("pointer-events-none absolute inset-0 -z-10", tone === "dark" ? darkScrim : lightScrim)} />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 backdrop-blur-sm [mask-image:linear-gradient(to_top,#000_40%,transparent)] motion-reduce:backdrop-blur-none"
        />
        {children}
      </div>
    </CardContext.Provider>
  );
}

// --- Text parts

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx("flex flex-col gap-0.5", className)} />;
}

export interface CardTitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "className"> {
  /** Overrides the card's heading level for this title, 2 to 6. */
  level?: 2 | 3 | 4 | 5 | 6;
  size?: "md" | "lg";
  className?: string;
}

/** The card's heading. It also names the card for screen readers. */
export function CardTitle({ level, size = "md", className, children, ...rest }: CardTitleProps) {
  const card = useCard();
  const register = card?.registerTitle;
  useEffect(() => {
    register?.();
  }, [register]);
  const Heading = `h${level ?? card?.headingLevel ?? 3}` as "h3";
  return (
    <Heading
      {...rest}
      id={card?.titleId}
      className={cx(
        "flex items-center gap-1.5 font-semibold",
        size === "lg" ? "text-2xl leading-tight tracking-tight" : "text-base",
        className,
      )}
    >
      {children}
    </Heading>
  );
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  const card = useCard();
  return (
    <p
      {...rest}
      className={cx(card?.tone === "dark" ? "text-white/80" : "text-[var(--rd-color-text-muted)]", className)}
    />
  );
}

/** A row of small facts. Use CardMetaItem for each. */
export function CardMeta({ className, ...rest }: HTMLAttributes<HTMLUListElement>) {
  return <ul {...rest} className={cx("m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-sm", className)} />;
}

export interface CardMetaItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "className"> {
  /** A decorative icon. The text must say the same thing. */
  icon?: ReactNode;
  className?: string;
}

export function CardMetaItem({ icon, children, className, ...rest }: CardMetaItemProps) {
  const card = useCard();
  return (
    <li
      {...rest}
      className={cx(
        "flex items-center gap-1.5",
        card?.tone === "dark" ? "text-white/90" : "text-[var(--rd-color-text-muted)]",
        className,
      )}
    >
      {icon}
      <span>{children}</span>
    </li>
  );
}

// --- Layout parts

/** A padded block for the card's main content when the card itself has no padding. */
export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const card = useCard();
  return (
    <div
      {...rest}
      className={cx(
        "relative z-10 flex flex-col gap-3 bg-[var(--rd-color-surface-raised)] p-5",
        card?.rounded === "large" ? "rounded-[var(--rd-radius-media)]" : "rounded-[var(--rd-radius-overlay)]",
        className,
      )}
    />
  );
}

const bands = {
  peach: "bg-[color-mix(in_srgb,var(--rd-color-action-primary)_16%,var(--rd-color-surface-default))]",
  lilac: "bg-[color-mix(in_srgb,var(--rd-color-chart-4)_16%,var(--rd-color-surface-default))]",
  rose: "bg-[color-mix(in_srgb,var(--rd-color-chart-6)_16%,var(--rd-color-surface-default))]",
} as const;

export interface CardBandProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  tone?: keyof typeof bands;
  className?: string;
}

/** A tinted strip along the bottom edge, tucked under a CardBody so the body reads as a sheet on a coloured base. */
export function CardBand({ tone = "peach", className, ...rest }: CardBandProps) {
  return (
    <div
      {...rest}
      className={cx(
        "-mt-6 px-5 pb-3 pt-9 text-xs font-semibold uppercase tracking-wide text-[var(--rd-color-text-default)]",
        bands[tone],
        className,
      )}
    />
  );
}

export function CardActions({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx("flex items-center gap-2", className)} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cx("mt-1 flex flex-wrap items-center gap-2 border-t border-[var(--rd-color-border-default)] pt-3", className)}
    />
  );
}

// --- Icon button

const iconTones = {
  frosted:
    "bg-white/25 text-white backdrop-blur-md data-[hovered]:bg-white/35 motion-reduce:backdrop-blur-none",
  outlined:
    "border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
  ghost: "text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)]",
} as const;

export interface CardIconButtonProps extends Omit<AriaButtonProps, "className" | "children" | "aria-label"> {
  /** What the button does, e.g. "Save New York". Required: the icon has no text. */
  label: string;
  tone?: keyof typeof iconTones;
  /** Square corners instead of a circle. */
  square?: boolean;
  className?: string;
  children: ReactNode;
}

/** A round icon-only button for a card corner or action row. */
export const CardIconButton = forwardRef<HTMLButtonElement, CardIconButtonProps>(function CardIconButton(
  { label, tone = "outlined", square, className, children, ...rest },
  ref,
) {
  return (
    <AriaButton
      {...rest}
      ref={ref}
      aria-label={label}
      className={cx(
        "inline-flex size-[var(--rd-size-control-md)] shrink-0 items-center justify-center outline-none transition-colors motion-reduce:transition-none",
        square ? "rounded-[var(--rd-radius-control)]" : "rounded-full",
        "data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        iconTones[tone],
        className,
      )}
    >
      {children}
    </AriaButton>
  );
});

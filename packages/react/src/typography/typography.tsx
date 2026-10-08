import { createElement, forwardRef, type BlockquoteHTMLAttributes, type HTMLAttributes, type LiHTMLAttributes, type OlHTMLAttributes, type ReactNode } from "react";
import { typographyDefaults, type TypographySpecProps } from "../generated/typography.types";
import { cx } from "../utils/cx";

// None of these set a font family: they inherit the font of the host app.

type HeadingSize = NonNullable<TypographySpecProps["size"]>;
type Tone = NonNullable<TypographySpecProps["tone"]>;
type TextSize = "sm" | "md" | "lg";

const headingSizes: Record<HeadingSize, string> = {
  sm: "text-base leading-snug",
  md: "text-lg leading-snug",
  lg: "text-xl leading-snug",
  xl: "text-2xl leading-tight",
  "2xl": "text-4xl leading-tight",
};

const defaultSizeForLevel: Record<number, HeadingSize> = { 1: "2xl", 2: "xl", 3: "lg", 4: "md" };

const textSizes: Record<TextSize, string> = {
  sm: "text-sm leading-6",
  md: "text-base leading-7",
  lg: "text-lg leading-8",
};

const tones: Record<Tone, string> = {
  default: "text-[var(--rd-color-text-default)]",
  muted: "text-[var(--rd-color-text-muted)]",
  danger: "text-[var(--rd-color-feedback-danger)]",
};

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "className"> {
  /** Semantic level, 1 to 4. Sets the element (h1 to h4) and nothing else. */
  level?: 1 | 2 | 3 | 4;
  /** Visual size. Defaults to the usual size for the level. */
  size?: HeadingSize;
  tone?: Tone;
  className?: string;
}

/** A heading. `level` sets the element for the page outline; `size` sets how large it looks. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, size, tone = typographyDefaults.tone, className, ...rest },
  ref,
) {
  const safe = Math.min(4, Math.max(1, Math.round(level)));
  return createElement(`h${safe}`, {
    ...rest,
    ref,
    className: cx("m-0 font-semibold tracking-tight", headingSizes[size ?? defaultSizeForLevel[safe]], tones[tone], className),
  });
});

type FixedHeadingProps = Omit<HeadingProps, "level">;
export const H1 = forwardRef<HTMLHeadingElement, FixedHeadingProps>(function H1(props, ref) {
  return <Heading {...props} ref={ref} level={1} />;
});
export const H2 = forwardRef<HTMLHeadingElement, FixedHeadingProps>(function H2(props, ref) {
  return <Heading {...props} ref={ref} level={2} />;
});
export const H3 = forwardRef<HTMLHeadingElement, FixedHeadingProps>(function H3(props, ref) {
  return <Heading {...props} ref={ref} level={3} />;
});
export const H4 = forwardRef<HTMLHeadingElement, FixedHeadingProps>(function H4(props, ref) {
  return <Heading {...props} ref={ref} level={4} />;
});

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "className"> {
  size?: TextSize;
  tone?: Tone;
  /** The element: a paragraph (default) or an inline span. */
  as?: "p" | "span";
  className?: string;
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { size = "md", tone = typographyDefaults.tone, as = "p", className, ...rest },
  ref,
) {
  return createElement(as, { ...rest, ref, className: cx(as === "p" && "m-0", textSizes[size], tones[tone], className) });
});

/** A larger, muted introduction paragraph. */
export const Lead = forwardRef<HTMLParagraphElement, Omit<HTMLAttributes<HTMLParagraphElement>, "className"> & { className?: string }>(function Lead(
  { className, ...rest },
  ref,
) {
  return <p {...rest} ref={ref} className={cx("m-0 text-xl leading-8 text-[var(--rd-color-text-muted)]", className)} />;
});

export const InlineCode = forwardRef<HTMLElement, Omit<HTMLAttributes<HTMLElement>, "className"> & { className?: string }>(function InlineCode(
  { className, ...rest },
  ref,
) {
  return (
    <code
      {...rest}
      ref={ref}
      className={cx(
        "rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] px-1.5 py-0.5 font-mono text-[0.875em] text-[var(--rd-color-text-default)]",
        className,
      )}
    />
  );
});

export interface BlockquoteProps extends Omit<BlockquoteHTMLAttributes<HTMLQuoteElement>, "className" | "cite"> {
  /** Who said it. Shown under the quote in a footer. */
  source?: string;
  className?: string;
}

export const Blockquote = forwardRef<HTMLQuoteElement, BlockquoteProps>(function Blockquote({ children, source, className, ...rest }, ref) {
  return (
    <blockquote
      {...rest}
      ref={ref}
      className={cx("m-0 border-s-4 border-[var(--rd-color-border-strong)] ps-4 italic text-[var(--rd-color-text-muted)]", className)}
    >
      {children}
      {source ? <footer className="mt-2 text-sm not-italic text-[var(--rd-color-text-muted)]">{source}</footer> : null}
    </blockquote>
  );
});

export interface ListProps extends Omit<OlHTMLAttributes<HTMLElement>, "className" | "type"> {
  /** Ordered renders an ol with numbers; the default is an ul with bullets. */
  ordered?: boolean;
  /** none removes the markers, for lists whose items stand alone. */
  marker?: "auto" | "none";
  className?: string;
}

export const List = forwardRef<HTMLElement, ListProps>(function List({ ordered = false, marker = "auto", className, ...rest }, ref) {
  return createElement(ordered ? "ol" : "ul", {
    ...rest,
    ref,
    // role list is kept when the markers are removed, which some browsers treat as "not a list"
    role: marker === "none" ? "list" : undefined,
    className: cx(
      "m-0 flex flex-col gap-2 text-base leading-7 text-[var(--rd-color-text-default)] [&_ol]:mt-2 [&_ul]:mt-2",
      marker === "none" ? "list-none ps-0" : cx("ps-6 marker:text-[var(--rd-color-text-muted)]", ordered ? "list-decimal" : "list-disc"),
      className,
    ),
  });
});

export const ListItem = forwardRef<HTMLLIElement, Omit<LiHTMLAttributes<HTMLLIElement>, "className"> & { className?: string }>(function ListItem(
  { className, ...rest },
  ref,
) {
  return <li {...rest} ref={ref} className={cx("ps-1", className)} />;
});

export interface ProseProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  children?: ReactNode;
  className?: string;
}

const proseStyles = [
  "max-w-prose text-base leading-7 text-[var(--rd-color-text-default)]",
  "[&>*+*]:mt-4",
  "[&_h1]:mt-0 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:tracking-tight",
  "[&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:tracking-tight",
  "[&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug",
  "[&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:leading-snug",
  "[&_p]:m-0 [&_p+p]:mt-4",
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-6 [&_ol]:ps-6 [&_ul]:m-0 [&_ol]:m-0 [&_li]:mt-2 [&_li>ul]:mt-2 [&_li>ol]:mt-2 [&_ul]:marker:text-[var(--rd-color-text-muted)] [&_ol]:marker:text-[var(--rd-color-text-muted)]",
  "[&_a]:text-[var(--rd-color-action-primary)] [&_a]:underline [&_a]:underline-offset-2 [&_a:focus-visible]:rounded-[var(--rd-radius-control)] [&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-[var(--rd-color-focus-ring)]",
  "[&_blockquote]:m-0 [&_blockquote]:border-s-4 [&_blockquote]:border-[var(--rd-color-border-strong)] [&_blockquote]:ps-4 [&_blockquote]:italic [&_blockquote]:text-[var(--rd-color-text-muted)]",
  "[&_:not(pre)>code]:rounded-[var(--rd-radius-control)] [&_:not(pre)>code]:border [&_:not(pre)>code]:border-[var(--rd-color-border-default)] [&_:not(pre)>code]:bg-[var(--rd-color-surface-subtle)] [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em]",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-[var(--rd-radius-control)] [&_pre]:bg-[var(--rd-color-surface-subtle)] [&_pre]:p-4 [&_pre]:text-sm",
  "[&_hr]:my-8 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-[var(--rd-color-border-default)]",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border-b [&_th]:border-[var(--rd-color-border-strong)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_th]:font-semibold",
  "[&_td]:border-b [&_td]:border-[var(--rd-color-border-default)] [&_td]:px-3 [&_td]:py-2 [&_td]:text-start",
  "[&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[var(--rd-radius-control)]",
].join(" ");

/** Styles raw HTML children (a CMS body, rendered Markdown): headings, paragraphs, lists, links, quotes, code, rules and tables. */
export const Prose = forwardRef<HTMLDivElement, ProseProps>(function Prose({ className, ...rest }, ref) {
  return <div {...rest} ref={ref} className={cx(proseStyles, className)} />;
});

/** All the typography parts in one object, for `Typography.Heading`, `Typography.Text` and so on. */
export const Typography = { Heading, H1, H2, H3, H4, Text, Lead, Prose, InlineCode, Blockquote, List, ListItem };

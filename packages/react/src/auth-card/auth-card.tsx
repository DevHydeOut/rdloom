import { forwardRef, type HTMLAttributes } from "react";
import { authCardDefaults, type AuthCardSpecProps } from "../generated/auth-card.types";
import { Separator } from "../separator/separator";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface AuthCardProps
  extends AuthCardSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof AuthCardSpecProps | "className" | "title"> {
  className?: string;
}

const widths = { sm: "max-w-[22rem]", md: "max-w-[26rem]", lg: "max-w-[32rem]" } as const;

/**
 * The centered card for sign in, sign up, forgot password and verify code. It fills its parent
 * (give the parent a height, or pass `min-h-dvh` in className) and sits on a tinted page. The
 * form is yours: pass Form, fields and an ErrorSummary as children.
 */
export const AuthCard = forwardRef<HTMLDivElement, AuthCardProps>(function AuthCard(
  {
    title,
    headingLevel = authCardDefaults.headingLevel,
    description,
    brand,
    children,
    socialProviders,
    socialLabel = authCardDefaults.socialLabel,
    footer,
    illustration,
    size = authCardDefaults.size,
    classNames,
    className,
    ...rest
  },
  ref,
) {
  const level = Math.min(6, Math.max(1, Math.round(headingLevel)));
  const Heading = `h${level}` as "h1";
  return (
    <div {...rest} ref={ref} className={cx("flex min-h-full w-full items-center justify-center bg-[var(--rd-color-surface-subtle)] p-4 sm:p-8", classNames?.root, className)}>
      <div
        className={cx(
          "grid w-full overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] [box-shadow:var(--rd-elevation-floating)]",
          illustration ? "max-w-4xl lg:grid-cols-2" : widths[size],
          classNames?.card,
        )}
      >
        <div className={cx("mx-auto flex w-full flex-col gap-6 p-6 sm:p-8", illustration ? widths[size] : undefined)}>
          {brand && <div className={cx("flex items-center", classNames?.brand)}>{brand}</div>}
          <div className={cx("flex flex-col gap-1.5", classNames?.header)}>
            <Heading className={cx("text-2xl leading-8 font-semibold tracking-[-0.02em] text-[var(--rd-color-text-default)]", classNames?.title)}>{title}</Heading>
            {description && <div className={cx("text-sm text-[var(--rd-color-text-muted)]", classNames?.description)}>{description}</div>}
          </div>
          {children && <div className={cx("flex flex-col gap-4", classNames?.body)}>{children}</div>}
          {socialProviders && (
            <div className={cx("flex flex-col gap-4", classNames?.socialProviders)}>
              <Separator label={socialLabel} />
              <div className="flex flex-col gap-2">{socialProviders}</div>
            </div>
          )}
          {footer && <div className={cx("flex flex-col items-center gap-2 text-center text-sm text-[var(--rd-color-text-muted)]", classNames?.footer)}>{footer}</div>}
        </div>
        {illustration && (
          <div aria-hidden="true" className={cx("hidden items-center justify-center bg-[var(--rd-color-surface-subtle)] p-8 lg:flex", classNames?.illustration)}>
            {illustration}
          </div>
        )}
      </div>
    </div>
  );
});

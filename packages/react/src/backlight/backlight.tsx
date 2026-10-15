import { Children, cloneElement, forwardRef, isValidElement, version, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { backlightDefaults, type BacklightSpecProps } from "../generated/backlight.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface BacklightProps
  extends BacklightSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof BacklightSpecProps | "className"> {
  className?: string;
}

// React 19 takes inert as a boolean, React 18 only as an attribute string.
const inertProps = (Number(version.split(".")[0]) >= 19 ? { inert: true } : { inert: "" }) as Record<string, unknown>;

// The glow in copy mode repeats the children, so ids inside the copy are removed: the page must never hold the same id twice.
function withoutIds(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement<{ id?: string; children?: ReactNode }>(child)) return child;
    const { children } = child.props;
    if (typeof children === "function") return cloneElement(child, { id: undefined });
    return cloneElement(child, { id: undefined }, children === undefined ? undefined : withoutIds(children));
  });
}

/**
 * A soft glow behind its children. With `colors` it is a blurred gradient; without, it is a blurred,
 * enlarged copy of the children. The glow is decoration: aria-hidden, inert and pointer-events none.
 */
export const Backlight = forwardRef<HTMLDivElement, BacklightProps>(function Backlight(
  {
    children,
    colors,
    intensity = backlightDefaults.intensity,
    blur = backlightDefaults.blur,
    scale = backlightDefaults.scale,
    duration = backlightDefaults.duration,
    isStill = backlightDefaults.isStill,
    className,
    style,
    ...rest
  },
  ref,
) {
  const gradient = colors && colors.length > 0 ? colors : undefined;
  const vars = {
    "--rdm-o": Math.min(1, Math.max(0, intensity)),
    "--rdm-blur": `${Math.max(0, blur)}px`,
    "--rdm-sc": scale,
    "--rdm-d": `${duration}s`,
  } as CSSProperties;
  if (gradient) {
    const list = gradient.length === 1 ? [gradient[0], gradient[0]] : gradient;
    (vars as Record<string, string>)["--rdm-bg"] = `conic-gradient(from 0deg, ${[...list, list[0]].join(", ")})`;
  }

  return (
    <div
      {...rest}
      ref={ref}
      data-rdm-paused={isStill || undefined}
      className={cx("rdm-backlight", className)}
      style={{ ...vars, ...style }}
    >
      <div
        aria-hidden="true"
        {...(gradient ? {} : inertProps)}
        className="rdm-backlight-glow"
        data-mode={gradient ? "colors" : "copy"}
      >
        {gradient ? null : withoutIds(children)}
      </div>
      <div className="rdm-backlight-content">{children}</div>
    </div>
  );
});

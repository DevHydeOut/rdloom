import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { deviceMockDefaults, type DeviceMockSpecProps } from "../generated/device-mock.types";
import { cx } from "../utils/cx";

export interface DeviceMockProps
  extends DeviceMockSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof DeviceMockSpecProps | "className"> {
  className?: string;
}

const tones = {
  dark: { bezel: "border-neutral-700 bg-neutral-900", detail: "bg-neutral-700", chrome: "bg-neutral-800 text-neutral-300" },
  light: { bezel: "border-neutral-300 bg-neutral-100", detail: "bg-neutral-300", chrome: "bg-neutral-200 text-neutral-600" },
} as const;

const dot = "pointer-events-none absolute rounded-full";

/**
 * A drawn device frame around your content. The frame is CSS decoration and hidden from assistive
 * technology; the screen is a real container, so the children keep their own semantics. Static.
 */
export const DeviceMock = forwardRef<HTMLDivElement, DeviceMockProps>(function DeviceMock(
  { children, device = deviceMockDefaults.device, orientation = deviceMockDefaults.orientation, tone = deviceMockDefaults.tone, label, className, ...rest },
  ref,
) {
  const t = tones[tone];
  const landscape = orientation === "landscape" && (device === "phone" || device === "tablet");
  const screen = "relative overflow-hidden bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] forced-colors:border forced-colors:border-[CanvasText]";
  const frame = cx("relative w-full border-solid forced-colors:border-[CanvasText]", t.bezel);
  const deco = (extra: string) => <span aria-hidden="true" className={cx(dot, t.detail, extra)} />;

  let width = "max-w-[18rem]";
  let body: ReactNode;

  if (device === "phone" || device === "tablet") {
    const phone = device === "phone";
    width = phone ? (landscape ? "max-w-[36rem]" : "max-w-[18rem]") : landscape ? "max-w-[42rem]" : "max-w-[26rem]";
    const ratio = phone ? (landscape ? "aspect-[19.5/9]" : "aspect-[9/19.5]") : landscape ? "aspect-[4/3]" : "aspect-[3/4]";
    body = (
      <div className={cx(frame, phone ? "rounded-[2.25rem] border-[0.6rem]" : "rounded-[1.5rem] border-[0.9rem]")}>
        <div className={cx(screen, ratio, phone ? "rounded-[1.6rem]" : "rounded-[0.6rem]")}>{children}</div>
        {phone
          ? deco(landscape ? "start-[-0.45rem] top-1/2 h-[22%] w-[0.3rem] -translate-y-1/2" : "start-1/2 top-[-0.4rem] h-[0.3rem] w-[22%] -translate-x-1/2 rtl:translate-x-1/2")
          : deco(cx("size-[0.35rem]", landscape ? "start-[-0.62rem] top-1/2 -translate-y-1/2" : "start-1/2 top-[-0.62rem] -translate-x-1/2 rtl:translate-x-1/2"))}
      </div>
    );
  } else if (device === "watch") {
    width = "max-w-[11rem]";
    body = (
      <div className="relative flex w-full flex-col items-center">
        <span aria-hidden="true" className={cx("h-6 w-[60%] rounded-t-xl", t.detail)} />
        <div className={cx(frame, "rounded-[2rem] border-[0.5rem]")}>
          <div className={cx(screen, "aspect-[4/5] rounded-[1.4rem]")}>{children}</div>
          {deco("end-[-0.85rem] top-[30%] h-[18%] w-[0.3rem]")}
        </div>
        <span aria-hidden="true" className={cx("h-6 w-[60%] rounded-b-xl", t.detail)} />
      </div>
    );
  } else if (device === "laptop") {
    width = "max-w-[40rem]";
    body = (
      <div className="relative w-full">
        <div className={cx(frame, "rounded-t-[0.9rem] border-[0.55rem] border-b-[0.7rem]")}>
          <div className={cx(screen, "aspect-[16/10] rounded-[0.25rem]")}>{children}</div>
          {deco("start-1/2 top-[-0.4rem] size-[0.25rem] -translate-x-1/2 rtl:translate-x-1/2")}
        </div>
        <div aria-hidden="true" className={cx("mx-[-4%] h-3 rounded-b-[1rem] border border-t-0 forced-colors:border-[CanvasText]", t.bezel)}>
          <span className={cx("mx-auto block h-1 w-1/5 rounded-b-md", t.detail)} />
        </div>
      </div>
    );
  } else if (device === "desktop") {
    width = "max-w-[40rem]";
    body = (
      <div className="relative flex w-full flex-col items-center">
        <div className={cx(frame, "rounded-[0.8rem] border-[0.55rem] border-b-[1.1rem]")}>
          <div className={cx(screen, "aspect-[16/9] rounded-[0.2rem]")}>{children}</div>
        </div>
        <span aria-hidden="true" className={cx("h-8 w-[14%]", t.detail)} />
        <span aria-hidden="true" className={cx("h-2 w-[34%] rounded-t-md rounded-b-sm", t.detail)} />
      </div>
    );
  } else {
    width = "max-w-[40rem]";
    body = (
      <div className={cx(frame, "overflow-hidden rounded-[0.75rem] border")}>
        <div aria-hidden="true" className={cx("flex items-center gap-3 px-3 py-2", t.chrome)}>
          <span className="flex gap-1.5">
            <span className={cx("size-2.5 rounded-full", t.detail)} />
            <span className={cx("size-2.5 rounded-full", t.detail)} />
            <span className={cx("size-2.5 rounded-full", t.detail)} />
          </span>
          <span className={cx("h-4 flex-1 rounded-full", t.detail)} />
        </div>
        <div className={cx(screen, "min-h-40")}>{children}</div>
      </div>
    );
  }

  return (
    <div
      {...rest}
      ref={ref}
      role={label ? "group" : rest.role}
      aria-label={label ?? rest["aria-label"]}
      data-device={device}
      data-orientation={landscape ? "landscape" : "portrait"}
      data-tone={tone}
      className={cx("rd-device-mock mx-auto w-full min-w-0", width, className)}
    >
      {body}
    </div>
  );
});

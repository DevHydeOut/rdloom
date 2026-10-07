"use client";

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import { carouselDefaults, type CarouselSpecProps } from "../generated/carousel.types";
import { cx } from "../utils/cx";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, PauseIcon, PlayIcon } from "../utils/icons";
import { prefersReducedMotion, useIsomorphicLayoutEffect, useReducedMotion } from "../utils/motion";

export interface CarouselProps
  extends CarouselSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof CarouselSpecProps | "className" | "children" | "role" | "defaultValue"> {
  className?: string;
}

const gaps = { sm: "0.5rem", md: "1rem", lg: "1.5rem" } as const;

const defaultMessages = {
  previous: "Previous slide",
  next: "Next slide",
  goTo: "Go to slide {n}",
  dots: "Choose a slide",
  pause: "Pause autoplay",
  play: "Start autoplay",
  slide: "Slide {from} of {total}",
  slides: "Slides {from} to {to} of {total}",
};

function fill(text: string, values: Record<string, number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));
}

interface SlideInfo {
  index: number;
  total: number;
  perView: number;
  gap: string;
  inView: boolean;
}
const SlideContext = createContext<SlideInfo | null>(null);

export interface CarouselItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  /** Replaces the default name, '2 of 5'. */
  label?: string;
}

/** One slide. Place it directly inside Carousel. */
export const CarouselItem = forwardRef<HTMLDivElement, CarouselItemProps>(function CarouselItem({ label, className, style, children, ...rest }, ref) {
  const info = useContext(SlideContext);
  const own = useRef<HTMLDivElement | null>(null);
  const inView = info?.inView ?? true;
  // `inert` is set as an attribute, so it works the same in React 18 and 19.
  useEffect(() => {
    own.current?.toggleAttribute("inert", !inView);
  }, [inView]);
  const n = info?.perView ?? 1;
  return (
    <div
      {...rest}
      ref={(node) => {
        own.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      role="group"
      aria-roledescription="slide"
      aria-label={label ?? (info ? `${info.index + 1} of ${info.total}` : undefined)}
      data-slide=""
      style={{ ...style, flex: `0 0 calc((100% - ${info?.gap ?? "0px"} * ${n - 1}) / ${n})` }}
      className={cx("min-h-0 min-w-0 snap-start", className)}
    >
      {children}
    </div>
  );
});

const arrowClass =
  "absolute z-10 grid size-[var(--rd-size-control-sm)] place-items-center rounded-full border border-[var(--rd-color-border-default)] " +
  "bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-control)] outline-none " +
  "hover:bg-[var(--rd-color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] " +
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-[var(--rd-color-surface-raised)]";

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
  {
    label,
    children,
    orientation = carouselDefaults.orientation,
    slidesPerView = carouselDefaults.slidesPerView,
    loop = carouselDefaults.loop,
    showArrows = carouselDefaults.showArrows,
    showDots = carouselDefaults.showDots,
    autoplay = carouselDefaults.autoplay,
    autoplayInterval = carouselDefaults.autoplayInterval,
    index,
    defaultIndex = carouselDefaults.defaultIndex,
    onIndexChange,
    gap = carouselDefaults.gap,
    messages,
    classNames,
    className,
    onKeyDown,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const text = { ...defaultMessages, ...messages };
  const vertical = orientation === "vertical";
  const slides = Children.toArray(children).filter(isValidElement);
  const total = slides.length;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Narrow containers show fewer slides at once. Unmeasured (server, first paint) it shows what was asked for.
  const [width, setWidth] = useState(0);
  useIsomorphicLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const read = () => setWidth(el.clientWidth);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const asked = Math.max(1, Math.min(3, Math.round(slidesPerView)));
  const perView = vertical || width === 0 ? asked : width < 400 ? 1 : width < 640 ? Math.min(asked, 2) : asked;

  const maxIndex = Math.max(0, total - perView);
  const clamp = (i: number) => Math.min(maxIndex, Math.max(0, Math.round(i) || 0));
  const [inner, setInner] = useState(defaultIndex);
  const current = clamp(index ?? inner);

  // Only a change the person made is announced.
  const [announcement, setAnnouncement] = useState("");
  const moveTo = useCallback(
    (to: number, byPerson: boolean) => {
      const next = Math.min(maxIndex, Math.max(0, to));
      if (next === current) return;
      if (index === undefined) setInner(next);
      onIndexChange?.(next);
      if (byPerson) {
        const from = next + 1;
        const last = Math.min(total, next + perView);
        setAnnouncement(
          perView > 1 && last > from
            ? fill(text.slides, { from, to: last, total })
            : fill(text.slide, { from, total }),
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, index, maxIndex, onIndexChange, perView, total, text.slide, text.slides],
  );
  const step = (dir: 1 | -1, byPerson: boolean, wrap: boolean) => {
    const to = current + dir;
    if (to > maxIndex) return wrap ? moveTo(0, byPerson) : undefined;
    if (to < 0) return wrap ? moveTo(maxIndex, byPerson) : undefined;
    moveTo(to, byPerson);
  };

  // The distance from the start of the viewport to the start of a slide, along the scroll direction.
  const offsetOf = (slide: Element) => {
    const view = viewportRef.current!;
    const v = view.getBoundingClientRect();
    const s = slide.getBoundingClientRect();
    if (vertical) return s.top - v.top;
    return getComputedStyle(view).direction === "rtl" ? s.right - v.right : s.left - v.left;
  };
  const slideEls = () => [...(viewportRef.current?.querySelectorAll(":scope > [data-slide]") ?? [])];
  const scrolledTo = () => {
    let best = 0;
    let bestDistance = Infinity;
    slideEls().forEach((el, i) => {
      const d = Math.abs(offsetOf(el));
      if (d < bestDistance - 0.5) {
        best = i;
        bestDistance = d;
      }
    });
    return best;
  };

  // Keep the scroll position on the current slide when it changes by a button, a key, autoplay or the index prop.
  const mounted = useRef(false);
  useIsomorphicLayoutEffect(() => {
    const view = viewportRef.current;
    const target = slideEls()[current];
    const first = !mounted.current;
    mounted.current = true;
    if (!view || !target) return;
    const delta = offsetOf(target);
    if (Math.abs(delta) < 2 || typeof view.scrollBy !== "function") return;
    const behavior: ScrollBehavior = first || prefersReducedMotion() ? "auto" : "smooth";
    view.scrollBy(vertical ? { top: delta, behavior } : { left: delta, behavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, vertical]);

  // A swipe or a drag of the scroll bar moves the scroll position first; the index follows when it settles.
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(settle.current), []);
  const onScroll = () => {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => moveTo(scrolledTo(), true), 90);
  };

  // Autoplay: stops for hover, for focus inside, for a hidden tab, and for people who ask for less motion.
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const running = autoplay && playing && !hovered && !focused && !reduced && total > perView;
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => step(1, false, true), Math.max(1000, autoplayInterval));
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, autoplayInterval, current, maxIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    // Only when the carousel itself has focus: arrows inside a slide's own controls are left alone.
    if (e.defaultPrevented || e.target !== e.currentTarget) return;
    const rtl = !vertical && getComputedStyle(e.currentTarget).direction === "rtl";
    const forward = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
    const back = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    if (e.key === forward) step(1, true, loop);
    else if (e.key === back) step(-1, true, loop);
    else if (e.key === "Home") moveTo(0, true);
    else if (e.key === "End") moveTo(maxIndex, true);
    else return;
    e.preventDefault();
  };

  const atStart = !loop && current <= 0;
  const atEnd = !loop && current >= maxIndex;
  const arrows = showArrows && total > perView;
  const dots = showDots && maxIndex > 0;
  const toggle = autoplay && !reduced;
  const gapValue = gaps[gap];

  const Prev = vertical ? ChevronUpIcon : ChevronLeftIcon;
  const Next = vertical ? ChevronDownIcon : ChevronRightIcon;
  const flip = vertical ? "" : "rtl:-scale-x-100";

  return (
    <div
      {...rest}
      ref={(node) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      data-orientation={orientation}
      onKeyDown={handleKeyDown}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        setHovered(true);
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        setHovered(false);
      }}
      onFocus={(e) => {
        onFocus?.(e);
        // Focus on the play and pause button itself does not hold autoplay back, or pressing Play would do nothing.
        setFocused(!(e.target as HTMLElement).closest("[data-autoplay-toggle]"));
      }}
      onBlur={(e) => {
        onBlur?.(e);
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className={cx(
        "relative flex w-full flex-col gap-3 rounded-[var(--rd-radius-control)] outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] focus-visible:ring-offset-2",
        classNames?.root,
        className,
      )}
    >
      <div className="relative">
        <div
          ref={viewportRef}
          onScroll={onScroll}
          style={{ gap: gapValue }}
          className={cx(
            "flex overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            vertical ? "h-72 flex-col snap-y snap-mandatory overflow-y-auto" : "snap-x snap-mandatory overflow-x-auto",
            classNames?.viewport,
          )}
        >
          {slides.map((slide, i) => (
            <SlideContext.Provider
              key={(slide as { key?: string | number | null }).key ?? i}
              value={{ index: i, total, perView, gap: gapValue, inView: i >= current && i < current + perView }}
            >
              {slide}
            </SlideContext.Provider>
          ))}
        </div>
        {arrows ? (
          <>
            <button
              type="button"
              aria-label={text.previous}
              aria-disabled={atStart || undefined}
              onClick={() => !atStart && step(-1, true, loop)}
              className={cx(arrowClass, vertical ? "inset-x-0 top-2 mx-auto" : "start-2 top-1/2 -translate-y-1/2", classNames?.arrow)}
            >
              <Prev className={cx("size-4", flip)} />
            </button>
            <button
              type="button"
              aria-label={text.next}
              aria-disabled={atEnd || undefined}
              onClick={() => !atEnd && step(1, true, loop)}
              className={cx(arrowClass, vertical ? "inset-x-0 bottom-2 mx-auto" : "end-2 top-1/2 -translate-y-1/2", classNames?.arrow)}
            >
              <Next className={cx("size-4", flip)} />
            </button>
          </>
        ) : null}
      </div>
      {dots || toggle ? (
        <div className={cx("flex items-center justify-center gap-2", classNames?.controls)}>
          {toggle ? (
            <button
              type="button"
              data-autoplay-toggle=""
              aria-label={playing ? text.pause : text.play}
              onClick={() => setPlaying((p) => !p)}
              className={cx(
                "grid size-6 place-items-center rounded-full text-[var(--rd-color-text-muted)] outline-none hover:text-[var(--rd-color-text-default)]",
                "focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]",
                classNames?.autoplayButton,
              )}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
          ) : null}
          {dots ? (
            <div role="group" aria-label={text.dots} className={cx("flex items-center", classNames?.dots)}>
              {Array.from({ length: maxIndex + 1 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={fill(text.goTo, { n: i + 1 })}
                  aria-current={i === current ? "true" : undefined}
                  onClick={() => moveTo(i, true)}
                  className={cx(
                    "group grid size-6 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]",
                    classNames?.dot,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      "block size-2 rounded-full transition-colors motion-reduce:transition-none",
                      i === current
                        ? "bg-[var(--rd-color-action-primary)]"
                        : "bg-[var(--rd-color-border-strong)] group-hover:bg-[var(--rd-color-text-muted)]",
                    )}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <div role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  );
});

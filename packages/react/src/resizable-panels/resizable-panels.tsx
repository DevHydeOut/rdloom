"use client";

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { resizablePanelsDefaults, type ResizablePanelsSpecProps } from "../generated/resizable-panels.types";
import { cx } from "../utils/cx";
import { GripIcon } from "../utils/icons";
import { useIsomorphicLayoutEffect } from "../utils/motion";

export interface ResizablePanelGroupProps
  extends ResizablePanelsSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ResizablePanelsSpecProps | "className" | "children"> {
  className?: string;
}

export interface ResizablePanelProps {
  /** Names the panel for the handle's aria-controls. A generated one is used when left out. */
  id?: string;
  /** Size in percent at first. Panels without one share what is left. */
  defaultSize?: number;
  /** Smallest size in percent (default 10). */
  minSize?: number;
  /** Largest size in percent (default 100). */
  maxSize?: number;
  /** Lets the panel collapse to collapsedSize when dragged below minSize, or with Enter on its handle. */
  collapsible?: boolean;
  /** Size in percent when collapsed (default 0). */
  collapsedSize?: number;
  children?: ReactNode;
  className?: string;
}

export interface ResizableHandleProps {
  /** Show a visible grip on the handle. */
  withHandle?: boolean;
  /** Accessible name of the handle. */
  label?: string;
  isDisabled?: boolean;
  className?: string;
}

interface PanelConfig {
  id: string;
  defaultSize?: number;
  min: number;
  max: number;
  collapsible: boolean;
  collapsed: number;
}

type Mode = "pointer" | "keyboard";

interface GroupApi {
  orientation: "horizontal" | "vertical";
  layout: number[];
  panels: PanelConfig[];
  dragging: boolean;
  classNames: ResizablePanelsSpecProps["classNames"];
  /** Sets the size of panel `i` (and of its neighbour, which takes the difference). Returns the new layout. */
  resize: (i: number, size: number, mode: Mode, from?: number[]) => void;
  toggle: (i: number) => void;
  reset: (i: number) => void;
  bounds: (i: number) => { min: number; max: number };
  setDragging: (value: boolean) => void;
  container: () => HTMLElement | null;
  layoutRef: { current: number[] };
}

const GroupContext = createContext<GroupApi | null>(null);
const PanelContext = createContext<number>(-1);
const HandleContext = createContext<number>(-1);

const EPS = 0.001;

function initialLayout(panels: PanelConfig[]): number[] {
  const given = panels.reduce((sum, p) => sum + (p.defaultSize ?? 0), 0);
  const open = panels.filter((p) => p.defaultSize === undefined).length;
  let sizes: number[];
  if (open > 0) {
    const share = Math.max(0, 100 - given) / open;
    sizes = panels.map((p) => p.defaultSize ?? share);
  } else sizes = panels.map((p) => p.defaultSize as number);
  const total = sizes.reduce((a, b) => a + b, 0) || 1;
  return sizes.map((s) => (s / total) * 100);
}

function readSaved(key: string, count: number): number[] | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length !== count) return null;
    if (!value.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0)) return null;
    const total = (value as number[]).reduce((a, b) => a + b, 0);
    return Math.abs(total - 100) < 0.5 ? (value as number[]) : null;
  } catch {
    return null;
  }
}

function save(key: string, sizes: number[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(sizes));
  } catch {
    /* storage may be full or blocked: the layout simply is not remembered */
  }
}

export const ResizablePanelGroup = forwardRef<HTMLDivElement, ResizablePanelGroupProps>(function ResizablePanelGroup(
  { children, orientation = resizablePanelsDefaults.orientation, autoSaveId, onLayoutChange, classNames, className, ...rest },
  ref,
) {
  const generated = useId();
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<Record<string, unknown>>[];
  const panelElements = items.filter((el) => el.type === ResizablePanel);
  const panels: PanelConfig[] = panelElements.map((el, i) => {
    const p = el.props as unknown as ResizablePanelProps;
    const collapsedSize = p.collapsible ? (p.collapsedSize ?? 0) : 0;
    return {
      id: p.id ?? `${generated}-panel-${i}`,
      defaultSize: p.defaultSize,
      min: p.minSize ?? 10,
      max: p.maxSize ?? 100,
      collapsible: Boolean(p.collapsible),
      collapsed: collapsedSize,
    };
  });
  const count = panels.length;

  const [sizes, setSizes] = useState<number[] | null>(null);
  const initial = initialLayout(panels);
  const layout = sizes && sizes.length === count ? sizes : initial;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const before = useRef<Record<number, number>>({});
  const callbacks = useRef({ onLayoutChange });
  callbacks.current = { onLayoutChange };
  const storageKey = autoSaveId ? `rdloom:resizable-panels:${autoSaveId}` : null;

  // Remembered sizes are read after mount, so the server and the first client render agree.
  useIsomorphicLayoutEffect(() => {
    if (!storageKey) return;
    const saved = readSaved(storageKey, count);
    if (saved) setSizes(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const commit = (next: number[]) => {
    const current = layoutRef.current;
    if (next.length === current.length && next.every((n, i) => Math.abs(n - current[i]) < EPS)) return;
    layoutRef.current = next;
    setSizes(next);
    callbacks.current.onLayoutChange?.(next);
    if (storageKey) save(storageKey, next);
  };

  // The range panel `i` can take while its neighbour `i + 1` takes the difference.
  const range = (i: number, base: number[]) => {
    const a = panels[i];
    const b = panels[i + 1];
    const total = base[i] + base[i + 1];
    return {
      total,
      lo: Math.max(a.min, total - b.max),
      hi: Math.min(a.max, total - b.min),
      a,
      b,
    };
  };

  const api: GroupApi = {
    orientation,
    layout,
    panels,
    dragging,
    classNames,
    setDragging,
    layoutRef,
    container: () => rootRef.current,
    bounds: (i) => {
      const { lo, hi, a, total, b } = range(i, layout);
      const low = a.collapsible && total - a.collapsed <= b.max ? a.collapsed : lo;
      return { min: Math.min(low, hi), max: Math.max(lo, hi) };
    },
    resize: (i, wanted, mode, from) => {
      if (i < 0 || i + 1 >= count) return;
      const base = from ?? layoutRef.current;
      const { total, lo, hi, a, b } = range(i, base);
      if (lo > hi + EPS) return;
      let next = Math.min(hi, Math.max(lo, wanted));
      const lowLimit = mode === "keyboard" ? lo : (a.collapsed + lo) / 2;
      if (a.collapsible && wanted < lowLimit - (mode === "keyboard" ? EPS : 0) && total - a.collapsed <= b.max + EPS) next = a.collapsed;
      const highSide = total - wanted;
      const highLimit = mode === "keyboard" ? total - hi : (b.collapsed + (total - hi)) / 2;
      if (b.collapsible && highSide < highLimit - (mode === "keyboard" ? EPS : 0) && total - b.collapsed <= a.max + EPS) next = total - b.collapsed;
      const out = [...base];
      out[i] = next;
      out[i + 1] = total - next;
      commit(out);
    },
    toggle: (i) => {
      const current = layoutRef.current;
      // Collapse whichever neighbour can collapse: the one before the handle first.
      for (const k of [i, i + 1]) {
        const p = panels[k];
        if (!p?.collapsible) continue;
        const other = k === i ? i + 1 : i;
        const total = current[k] + current[other];
        const isCollapsed = current[k] <= p.collapsed + EPS;
        let size: number;
        if (isCollapsed) {
          const lo = panels[k].min;
          size = Math.min(panels[k].max, Math.max(lo, before.current[k] ?? panels[k].defaultSize ?? lo));
        } else {
          before.current[k] = current[k];
          size = p.collapsed;
        }
        const out = [...current];
        out[k] = size;
        out[other] = total - size;
        commit(out);
        return;
      }
    },
    reset: (i) => {
      const base = initialRef.current;
      const current = layoutRef.current;
      const total = current[i] + current[i + 1];
      const out = [...current];
      out[i] = Math.min(total, base[i]);
      out[i + 1] = total - out[i];
      commit(out);
    },
  };

  let panelIndex = -1;
  return (
    <GroupContext.Provider value={api}>
      <div
        {...rest}
        ref={(node) => {
          rootRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        data-panel-group=""
        data-orientation={orientation}
        data-dragging={dragging ? "" : undefined}
        className={cx("flex size-full min-h-0 min-w-0", orientation === "vertical" ? "flex-col" : "flex-row", classNames?.root, className)}
      >
        {items.map((el, k) => {
          if (el.type === ResizablePanel) {
            panelIndex += 1;
            return (
              <PanelContext.Provider key={el.key ?? k} value={panelIndex}>
                {el}
              </PanelContext.Provider>
            );
          }
          if (el.type === ResizableHandle) {
            // A handle controls the panel just before it.
            return (
              <HandleContext.Provider key={el.key ?? k} value={panelIndex}>
                {el}
              </HandleContext.Provider>
            );
          }
          return el;
        })}
      </div>
    </GroupContext.Provider>
  );
});

export const ResizablePanel = forwardRef<HTMLDivElement, ResizablePanelProps>(function ResizablePanel({ children, className }, ref) {
  const group = useContext(GroupContext);
  const index = useContext(PanelContext);
  const own = useRef<HTMLDivElement | null>(null);
  const config = group?.panels[index];
  const size = group?.layout[index] ?? 100;
  const hidden = Boolean(config?.collapsible) && size <= (config?.collapsed ?? 0) + EPS && (config?.collapsed ?? 0) === 0;
  useEffect(() => {
    own.current?.toggleAttribute("inert", hidden);
  }, [hidden]);
  const collapsed = Boolean(config?.collapsible) && size <= (config?.collapsed ?? 0) + EPS;
  return (
    <div
      ref={(node) => {
        own.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      id={config?.id}
      data-panel=""
      data-collapsed={collapsed ? "" : undefined}
      style={{ flexGrow: size, flexShrink: 1, flexBasis: 0 }}
      className={cx(
        "min-h-0 min-w-0 overflow-hidden",
        !group?.dragging && "transition-[flex-grow] duration-200 ease-out motion-reduce:transition-none",
        group?.classNames?.panel,
        className,
      )}
    >
      {children}
    </div>
  );
});

export const ResizableHandle = forwardRef<HTMLDivElement, ResizableHandleProps>(function ResizableHandle(
  { withHandle, label = "Resize panels", isDisabled, className },
  ref,
) {
  const group = useContext(GroupContext);
  const i = useContext(HandleContext);
  const drag = useRef<{ x: number; start: number[]; total: number; rtl: boolean } | null>(null);
  const [active, setActive] = useState(false);
  if (!group || i < 0 || i + 1 >= group.panels.length) return null;
  const vertical = group.orientation === "vertical";
  const size = group.layout[i];
  const { min, max } = group.bounds(i);
  const panel = group.panels[i];

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    const rtl = !vertical && getComputedStyle(e.currentTarget).direction === "rtl";
    const grow = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
    const shrink = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    const step = e.shiftKey ? 10 : 1;
    const current = group.layoutRef.current;
    const other = group.panels[i + 1];
    if (e.key === grow || e.key === shrink) {
      const dir = e.key === grow ? 1 : -1;
      const aCollapsed = panel.collapsible && current[i] <= panel.collapsed + EPS;
      const bCollapsed = other.collapsible && current[i + 1] <= other.collapsed + EPS;
      if (aCollapsed && dir > 0) group.resize(i, panel.min, "keyboard");
      else if (bCollapsed && dir < 0) group.resize(i, current[i] + current[i + 1] - other.min, "keyboard");
      else group.resize(i, current[i] + dir * step, "keyboard");
    } else if (e.key === "Home") group.resize(i, min, "keyboard");
    else if (e.key === "End") group.resize(i, max, "keyboard");
    else if (e.key === "Enter") group.toggle(i);
    else return;
    e.preventDefault();
  };

  const metrics = (root: HTMLElement) => {
    const rect = root.getBoundingClientRect();
    let handles = 0;
    root.querySelectorAll(":scope > [role=separator]").forEach((h) => {
      const r = h.getBoundingClientRect();
      handles += vertical ? r.height : r.width;
    });
    return (vertical ? rect.height : rect.width) - handles;
  };

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={vertical ? "horizontal" : "vertical"}
      aria-label={label}
      aria-valuenow={Math.round(size)}
      aria-valuemin={Math.round(min)}
      aria-valuemax={Math.round(max)}
      aria-controls={panel.id}
      aria-disabled={isDisabled || undefined}
      tabIndex={isDisabled ? undefined : 0}
      data-active={active ? "" : undefined}
      onKeyDown={onKeyDown}
      onDoubleClick={() => !isDisabled && group.reset(i)}
      onPointerDown={(e) => {
        if (isDisabled || (e.button ?? 0) !== 0) return;
        const root = group.container();
        if (!root) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        drag.current = {
          x: vertical ? e.clientY : e.clientX,
          start: [...group.layoutRef.current],
          total: metrics(root),
          rtl: !vertical && getComputedStyle(root).direction === "rtl",
        };
        setActive(true);
        group.setDragging(true);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.total <= 0) return;
        const delta = ((vertical ? e.clientY : e.clientX) - d.x) * (d.rtl ? -1 : 1);
        group.resize(i, d.start[i] + (delta / d.total) * 100, "pointer", d.start);
      }}
      onPointerUp={(e) => {
        drag.current = null;
        setActive(false);
        group.setDragging(false);
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setActive(false);
        group.setDragging(false);
      }}
      className={cx(
        "relative flex shrink-0 touch-none items-center justify-center bg-[var(--rd-color-border-default)] outline-none",
        "after:absolute after:content-['']",
        vertical ? "h-px w-full cursor-row-resize after:inset-x-0 after:-inset-y-1.5 [@media(pointer:coarse)]:after:-inset-y-4" : "h-full w-px cursor-col-resize after:inset-y-0 after:-inset-x-1.5 [@media(pointer:coarse)]:after:-inset-x-4",
        "hover:bg-[var(--rd-color-action-primary)] data-[active]:bg-[var(--rd-color-action-primary)]",
        "focus-visible:bg-[var(--rd-color-action-primary)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]",
        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        group.classNames?.handle,
        className,
      )}
    >
      {withHandle ? (
        <span
          aria-hidden="true"
          className={cx(
            "z-10 grid place-items-center rounded-[var(--rd-radius-sm)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-muted)]",
            vertical ? "h-4 w-6" : "h-6 w-4",
            group.classNames?.grip,
          )}
        >
          <GripIcon className={cx("size-3", vertical && "rotate-90")} />
        </span>
      ) : null}
    </div>
  );
});

/** The same component as ResizablePanelGroup, under the name of the spec. */
export const ResizablePanels = ResizablePanelGroup;

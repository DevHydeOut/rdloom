import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia. Tests get a desktop-width viewport by default;
// call setViewportWidth() to test narrow layouts.
let viewportWidth = 1280;

export function setViewportWidth(width: number) {
  viewportWidth = width;
}

afterEach(() => setViewportWidth(1280));

// jsdom has no IntersectionObserver. Tests call intersectAll() to act as if
// every observed element (e.g. a load-more sentinel) scrolled into view.
const observers = new Set<MockIntersectionObserver>();

class MockIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [0];
  private targets = new Set<Element>();
  constructor(private callback: IntersectionObserverCallback) {
    observers.add(this);
  }
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
    observers.delete(this);
  }
  takeRecords() {
    return [];
  }
  fire() {
    const entries = [...this.targets].map(
      (target) => ({ target, isIntersecting: true, intersectionRatio: 1 }) as IntersectionObserverEntry,
    );
    if (entries.length) this.callback(entries, this as unknown as IntersectionObserver);
  }
}

window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

export function intersectAll() {
  observers.forEach((o) => o.fire());
}

// jsdom has no layout: every element measures 0x0. Report inline style sizes
// instead, so the virtualized grid (which sets its height inline) can compute
// which rows are visible. scrollTo also doesn't exist; emulate it.
Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  get() {
    return parseFloat((this as HTMLElement).style.height) || 0;
  },
});
Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  get() {
    return parseFloat((this as HTMLElement).style.width) || 0;
  },
});
Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  get() {
    return (this as HTMLElement).offsetHeight;
  },
});
// Content height = the inline heights of the children (enough for the grid's scroller).
Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
  configurable: true,
  get() {
    const own = (this as HTMLElement).offsetHeight;
    const content = [...(this as HTMLElement).children].reduce((sum, c) => sum + (c as HTMLElement).offsetHeight, 0);
    return Math.max(own, content);
  },
});
const scrollTops = new WeakMap<Element, number>();
Object.defineProperty(Element.prototype, "scrollTop", {
  configurable: true,
  get() {
    return scrollTops.get(this as Element) ?? 0;
  },
  set(value: number) {
    scrollTops.set(this as Element, value);
  },
});
Element.prototype.scrollTo = function (this: Element, options?: ScrollToOptions | number) {
  const top = typeof options === "number" ? arguments[1] : options?.top;
  if (typeof top === "number") this.scrollTop = top;
  this.dispatchEvent(new Event("scroll"));
} as Element["scrollTo"];

window.matchMedia = (query: string) => {
  const min = query.match(/min-width:\s*(\d+)px/);
  return {
    matches: min ? viewportWidth >= Number(min[1]) : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as MediaQueryList;
};

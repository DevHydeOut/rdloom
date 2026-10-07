import { act, render, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { parseQueryState, serializeQueryState, useQueryState, useWindowQueryState } from "../src";

const schema = {
  q: { type: "string", default: "" },
  page: { type: "number", default: 1, min: 1, max: 20 },
  open: { type: "boolean", default: false },
  sort: { type: "enum", values: ["name", "date"], default: "name" },
  tags: { type: "array", default: [], name: "tag" },
} as const;

describe("parseQueryState", () => {
  it("returns defaults for an empty query", () => {
    expect(parseQueryState("", schema)).toEqual({ q: "", page: 1, open: false, sort: "name", tags: [] });
  });

  it("reads every type, with or without the leading question mark, and a URL name", () => {
    const want = { q: "ann", page: 3, open: true, sort: "date", tags: ["a", "b"] };
    expect(parseQueryState("?q=ann&page=3&open=true&sort=date&tag=a&tag=b", schema)).toEqual(want);
    expect(parseQueryState(new URLSearchParams("q=ann&page=3&open=1&sort=date&tag=a&tag=b"), schema)).toEqual(want);
  });

  it("falls back to the default for invalid values and never throws", () => {
    expect(parseQueryState("page=abc&open=maybe&sort=size", schema)).toMatchObject({ page: 1, open: false, sort: "name" });
    expect(parseQueryState("page=&page=Infinity", schema).page).toBe(1);
  });

  it("clamps numbers to min and max and keeps whole numbers", () => {
    expect(parseQueryState("page=0", schema).page).toBe(1);
    expect(parseQueryState("page=-4", schema).page).toBe(1);
    expect(parseQueryState("page=99", schema).page).toBe(20);
    expect(parseQueryState("page=2.7", schema).page).toBe(2);
  });
});

describe("serializeQueryState", () => {
  it("omits defaults by default and keeps them when asked", () => {
    const state = parseQueryState("", schema);
    expect(serializeQueryState(state, schema)).toBe("");
    expect(serializeQueryState(state, schema, { omitDefaults: false })).toBe("q=&page=1&open=false&sort=name");
  });

  it("round trips and writes arrays as repeated keys", () => {
    const state = { q: "a b", page: 4, open: true, sort: "date", tags: ["x", "y"] } as const;
    const query = serializeQueryState(state, schema);
    expect(query).toBe("q=a+b&page=4&open=true&sort=date&tag=x&tag=y");
    expect(parseQueryState(query, schema)).toEqual(state);
  });

  it("cleans invalid values on the way out", () => {
    expect(serializeQueryState({ page: 500 }, schema)).toBe("page=20");
    expect(serializeQueryState({ sort: "bogus" as "name" }, schema)).toBe("");
  });

  it("keeps unrelated parameters from the base query", () => {
    expect(serializeQueryState({ page: 2 }, schema, { base: "utm=1&page=9&tag=old" })).toBe("utm=1&page=2");
  });
});

describe("useQueryState", () => {
  it("reads from the search the app supplies and writes through onChange", () => {
    const writes: string[] = [];
    const { result, rerender } = renderHook(({ search }) => useQueryState(schema, { search, onChange: (s) => writes.push(s) }), {
      initialProps: { search: "utm=1&page=2" },
    });
    expect(result.current[0].page).toBe(2);
    act(() => result.current[1]({ q: "ann" }));
    expect(writes).toEqual(["utm=1&q=ann&page=2"]);
    act(() => result.current[1]((s) => ({ page: s.page + 1 })));
    expect(writes[1]).toBe("utm=1&q=ann&page=3");
    rerender({ search: "" });
    expect(result.current[0].page).toBe(1);
  });

  it("works controlled by React state, like a router would", () => {
    function Harness() {
      const [search, setSearch] = useState("");
      const [state, setState] = useQueryState(schema, { search, onChange: setSearch });
      return (
        <button onClick={() => setState({ page: state.page + 1 })}>
          {state.page}|{search}
        </button>
      );
    }
    const { getByRole } = render(<Harness />);
    act(() => getByRole("button").click());
    expect(getByRole("button").textContent).toBe("2|page=2");
  });
});

describe("useWindowQueryState", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("pushes history entries, replaces on request, and follows popstate", () => {
    window.history.replaceState(null, "", "/list?utm=1&page=2#top");
    const pushed = window.history.length;
    const { result } = renderHook(() => useWindowQueryState(schema));
    expect(result.current[0].page).toBe(2);
    act(() => result.current[1]({ page: 3 }));
    expect(window.location.search).toBe("?utm=1&page=3");
    expect(window.location.hash).toBe("#top");
    expect(window.history.length).toBe(pushed + 1);

    const replace = renderHook(() => useWindowQueryState(schema, { mode: "replace" }));
    act(() => replace.result.current[1]({ page: 5 }));
    expect(window.history.length).toBe(pushed + 1);
    expect(window.location.search).toBe("?utm=1&page=5");

    window.history.replaceState(null, "", "/list?page=7");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current[0].page).toBe(7);
  });

  it("renders on the server without touching window", () => {
    function Page() {
      const [state] = useWindowQueryState(schema);
      return <p>page {state.page}</p>;
    }
    const win = globalThis.window;
    // @ts-expect-error simulate a server
    delete globalThis.window;
    try {
      expect(renderToString(<Page />)).toContain("page <!-- -->1");
    } finally {
      globalThis.window = win;
    }
  });
});

// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useCatalogSearch } from "../../src/hooks/use-catalog-search";
import { GUIDE_ARTICLES } from "../../src/lib/workspace-catalog";
afterEach(cleanup);

describe("catalogue search hook", () => {
  it("combines categories with search and resets both", () => {
    const { result } = renderHook(() => useCatalogSearch(GUIDE_ARTICLES));
    act(() => {
      result.current.setCategory("Safety");
      result.current.setQuery("cancel");
    });
    expect(result.current.results.map((item) => item.id)).toEqual(["cancel"]);
    act(() => result.current.reset());
    expect(result.current.query).toBe("");
    expect(result.current.results).toHaveLength(GUIDE_ARTICLES.length);
  });
  it("caps input and returns an empty result for unknown content", () => {
    const { result } = renderHook(() => useCatalogSearch(GUIDE_ARTICLES));
    act(() => result.current.setQuery("x".repeat(500)));
    expect(result.current.query).toHaveLength(120);
    expect(result.current.results).toEqual([]);
  });
});

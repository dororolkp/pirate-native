import { useMemo, useState } from "react";
import { searchCatalog } from "../lib/workspace-catalog";

export function useCatalogSearch<
  T extends { title: string; category?: string },
>(items: readonly T[]) {
  const [query, updateQuery] = useState("");
  const [category, setCategory] = useState("All");
  const results = useMemo(
    () =>
      searchCatalog(items, query).filter(
        (item) => category === "All" || item.category === category,
      ),
    [items, query, category],
  );
  return {
    query,
    category,
    results,
    setQuery: (value: string) => updateQuery(value.slice(0, 120)),
    setCategory,
    reset: () => {
      updateQuery("");
      setCategory("All");
    },
  };
}

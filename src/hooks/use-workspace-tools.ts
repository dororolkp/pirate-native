import { useCallback, useMemo, useState } from "react";
import { router } from "expo-router";
import { searchCatalog, WORKSPACE_COMMANDS } from "../lib/workspace-catalog";
import { useCommandShortcut } from "./use-command-shortcut";

export function useWorkspaceTools(startTour: () => void) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState(0);
  const results = useMemo(
    () => searchCatalog(WORKSPACE_COMMANDS, query),
    [query],
  );
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => {
    setQuery("");
    setSelection(0);
    setOpen((value) => !value);
  }, []);
  useCommandShortcut(open, toggle, close);
  const choose = useCallback(
    (index = selection) => {
      const command = results[index];
      if (!command) return;
      setOpen(false);
      if (command.route) router.push(command.route);
      else if (command.id === "tour") startTour();
    },
    [results, selection, startTour],
  );
  return {
    open,
    query,
    selection,
    results,
    toggle,
    close,
    choose,
    search: (value: string) => {
      setQuery(value.slice(0, 120));
      setSelection(0);
    },
    move: (direction: number) =>
      setSelection((value) =>
        Math.max(0, Math.min(results.length - 1, value + direction)),
      ),
  };
}

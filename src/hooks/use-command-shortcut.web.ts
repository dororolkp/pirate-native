import { useEffect } from "react";

export function useCommandShortcut(
  open: boolean,
  toggle: () => void,
  close: () => void,
) {
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.isComposing) return;
      const target = event.target;
      const editing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "k" &&
        (open || !editing)
      ) {
        event.preventDefault();
        toggle();
      } else if (open && event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }
    // Modal focus handling can stop bubbling keyboard events.
    window.addEventListener("keydown", keydown, true);
    return () => window.removeEventListener("keydown", keydown, true);
  }, [open, toggle, close]);
}

import { useEffect } from "react";
import { usePathname } from "expo-router";
import { useGuidedTour } from "../hooks/use-guided-tour";

export function GuideFocus() {
  const tour = useGuidedTour();
  const path = usePathname();
  const step = tour?.step;
  useEffect(() => {
    if (!step || path !== step.route) return;
    let highlighted: HTMLElement | null = null;
    let frame = 0;
    function reveal() {
      const target =
        document.querySelector<HTMLElement>(`[data-guide="${step!.target}"]`) ??
        (step!.fallback
          ? document.querySelector<HTMLElement>(
              `[data-guide="${step!.fallback}"]`,
            )
          : null);
      if (!target || target === highlighted) return;
      highlighted?.removeAttribute("data-guide-highlight");
      highlighted = target;
      target.setAttribute("data-guide-highlight", "true");
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        target.scrollIntoView({ block: "center", behavior: "instant" }),
      );
    }
    const observer = new MutationObserver(reveal);
    observer.observe(document.getElementById("main-content") ?? document.body, {
      childList: true,
      subtree: true,
    });
    reveal();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      highlighted?.removeAttribute("data-guide-highlight");
    };
  }, [step, path]);
  return null;
}

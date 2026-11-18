import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { VisualBoundary, VisualFallback } from "./visual-boundary";

const Scene = lazy(() => import("./hero-scene.web"));

export function HeroArt() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // Older browsers still get the art; only the optimization is optional.
      queueMicrotask(() => {
        if (active) setReady(true);
      });
      return () => {
        active = false;
      };
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (active && entries.some((entry) => entry.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-testid="hero-art"
      data-visual-ready={ready}
      style={{ height: "100%", display: "flex", minWidth: 0 }}
    >
      <VisualBoundary>
        <Suspense fallback={<VisualFallback />}>
          {ready ? <Scene /> : <VisualFallback />}
        </Suspense>
      </VisualBoundary>
    </div>
  );
}

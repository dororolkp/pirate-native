import { createContext, PropsWithChildren, useContext, useState } from "react";
import { router } from "expo-router";
import { GUIDE_STEPS } from "../lib/guide-steps";

function useTourController() {
  const [index, setIndex] = useState<number | null>(null);
  const step = index === null ? null : GUIDE_STEPS[index];
  function go(next: number) {
    const bounded = Math.max(0, Math.min(GUIDE_STEPS.length - 1, next));
    setIndex(bounded);
    router.push(GUIDE_STEPS[bounded].route);
  }
  return {
    index,
    step,
    total: GUIDE_STEPS.length,
    start: () => go(0),
    next: () => index !== null && go(index + 1),
    previous: () => index !== null && go(index - 1),
    stop: () => setIndex(null),
  };
}
type Tour = ReturnType<typeof useTourController>;
const Context = createContext<Tour | null>(null);
export function GuidedTourProvider({ children }: PropsWithChildren) {
  const tour = useTourController();
  return <Context.Provider value={tour}>{children}</Context.Provider>;
}
export const useGuidedTour = () => useContext(Context);

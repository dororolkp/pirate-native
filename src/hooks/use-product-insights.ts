import { useSyncExternalStore } from "react";
import { EMPTY_INSIGHTS, insightsStore } from "../lib/product-insights";
const serverSnapshot = () => EMPTY_INSIGHTS;
export function useProductInsights() {
  const state = useSyncExternalStore(
    insightsStore.subscribe,
    insightsStore.getSnapshot,
    serverSnapshot,
  );
  return {
    ...state,
    setEnabled: insightsStore.setEnabled,
    clear: insightsStore.clear,
    total: Object.values(state.counts).reduce((sum, value) => sum + value, 0),
  };
}

import { PUBLIC_EVENTS, type PublicEvent } from "./analytics-events";

export interface InsightsSnapshot {
  enabled: boolean;
  counts: Readonly<Record<PublicEvent, number>>;
}
function snapshot(enabled: boolean): InsightsSnapshot {
  return Object.freeze({
    enabled,
    counts: Object.freeze({
      help_opened: 0,
      mission_history_exported: 0,
      chart_style_changed: 0,
    }),
  });
}
export const EMPTY_INSIGHTS = snapshot(false);

// An opt-in, bounded aggregate store, not a user/session tracking SDK.
export function createInsightsStore() {
  let state = EMPTY_INSIGHTS;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setEnabled(enabled: boolean) {
      if (state.enabled === enabled) return;
      state = snapshot(enabled);
      emit();
    },
    clear() {
      state = snapshot(state.enabled);
      emit();
    },
    record(event: string) {
      if (!state.enabled || !PUBLIC_EVENTS.includes(event as PublicEvent))
        return false;
      const code = event as PublicEvent;
      if (state.counts[code] >= 999) return false;
      state = Object.freeze({
        enabled: true,
        counts: Object.freeze({
          ...state.counts,
          [code]: state.counts[code] + 1,
        }),
      });
      emit();
      return true;
    },
  };
}
export const insightsStore = createInsightsStore();

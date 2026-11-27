import { BehaviorSubject, skip } from "rxjs";
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
  const state = new BehaviorSubject(EMPTY_INSIGHTS);
  return {
    getSnapshot: () => state.value,
    subscribe: (listener: () => void) => {
      // React reads the current snapshot itself; notify only subsequent changes.
      const subscription = state.pipe(skip(1)).subscribe(listener);
      return () => subscription.unsubscribe();
    },
    setEnabled(enabled: boolean) {
      if (state.value.enabled === enabled) return;
      state.next(snapshot(enabled));
    },
    clear() {
      state.next(snapshot(state.value.enabled));
    },
    record(event: string) {
      if (!state.value.enabled || !PUBLIC_EVENTS.includes(event as PublicEvent))
        return false;
      const code = event as PublicEvent;
      if (state.value.counts[code] >= 999) return false;
      state.next(
        Object.freeze({
          enabled: true,
          counts: Object.freeze({
            ...state.value.counts,
            [code]: state.value.counts[code] + 1,
          }),
        }),
      );
      return true;
    },
  };
}
export const insightsStore = createInsightsStore();

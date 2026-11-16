import { useEffect, useSyncExternalStore } from "react";
import { activityStore, EMPTY_ACTIVITY } from "../lib/activity-store";

const serverSnapshot = () => EMPTY_ACTIVITY;
export function useLogbook() {
  const snapshot = useSyncExternalStore(
    activityStore.subscribe,
    activityStore.getSnapshot,
    serverSnapshot,
  );
  useEffect(() => {
    void activityStore.initialize();
  }, []);
  return snapshot;
}

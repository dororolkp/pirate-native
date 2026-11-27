import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// Prerendered controls cannot handle interaction until their client state mounts.
export function useClientReady() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

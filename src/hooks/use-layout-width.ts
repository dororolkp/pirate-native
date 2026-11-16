import { useSyncExternalStore } from "react";
import { Platform, useWindowDimensions } from "react-native";

function subscribe(update: () => void) {
  if (Platform.OS !== "web") return () => {};
  window.addEventListener("resize", update);
  return () => window.removeEventListener("resize", update);
}
const snapshot = () => (typeof window === "undefined" ? 0 : window.innerWidth);
const serverSnapshot = () => 0;

// Match the prerendered mobile layout during hydration, then adapt to the viewport.
export function useLayoutWidth() {
  const dimensions = useWindowDimensions();
  const webWidth = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return Platform.OS === "web" ? webWidth : dimensions.width;
}

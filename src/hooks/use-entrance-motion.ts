import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Platform } from "react-native";

export function useEntranceMotion() {
  // React Native Web does not expose React Native's useAnimatedValue helper.
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let alive = true;
    let preferenceChanged = false;
    let animation: Animated.CompositeAnimation | undefined;
    function settle() {
      animation?.stop();
      opacity.setValue(1);
    }
    function apply(reduced: boolean) {
      settle();
      if (reduced || AppState.currentState !== "active") return;
      opacity.setValue(0);
      animation = Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
      });
      animation.start();
    }
    const preference = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (reduced) => {
        preferenceChanged = true;
        if (alive) apply(reduced);
      },
    );
    const state = AppState.addEventListener("change", (next) => {
      if (next !== "active") settle();
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (reduced) => {
        if (alive && !preferenceChanged) apply(reduced);
      },
      () => {
        if (alive) settle();
      },
    );
    return () => {
      alive = false;
      preference.remove();
      state.remove();
      settle();
    };
  }, [opacity]);
  return { opacity };
}

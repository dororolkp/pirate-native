import { lazy, Suspense, useState } from "react";
import { View } from "react-native";
import { VisualBoundary, VisualFallback } from "./visual-boundary";

const Scene = lazy(() =>
  import("./gazebo-scene").then((module) => ({ default: module.GazeboScene })),
);

// Native art is mounted only when its container is laid out. No DOM or timers.
export function HeroArt() {
  const [ready, setReady] = useState(false);
  return (
    <View style={{ flex: 1 }} onLayout={() => setReady(true)}>
      <VisualBoundary>
        <Suspense fallback={<VisualFallback />}>
          {ready ? <Scene /> : <VisualFallback />}
        </Suspense>
      </VisualBoundary>
    </View>
  );
}

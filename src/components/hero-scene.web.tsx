import { useSyncExternalStore } from "react";
import { GazeboScene } from "./gazebo-scene";

function subscribe(update: () => void) {
  document.addEventListener("visibilitychange", update);
  return () => document.removeEventListener("visibilitychange", update);
}
const snapshot = () => document.visibilityState !== "hidden";
const serverSnapshot = () => true;

// Loaded alongside the vector chunk, not in the initial page's animation budget.
export default function HeroScene() {
  const visible = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  return (
    <div
      className="driving-art"
      data-testid="driving-art"
      data-paused={!visible}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        isolation: "isolate",
      }}
    >
      <style>{`
        .driving-art { animation: art-reveal 650ms ease-out both; }
        .art-orbit { position: absolute; border: 2px solid #fff9; border-radius: 50%; pointer-events: none; }
        .art-orbit-one { width: 92px; height: 92px; right: 14px; top: 10px; animation: art-drift 3.8s ease-in-out both; }
        .art-orbit-two { width: 36px; height: 36px; right: 76px; top: 30px; background: #fff0b4; border: 0; animation: art-drift 3.8s ease-in-out reverse both; }
        .driving-art[data-paused="true"], .driving-art[data-paused="true"] * { animation-play-state: paused; }
        @keyframes art-reveal { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes art-drift { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(12px) rotate(12deg); } }
        @media (prefers-reduced-motion: reduce) {
          .driving-art, .art-orbit { animation: none !important; }
        }
      `}</style>
      <GazeboScene />
      <span className="art-orbit art-orbit-one" aria-hidden="true" />
      <span className="art-orbit art-orbit-two" aria-hidden="true" />
    </div>
  );
}

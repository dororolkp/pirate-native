import { Component, PropsWithChildren, ReactNode } from "react";
import { Text, View } from "react-native";

export function VisualFallback({ failed = false }: { failed?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        gap: 16,
        backgroundColor: "#dce7f7",
        borderRadius: 24,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 16,
          borderColor: "#7664c5",
          backgroundColor: "#8ce1d0",
          transform: [{ rotate: "-20deg" }],
        }}
      />
      <Text style={{ color: "#33276b", fontSize: 12, textAlign: "center" }}>
        {failed
          ? "Illustration unavailable. Workspace controls remain ready."
          : "Driving-world illustration loads when visible."}
      </Text>
    </View>
  );
}

// Decorative chunk failures must never take down mission controls.
export class VisualBoundary extends Component<
  PropsWithChildren<{ fallback?: ReactNode }>,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed
      ? (this.props.fallback ?? <VisualFallback failed />)
      : this.props.children;
  }
}

import { memo } from "react";
import { Text, View } from "react-native";
import { Badge, colors, s } from "./ui";
import { GazeboScene } from "./gazebo-scene";
import { useLayoutWidth } from "../hooks/use-layout-width";

export const SimulationHero = memo(function SimulationHero() {
  const width = useLayoutWidth();
  return (
    <View
      style={{
        backgroundColor: "#eae8ff",
        borderRadius: 24,
        overflow: "hidden",
        flexDirection: width > 850 ? "row" : "column",
      }}
    >
      <View style={{ flex: 1, padding: width < 600 ? 20 : 28, gap: 14 }}>
        <Badge label="PIRATE + GAZEBO / DRIVING LAB" />
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: "#33276b",
            lineHeight: 36,
          }}
        >
          Plan with confidence.{"\n"}Practice without risk.
        </Text>
        <Text style={[s.text, { color: "#493f70", maxWidth: 460 }]}>
          One focused workspace for warehouse missions, fleet insights and
          Gazebo driving previews. Start locally; connect an approved gateway
          when it is ready.
        </Text>
        <View style={s.row}>
          {["Ackermann steering", "Touch + keyboard", "Backend idle"].map(
            (label) => (
              <Badge key={label} label={label} />
            ),
          )}
        </View>
        <Text style={[s.caption, { color: colors.ink }]}>
          Illustrative driving-world diagram, not live telemetry.
        </Text>
      </View>
      <View
        style={{
          width: width > 850 ? "42%" : "100%",
          height: width < 600 ? 200 : 260,
          alignSelf: "center",
        }}
      >
        <GazeboScene />
      </View>
    </View>
  );
});

import { Text, View } from "react-native";
import { Badge, colors, s } from "./ui";
import { GazeboScene } from "./gazebo-scene";
import { useLayoutWidth } from "../hooks/use-layout-width";

export function SimulationHero() {
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
      <View style={{ flex: 1, padding: 28, gap: 14 }}>
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
          Big ideas. Small car.{"\n"}Your next move starts here.
        </Text>
        <Text style={[s.text, { color: "#493f70", maxWidth: 460 }]}>
          Explore motion, steering, and mission planning in one colorful
          workspace. Prepare for Gazebo Harmonic without connecting a backend.
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
          height: 260,
          alignSelf: "center",
        }}
      >
        <GazeboScene />
      </View>
    </View>
  );
}

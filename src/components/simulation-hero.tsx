import { memo } from "react";
import { Text, View } from "react-native";
import { Badge, s } from "./ui";
import { HeroArt } from "./hero-art";
import { useLayoutWidth } from "../hooks/use-layout-width";

export const SimulationHero = memo(function SimulationHero() {
  const width = useLayoutWidth();
  return (
    <View
      style={{
        backgroundColor: "#34286a",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#6656a3",
        overflow: "hidden",
        flexDirection: width > 850 ? "row" : "column",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 240,
          height: 240,
          borderRadius: 120,
          borderWidth: 36,
          borderColor: "#493a82",
          top: -130,
          left: -80,
        }}
      />
      <View style={{ flex: 1, padding: width < 600 ? 20 : 28, gap: 14 }}>
        <Badge label="PIRATE + GAZEBO / DRIVING LAB" />
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: "#ffffff",
            lineHeight: 36,
          }}
        >
          Plan with confidence.{"\n"}Practice without risk.
        </Text>
        <Text style={[s.text, { color: "#e3def8", maxWidth: 460 }]}>
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
        <Text style={[s.caption, { color: "#e3def8" }]}>
          Illustrative driving-world diagram, not live telemetry.
        </Text>
      </View>
      <View
        style={{
          width: width > 850 ? "42%" : "100%",
          height: width < 600 ? 200 : 260,
          alignSelf: "center",
          padding: 12,
        }}
      >
        <HeroArt />
      </View>
    </View>
  );
});

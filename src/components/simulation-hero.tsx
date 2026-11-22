import { memo } from "react";
import { Text, View } from "react-native";
import { Badge, maximalist, s } from "./ui";
import { HeroArt } from "./hero-art";
import { MaximalistPattern } from "./maximalist-pattern";
import { useLayoutWidth } from "../hooks/use-layout-width";

export const SimulationHero = memo(function SimulationHero() {
  const width = useLayoutWidth();
  return (
    <View
      testID="maximalist-hero"
      style={{
        backgroundColor: maximalist.violet,
        borderRadius: 28,
        borderBottomLeftRadius: 8,
        borderWidth: 3,
        borderColor: maximalist.outline,
        boxShadow: "6px 7px 0 #f1a6cd",
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
          borderColor: "#733cc4",
          top: -130,
          left: -80,
        }}
      />
      <View
        pointerEvents="none"
        style={{ position: "absolute", right: -55, bottom: -65, opacity: 0.65 }}
      >
        <MaximalistPattern color={maximalist.pink} size={260} />
      </View>
      <View style={{ flex: 1, padding: width < 600 ? 18 : 30, gap: 18 }}>
        <Badge label="PIRATE + GAZEBO / DRIVING LAB" />
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={{
            fontSize: width < 600 ? 34 : 46,
            fontWeight: "900",
            color: "#ffffff",
            lineHeight: width < 600 ? 43 : 55,
            letterSpacing: -1.4,
          }}
        >
          Plan with confidence.{"\n"}
          <Text style={{ color: maximalist.lime }}>Practice without risk.</Text>
        </Text>
        <Text
          style={[s.text, { color: "#f6edff", maxWidth: 490, fontSize: 14 }]}
        >
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
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: maximalist.pink,
            borderRadius: 9,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 2,
            borderColor: maximalist.outline,
            transform: [{ rotate: "-2deg" }],
          }}
        >
          <Text
            style={{
              color: maximalist.outline,
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 1,
            }}
          >
            SMALL ROBOT. BIG IDEAS.
          </Text>
        </View>
        <Text style={[s.caption, { color: "#e3def8" }]}>
          Illustrative driving-world diagram, not live telemetry.
        </Text>
      </View>
      <View
        style={{
          width: width > 850 ? "44%" : "100%",
          height: width < 600 ? 250 : 330,
          alignSelf: "center",
          padding: 18,
        }}
      >
        <HeroArt />
      </View>
    </View>
  );
});

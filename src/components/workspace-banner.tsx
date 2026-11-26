import { PropsWithChildren } from "react";
import { Animated, Text, View } from "react-native";
import { useEntranceMotion } from "../hooks/use-entrance-motion";
import { useLayoutWidth } from "../hooks/use-layout-width";
import { MaximalistPattern } from "./maximalist-pattern";
import { Badge, maximalist, s } from "./ui";

export function WorkspaceBanner({
  title,
  description,
  children,
}: PropsWithChildren<{ title: string; description: string }>) {
  const motion = useEntranceMotion();
  const width = useLayoutWidth();
  return (
    <View
      style={{
        backgroundColor: maximalist.violet,
        borderColor: maximalist.outline,
        borderWidth: 3,
        borderRadius: 26,
        padding: width < 600 ? 20 : 30,
        overflow: "hidden",
        gap: 14,
        boxShadow: "6px 7px 0 #ff8bc5",
      }}
    >
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[motion, { position: "absolute", right: -45, bottom: -60 }]}
      >
        <MaximalistPattern size={230} color="#8450cb" />
      </Animated.View>
      <Badge label="OPEN TOOLS. ZERO REQUIRED PAID SDKS." />
      <Text
        accessibilityRole="header"
        aria-level={1}
        style={{
          color: "#ffffff",
          fontWeight: "900",
          fontSize: width < 600 ? 30 : 44,
          maxWidth: 750,
          letterSpacing: -1,
        }}
      >
        {title}
      </Text>
      <Text style={[s.text, { color: "#f6edff", maxWidth: 720 }]}>
        {description}
      </Text>
      {children}
    </View>
  );
}

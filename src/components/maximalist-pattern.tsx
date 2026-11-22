import { memo } from "react";
import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

// Original, static geometry: no animation loop, image download or hit targets.
export const MaximalistPattern = memo(function MaximalistPattern({
  color = "#def783",
  size = 180,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg viewBox="0 0 200 200" width="100%" height="100%">
        <Path
          d="M100 8 L114 53 L150 23 L145 70 L192 61 L162 100 L192 139 L145 130 L150 177 L114 147 L100 192 L86 147 L50 177 L55 130 L8 139 L38 100 L8 61 L55 70 L50 23 L86 53 Z"
          fill={color}
        />
        <Circle
          cx={100}
          cy={100}
          r={43}
          fill="none"
          stroke="#34204b"
          strokeWidth={3}
        />
        <Circle cx={100} cy={100} r={22} fill="#fff7e8" />
        <Rect
          x={12}
          y={12}
          width={20}
          height={20}
          rx={4}
          fill="#ff8bc5"
          transform="rotate(20 22 22)"
        />
        <Circle cx={180} cy={177} r={9} fill="#a1eadb" />
      </Svg>
    </View>
  );
});

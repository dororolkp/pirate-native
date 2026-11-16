import { memo } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

// A diagram of the source world's car/obstacle interaction, not a live pose or image resource.
export const GazeboScene = memo(function GazeboScene() {
  return (
    <Svg
      viewBox="0 0 520 310"
      width="100%"
      height="100%"
      accessibilityRole="image"
      accessibilityLabel="Concept diagram: blue hatchback on a curved test lane with teal and coral obstacles. Not live telemetry."
    >
      <Defs>
        <LinearGradient id="floor" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d4ccfa" />
          <Stop offset="1" stopColor="#bfe9f0" />
        </LinearGradient>
        <LinearGradient id="car" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#428ddb" />
          <Stop offset="1" stopColor="#244e9c" />
        </LinearGradient>
      </Defs>
      <Rect width={520} height={310} fill="url(#floor)" rx={24} />
      <Circle cx={462} cy={50} r={90} fill="#fff" opacity={0.22} />
      <Path
        d="M-20 239 Q140 310 248 174 T560 120"
        fill="none"
        stroke="#f8fbff"
        strokeWidth={105}
      />
      <Path
        d="M-20 239 Q140 310 248 174 T560 120"
        fill="none"
        stroke="#7792bb"
        strokeWidth={3}
        strokeDasharray="10 12"
      />
      <G transform="translate(270 117) rotate(-27)">
        <Ellipse cx={3} cy={30} rx={57} ry={26} fill="#424470" opacity={0.2} />
        <Rect x={-44} y={-34} width={16} height={25} rx={5} fill="#253246" />
        <Rect x={28} y={-34} width={16} height={25} rx={5} fill="#253246" />
        <Rect x={-44} y={25} width={16} height={25} rx={5} fill="#253246" />
        <Rect x={28} y={25} width={16} height={25} rx={5} fill="#253246" />
        <Rect
          x={-39}
          y={-60}
          width={78}
          height={121}
          rx={22}
          fill="url(#car)"
          stroke="#1c3c7e"
          strokeWidth={2}
        />
        <Path d="M-27 -32 L27 -32 L22 -7 L-22 -7 Z" fill="#c5f3ff" />
        <Rect x={-23} y={-2} width={46} height={32} rx={8} fill="#5babe7" />
        <Rect x={-23} y={35} width={46} height={14} rx={5} fill="#b7e3f9" />
        <Rect x={-28} y={-51} width={15} height={6} rx={2} fill="#fff5b7" />
        <Rect x={13} y={-51} width={15} height={6} rx={2} fill="#fff5b7" />
      </G>
      <G>
        <Ellipse
          cx={115}
          cy={134}
          rx={34}
          ry={13}
          fill="#41467c"
          opacity={0.14}
        />
        <Path d="M85 102 L116 88 L146 103 L116 119 Z" fill="#62d4c3" />
        <Path d="M85 102 L116 119 L116 145 L85 129 Z" fill="#2f9b91" />
        <Path d="M116 119 L146 103 L146 129 L116 145 Z" fill="#3eb5a7" />
        <Ellipse
          cx={414}
          cy={238}
          rx={34}
          ry={13}
          fill="#41467c"
          opacity={0.14}
        />
        <Path d="M382 206 L414 190 L445 206 L414 222 Z" fill="#ffaa8b" />
        <Path d="M382 206 L414 222 L414 249 L382 232 Z" fill="#d96858" />
        <Path d="M414 222 L445 206 L445 233 L414 249 Z" fill="#ee8870" />
      </G>
      <Circle cx={68} cy={49} r={17} fill="#fff0b4" />
      <SvgText x={26} y={286} fontSize={11} fill="#3a4969" fontWeight="700">
        DRIVING WORLD / CONCEPT DIAGRAM
      </SvgText>
    </Svg>
  );
});

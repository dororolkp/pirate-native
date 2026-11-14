import { useState } from "react";
import { Text, View } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Pattern,
  Defs,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { Crosshair, Layers, Minus, Plus } from "lucide-react-native";
import {
  activeMission,
  FleetSnapshot,
  isStale,
  STATIONS,
} from "../lib/fleet-domain";
import { Badge, Button, colors, Panel, s } from "./ui";

export function WarehouseMap({
  snapshot,
  now,
  live,
}: {
  snapshot: FleetSnapshot;
  now: number;
  live: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [labels, setLabels] = useState(true);
  const task = activeMission(snapshot);
  const robot = snapshot.robot;
  const online = robot.connected && !isStale(robot, now);
  const width = 800 / zoom;
  const height = 390 / zoom;
  return (
    <Panel
      title="Live warehouse map"
      subtitle="Warehouse 01 / Ground floor"
      action={
        <Badge
          label={live ? "LIVE API" : "DEMO LIVE"}
          tone={online ? "green" : "red"}
        />
      }
    >
      <View style={{ backgroundColor: "#fafbfc", paddingTop: 14 }}>
        <View
          style={[
            s.row,
            { paddingHorizontal: 20, justifyContent: "space-between" },
          ]}
        >
          <Text style={s.label}>WAREHOUSE 01</Text>
          <Text style={[s.caption, { fontSize: 10 }]}>
            Application map units
          </Text>
        </View>
        <View style={{ width: "100%", aspectRatio: 800 / 390, minHeight: 180 }}>
          <Svg
            width="100%"
            height="100%"
            viewBox={`${(800 - width) / 2} ${(390 - height) / 2} ${width} ${height}`}
            accessibilityLabel={`Warehouse map. ${robot.name} at x ${Math.round(robot.pose.x)}, y ${Math.round(robot.pose.y)}. ${task ? `Heading to ${STATIONS[task.destination].label}.` : "No active mission."}`}
            accessibilityRole="image"
          >
            <Defs>
              <Pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <Circle cx="1" cy="1" r="0.7" fill="#dce1e5" />
              </Pattern>
            </Defs>
            <Rect width="800" height="390" fill="url(#grid)" />
            <Rect
              x="68"
              y="47"
              width="664"
              height="300"
              rx="6"
              fill="#fcfcfd"
              stroke="#cbd2d9"
              strokeWidth="3"
            />
            <Rect
              x="91"
              y="187"
              width="618"
              height="66"
              rx="5"
              fill="#f0f2f4"
            />
            <Path d="M105 220H696" stroke="#d8dfe6" strokeDasharray="5 6" />
            {[0, 1, 2, 3].map((index) => (
              <G key={index}>
                {[82, 274].map((y) => (
                  <G key={y}>
                    <Rect
                      x={209 + index * 104}
                      y={y}
                      width="74"
                      height="61"
                      rx="3"
                      fill="#e7ebef"
                      stroke="#cbd3db"
                    />
                    {[1, 2].map((n) => (
                      <Line
                        key={n}
                        x1={209 + index * 104 + n * 24}
                        x2={209 + index * 104 + n * 24}
                        y1={y + 6}
                        y2={y + 55}
                        stroke="#cbd3db"
                      />
                    ))}
                    <Line
                      x1={215 + index * 104}
                      x2={277 + index * 104}
                      y1={y + 30}
                      y2={y + 30}
                      stroke="#cbd3db"
                    />
                  </G>
                ))}
                {labels && (
                  <SvgText
                    x={246 + index * 104}
                    y="163"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#85919d"
                  >
                    AISLE 0{index + 1}
                  </SvgText>
                )}
              </G>
            ))}
            {labels && (
              <SvgText
                x="400"
                y="69"
                textAnchor="middle"
                fontSize="10"
                fill="#85919d"
                letterSpacing="2"
              >
                STORAGE ZONE
              </SvgText>
            )}
            {Object.entries(STATIONS).map(([key, station]) => (
              <G key={key}>
                <Rect
                  x={station.x - 33}
                  y="188"
                  width="66"
                  height="64"
                  rx="7"
                  fill={key === "station_a" ? "#e5eee9" : "#fff1e7"}
                  stroke={key === "station_a" ? "#bdd3c6" : "#e9c5a9"}
                  strokeDasharray="4 3"
                />
                <Circle
                  cx={station.x}
                  cy="220"
                  r="15"
                  fill={key === "station_a" ? "#d1e3d8" : "#ffdac1"}
                />
                <SvgText
                  x={station.x}
                  y="225"
                  textAnchor="middle"
                  fontWeight="700"
                  fontSize="13"
                  fill={key === "station_a" ? "#448364" : "#bc5b27"}
                >
                  {key === "station_a" ? "A" : "B"}
                </SvgText>
                {labels && (
                  <G>
                    <SvgText
                      x={station.x}
                      y="270"
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill={colors.ink}
                    >
                      {station.label}
                    </SvgText>
                    <SvgText
                      x={station.x}
                      y="285"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#85919d"
                    >
                      {station.description}
                    </SvgText>
                  </G>
                )}
              </G>
            ))}
            {task && (
              <Path
                d={`M${task.origin.x} ${task.origin.y} L${STATIONS[task.destination].x} ${STATIONS[task.destination].y}`}
                stroke="#ed8751"
                strokeWidth="3"
                strokeDasharray="7 6"
                fill="none"
              />
            )}
            {snapshot.scenario === "obstacle" && (
              <G>
                <Rect
                  x="389"
                  y="202"
                  width="22"
                  height="36"
                  rx="3"
                  fill="#e7b375"
                  stroke="#bb884b"
                />
                <Path d="M393 208l14 22m-14 0l14-22" stroke="#bb884b" />
              </G>
            )}
            <G transform={`translate(${robot.pose.x},${robot.pose.y})`}>
              <Circle
                r="35"
                fill={online ? colors.orange : "#8d98a6"}
                opacity="0.1"
              />
              <Circle
                r="25"
                fill="none"
                stroke={online ? colors.orange : "#8d98a6"}
                strokeOpacity="0.25"
              />
              <G transform={`rotate(${(robot.pose.yaw * 180) / Math.PI})`}>
                <Rect
                  x="-17"
                  y="-14"
                  width="34"
                  height="28"
                  rx="7"
                  fill={online ? colors.orange : "#8d98a6"}
                  stroke="white"
                  strokeWidth="2"
                />
                <Path
                  d="M-3 -5L5 0L-3 5"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
              </G>
              {labels && (
                <SvgText
                  x="0"
                  y="-41"
                  textAnchor="middle"
                  fill={colors.ink}
                  fontWeight="700"
                  fontSize="11"
                >
                  {robot.name}
                </SvgText>
              )}
            </G>
          </Svg>
        </View>
        <View style={[s.row, { padding: 16, justifyContent: "space-between" }]}>
          <View style={s.row}>
            <Badge label="A Receiving" tone="green" />
            <Badge label="B Dispatch" tone="orange" />
          </View>
          <View style={s.row}>
            <Button
              label="Zoom out"
              icon={Minus}
              onPress={() => setZoom((z) => Math.max(1, z - 0.25))}
              disabled={zoom <= 1}
            />
            <Button
              label="Zoom in"
              icon={Plus}
              onPress={() => setZoom((z) => Math.min(2, z + 0.25))}
              disabled={zoom >= 2}
            />
            <Button
              label="Center"
              icon={Crosshair}
              onPress={() => setZoom(1)}
            />
            <Button
              label="Labels"
              icon={Layers}
              onPress={() => setLabels(!labels)}
              selected={labels}
            />
          </View>
        </View>
      </View>
      <View
        style={[
          s.row,
          {
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            justifyContent: "space-between",
          },
        ]}
      >
        <Text style={s.caption}>
          Position {Math.round(robot.pose.x)}, {Math.round(robot.pose.y)} / yaw{" "}
          {robot.pose.yaw.toFixed(2)}
        </Text>
        <Text
          style={[s.caption, { color: online ? colors.green : colors.red }]}
        >
          {online ? "Fresh telemetry" : "Offline / stale"}
        </Text>
      </View>
    </Panel>
  );
}

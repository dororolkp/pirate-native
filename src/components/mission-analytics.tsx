import { useState } from "react";
import { Text, View } from "react-native";
import Svg, {
  G,
  Line,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { BarChart3, TrendingUp } from "lucide-react-native";
import { fleetMetrics, hourlyActivity, Mission } from "../lib/fleet-domain";
import { Badge, Button, colors, Panel, s } from "./ui";
import { trackPublicEvent } from "../lib/analytics";

export function MissionAnalytics({
  missions,
  now,
}: {
  missions: Mission[];
  now: number;
}) {
  const [hours, setHours] = useState(8);
  const [chart, setChart] = useState<"bar" | "line">("bar");
  const data = hourlyActivity(missions, now, hours);
  const max = Math.max(4, ...data.map((d) => d.completed + d.other));
  const total = data.reduce((sum, d) => sum + d.completed + d.other, 0);
  const completed = data.reduce((sum, d) => sum + d.completed, 0);
  const step = 540 / data.length;
  const points = data
    .map(
      (d, i) =>
        `${55 + i * step + step / 2},${170 - ((d.completed + d.other) / max) * 125}`,
    )
    .join(" ");
  return (
    <Panel
      title="Mission activity"
      subtitle="A little progress, every delivery."
    >
      <View style={s.body}>
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <View>
            <Text
              style={{ fontSize: 28, fontWeight: "700", color: colors.ink }}
            >
              {total}{" "}
              <Text style={{ fontSize: 12, color: colors.muted }}>
                missions
              </Text>
            </Text>
            <Text style={s.caption}>{completed} successfully delivered</Text>
          </View>
          <View style={s.row}>
            <Button
              label="Bar chart"
              icon={BarChart3}
              selected={chart === "bar"}
              onPress={() => {
                setChart("bar");
                trackPublicEvent("chart_style_changed");
              }}
            />
            <Button
              label="Line chart"
              icon={TrendingUp}
              selected={chart === "line"}
              onPress={() => {
                setChart("line");
                trackPublicEvent("chart_style_changed");
              }}
            />
          </View>
        </View>
        <View style={{ width: "100%", aspectRatio: 640 / 205 }}>
          <Svg
            viewBox="0 0 640 205"
            width="100%"
            height="100%"
            accessibilityRole="image"
            accessibilityLabel={`${total} missions in the last ${hours} hours, ${completed} completed. ${chart} chart.`}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <G key={n}>
                <Line
                  x1="45"
                  x2="605"
                  y1={170 - n * 31.25}
                  y2={170 - n * 31.25}
                  stroke="#edf0f3"
                />
                <SvgText
                  x="25"
                  y={174 - n * 31.25}
                  textAnchor="middle"
                  fill={colors.muted}
                  fontSize="10"
                >
                  {Math.round((max / 4) * n)}
                </SvgText>
              </G>
            ))}
            {chart === "bar" ? (
              data.map((d, i) => {
                const w = Math.min(26, step * 0.48);
                return (
                  <G key={i}>
                    <Rect
                      x={55 + i * step + (step - w) / 2}
                      y={170 - (d.completed / max) * 125}
                      width={w}
                      height={(d.completed / max) * 125}
                      rx="2"
                      fill={colors.orange}
                    />
                    <Rect
                      x={55 + i * step + (step - w) / 2}
                      y={170 - ((d.completed + d.other) / max) * 125}
                      width={w}
                      height={(d.other / max) * 125}
                      rx="2"
                      fill="#f8d9c6"
                    />
                  </G>
                );
              })
            ) : (
              <Polyline
                points={points}
                stroke={colors.orange}
                strokeWidth="2.5"
                fill="none"
              />
            )}
            {data.map(
              (d, i) =>
                i % Math.max(1, Math.ceil(data.length / 8)) === 0 && (
                  <SvgText
                    key={i}
                    x={55 + i * step + step / 2}
                    y="195"
                    textAnchor="middle"
                    fontSize="10"
                    fill={colors.muted}
                  >
                    {d.label}:00
                  </SvgText>
                ),
            )}
          </Svg>
        </View>
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <View style={s.row}>
            <Badge label="Completed" tone="orange" />
            <Badge label="Other outcomes" />
          </View>
          <View style={s.row}>
            {[8, 24, 168].map((n) => (
              <Button
                key={n}
                label={n === 168 ? "7 days" : `${n} hours`}
                selected={hours === n}
                onPress={() => setHours(n)}
              />
            ))}
          </View>
        </View>
      </View>
    </Panel>
  );
}
export function MissionPerformance({ missions }: { missions: Mission[] }) {
  const metrics = fleetMetrics(missions);
  return (
    <Panel
      title="Mission performance"
      subtitle="Calculated from timestamped mission records."
    >
      <View style={s.body}>
        <Text style={{ fontSize: 42, color: colors.ink, fontWeight: "700" }}>
          {metrics.successRate}
          <Text style={{ fontSize: 21 }}>%</Text>
        </Text>
        <Text style={s.caption}>
          Success rate / completed, failed and canceled missions
        </Text>
        <View
          style={{
            height: 8,
            backgroundColor: "#f0f3f6",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 8,
              width: `${metrics.successRate}%`,
              backgroundColor: colors.green,
              borderRadius: 8,
            }}
          />
        </View>
        <View style={s.separator} />
        {[
          ["Completed", metrics.completed],
          ["Active missions", metrics.active],
          ["Average delivery", `${metrics.averageSeconds}s`],
        ].map(([label, value]) => (
          <View
            key={label}
            style={[s.row, { justifyContent: "space-between" }]}
          >
            <Text style={s.caption}>{label}</Text>
            <Text style={[s.text, { fontWeight: "700" }]}>{value}</Text>
          </View>
        ))}
        <Text style={s.caption}>
          Seeded records are sample data, not real deliveries.
        </Text>
      </View>
    </Panel>
  );
}

import { Text, View } from "react-native";
import { useProductInsights } from "../hooks/use-product-insights";
import { PUBLIC_EVENTS } from "../lib/analytics-events";
import { Badge, Button, colors, maximalist, Panel, s } from "./ui";

const labels = {
  help_opened: "Help opened",
  mission_history_exported: "Mission CSV exports",
  chart_style_changed: "Chart style changes",
};
export function LocalInsights() {
  const insights = useProductInsights();
  return (
    <Panel
      title="Private product insights"
      subtitle="A free local alternative to a product analytics SDK."
    >
      <View style={s.body}>
        <Badge
          label={insights.enabled ? "OPTED IN / MEMORY ONLY" : "OFF BY DEFAULT"}
          tone={insights.enabled ? "green" : "neutral"}
        />
        <Text style={s.text}>
          Count allowlisted interface actions on this device without sending
          them to any service.
        </Text>
        <View style={s.row}>
          <Button
            label={
              insights.enabled
                ? "Disable local insights"
                : "Enable local insights"
            }
            primary
            onPress={() => insights.setEnabled(!insights.enabled)}
          />
          <Button
            label="Clear insight counters"
            disabled={!insights.enabled || insights.total === 0}
            onPress={insights.clear}
          />
        </View>
        <Text accessibilityLiveRegion="polite" style={s.caption}>
          {insights.total} local actions counted. Disable or reload clears every
          counter.
        </Text>
        {PUBLIC_EVENTS.map((event) => (
          <View key={event} style={{ gap: 5 }}>
            <View style={[s.row, { justifyContent: "space-between" }]}>
              <Text style={s.text}>{labels[event]}</Text>
              <Text
                accessibilityLabel={`${labels[event]} count`}
                style={[s.text, { fontWeight: "800" }]}
              >
                {insights.counts[event]}
              </Text>
            </View>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                height: 8,
                backgroundColor: colors.background,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 8,
                  width: `${Math.min(100, insights.counts[event] / 10)}%`,
                  backgroundColor: maximalist.violet,
                }}
              />
            </View>
          </View>
        ))}
        <Text style={s.caption}>
          No identifiers, URLs, poses, commands, searches, timestamps, event
          history or persistence. Counters cap at 999 per action. GA4 consent is
          separate in Settings; this does not enable Google tracking.
        </Text>
      </View>
    </Panel>
  );
}

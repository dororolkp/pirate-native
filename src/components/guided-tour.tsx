import { PropsWithChildren } from "react";
import { ScrollView, Text, View } from "react-native";
import { useGuidedTour } from "../hooks/use-guided-tour";
import { guideAttributes } from "../lib/guide-attributes";
import { Button, colors, maximalist, s } from "./ui";
import { GuideFocus } from "./guide-focus";

export function GuideTarget({
  id,
  children,
}: PropsWithChildren<{ id: string }>) {
  const step = useGuidedTour()?.step;
  return (
    <View
      {...guideAttributes(id)}
      style={
        step?.target === id || step?.fallback === id
          ? {
              borderWidth: 3,
              borderColor: maximalist.violet,
              borderRadius: 16,
              padding: 3,
            }
          : undefined
      }
    >
      {children}
    </View>
  );
}

export function GuidedTour() {
  const tour = useGuidedTour();
  if (!tour?.step) return null;
  return (
    <View
      testID="guided-tour"
      style={{
        backgroundColor: maximalist.lime,
        borderBottomWidth: 2,
        borderColor: maximalist.outline,
        padding: 12,
        gap: 8,
        maxHeight: 260,
      }}
    >
      <GuideFocus />
      <Text
        accessibilityLiveRegion="polite"
        style={[s.label, { color: colors.ink }]}
      >
        GUIDED WORKFLOW / Step {tour.index! + 1} of {tour.total} / No automatic
        commands
      </Text>
      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 5 }}>
        <Text accessibilityRole="header" aria-level={2} style={s.panelTitle}>
          {tour.step.title}
        </Text>
        <Text style={s.text}>{tour.step.detail}</Text>
      </ScrollView>
      <View style={s.row}>
        <Button
          label="Previous step"
          disabled={tour.index === 0}
          onPress={tour.previous}
        />
        <Button
          label={tour.index === tour.total - 1 ? "Finish guide" : "Next step"}
          primary
          onPress={tour.index === tour.total - 1 ? tour.stop : tour.next}
        />
        <Button label="Exit guide" onPress={tour.stop} />
      </View>
    </View>
  );
}

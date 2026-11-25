import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { visualAttributes } from "../lib/visual-attributes";
import { colors, maximalist } from "../lib/theme";
import { useGuidedTour } from "../hooks/use-guided-tour";
import { guideId } from "../lib/guide-steps";

export { colors, maximalist } from "../lib/theme";
export function Button({
  label,
  onPress,
  disabled,
  primary,
  danger,
  icon: Icon,
  selected,
  compact,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  icon?: LucideIcon;
  selected?: boolean;
  compact?: boolean;
}) {
  const target = `button-${guideId(label)}`;
  const highlighted = useGuidedTour()?.step?.target === target;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled: Boolean(disabled),
        selected: Boolean(selected),
      }}
      disabled={disabled}
      onPress={onPress}
      {...visualAttributes("button", danger ? "danger" : "regular", target)}
      style={({ pressed }) => [
        s.button,
        primary && s.primary,
        danger && s.danger,
        selected && s.selected,
        highlighted && {
          borderWidth: 3,
          borderColor: maximalist.violet,
          boxShadow: "0 0 0 4px #ff8bc5",
        },
        (disabled || pressed) && { opacity: disabled ? 0.45 : 0.75 },
      ]}
    >
      {Icon && (
        <Icon
          size={16}
          color={
            primary
              ? "white"
              : danger
                ? colors.red
                : selected
                  ? maximalist.violet
                  : colors.muted
          }
        />
      )}
      {!compact && (
        <Text
          style={[
            s.buttonText,
            primary && { color: "white" },
            danger && { color: colors.red },
            selected && { color: maximalist.violet },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
export function Panel({
  title,
  subtitle,
  children,
  action,
  style,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}>) {
  return (
    <View {...visualAttributes("panel")} style={[s.panel, style]}>
      <View style={s.panelHead}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" aria-level={2} style={s.panelTitle}>
            {title}
          </Text>
          {subtitle && <Text style={s.caption}>{subtitle}</Text>}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}
export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "green" | "orange" | "red" | "neutral";
}) {
  return (
    <View
      style={[
        s.badge,
        {
          backgroundColor:
            tone === "green"
              ? colors.greenSoft
              : tone === "orange"
                ? colors.orangeSoft
                : tone === "red"
                  ? "#fbeceb"
                  : "#f0f3f6",
        },
      ]}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color:
            tone === "green"
              ? colors.green
              : tone === "orange"
                ? colors.orange
                : tone === "red"
                  ? colors.red
                  : colors.muted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
export const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  stack: { gap: 18 },
  button: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 2,
    borderColor: maximalist.outline,
    borderRadius: 14,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 3px 0 #34204b",
  },
  buttonText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  primary: {
    backgroundColor: maximalist.violet,
    borderColor: maximalist.outline,
    boxShadow: "0 4px 0 #34204b",
  },
  danger: { backgroundColor: "#fff5f4", borderColor: "#f0d4d2" },
  selected: {
    backgroundColor: maximalist.lime,
    borderColor: maximalist.outline,
  },
  panel: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: maximalist.outline,
    backgroundColor: colors.surface,
    overflow: "hidden",
    boxShadow: "5px 6px 0 #e4c9ee",
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: maximalist.outline,
    backgroundColor: "#fff0d4",
  },
  panelTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 5 },
  body: { padding: 20, gap: 14 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c6b1d3",
    alignSelf: "flex-start",
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    color: colors.ink,
    backgroundColor: "#fafbfc",
    fontSize: 13,
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  text: { color: colors.ink, fontSize: 13, lineHeight: 21 },
  separator: { height: 1, backgroundColor: colors.border },
});

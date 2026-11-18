import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { visualAttributes } from "../lib/visual-attributes";

export const colors = {
  background: "#f5f4fc",
  surface: "#ffffff",
  ink: "#253246",
  muted: "#59657a",
  border: "#e1e3ef",
  orange: "#a44925",
  orangeSoft: "#fff0e8",
  green: "#397558",
  greenSoft: "#e9f3ec",
  red: "#b44c48",
};
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
      {...visualAttributes("button", danger ? "danger" : "regular")}
      style={({ pressed }) => [
        s.button,
        primary && s.primary,
        danger && s.danger,
        selected && s.selected,
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
                  ? colors.orange
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
            selected && { color: colors.orange },
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: { fontSize: 12, fontWeight: "600", color: colors.ink },
  primary: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
    boxShadow: "0 4px 0 #75371f",
  },
  danger: { backgroundColor: "#fff5f4", borderColor: "#f0d4d2" },
  selected: { backgroundColor: colors.orangeSoft, borderColor: "#edc5ae" },
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
    overflow: "hidden",
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panelTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 5 },
  body: { padding: 20, gap: 14 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
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

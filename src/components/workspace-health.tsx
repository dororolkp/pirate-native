import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowUpRight, BookOpen, ShieldCheck } from "lucide-react-native";
import type { FleetController } from "../hooks/use-fleet";
import { workspaceHealth } from "../lib/workspace-health";
import { Badge, colors, s } from "./ui";

export function WorkspaceHealth({ fleet }: { fleet: FleetController }) {
  if (!fleet.snapshot) return null;
  const health = workspaceHealth(
    fleet.snapshot,
    fleet.now,
    fleet.isLive,
    fleet.connectionError,
  );
  return (
    <View
      style={[
        s.row,
        {
          padding: 20,
          borderRadius: 18,
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: colors.border,
          gap: 18,
        },
      ]}
    >
      <View
        style={{ padding: 12, borderRadius: 14, backgroundColor: "#eeebff" }}
      >
        <ShieldCheck size={24} color="#443c91" />
      </View>
      <View style={{ flex: 1, minWidth: 180 }}>
        <View style={s.row}>
          <Text style={[s.text, { fontWeight: "700" }]}>Operations status</Text>
          <Badge label={health.label} tone={health.tone} />
        </View>
        <Text style={s.caption}>{health.detail}</Text>
      </View>
      <Link href="/logbook" asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="View logbook"
          style={StyleSheet.flatten([s.button, { backgroundColor: "#f7f6ff" }])}
        >
          <BookOpen size={17} color="#443c91" />
          <Text style={[s.buttonText, { color: "#443c91" }]}>View logbook</Text>
          <ArrowUpRight size={15} color="#443c91" />
        </Pressable>
      </Link>
    </View>
  );
}

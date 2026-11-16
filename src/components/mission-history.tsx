import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Download, ChevronLeft, ChevronRight } from "lucide-react-native";
import { FleetEvent, Mission, STATIONS, TaskStatus } from "../lib/fleet-domain";
import { exportMissions } from "../lib/export-missions";
import { Badge, Button, colors, Panel, s } from "./ui";
import { useLayoutWidth } from "../hooks/use-layout-width";
import { activityStore } from "../lib/activity-store";
import { API_BASE } from "../lib/fleet-service";
import { trackPublicEvent } from "../lib/analytics";

export const statusTone = (status: TaskStatus) =>
  status === "completed"
    ? "green"
    : status === "failed"
      ? "red"
      : status === "queued" || status === "running"
        ? "orange"
        : "neutral";
export function MissionHistory({
  missions,
  viewMission,
  compact = false,
}: {
  missions: Mission[];
  viewMission: (mission: Mission) => void;
  compact?: boolean;
}) {
  const width = useLayoutWidth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const results = useMemo(
    () =>
      missions.filter(
        (m) =>
          (filter === "all" || m.status === filter) &&
          `${m.task_id} ${m.robot_id} ${STATIONS[m.destination].label} ${m.status}`
            .toLowerCase()
            .includes(normalizedSearch),
      ),
    [missions, filter, normalizedSearch],
  );
  const size = compact ? 5 : 8;
  const lastPage = Math.max(0, Math.ceil(results.length / size) - 1);
  const current = Math.min(page, lastPage);
  const visible = results.slice(current * size, (current + 1) * size);
  async function download() {
    try {
      await exportMissions(results);
      trackPublicEvent("mission_history_exported");
      void activityStore
        .record("history_export", "ok", API_BASE ? "live" : "demo")
        .catch(() => undefined);
      setError("");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Export failed.");
    }
  }
  return (
    <Panel
      title={compact ? "Recent missions" : "Mission ledger"}
      subtitle="Every journey, accounted for."
      action={
        <Button
          label="Export CSV"
          icon={Download}
          onPress={() => void download()}
        />
      }
    >
      {!compact && (
        <View style={s.body}>
          <TextInput
            accessibilityLabel="Search missions"
            placeholder="Search by mission, robot, destination or status..."
            placeholderTextColor={colors.muted}
            style={s.input}
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              setPage(0);
            }}
          />
          <View style={s.row}>
            {[
              "all",
              "queued",
              "running",
              "completed",
              "failed",
              "canceled",
            ].map((status) => (
              <Button
                key={status}
                label={status === "all" ? "All statuses" : status}
                selected={filter === status}
                onPress={() => {
                  setFilter(status);
                  setPage(0);
                }}
              />
            ))}
          </View>
        </View>
      )}
      {error && (
        <Text
          accessibilityRole="alert"
          style={[s.text, { padding: 16, color: colors.red }]}
        >
          {error}
        </Text>
      )}
      {width > 750 && (
        <View
          style={[
            s.row,
            {
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: "#fafbfc",
            },
          ]}
        >
          <Text style={[s.label, { flex: 1.3 }]}>MISSION</Text>
          <Text style={[s.label, { flex: 1 }]}>DESTINATION</Text>
          <Text style={[s.label, { flex: 1 }]}>STATUS</Text>
          <Text style={[s.label, { flex: 1 }]}>CREATED</Text>
          <View style={{ width: 74 }} />
        </View>
      )}
      {visible.map((m) => (
        <View
          key={m.task_id}
          style={[
            s.row,
            {
              padding: 16,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={{ flex: width > 750 ? 1.3 : 1, minWidth: 120 }}>
            <Text style={[s.text, { fontWeight: "600" }]}>{m.task_id}</Text>
            <Text style={s.caption}>{m.robot_id}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 100 }}>
            <Text style={s.text}>{STATIONS[m.destination].label}</Text>
            {width <= 750 && (
              <Text style={s.caption}>
                {new Date(m.created_at).toLocaleTimeString()}
              </Text>
            )}
          </View>
          <View style={{ flex: width > 750 ? 1 : undefined }}>
            <Badge label={m.status} tone={statusTone(m.status)} />
          </View>
          {width > 750 && (
            <Text style={[s.caption, { flex: 1 }]}>
              {new Date(m.created_at).toLocaleTimeString()}
            </Text>
          )}
          <Button label="Details" onPress={() => viewMission(m)} />
        </View>
      ))}
      {!visible.length && (
        <View style={[s.body, { alignItems: "center" }]}>
          <Text style={s.panelTitle}>No missions found</Text>
          <Text style={s.caption}>
            Change the search or filters, or dispatch a new mission.
          </Text>
        </View>
      )}
      <View style={[s.row, { padding: 16, justifyContent: "space-between" }]}>
        <Text style={s.caption}>
          {results.length} missions / Page {current + 1} of {lastPage + 1}
        </Text>
        <View style={s.row}>
          <Button
            label="Previous"
            icon={ChevronLeft}
            disabled={current === 0}
            onPress={() => setPage(current - 1)}
          />
          <Button
            label="Next"
            icon={ChevronRight}
            disabled={current === lastPage}
            onPress={() => setPage(current + 1)}
          />
        </View>
      </View>
    </Panel>
  );
}
export function ActivityTimeline({
  events,
  limit = 8,
}: {
  events: FleetEvent[];
  limit?: number;
}) {
  return (
    <Panel
      title="Activity timeline"
      subtitle="Timestamped updates from your fleet."
    >
      <View style={s.body}>
        {!events.length && <Text style={s.caption}>No events yet.</Text>}
        {events.slice(0, limit).map((event) => (
          <View key={event.event_id} style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                marginTop: 6,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  event.level === "error"
                    ? colors.red
                    : event.level === "warning"
                      ? colors.orange
                      : colors.green,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.text}>{event.message}</Text>
              <Text style={s.caption}>
                {new Date(event.timestamp).toLocaleString()}
                {event.task_id ? ` / ${event.task_id}` : ""}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Panel>
  );
}

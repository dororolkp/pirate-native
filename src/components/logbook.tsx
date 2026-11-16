import { memo, useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { BookOpen, Download, ShieldCheck, Trash2 } from "lucide-react-native";
import { useLogbook } from "../hooks/use-logbook";
import {
  ACTIVITY_LABELS,
  activityCsv,
  activityStore,
} from "../lib/activity-store";
import { exportCsv } from "../lib/export-missions";
import { Badge, Button, colors, Panel, s } from "./ui";
import { Dialog } from "./fleet-shell";

export const Logbook = memo(function Logbook() {
  const journal = useLogbook();
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [page, setPage] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  const results = useMemo(
    () =>
      journal.entries.filter(
        (entry) =>
          (outcome === "all" || entry.outcome === outcome) &&
          `${ACTIVITY_LABELS[entry.code]} ${entry.mode}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [journal.entries, outcome, query],
  );
  const pages = Math.max(1, Math.ceil(results.length / 10));
  const current = Math.min(page, pages - 1);
  async function download() {
    try {
      await exportCsv(activityCsv(results), `pirate-logbook-${Date.now()}.csv`);
      setNotice("Filtered local records exported.");
    } catch {
      setNotice("Export unavailable. Try again on a device with file sharing.");
    }
  }
  return (
    <View style={s.stack}>
      <View
        style={[
          s.row,
          { padding: 20, borderRadius: 18, backgroundColor: colors.greenSoft },
        ]}
      >
        <ShieldCheck color={colors.green} size={24} />
        <View style={{ flex: 1, minWidth: 180 }}>
          <Text style={[s.text, { fontWeight: "700" }]}>
            Your device. Your operational record.
          </Text>
          <Text style={s.caption}>
            Up to 200 records, retained for seven days. Nothing here is sent to
            Google or the backend. This is not a tamper-proof audit trail.
          </Text>
        </View>
        <Badge
          label={journal.enabled ? "LOCAL ONLY" : "RECORDING OFF"}
          tone={journal.enabled ? "green" : "neutral"}
        />
      </View>
      <Panel
        title="Operational logbook"
        subtitle="Requests and observed outcomes, without sensitive payloads."
        action={
          <Button
            label="Export logbook CSV"
            icon={Download}
            disabled={!results.length}
            onPress={() => void download()}
          />
        }
      >
        <View style={s.body}>
          <TextInput
            accessibilityLabel="Search logbook"
            placeholder="Search local events or mode..."
            placeholderTextColor={colors.muted}
            style={s.input}
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              setPage(0);
            }}
          />
          <View style={s.row}>
            {(
              [
                ["all", "All events"],
                ["ok", "Successful"],
                ["failed", "Failures"],
                ["info", "Information"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                label={label}
                selected={outcome === value}
                onPress={() => {
                  setOutcome(value);
                  setPage(0);
                }}
              />
            ))}
          </View>
          {(journal.error || notice) && (
            <Text accessibilityLiveRegion="polite" style={s.caption}>
              {journal.error || notice}
            </Text>
          )}
          {!journal.ready && (
            <Text style={s.caption}>Loading your local record...</Text>
          )}
          {journal.ready && !results.length && (
            <View style={{ padding: 24, alignItems: "center", gap: 8 }}>
              <BookOpen color={colors.muted} size={32} />
              <Text style={s.panelTitle}>No matching events</Text>
              <Text style={s.caption}>
                {journal.enabled
                  ? "Try another filter, or use a local workspace action."
                  : "Recording is disabled. Enable it below to keep new local events."}
              </Text>
            </View>
          )}
          {results.slice(current * 10, current * 10 + 10).map((entry) => (
            <View
              key={entry.id}
              style={[
                s.row,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingVertical: 12,
                },
              ]}
            >
              <View style={{ flex: 1, minWidth: 170 }}>
                <Text style={[s.text, { fontWeight: "600" }]}>
                  {ACTIVITY_LABELS[entry.code]}
                </Text>
                <Text style={s.caption}>
                  {new Date(entry.timestamp).toLocaleString()} / {entry.mode}
                </Text>
              </View>
              <Badge
                label={
                  entry.outcome === "ok"
                    ? "SUCCESS"
                    : entry.outcome === "failed"
                      ? "FAILED"
                      : "INFO"
                }
                tone={
                  entry.outcome === "failed"
                    ? "red"
                    : entry.outcome === "ok"
                      ? "green"
                      : "neutral"
                }
              />
            </View>
          ))}
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Text style={s.caption}>
              {results.length} events / Page {current + 1} of {pages}
            </Text>
            <View style={s.row}>
              <Button
                label="Previous events"
                disabled={current === 0}
                onPress={() => setPage(current - 1)}
              />
              <Button
                label="Next events"
                disabled={current === pages - 1}
                onPress={() => setPage(current + 1)}
              />
            </View>
          </View>
        </View>
      </Panel>
      <Panel
        title="Local history preferences"
        subtitle="Disabling recording also clears saved records on this device."
      >
        <View style={s.body}>
          <View style={s.row}>
            <Button
              label={
                journal.enabled
                  ? "Disable local recording"
                  : "Enable local recording"
              }
              onPress={() => void activityStore.setEnabled(!journal.enabled)}
            />
            <Button
              label="Clear local logbook"
              danger
              icon={Trash2}
              disabled={!journal.entries.length}
              onPress={() => setConfirm(true)}
            />
          </View>
          <Text style={s.caption}>
            Request success does not certify robot motion or stopping. Live
            cancellation must still be acknowledged by the backend.
            Shared-device users can clear or disable this history at any time.
          </Text>
        </View>
      </Panel>
      <Dialog
        title="Clear local logbook?"
        visible={confirm}
        close={() => setConfirm(false)}
      >
        <Text style={s.text}>
          This permanently clears local logbook entries. Missions and backend
          data are unaffected.
        </Text>
        <Button
          label="Confirm clear logbook"
          danger
          onPress={() =>
            void activityStore.clear().then(() => setConfirm(false))
          }
        />
        <Button label="Keep logbook" onPress={() => setConfirm(false)} />
      </Dialog>
    </View>
  );
});

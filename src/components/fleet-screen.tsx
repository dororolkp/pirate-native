import { useState } from "react";
import { Text, View } from "react-native";
import {
  Bot,
  CheckCircle2,
  Flag,
  Plus,
  RefreshCw,
  TrendingUp,
} from "lucide-react-native";
import { useFleet } from "../hooks/use-fleet";
import {
  activeMission,
  dispatchError,
  fleetMetrics,
  isStale,
  Mission,
  missionDuration,
  StationId,
  STATIONS,
} from "../lib/fleet-domain";
import { API_BASE, ROBOT_ID } from "../lib/fleet-service";
import { Badge, Button, colors, Panel, s } from "./ui";
import { WarehouseMap } from "./warehouse-map";
import { RobotCommandCenter } from "./robot-command-center";
import { MissionAnalytics, MissionPerformance } from "./mission-analytics";
import {
  ActivityTimeline,
  MissionHistory,
  statusTone,
} from "./mission-history";
import { Dialog } from "./fleet-shell";
import { SimulationHero } from "./simulation-hero";
import { GazeboDrivingLab } from "./gazebo-driving-lab";
import { ArielAssistant } from "./ariel-assistant";
import { AnalyticsPreferences } from "./web-presence";
import { useLayoutWidth } from "../hooks/use-layout-width";

type Tab = "Overview" | "Robots" | "Missions" | "Analytics" | "Settings";
const headings = {
  Overview: [
    "Fleet overview",
    "A clear view of your fleet. A better way to move.",
  ],
  Robots: [
    "Your robot fleet",
    "One place to monitor, dispatch, and stay in control.",
  ],
  Missions: [
    "Mission center",
    "Plan a delivery. Follow its journey. Keep the record.",
  ],
  Analytics: [
    "Fleet analytics",
    "Turn every mission into a little more insight.",
  ],
  Settings: [
    "Workspace settings",
    "Your simulation, connection, and integration essentials.",
  ],
};
export function FleetScreen({ tab }: { tab: Tab }) {
  const fleet = useFleet();
  const width = useLayoutWidth();
  const wide = width >= 1250;
  const [period, setPeriod] = useState("all");
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [destination, setDestination] = useState<StationId>("station_b");
  const [selected, setSelected] = useState<Mission | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const snapshot = fleet.snapshot;
  if (!snapshot)
    return (
      <View style={s.stack}>
        <Text
          accessibilityRole="header"
          style={{ color: colors.ink, fontSize: 30, fontWeight: "700" }}
        >
          {headings[tab][0]}
        </Text>
        <Text style={s.text}>{headings[tab][1]}</Text>
        {(tab === "Overview" || tab === "Robots") && <SimulationHero />}
        <Text style={s.caption}>
          Loading local workspace. Gazebo backend remains idle.
        </Text>
      </View>
    );
  const task = activeMission(snapshot);
  const start =
    period === "all"
      ? 0
      : period === "week"
        ? fleet.now - 7 * 86_400_000
        : new Date(new Date(fleet.now).setHours(0, 0, 0, 0)).getTime();
  const missions = snapshot.missions.filter(
    (m) => Date.parse(m.created_at) >= start,
  );
  const metrics = fleetMetrics(missions);
  const details = selected
    ? (snapshot.missions.find((m) => m.task_id === selected.task_id) ??
      selected)
    : null;
  const blocked = fleet.connectionError
    ? "Connection unavailable. Refresh telemetry before dispatching."
    : dispatchError(snapshot, destination, fleet.now);
  async function dispatch() {
    if (await fleet.dispatch(destination)) setDispatchOpen(false);
  }
  const pair = (left: React.ReactNode, right: React.ReactNode, ratio = 2) => (
    <View
      style={{
        flexDirection: wide ? "row" : "column",
        gap: 18,
        alignItems: "stretch",
      }}
    >
      <View style={{ flex: wide ? ratio : undefined, minWidth: 0 }}>
        {left}
      </View>
      <View style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>{right}</View>
    </View>
  );
  return (
    <View style={s.stack}>
      <View
        style={[
          s.row,
          { justifyContent: "space-between", marginBottom: 5, gap: 20 },
        ]}
      >
        <View style={{ flex: 1, minWidth: 230 }}>
          <Text
            style={[
              s.label,
              { fontSize: 9, letterSpacing: 1.5, marginBottom: 9 },
            ]}
          >
            YOUR OPERATIONS, IN SYNC
          </Text>
          <Text
            accessibilityRole="header"
            style={{
              fontSize: width < 600 ? 29 : 34,
              fontWeight: "700",
              letterSpacing: -1.1,
              color: colors.ink,
            }}
          >
            {headings[tab][0]}
            <Text style={{ color: colors.orange }}>.</Text>
          </Text>
          <Text style={[s.caption, { marginTop: 9, fontSize: 13 }]}>
            {headings[tab][1]}
          </Text>
        </View>
        {tab !== "Settings" && (
          <Button
            label="New mission"
            primary
            icon={Plus}
            disabled={fleet.pending}
            onPress={() => {
              setDestination(
                snapshot.robot.pose.x > 650 ? "station_a" : "station_b",
              );
              setDispatchOpen(true);
            }}
          />
        )}
      </View>
      {(tab === "Overview" || tab === "Robots") && <SimulationHero />}
      <View
        style={[
          s.row,
          {
            padding: 14,
            backgroundColor: fleet.isLive ? "#edf3fa" : "#fff7f0",
            borderRadius: 9,
            borderWidth: 1,
            borderColor: fleet.isLive ? "#d3e0ef" : "#f0e1d4",
          },
        ]}
      >
        <Badge
          label={fleet.isLive ? "BACKEND MODE" : "SAFE DEMO"}
          tone="orange"
        />
        <Text style={[s.caption, { flex: 1, minWidth: 180, marginTop: 0 }]}>
          {fleet.isLive
            ? "Authoritative backend telemetry. History includes tasks created in this session only."
            : "This workspace is a simulation. No physical robot is controlled. Includes 24 seeded sample missions."}
        </Text>
      </View>
      {tab !== "Settings" && (
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <Text style={s.label}>REPORTING PERIOD</Text>
          <View style={s.row}>
            {[
              ["all", "All time"],
              ["today", "Today"],
              ["week", "Last 7 days"],
            ].map(([value, label]) => (
              <Button
                key={value}
                label={label}
                selected={period === value}
                onPress={() => setPeriod(value)}
              />
            ))}
          </View>
        </View>
      )}
      {tab !== "Settings" && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
          {[
            {
              label: "Total missions",
              value: metrics.total,
              note: "Across selected period",
              icon: Flag,
            },
            {
              label: "Robots online",
              value:
                snapshot.robot.connected &&
                !isStale(snapshot.robot, fleet.now) &&
                !fleet.connectionError
                  ? "1 / 1"
                  : "0 / 1",
              note: "Atlas / Warehouse 01",
              icon: Bot,
            },
            {
              label: "Completed",
              value: metrics.completed,
              note: "Successful deliveries",
              icon: CheckCircle2,
            },
            {
              label: "Success rate",
              value: `${metrics.successRate}%`,
              note: "Terminal mission outcomes",
              icon: TrendingUp,
            },
          ].map(({ label, value, note, icon: Icon }, index) => (
            <View
              key={label}
              style={{
                flexGrow: 1,
                flexBasis: width < 600 ? "45%" : "21%",
                backgroundColor: ["#eeebff", "#e5f4ef", "#fff0e6", "#e8f0ff"][
                  index
                ],
                padding: 20,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 18,
                gap: 12,
              }}
            >
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <Text style={s.label}>{label}</Text>
                <Icon
                  color={["#64479b", "#287263", "#a44925", "#3c64a5"][index]}
                  size={20}
                />
              </View>
              <Text
                style={{ fontSize: 29, fontWeight: "700", color: colors.ink }}
              >
                {value}
              </Text>
              <Text style={s.caption}>{note}</Text>
            </View>
          ))}
        </View>
      )}
      {(tab === "Overview" || tab === "Robots") &&
        pair(
          <WarehouseMap
            snapshot={snapshot}
            now={fleet.now}
            live={fleet.isLive}
          />,
          <RobotCommandCenter fleet={fleet} expanded={tab === "Robots"} />,
        )}
      {tab === "Robots" && <GazeboDrivingLab />}
      {(tab === "Robots" || tab === "Settings") && <ArielAssistant />}
      {(tab === "Overview" || tab === "Analytics") &&
        pair(
          <MissionAnalytics missions={missions} now={fleet.now} />,
          <MissionPerformance missions={missions} />,
        )}
      {(tab === "Overview" || tab === "Missions") && (
        <MissionHistory
          missions={missions}
          viewMission={setSelected}
          compact={tab === "Overview"}
        />
      )}
      {(tab === "Overview" || tab === "Robots" || tab === "Missions") && (
        <ActivityTimeline events={snapshot.events} />
      )}
      {tab === "Settings" && (
        <View style={s.stack}>
          <AnalyticsPreferences />
          <Panel
            title="Gazebo cooperation"
            subtitle="Integration prepared, backend intentionally idle."
          >
            <View style={s.body}>
              <Badge label="NOT CONNECTED" tone="orange" />
              <Text style={s.text}>
                Gazebo Harmonic / shapes / hatchback_blue. The driving lab
                previews Ackermann velocity commands locally.
              </Text>
              <Text style={s.caption}>
                The Gazebo source provides Python transport controls, not a web
                API. Proposed gateway schemas and control leases are documented
                in docs/GAZEBO_INTEGRATION.md. The Atlas warehouse demo remains
                separate; its map units must not be interpreted as Gazebo
                meters.
              </Text>
            </View>
          </Panel>
          <Panel
            title="Connection & integration"
            subtitle="Build-time configuration, never a hidden demo fallback."
          >
            <View style={s.body}>
              <Text style={s.text}>
                Mode: {fleet.isLive ? "Live API" : "Local simulation"}
              </Text>
              <Text selectable style={s.text}>
                API base: {API_BASE || "Not configured (demo)"}
              </Text>
              <Text style={s.text}>
                Robot: {fleet.isLive ? ROBOT_ID : "robot_01"}
              </Text>
              <Text style={s.caption}>
                Set EXPO_PUBLIC_API_BASE_URL and EXPO_PUBLIC_ROBOT_ID before
                building. Public variables are bundled into the app. Never
                include keys or credentials.
              </Text>
              <Button
                label="Refresh telemetry"
                icon={RefreshCw}
                disabled={fleet.pending}
                onPress={() => void fleet.refresh()}
              />
              <Text style={s.caption}>
                Native and web poll every two seconds. Stale robot heartbeats
                block dispatch after ten seconds. Physical map conversion,
                authentication and stopping belong to the backend and robot
                adapter.
              </Text>
            </View>
          </Panel>
          {!fleet.isLive && (
            <Panel
              title="Simulation laboratory"
              subtitle="Try the same scenarios as the original Next.js app."
            >
              <View style={s.body}>
                <Text style={s.label}>MISSION SCENARIO</Text>
                <View style={s.row}>
                  {(
                    [
                      ["normal", "Normal delivery"],
                      ["obstacle", "Obstacle pause and recovery"],
                      ["timeout", "Navigation timeout"],
                    ] as const
                  ).map(([command, label]) => (
                    <Button
                      key={command}
                      label={label}
                      selected={snapshot.scenario === command}
                      disabled={Boolean(task) || fleet.pending}
                      onPress={() => void fleet.demo(command)}
                    />
                  ))}
                </View>
                <Text style={s.caption}>
                  Normal: completes in about 19 seconds. Obstacle: pauses for 4
                  seconds, then completes. Timeout: fails after 15 seconds.
                </Text>
                <View style={s.separator} />
                <Button
                  label={
                    snapshot.robot.connected
                      ? "Simulate disconnect"
                      : "Reconnect robot"
                  }
                  disabled={fleet.pending}
                  danger={snapshot.robot.connected}
                  onPress={() =>
                    void fleet.demo(
                      snapshot.robot.connected ? "disconnect" : "reconnect",
                    )
                  }
                />
                <Text style={s.caption}>
                  Disconnect fails active work. Reconnect never resumes a failed
                  mission.
                </Text>
                <View style={s.separator} />
                <Button
                  label="Reset demo data"
                  danger
                  disabled={fleet.pending}
                  onPress={() => setResetOpen(true)}
                />
                <Text style={s.caption}>
                  Reset removes local demo history and restores 24 examples.
                  Demo persistence is capped at 200 missions and 60 events.
                  Manual mode is cleared on reload and backgrounding; active
                  demo work resumes by wall-clock time.
                </Text>
              </View>
            </Panel>
          )}
          <Panel
            title="About this workspace"
            subtitle="Pirate / React Native edition"
          >
            <View style={s.body}>
              <Text style={s.text}>
                Expo + React Native + TypeScript. One shared application for
                web, iOS and Android, adapted from dororolkp/pirate.
              </Text>
              <Text style={s.caption}>
                Acme Warehouse and Felix are demo workspace labels, not
                authenticated accounts. Multi-robot operations, user
                authentication, live teleoperation and a full backend mission
                history are outside this MVP.
              </Text>
            </View>
          </Panel>
        </View>
      )}
      <View
        style={[s.row, { justifyContent: "space-between", paddingVertical: 8 }]}
      >
        <Text style={[s.caption, { fontSize: 11 }]}>
          pirate. / Fleet & mission control for things that move.
        </Text>
        <Text style={[s.caption, { fontSize: 11 }]}>
          React Native edition / v1.0
        </Text>
      </View>
      <Dialog
        title="Dispatch a new mission"
        visible={dispatchOpen}
        close={() => setDispatchOpen(false)}
      >
        <Text style={s.text}>Choose a destination for Atlas.</Text>
        <View style={s.row}>
          {(Object.keys(STATIONS) as StationId[]).map((id) => (
            <Button
              key={id}
              label={STATIONS[id].label}
              selected={destination === id}
              onPress={() => setDestination(id)}
            />
          ))}
        </View>
        <Text style={s.caption}>{STATIONS[destination].description}</Text>
        {blocked && (
          <Text style={[s.text, { color: colors.red }]}>{blocked}</Text>
        )}
        <Button
          label="Dispatch mission"
          primary
          disabled={fleet.pending || Boolean(blocked)}
          onPress={() => void dispatch()}
        />
      </Dialog>
      <Dialog
        title="Mission details"
        visible={Boolean(details)}
        close={() => setSelected(null)}
      >
        {details && (
          <>
            <Text selectable style={s.panelTitle}>
              {details.task_id}
            </Text>
            <Badge label={details.status} tone={statusTone(details.status)} />
            <Text style={s.text}>Robot: {details.robot_id}</Text>
            <Text style={s.text}>
              Destination: {STATIONS[details.destination].label}
            </Text>
            <Text style={s.text}>Progress: {details.progress}%</Text>
            {[
              ["Created", details.created_at],
              ["Started", details.started_at],
              ["Updated", details.updated_at],
              ["Finished", details.finished_at],
            ].map(([label, value]) => (
              <Text key={label} selectable style={s.text}>
                {label}: {value ? new Date(value).toLocaleString() : "Not yet"}
              </Text>
            ))}
            <Text style={s.text}>
              Duration:{" "}
              {missionDuration(details) === null
                ? "Not available"
                : `${missionDuration(details)}s`}
            </Text>
            {details.error && (
              <Text style={[s.text, { color: colors.red }]}>
                {details.error}
              </Text>
            )}
            {["queued", "running"].includes(details.status) && (
              <Button
                label="Cancel mission"
                danger
                disabled={fleet.pending}
                onPress={() => void fleet.cancel(details.task_id)}
              />
            )}
            <ActivityTimeline
              events={snapshot.events.filter(
                (e) => e.task_id === details.task_id,
              )}
              limit={60}
            />
          </>
        )}
      </Dialog>
      <Dialog
        title="Reset demo data?"
        visible={resetOpen}
        close={() => setResetOpen(false)}
      >
        <Text style={s.text}>
          This removes current demo missions and events on this device and stops
          active simulated work. The 24 sample missions will be restored.
        </Text>
        <Button
          label="Confirm reset"
          danger
          disabled={fleet.pending}
          onPress={() => {
            void fleet.demo("reset").then((ok) => {
              if (ok) setResetOpen(false);
            });
          }}
        />
        <Button label="Keep my data" onPress={() => setResetOpen(false)} />
      </Dialog>
    </View>
  );
}

import { useState } from "react";
import { Text, View } from "react-native";
import { Bot, CheckCircle2, Flag, Plus, TrendingUp } from "lucide-react-native";
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
import { visualAttributes } from "../lib/visual-attributes";
import { Badge, Button, colors, maximalist, Panel, s } from "./ui";
import { MaximalistPattern } from "./maximalist-pattern";
import { WarehouseMap } from "./warehouse-map";
import { RobotCommandCenter } from "./robot-command-center";
import { MissionAnalytics, MissionPerformance } from "./mission-analytics";
import {
  ActivityTimeline,
  MissionHistory,
  statusTone,
} from "./mission-history";
import { Dialog } from "./dialog";
import { SimulationHero } from "./simulation-hero";
import { GazeboDrivingLab } from "./gazebo-driving-lab";
import { ArielAssistant } from "./ariel-assistant";
import { AnalyticsPreferences } from "./web-presence";
import { useLayoutWidth } from "../hooks/use-layout-width";
import { Logbook } from "./logbook";
import { WorkspaceHealth } from "./workspace-health";
import { BackendConnection } from "./backend-connection";
import { GuideTarget } from "./guided-tour";

type Tab =
  "Overview" | "Robots" | "Missions" | "Analytics" | "Settings" | "Logbook";
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
  Logbook: [
    "Workspace logbook",
    "A clear, private record of local requests and observed outcomes.",
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
          aria-level={1}
          style={{ color: colors.ink, fontSize: 30, fontWeight: "700" }}
        >
          {headings[tab][0]}
        </Text>
        <Text style={s.text}>{headings[tab][1]}</Text>
        <Text style={s.caption}>
          {fleet.isLive
            ? "Connecting to David's backend. No commands have been sent."
            : "Loading your local practice workspace."}
        </Text>
        {tab === "Settings" && <BackendConnection fleet={fleet} />}
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
              {
                fontSize: 9,
                letterSpacing: 1.5,
                marginBottom: 12,
                alignSelf: "flex-start",
                color: maximalist.outline,
                backgroundColor: maximalist.pink,
                padding: 7,
                borderWidth: 1,
                borderColor: maximalist.outline,
                borderRadius: 6,
              },
            ]}
          >
            YOUR OPERATIONS, IN SYNC
          </Text>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={{
              fontSize: width < 600 ? 32 : 42,
              fontWeight: "900",
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
        {tab !== "Settings" && tab !== "Logbook" && (
          <Button
            label="New mission"
            primary
            icon={Plus}
            disabled={fleet.pending}
            onPress={() => {
              setDestination(
                snapshot.missions[0]?.destination === "station_b"
                  ? "station_a"
                  : "station_b",
              );
              setDispatchOpen(true);
            }}
          />
        )}
      </View>
      <WorkspaceHealth fleet={fleet} />
      {(tab === "Overview" || tab === "Robots") &&
        pair(
          <GuideTarget id="warehouse-map">
            <WarehouseMap
              snapshot={snapshot}
              now={fleet.now}
              live={fleet.isLive}
            />
          </GuideTarget>,
          <GuideTarget id="command-center">
            <RobotCommandCenter fleet={fleet} expanded={tab === "Robots"} />
          </GuideTarget>,
        )}
      {tab === "Overview" && <SimulationHero live={fleet.isLive} />}
      {tab === "Logbook" && (
        <GuideTarget id="logbook">
          <Logbook />
        </GuideTarget>
      )}
      <View
        style={[
          s.row,
          {
            padding: 14,
            backgroundColor: fleet.isLive ? "#edf3fa" : "#fff7f0",
            borderRadius: 14,
            borderWidth: 2,
            borderColor: maximalist.outline,
          },
        ]}
      >
        <Badge
          label={fleet.isLive ? "BACKEND MODE" : "SAFE DEMO"}
          tone="orange"
        />
        <Text style={[s.caption, { flex: 1, minWidth: 180, marginTop: 0 }]}>
          {fleet.isLive
            ? "David's backend supplies robot state and the 200 newest missions. Its selected adapter (mock or Gazebo) controls motion."
            : "This workspace is a simulation. No physical robot is controlled. Includes 24 seeded sample missions."}
        </Text>
      </View>
      {tab !== "Settings" && tab !== "Logbook" && (
        <GuideTarget id="reporting">
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
        </GuideTarget>
      )}
      {tab !== "Settings" && tab !== "Logbook" && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
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
              note: `${snapshot.robot.name} / Warehouse 01`,
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
              {...visualAttributes("metric")}
              style={{
                flexGrow: 1,
                flexBasis: width < 600 ? "45%" : "21%",
                backgroundColor: [
                  maximalist.pink,
                  maximalist.teal,
                  maximalist.yellow,
                  maximalist.lime,
                ][index],
                padding: 18,
                borderWidth: 2,
                borderColor: maximalist.outline,
                borderRadius: 22,
                borderTopRightRadius: index % 2 === 0 ? 8 : 22,
                boxShadow: "4px 5px 0 #34204b",
                gap: 12,
                overflow: "hidden",
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  right: -35,
                  bottom: -38,
                  opacity: 0.35,
                }}
              >
                <MaximalistPattern color="#ffffff" size={130} />
              </View>
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <Text
                  style={[
                    s.label,
                    { color: colors.ink, fontWeight: "800", flex: 1 },
                  ]}
                >
                  {label}
                </Text>
                <View
                  style={{
                    padding: 7,
                    backgroundColor: "#fffdfa",
                    borderWidth: 1,
                    borderColor: maximalist.outline,
                    borderRadius: 10,
                    transform: [{ rotate: index % 2 === 0 ? "-7deg" : "7deg" }],
                  }}
                >
                  <Icon color={maximalist.violet} size={18} />
                </View>
              </View>
              <Text
                style={{ fontSize: 34, fontWeight: "900", color: colors.ink }}
              >
                {value}
              </Text>
              <Text style={s.caption}>{note}</Text>
            </View>
          ))}
        </View>
      )}
      {tab === "Robots" && (
        <GuideTarget id="driving-preview">
          <GazeboDrivingLab />
        </GuideTarget>
      )}
      {(tab === "Robots" || tab === "Settings") && <ArielAssistant />}
      {(tab === "Overview" || tab === "Analytics") &&
        pair(
          <MissionAnalytics missions={missions} now={fleet.now} />,
          <MissionPerformance missions={missions} />,
        )}
      {(tab === "Overview" || tab === "Missions") && (
        <GuideTarget id="mission-history">
          <MissionHistory
            missions={missions}
            viewMission={setSelected}
            compact={tab === "Overview"}
          />
        </GuideTarget>
      )}
      {(tab === "Overview" || tab === "Robots" || tab === "Missions") && (
        <ActivityTimeline events={snapshot.events} />
      )}
      {tab === "Settings" && (
        <View style={s.stack}>
          <BackendConnection fleet={fleet} />
          <GuideTarget id="privacy">
            <AnalyticsPreferences />
          </GuideTarget>
          <Panel
            title="Gazebo cooperation"
            subtitle="A/B missions use David's API; manual driving stays a preview."
          >
            <View style={s.body}>
              <Badge
                label={
                  fleet.isLive ? "ADAPTER SELECTED BY BACKEND" : "LOCAL PREVIEW"
                }
                tone="orange"
              />
              <Text style={s.text}>
                Gazebo Harmonic / shapes / hatchback_blue. The driving lab
                previews Ackermann velocity commands locally.
              </Text>
              <Text style={s.caption}>
                David&apos;s backend provides REST tasks and robot telemetry for
                both mock and Gazebo adapters. The frontend never publishes ROS
                or Gazebo commands directly. The separate driving pad remains a
                local preview, not live teleoperation.
              </Text>
            </View>
          </Panel>
          {!fleet.isLive && (
            <GuideTarget id="practice-controls">
              <Panel
                title="Simulation laboratory"
                subtitle="Safe local-only practice. Never sends backend commands."
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
                    Normal: completes in about 19 seconds. Obstacle: pauses for
                    4 seconds, then completes. Timeout: fails after 15 seconds.
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
                    Disconnect fails active work. Reconnect never resumes a
                    failed mission.
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
            </GuideTarget>
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
                Felix&apos;s workspace is a local label, not an authenticated
                account. This MVP connects one robot through David&apos;s
                backend. Multi-robot operations, authentication and live manual
                teleoperation remain future work.
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
        <Text style={s.text}>
          Choose a destination for {snapshot.robot.name}.
        </Text>
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

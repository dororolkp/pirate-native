import { Text, View } from "react-native";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Battery,
  Bot,
  Navigation,
  Square,
  Wifi,
} from "lucide-react-native";
import { FleetController } from "../hooks/use-fleet";
import { activeMission, dispatchError, isStale } from "../lib/fleet-domain";
import { Badge, Button, colors, Panel, s } from "./ui";

export function RobotCommandCenter({
  fleet,
  expanded = false,
}: {
  fleet: FleetController;
  expanded?: boolean;
}) {
  const snapshot = fleet.snapshot;
  if (!snapshot) return null;
  const robot = snapshot.robot;
  const task = activeMission(snapshot);
  const latest = snapshot.missions[0];
  const online =
    robot.connected && !isStale(robot, fleet.now) && !fleet.connectionError;
  const blocked = fleet.pending
    ? "Waiting for the current command."
    : fleet.connectionError
      ? "Backend telemetry is unavailable. Check Settings and refresh."
      : dispatchError(snapshot, "station_b", fleet.now);
  const dispatchLocked = Boolean(blocked);
  return (
    <Panel
      title="Robot command center"
      subtitle="Your fleet, ready to move."
      action={<Badge label="1 robot" />}
    >
      <View style={s.body}>
        <View style={s.row}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 12,
              backgroundColor: colors.orangeSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bot size={28} color={colors.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.panelTitle, { fontSize: 19 }]}>{robot.name}</Text>
            <Text style={s.caption}>AMR / {robot.robot_id}</Text>
          </View>
          <Badge
            label={online ? robot.status : "offline"}
            tone={online ? (task ? "orange" : "green") : "red"}
          />
        </View>
        <View
          style={[
            s.row,
            {
              justifyContent: "space-between",
              backgroundColor: "#fafbfc",
              padding: 12,
              borderRadius: 8,
            },
          ]}
        >
          <View style={s.row}>
            <Wifi size={15} color={online ? colors.green : colors.red} />
            <Text style={s.caption}>
              {online ? "Connected" : "Disconnected / stale"}
            </Text>
          </View>
          <View style={s.row}>
            <Battery size={18} color={colors.green} />
            <Text style={s.text}>
              {robot.battery === null
                ? "Battery not reported"
                : `${robot.battery}%`}
            </Text>
          </View>
        </View>
        <Text style={s.label}>QUICK DISPATCH</Text>
        {blocked && (
          <Text
            accessibilityLiveRegion="polite"
            style={[s.caption, { color: colors.orange }]}
          >
            {blocked}
          </Text>
        )}
        <Button
          label="Send to Station B"
          primary
          icon={Navigation}
          disabled={dispatchLocked}
          onPress={() => void fleet.dispatch("station_b")}
        />
        <Button
          label="Send to Station A"
          icon={Navigation}
          disabled={dispatchLocked}
          onPress={() => void fleet.dispatch("station_a")}
        />
        {task ? (
          <View
            style={{
              gap: 10,
              backgroundColor: colors.orangeSoft,
              padding: 14,
              borderRadius: 8,
            }}
          >
            <View style={[s.row, { justifyContent: "space-between" }]}>
              <Text style={[s.text, { fontWeight: "600" }]}>
                {task.status} / {task.task_id}
              </Text>
              <Text style={s.text}>{task.progress}%</Text>
            </View>
            <View
              style={{ height: 6, backgroundColor: "#f7d9c6", borderRadius: 4 }}
            >
              <View
                style={{
                  width: `${task.progress}%`,
                  height: 6,
                  backgroundColor: colors.orange,
                  borderRadius: 4,
                }}
              />
            </View>
            <Button
              label="Cancel mission"
              danger
              disabled={fleet.pending}
              onPress={() => void fleet.cancel(task.task_id)}
            />
          </View>
        ) : (
          <Text accessibilityLiveRegion="polite" style={s.caption}>
            {latest && fleet.isLive ? `Latest task: ${latest.status}. ` : ""}No
            active mission. Choose a destination to start a delivery.
          </Text>
        )}
        {fleet.isLive ? (
          <Text style={s.caption}>
            Live cancellation requires backend acknowledgment. Live manual
            control is unavailable without a deadman API.
          </Text>
        ) : (
          <Button
            label="Stop simulation"
            danger
            icon={Square}
            disabled={fleet.pending}
            onPress={() => void fleet.demo("stop")}
          />
        )}
        <Text style={[s.caption, { fontSize: 10 }]}>
          Simulation controls are not certified emergency stops.
        </Text>
        {expanded && !fleet.isLive && (
          <>
            <View style={s.separator} />
            <Text style={s.panelTitle}>Manual control</Text>
            <Text style={s.caption}>
              Discrete demo steps only. Autonomous dispatch is locked while
              manual mode is on.
            </Text>
            <Button
              label={
                snapshot.manual
                  ? "Disable manual control"
                  : "Enable manual control"
              }
              selected={snapshot.manual}
              disabled={
                fleet.pending ||
                (!snapshot.manual && (!online || Boolean(task)))
              }
              onPress={() =>
                void fleet.demo(snapshot.manual ? "manual-off" : "manual-on")
              }
            />
            <View style={[s.row, { justifyContent: "center" }]}>
              <Button
                label="Left"
                icon={ArrowLeft}
                disabled={!snapshot.manual || fleet.pending}
                onPress={() => void fleet.demo("left")}
              />
              <Button
                label="Up"
                icon={ArrowUp}
                disabled={!snapshot.manual || fleet.pending}
                onPress={() => void fleet.demo("up")}
              />
              <Button
                label="Down"
                icon={ArrowDown}
                disabled={!snapshot.manual || fleet.pending}
                onPress={() => void fleet.demo("down")}
              />
              <Button
                label="Right"
                icon={ArrowRight}
                disabled={!snapshot.manual || fleet.pending}
                onPress={() => void fleet.demo("right")}
              />
            </View>
          </>
        )}
      </View>
    </Panel>
  );
}

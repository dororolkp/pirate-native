import { useCallback, useEffect, useState } from "react";
import { AppState, Platform, Pressable, Text, View } from "react-native";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Square,
} from "lucide-react-native";
import {
  GAZEBO_PROFILE,
  previewDrive,
  DriveAction,
} from "../lib/gazebo-contract";
import { Badge, Button, Panel, s } from "./ui";

export function GazeboDrivingLab() {
  const [speed, setSpeed] = useState(1);
  const [action, setAction] = useState<DriveAction>("stop");
  const [keyboard, setKeyboard] = useState(false);
  const [sequence, setSequence] = useState(0);
  const stop = useCallback(() => setAction("stop"), []);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        stop();
        setKeyboard(false);
      }
    });
    return () => listener.remove();
  }, [stop]);
  useEffect(() => {
    if (Platform.OS !== "web" || !keyboard) return;
    const keys: Record<string, DriveAction> = {
      ArrowUp: "forward",
      ArrowDown: "reverse",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    const down = (event: KeyboardEvent) => {
      if (
        (event.target as HTMLElement)?.closest(
          "input, textarea, select, [role=dialog]",
        )
      )
        return;
      if (keys[event.key] || event.key === " " || event.key === "Escape") {
        event.preventDefault();
        setSequence((value) => value + 1);
        setAction(keys[event.key] ?? "stop");
      }
    };
    const up = (event: KeyboardEvent) => {
      if (keys[event.key]) stop();
    };
    const loseFocus = () => {
      stop();
      setKeyboard(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", loseFocus);
    document.addEventListener("visibilitychange", loseFocus);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", loseFocus);
      document.removeEventListener("visibilitychange", loseFocus);
      stop();
    };
  }, [keyboard, stop]);
  const command = previewDrive(action, speed, sequence);
  return (
    <Panel
      title="Gazebo driving lab"
      subtitle="Local command preview only. No simulator connection or network commands."
    >
      <View style={s.body}>
        <View style={s.row}>
          <Badge label="BACKEND IDLE" tone="orange" />
          <Badge label="GAZEBO HARMONIC / SIM 8" />
        </View>
        <Text style={s.text}>Blue hatchback / shapes world</Text>
        <Text style={s.caption}>
          Hold a direction to inspect its velocity command. Release to clear it.
          Left/right preview forward turning arcs, not sideways movement.
        </Text>
        <View
          style={{
            padding: 20,
            borderRadius: 18,
            backgroundColor: "#eff4ff",
            gap: 12,
          }}
        >
          <Text style={[s.label, { color: "#415da5" }]}>COMMAND PAD</Text>
          <View style={[s.row, { justifyContent: "center" }]}>
            {(
              [
                ["forward", "Preview forward", ArrowUp],
                ["left", "Preview left arc", ArrowLeft],
                ["stop", "Clear driving preview", Square],
                ["right", "Preview right arc", ArrowRight],
                ["reverse", "Preview reverse", ArrowDown],
              ] as const
            ).map(([value, label, Icon]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint="Hold to preview. Release to clear. Nothing is sent to Gazebo."
                accessibilityState={{ selected: action === value }}
                onPressIn={() => {
                  setSequence((previous) => previous + 1);
                  setAction(value);
                }}
                onPressOut={stop}
                onPress={stop}
                onBlur={stop}
                style={{
                  minWidth: 58,
                  minHeight: 58,
                  padding: 15,
                  borderRadius: 16,
                  backgroundColor: action === value ? "#443c91" : "white",
                  borderWidth: 1,
                  borderColor: "#c8d3ef",
                  alignItems: "center",
                }}
              >
                <Icon
                  size={24}
                  color={action === value ? "white" : "#443c91"}
                />
                <Text
                  style={{
                    color: action === value ? "white" : "#443c91",
                    fontSize: 10,
                    marginTop: 5,
                  }}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            accessibilityLiveRegion="polite"
            style={[s.text, { textAlign: "center" }]}
          >
            Preview: {action} / {command.linear_x.toFixed(2)} m/s /{" "}
            {command.angular_z.toFixed(3)} rad/s
          </Text>
        </View>
        <Text style={s.label}>REQUESTED SPEED</Text>
        <View style={s.row}>
          {[0.2, 0.5, 1, 1.5, 2].map((value) => (
            <Button
              key={value}
              label={`${value.toFixed(1)} m/s`}
              selected={speed === value}
              onPress={() => {
                stop();
                setSpeed(value);
              }}
            />
          ))}
        </View>
        {Platform.OS === "web" && (
          <Button
            label={
              keyboard ? "Disable driving keyboard" : "Enable driving keyboard"
            }
            selected={keyboard}
            onPress={() => {
              stop();
              setKeyboard(!keyboard);
            }}
          />
        )}
        <Text style={s.caption}>
          Keyboard preview is opt-in: arrows, Space or Escape to clear. Focus
          loss clears the preview. Touch buttons and standard keyboard
          activation also work.
        </Text>
        <View
          style={{
            borderRadius: 14,
            padding: 16,
            backgroundColor: "#fff4de",
            gap: 6,
          }}
        >
          <Text style={[s.text, { fontWeight: "700", color: "#765015" }]}>
            Not a live controller or emergency stop
          </Text>
          <Text style={[s.caption, { color: "#765015" }]}>
            The future backend must own control leases, stale-telemetry guards
            and a deadman timeout. A browser closing cannot guarantee a safe
            stop.
          </Text>
        </View>
        <Text selectable style={s.caption}>
          Prepared topic: {GAZEBO_PROFILE.commandTopic}
        </Text>
        <Button
          label="Connect Gazebo (coming later)"
          disabled
          onPress={() => {}}
        />
      </View>
    </Panel>
  );
}

import { useState } from "react";
import { Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { Button, Panel, s } from "./ui";
import { useFleet } from "../hooks/use-fleet";

const answers = {
  "How do I send a mission?":
    "Open Settings to connect David's backend, or stay in local demo. On Overview, verify idle and fresh telemetry, select Send to Station B, and watch queued, running and completed. Send to Station A returns the robot. Start guided tour highlights each part of the workflow without issuing commands.",
  "How do I drive?":
    "Open Robots, find Gazebo driving lab, choose a speed, and hold a direction. These are local command previews only. Left/right are turning arcs. The Atlas warehouse demo is a separate simulation.",
  "Is Gazebo connected?":
    "No backend is selected in local demo. Settings can connect David's REST API for A/B navigation. His backend chooses mock or Gazebo; the frontend cannot verify that choice from the current robot response. The driving pad remains a local preview.",
  "What does the backend need?":
    "A control lease, validated telemetry in meters, sequenced velocity commands, acknowledgment, authorization, and a server-enforced timeout are required for future live manual driving. David's current API already supports autonomous A/B tasks, robot poses and cancellation. The preview pad is not connected to that API.",
  "How can I use a keyboard?":
    "Tab between controls and activate buttons with Enter or Space. In the driving lab, enable driving keyboard for arrow-key previews. Release, Space, Escape, focus loss, or app backgrounding clears the preview.",
} as const;

export function ArielAssistant() {
  const fleet = useFleet();
  const [question, setQuestion] = useState<keyof typeof answers>(
    "Is Gazebo connected?",
  );
  return (
    <Panel
      title="Ariel assistant"
      subtitle="Local guidance, not an AI service. No chat or robot data leaves your device."
    >
      <View style={s.body}>
        <View style={s.row}>
          <Sparkles size={24} color="#6b48a5" />
          <Text style={s.text}>A little guidance for your next move.</Text>
        </View>
        <View style={s.row}>
          {(Object.keys(answers) as (keyof typeof answers)[]).map((label) => (
            <Button
              key={label}
              label={label}
              selected={question === label}
              onPress={() => setQuestion(label)}
            />
          ))}
        </View>
        <View
          accessibilityLiveRegion="polite"
          style={{ padding: 18, backgroundColor: "#f2edff", borderRadius: 16 }}
        >
          <Text style={[s.text, { color: "#493775" }]}>
            {question === "Is Gazebo connected?" && fleet.isLive
              ? "David's REST API is selected. Check the current connection and robot status on Overview. The backend chooses its mock or Gazebo adapter; this API does not identify which one is running. Manual driving buttons are still local previews."
              : answers[question]}
          </Text>
        </View>
      </View>
    </Panel>
  );
}

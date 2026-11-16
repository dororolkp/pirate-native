import { useState } from "react";
import { Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { Button, Panel, s } from "./ui";

const answers = {
  "How do I drive?":
    "Open Robots, find Gazebo driving lab, choose a speed, and hold a direction. These are local command previews only. Left/right are turning arcs. The Atlas warehouse demo is a separate simulation.",
  "Is Gazebo connected?":
    "No. The Gazebo backend is idle. No Gazebo API, socket, or transport publisher is active. The Connect button stays disabled until an authenticated gateway and robot-side deadman safeguards are implemented.",
  "What does the backend need?":
    "A control lease, validated telemetry in meters, sequenced velocity commands, acknowledgment, authorization, and a server-enforced timeout. Our proposed contract maps linear_x and angular_z to Gazebo Twist. It is not an existing simulator API.",
  "How can I use a keyboard?":
    "Tab between controls and activate buttons with Enter or Space. In the driving lab, enable driving keyboard for arrow-key previews. Release, Space, Escape, focus loss, or app backgrounding clears the preview.",
} as const;

export function ArielAssistant() {
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
            {answers[question]}
          </Text>
        </View>
      </View>
    </Panel>
  );
}

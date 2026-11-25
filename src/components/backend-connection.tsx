import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { RefreshCw } from "lucide-react-native";
import type { FleetController } from "../hooks/use-fleet";
import { activeMission } from "../lib/fleet-domain";
import { ROBOT_ID } from "../lib/fleet-service";
import { GuideTarget } from "./guided-tour";
import { Badge, Button, colors, Panel, s } from "./ui";

export function BackendConnection({ fleet }: { fleet: FleetController }) {
  const [url, setUrl] = useState(fleet.apiBase);
  const locked =
    fleet.pending ||
    !fleet.snapshot ||
    Boolean(
      fleet.snapshot &&
      (activeMission(fleet.snapshot) || fleet.snapshot.robot.status === "busy"),
    );
  return (
    <GuideTarget id="connection">
      <Panel
        title="Connect David's backend"
        subtitle="One robot. Two stations. A clear path to the team demo."
      >
        <View style={s.body}>
          <Badge
            label={fleet.isLive ? "LIVE API SELECTED" : "LOCAL DEMO"}
            tone={fleet.isLive ? "green" : "orange"}
          />
          <Text style={s.text}>
            Mode: {fleet.isLive ? "Live API" : "Local simulation"} / Robot:{" "}
            {ROBOT_ID}
          </Text>
          <Text style={s.caption}>
            Start David&apos;s server, then enter its base URL (not the GitHub
            URL or /api/v1). Connecting only loads data; dispatch buttons send
            commands.
          </Text>
          <Text style={s.label}>BACKEND SERVER URL</Text>
          <TextInput
            accessibilityLabel="Backend server URL"
            placeholder="http://localhost:8000"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={url}
            onChangeText={setUrl}
            editable={!locked}
            style={s.input}
          />
          <View style={s.row}>
            <Button
              label="Connect backend"
              primary
              disabled={locked || !url.trim()}
              onPress={() => fleet.connectBackend(url)}
            />
            <Button
              label="Use local demo"
              disabled={locked || !fleet.isLive}
              onPress={() => fleet.connectBackend("")}
            />
            <Button
              label="Refresh telemetry"
              icon={RefreshCw}
              disabled={fleet.pending}
              onPress={() => void fleet.refresh()}
            />
          </View>
          <Text selectable style={s.caption}>
            API base: {fleet.apiBase || "Not configured (demo)"}
          </Text>
          <Text style={s.caption}>
            This URL is session-only. Reopening the app uses
            EXPO_PUBLIC_API_BASE_URL, or the safe local demo. Never enter
            credentials. The deployed HTTPS site needs an HTTPS backend with
            CORS allowing this site&apos;s origin. On a phone, localhost means
            the phone; use your server&apos;s LAN address.
          </Text>
          <Text style={s.caption}>
            Robot and active task reads poll every 500ms; recent history
            refreshes every 5 seconds. Failed reads back off to 30 seconds
            (Retry-After up to 60). Commands are never retried automatically.
            Busy, offline or stale telemetry blocks dispatch.
          </Text>
          <Text style={[s.caption, { color: colors.orange }]}>
            No /api/scenario endpoint is published yet. The live map uses
            David&apos;s default station configuration in metres. If
            BACKEND_STATIONS changes, synchronize src/lib/backend-contract.ts
            before driving.
          </Text>
        </View>
      </Panel>
    </GuideTarget>
  );
}

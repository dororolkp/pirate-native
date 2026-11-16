import { useState } from "react";
import { Link, Slot, usePathname } from "expo-router";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Anchor,
  BarChart3,
  Bell,
  Bot,
  BookOpen,
  CircleHelp,
  Flag,
  LayoutDashboard,
  Settings2,
  Warehouse,
  X,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFleet } from "../hooks/use-fleet";
import { ActivityTimeline } from "./mission-history";
import { Badge, Button, colors, s } from "./ui";
import { WebPresence } from "./web-presence";
import { ArielAssistant } from "./ariel-assistant";
import { useLayoutWidth } from "../hooks/use-layout-width";
import { trackPublicEvent } from "../lib/analytics";

const navigation = [
  { label: "Overview", href: "/" as const, icon: LayoutDashboard },
  { label: "Robots", href: "/robots" as const, icon: Bot },
  { label: "Missions", href: "/missions" as const, icon: Flag },
  { label: "Analytics", href: "/analytics" as const, icon: BarChart3 },
  { label: "Logbook", href: "/logbook" as const, icon: BookOpen },
  { label: "Settings", href: "/settings" as const, icon: Settings2 },
];
export function Dialog({
  title,
  visible,
  close,
  children,
}: React.PropsWithChildren<{
  title: string;
  visible: boolean;
  close: () => void;
}>) {
  if (!visible) return null;
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <View
            style={[
              s.row,
              {
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[s.panelTitle, { flex: 1 }]}
            >
              {title}
            </Text>
            <Button label="Close dialog" icon={X} onPress={close} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.body}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function FleetShell() {
  const fleet = useFleet();
  const path = usePathname();
  const width = useLayoutWidth();
  const desktop = width >= 1050;
  const [activity, setActivity] = useState(false);
  const [help, setHelp] = useState(false);
  const openHelp = () => {
    trackPublicEvent("help_opened");
    setHelp(true);
  };
  const tab =
    navigation.find((item) => item.href === path)?.label ?? "Overview";
  const nav = (mobile = false) =>
    navigation.map(({ label, href, icon: Icon }) => {
      const selected = href === path;
      return (
        <Link key={href} href={href} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            style={StyleSheet.flatten([
              mobile ? styles.mobileItem : styles.navItem,
              selected && { backgroundColor: colors.orangeSoft },
            ])}
          >
            <Icon
              size={mobile ? 20 : 18}
              color={selected ? colors.orange : colors.muted}
            />
            <Text
              style={{
                color: selected ? colors.orange : colors.muted,
                fontSize: mobile ? 10 : 13,
                fontWeight: selected ? "700" : "500",
              }}
            >
              {label}
            </Text>
            {!mobile && label === "Robots" && (
              <View style={{ marginLeft: "auto" }}>
                <Badge label="1" />
              </View>
            )}
          </Pressable>
        </Link>
      );
    });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <WebPresence />
      <StatusBar style="dark" />
      <View style={{ flex: 1, flexDirection: "row" }}>
        {desktop && (
          <View style={styles.sidebar}>
            <Link href="/" asChild>
              <Pressable accessibilityLabel="Pirate home" style={styles.brand}>
                <View style={styles.mark}>
                  <Anchor size={24} color="white" />
                </View>
                <Text style={styles.brandText}>
                  pirate<Text style={{ color: colors.orange }}>.</Text>
                </Text>
                <Badge label="BETA" />
              </Pressable>
            </Link>
            <Link href="/settings" asChild>
              <Pressable style={styles.workspace}>
                <Warehouse size={22} color={colors.muted} />
                <View>
                  <Text style={[s.text, { fontWeight: "600" }]}>
                    Simulation studio
                  </Text>
                  <Text style={s.caption}>
                    {fleet.isLive ? "API workspace" : "Demo workspace"}
                  </Text>
                </View>
              </Pressable>
            </Link>
            <Text style={[s.label, { margin: 14 }]}>WORKSPACE</Text>
            <View style={{ gap: 5 }}>{nav()}</View>
            <Text style={[s.label, { margin: 14, marginTop: 28 }]}>
              LOCATIONS
            </Text>
            <Link href="/robots" asChild>
              <Pressable style={styles.navItem}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    backgroundColor: colors.green,
                    borderRadius: 4,
                  }}
                />
                <Text style={s.text}>Warehouse 01</Text>
              </Pressable>
            </Link>
            <View style={{ flex: 1 }} />
            <View style={styles.demoCard}>
              <Text style={s.panelTitle}>A brighter driving lab.</Text>
              <Text style={s.caption}>
                Explore Gazebo previews. Backend stays idle until the gateway is
                ready.
              </Text>
              <Button label="Explore the demo" onPress={openHelp} />
            </View>
            <Button
              label="Help & documentation"
              icon={CircleHelp}
              onPress={openHelp}
            />
            <View
              style={[
                s.row,
                {
                  paddingTop: 22,
                  marginTop: 20,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={styles.avatar}>
                <Text style={{ color: "#a55b37", fontWeight: "700" }}>LO</Text>
              </View>
              <View>
                <Text style={[s.text, { fontWeight: "700" }]}>
                  Local operator
                </Text>
                <Text style={s.caption}>No account connected</Text>
              </View>
            </View>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.topbar}>
            <View style={s.row}>
              {!desktop ? (
                <>
                  <View style={styles.mark}>
                    <Anchor size={21} color="white" />
                  </View>
                  <Text style={[styles.brandText, { fontSize: 24 }]}>
                    pirate.
                  </Text>
                </>
              ) : (
                <Text style={s.caption}>
                  Workspace /{" "}
                  <Text style={{ color: colors.ink, fontWeight: "600" }}>
                    {tab}
                  </Text>
                </Text>
              )}
            </View>
            <View style={s.row}>
              <Badge
                label={fleet.isLive ? "LIVE API" : "SIMULATION"}
                tone="orange"
              />
              <Button
                label="Notifications"
                icon={Bell}
                compact={width < 600}
                onPress={() => setActivity(true)}
              />
              <Button
                label="Help"
                icon={CircleHelp}
                compact={width < 600}
                onPress={openHelp}
              />
            </View>
          </View>
          {(fleet.error || fleet.notice) && (
            <View
              accessibilityRole={fleet.error ? "alert" : undefined}
              accessibilityLiveRegion="polite"
              style={[
                s.row,
                {
                  margin: 16,
                  marginBottom: 0,
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: fleet.error ? "#fbeceb" : colors.greenSoft,
                },
              ]}
            >
              <Text
                style={[
                  s.text,
                  { flex: 1, color: fleet.error ? colors.red : colors.green },
                ]}
              >
                {fleet.error || fleet.notice}
              </Text>
              <Button label="Dismiss message" onPress={fleet.dismiss} />
            </View>
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: desktop ? 30 : 16,
              paddingBottom: 35,
            }}
          >
            <View
              nativeID="main-content"
              role="main"
              tabIndex={-1}
              style={{ width: "100%", maxWidth: 1600, alignSelf: "center" }}
            >
              <Slot />
            </View>
          </ScrollView>
        </View>
      </View>
      {!desktop && <View style={styles.mobileNav}>{nav(true)}</View>}
      <Dialog
        title="Fleet notifications"
        visible={activity}
        close={() => setActivity(false)}
      >
        <ActivityTimeline events={fleet.snapshot?.events ?? []} limit={60} />
      </Dialog>
      <Dialog
        title="Welcome to Pirate"
        visible={help}
        close={() => setHelp(false)}
      >
        <ArielAssistant />
        <Text style={s.panelTitle}>
          Fleet & mission control for things that move.
        </Text>
        <Text style={s.text}>
          1. Dispatch Atlas to Station B and watch its position and progress.
        </Text>
        <Text style={s.text}>
          2. In Robots, try manual control while idle. Autonomous dispatch stays
          locked until manual mode is disabled.
        </Text>
        <Text style={s.text}>
          3. In Settings, test obstacle recovery, navigation timeout,
          disconnect, and reset.
        </Text>
        <Text style={s.text}>
          4. In Missions, filter records, inspect timestamps, and export CSV.
          Analytics shows timestamp-derived results.
        </Text>
        <Text style={s.text}>
          5. Logbook keeps a private, seven-day record on this device. Filter,
          export, clear or disable recording anytime.
        </Text>
        <Text style={[s.text, { color: colors.red }]}>
          Demo data is simulated. These controls are not physical emergency
          stops. Live robot safety is enforced by the robot adapter.
        </Text>
        <Text style={s.caption}>
          Deployment, required tools, API payloads, and acceptance criteria are
          documented in the repository README and docs folder.
        </Text>
      </Dialog>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  sidebar: {
    width: 232,
    padding: 18,
    paddingTop: 30,
    backgroundColor: "white",
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  brand: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 28,
  },
  brandText: {
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: -1.5,
    color: colors.ink,
  },
  mark: {
    backgroundColor: colors.orange,
    width: 35,
    height: 36,
    borderRadius: 10,
    borderBottomLeftRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  workspace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 8,
    minHeight: 46,
  },
  demoCard: {
    backgroundColor: "#faf7f3",
    borderRadius: 10,
    padding: 15,
    gap: 12,
    marginBottom: 18,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8e7db",
    justifyContent: "center",
    alignItems: "center",
  },
  topbar: {
    minHeight: 72,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  mobileNav: {
    flexDirection: "row",
    padding: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "white",
  },
  mobileItem: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(25,36,49,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialog: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "85%",
    backgroundColor: "white",
    borderRadius: 14,
    overflow: "hidden",
  },
});

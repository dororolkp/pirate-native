import { useRef, useState } from "react";
import { Link, Slot, usePathname } from "expo-router";
import {
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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
  Route,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFleet } from "../hooks/use-fleet";
import { ActivityTimeline } from "./mission-history";
import { Badge, Button, colors, maximalist, s } from "./ui";
import { WebPresence } from "./web-presence";
import { ArielAssistant } from "./ariel-assistant";
import { useLayoutWidth } from "../hooks/use-layout-width";
import { trackPublicEvent } from "../lib/analytics";
import { GuidedTourProvider, useGuidedTour } from "../hooks/use-guided-tour";
import { GuidedTour } from "./guided-tour";
import { guideAttributes } from "../lib/guide-attributes";
import { Dialog } from "./dialog";
import { WorkspaceTools } from "./workspace-tools";

const navigation = [
  { label: "Overview", href: "/" as const, icon: LayoutDashboard },
  { label: "Robots", href: "/robots" as const, icon: Bot },
  { label: "Missions", href: "/missions" as const, icon: Flag },
  { label: "Analytics", href: "/analytics" as const, icon: BarChart3 },
  { label: "Logbook", href: "/logbook" as const, icon: BookOpen },
  { label: "Settings", href: "/settings" as const, icon: Settings2 },
];
export function FleetShell() {
  return (
    <GuidedTourProvider>
      <FleetShellContent />
    </GuidedTourProvider>
  );
}
function FleetShellContent() {
  const fleet = useFleet();
  const tour = useGuidedTour()!;
  const path = usePathname();
  const width = useLayoutWidth();
  const { height } = useWindowDimensions();
  const pageScroll = useRef<ScrollViewInstance>(null);
  const desktop = width >= 1050;
  const [activity, setActivity] = useState(false);
  const [help, setHelp] = useState(false);
  const openHelp = () => {
    trackPublicEvent("help_opened");
    setHelp(true);
  };
  const tab =
    navigation.find((item) => item.href === path)?.label ??
    (path === "/docs"
      ? "Documentation"
      : path === "/integrations"
        ? "Free stack studio"
        : "Overview");
  const nav = (mobile = false) =>
    navigation.map(({ label, href, icon: Icon }) => {
      const selected = href === path;
      return (
        <Link key={href} href={href} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={label}
            {...guideAttributes(`nav-${label.toLowerCase()}`)}
            accessibilityState={{ selected }}
            style={StyleSheet.flatten([
              mobile ? styles.mobileItem : styles.navItem,
              selected && {
                backgroundColor: maximalist.lime,
                borderColor: maximalist.outline,
              },
            ])}
          >
            <Icon
              size={mobile ? 20 : 18}
              color={selected ? maximalist.violet : colors.muted}
            />
            <Text
              style={{
                color: selected ? maximalist.violet : colors.muted,
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
    <SafeAreaView
      style={{ flex: 1, minHeight: 0, backgroundColor: colors.background }}
    >
      <WebPresence />
      <StatusBar style="dark" />
      <View style={{ flex: 1, minHeight: 0, flexDirection: "row" }}>
        {desktop && (
          <ScrollView
            key="sidebar"
            testID="sidebar-scroll"
            style={styles.sidebar}
            contentContainerStyle={styles.sidebarContent}
            keyboardShouldPersistTaps="handled"
          >
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
            <Link href="/docs" style={[s.text, { padding: 14, minHeight: 44 }]}>
              Documentation
            </Link>
            <Link
              href="/integrations"
              style={[s.text, { padding: 14, minHeight: 44 }]}
            >
              Free stack studio
            </Link>
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
                {fleet.isLive
                  ? "David's API supplies robot telemetry and A/B missions. Manual driving remains a local preview."
                  : "Practice locally, or connect David's backend in Settings for the team demo."}
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
                <Text style={{ color: "#a55b37", fontWeight: "700" }}>FX</Text>
              </View>
              <View>
                <Text style={[s.text, { fontWeight: "700" }]}>
                  Felix&apos;s workspace
                </Text>
                <Text style={s.caption}>No account connected</Text>
              </View>
            </View>
          </ScrollView>
        )}
        <ScrollView
          key="workspace"
          ref={pageScroll}
          testID="workspace-scroll"
          style={{ flex: 1, minWidth: 0, minHeight: 0 }}
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={width > 0 && height >= 650 ? [0] : undefined}
        >
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
                  {width < 600 && (
                    <Badge
                      label={fleet.isLive ? "LIVE API" : "SIMULATION"}
                      tone="orange"
                    />
                  )}
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
            <View style={[s.row, { maxWidth: "100%", flexShrink: 1 }]}>
              {width >= 600 && (
                <Badge
                  label={fleet.isLive ? "LIVE API" : "SIMULATION"}
                  tone="orange"
                />
              )}
              <WorkspaceTools compact={width < 900} />
              <Button
                label={tour.step ? "View current guide" : "Start guided tour"}
                icon={Route}
                compact={width < 900}
                onPress={() => {
                  pageScroll.current?.scrollTo({ y: 0, animated: false });
                  if (!tour.step) tour.start();
                }}
              />
              <Button
                label="Notifications"
                icon={Bell}
                compact={width < 900}
                onPress={() => setActivity(true)}
              />
              <Button
                label="Help"
                icon={CircleHelp}
                compact={width < 900}
                onPress={openHelp}
              />
            </View>
          </View>
          <GuidedTour />
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
          <View
            style={{
              padding: desktop ? 30 : 16,
              paddingBottom: 35,
              minWidth: 0,
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
          </View>
        </ScrollView>
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
        <Link
          href="/docs"
          onPress={() => setHelp(false)}
          style={[s.text, { padding: 14, minHeight: 44 }]}
        >
          Read searchable documentation
        </Link>
        <Link
          href="/integrations"
          onPress={() => setHelp(false)}
          style={[s.text, { padding: 14, minHeight: 44 }]}
        >
          Explore free stack studio
        </Link>
        <Button
          label="Start guided tour"
          primary
          onPress={() => {
            setHelp(false);
            tour.start();
          }}
        />
        <Text style={s.panelTitle}>
          Fleet & mission control for things that move.
        </Text>
        <Text style={s.text}>
          1. Dispatch Atlas to Station B and watch its position and progress.
        </Text>
        <Text style={s.text}>
          2. In Settings, enter David&apos;s backend URL and select Connect
          backend. Live mode uses robot/task APIs; the backend determines
          whether it uses mock or Gazebo.
        </Text>
        <Text style={s.text}>
          3. Local-demo only: test manual steps, obstacle recovery, timeout,
          disconnect, and reset. These never control the live backend.
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
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 0,
    backgroundColor: "#fff0dc",
    borderRightWidth: 2,
    borderRightColor: maximalist.outline,
  },
  sidebarContent: {
    flexGrow: 1,
    padding: 18,
    paddingTop: 30,
    paddingBottom: 30,
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
    backgroundColor: maximalist.violet,
    width: 35,
    height: 36,
    borderRadius: 10,
    borderBottomLeftRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "3px 3px 0 #ff8bc5",
    transform: [{ rotate: "-6deg" }],
  },
  workspace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: maximalist.outline,
    backgroundColor: maximalist.yellow,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 8,
    minHeight: 46,
    borderWidth: 2,
    borderColor: "transparent",
  },
  demoCard: {
    backgroundColor: maximalist.pink,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: maximalist.outline,
    boxShadow: "3px 4px 0 #34204b",
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
    backgroundColor: "#fffdfa",
    borderBottomWidth: 2,
    borderBottomColor: maximalist.outline,
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
    borderTopWidth: 2,
    borderTopColor: maximalist.outline,
    backgroundColor: "#fff0dc",
  },
  mobileItem: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
});

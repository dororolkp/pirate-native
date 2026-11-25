export type GuideRoute =
  "/" | "/robots" | "/missions" | "/analytics" | "/logbook" | "/settings";
export const guideId = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export interface GuideStep {
  title: string;
  route: GuideRoute;
  target: string;
  detail: string;
  fallback?: string;
}
const button = (
  route: GuideRoute,
  label: string,
  detail: string,
  fallback?: string,
): GuideStep => ({
  route,
  title: label,
  target: `button-${guideId(label)}`,
  detail,
  fallback,
});

export const GUIDE_STEPS: GuideStep[] = [
  {
    route: "/settings",
    title: "1. Choose your connection",
    target: "connection",
    detail:
      "Felix's MVP uses David's REST API, not ROS directly. Enter the backend server URL here. The GitHub repository is source code, not a running API. Without a URL you can practice in the local demo.",
  },
  button(
    "/settings",
    "Connect backend",
    "Select the server entered above and load authoritative robot telemetry and recent tasks. This only reads data; it does not move the robot. Your session URL is not saved or sent to analytics.",
  ),
  button(
    "/settings",
    "Refresh telemetry",
    "Retry the robot and task reads after checking the server, CORS and connection. Failed reads never silently switch to simulated data.",
  ),
  {
    route: "/",
    title: "2. Check the map and status",
    target: "warehouse-map",
    detail:
      "Confirm the robot is connected and idle before dispatching. Live x/y are metres and theta is radians. The diagram uses David's configured A (-4, 0) and B (-14, 6); it is not a downloaded occupancy map.",
  },
  button(
    "/",
    "Send to Station B",
    "Send one navigation task to Station B. Only click when you intend to move the robot. The backend queues it promptly; the map and progress update every 500ms. Disabled means busy, offline, stale or a command is pending.",
  ),
  {
    route: "/",
    title: "3. Watch the journey",
    target: "command-center",
    detail:
      "Queued means accepted, running means underway, completed means the backend reports arrival. Position comes from the backend, not a frontend animation. Progress is displayed as 0–100%. Unknown battery is shown honestly.",
  },
  button(
    "/",
    "Cancel mission",
    "Appears while a mission is queued or running. Requests cancellation of that exact task; only the backend's canceled response acknowledges it. This is not a certified emergency stop.",
    "command-center",
  ),
  button(
    "/",
    "Send to Station A",
    "After arrival or acknowledged cancellation, send a new task back to Station A. The frontend prevents duplicate simultaneous commands.",
  ),
  button(
    "/",
    "Zoom in",
    "Magnify the centre of the 2D map. Does not change coordinates, robot speed or navigation.",
  ),
  button(
    "/",
    "Zoom out",
    "Reduce magnification. Disabled at the minimum zoom.",
  ),
  button("/", "Center", "Reset the map to its full configured extent."),
  button(
    "/",
    "Labels",
    "Show or hide station and robot labels. Does not affect dispatch.",
  ),
  button(
    "/",
    "New mission",
    "Open a destination chooser. Station A/B select a destination; Dispatch mission sends it; Close dialog leaves without sending. Nothing is sent simply by opening the dialog.",
  ),
  {
    route: "/missions",
    title: "4. Inspect mission history",
    target: "mission-history",
    detail:
      "Search missions narrows by task/robot/destination. All statuses, queued, running, completed, failed and canceled filter the list. Backend history is limited to the 200 newest tasks.",
  },
  button(
    "/missions",
    "Details",
    "Open a task's status, destination, progress, timestamps and error. Close dialog returns to the list. If no tasks exist, this button appears after your first dispatch.",
    "mission-history",
  ),
  button(
    "/missions",
    "Export CSV",
    "Download the filtered mission records. Does not send a robot command. CSV may include backend task IDs; treat exports appropriately.",
  ),
  button(
    "/missions",
    "Previous",
    "Show the previous page of filtered missions. Next shows the following page. Disabled at the first or last page.",
  ),
  {
    route: "/analytics",
    title: "Reporting controls",
    target: "reporting",
    detail:
      "All time uses the loaded history; Today and Last 7 days filter by creation time. These are summaries of the loaded records, not an unlimited backend reporting service.",
  },
  button(
    "/analytics",
    "Bar chart",
    "Display mission counts as bars. Line chart shows the same data as a line. Neither changes tasks.",
  ),
  button(
    "/analytics",
    "8 hours",
    "Choose the chart window. 24 hours and 7 days expand it. Success rate and duration come from recorded terminal states and timestamps.",
  ),
  {
    route: "/logbook",
    title: "Private local logbook",
    target: "logbook",
    detail:
      "Search logbook and All events/Successful/Failures/Information filter local diagnostic events. This is separate from backend mission history, retained for seven days with a 200-entry cap.",
  },
  button(
    "/logbook",
    "Export logbook CSV",
    "Download filtered local events. Previous events and Next events paginate. Nothing in the logbook is uploaded to Google or the backend.",
  ),
  button(
    "/logbook",
    "Clear local logbook",
    "Opens a confirmation. Confirm clear logbook deletes only device events; Keep logbook cancels. Backend tasks remain untouched.",
    "logbook",
  ),
  button(
    "/logbook",
    "Disable local recording",
    "Stop recording and clear saved device events. Enable local recording starts it again. This does not disable backend telemetry.",
    "logbook",
  ),
  {
    route: "/robots",
    title: "Optional practice controls",
    target: "command-center",
    detail:
      "Local-demo only: Enable/Disable manual control toggles discrete steps; Left/Up/Down/Right move the local demo robot. Stop simulation stops local work. These are never sent to David's backend and are hidden in live mode.",
  },
  {
    route: "/robots",
    title: "Driving preview, not teleoperation",
    target: "driving-preview",
    detail:
      "Preview forward/reverse/left arc/right arc inspect a local velocity request while held; Clear driving preview clears it. Speed buttons (0.2–2.0 m/s) change only the preview. Enable/Disable driving keyboard toggles arrow keys. Connect Gazebo (coming later) stays disabled; live A/B missions use David's task API instead.",
  },
  {
    route: "/settings",
    title: "Local practice scenarios",
    target: "practice-controls",
    fallback: "connection",
    detail:
      "Demo only: Normal delivery, Obstacle pause and recovery and Navigation timeout choose the next local mission scenario. Simulate disconnect/Reconnect robot test local connection loss. Reset demo data opens Confirm reset/Keep my data. None of these changes the backend.",
  },
  {
    route: "/settings",
    title: "Privacy and help",
    target: "privacy",
    detail:
      "Google Analytics is web-only, off without consent and a measurement ID. Allow optional page analytics opts in; Keep analytics off opts out. Ariel's question buttons show local explanations. No assistant or tour data is sent to an AI service.",
  },
  {
    route: "/",
    title: "Navigation and help",
    target: "nav-overview",
    detail:
      "Overview: map and quick dispatch. Robots: detailed controls. Missions: history. Analytics: summaries. Logbook: private events. Settings: API setup. Notifications opens observed events; Help opens local guidance; Start guided tour restarts this walkthrough.",
  },
  {
    route: "/",
    title: "Ready for the team demo",
    target: "command-center",
    detail:
      "Connect the backend, verify idle/fresh telemetry, send to B, observe running → completed, then return to A. The tour never clicks controls for you. For real Gazebo verification, David's backend and Luis's simulator must be running together.",
  },
];

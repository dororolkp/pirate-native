# Felix's Frontend Guide

The application remains Expo / React Native, with Expo Router and shared native components for web, iOS and Android. No Next.js migration is needed.

## Start Here

1. Open [Pirate](https://pirate-native.vercel.app).
2. Select **Start guided tour** in the header (the route icon on a narrow phone screen), or open **Help** and select **Start guided tour**.
3. Use **Next step** and **Previous step**. The web app scrolls to and outlines the current control; the guide explains what it does. Native screens use inline outlines and the guide panel. The guide scrolls with the page so it cannot squeeze short screens to zero height. Scroll back up, or choose **View current guide** in the header, to return to its controls without restarting.
4. **Exit guide** closes it at any time. **Finish guide** ends the last step. No tour step clicks a robot control, connects a server, deletes records or changes consent for you.

The Overview prioritizes the map and quick-dispatch controls above decorative artwork and reports.

## Documentation and Workspace Tools

**Workspace tools** in the header opens searchable navigation. Ctrl/Cmd+K works on web; Arrow Up/Down selects, Enter opens, and Escape closes. Closed-menu shortcuts ignore text-editing fields. The menu only navigates or starts the guide, never sends robot commands.

Open `/docs` to search setup, safety, privacy and development guides. Topic filters combine with search; **Read** expands an article and **Clear documentation search** resets filters. Searches stay local and are not tracked.

The workspace and desktop sidebar scroll independently. Dialog content scrolls below a persistent close button; keyboard arrows reveal the selected workspace tool. Controls wait for hydration before accepting interaction, preventing early clicks/searches from being reset. On short screens the header scrolls away to leave more room for content.

Open `/integrations` for the **Free stack studio**. It distinguishes included React Native equivalents from optional account-based services and unconnected providers. **Enable local insights** counts only help, mission CSV exports and chart changes in memory. **Clear insight counters** resets counts; **Disable local insights** or reload clears everything. Enabling it does not enable GA4. See [Free-First Stack](FREE_STACK.md) for technology mapping and privacy boundaries.

## Connect the Backend

David's repository is source code, not a hosted server: [ros_backend](https://github.com/davidcheungo123/ros_backend).

For a local browser demonstration, start the **mock** backend. These PowerShell commands are run in the backend repository, not the frontend:

```powershell
git clone https://github.com/davidcheungo123/ros_backend.git
Set-Location ros_backend/backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:BACKEND_ADAPTER = "mock"
$env:BACKEND_CORS_ORIGINS = '["http://localhost:8081","http://localhost:8090","https://pirate-native.vercel.app"]'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Python 3.12 was used for verification. Docker or ROS is not required for this mock demo.

Start the frontend in a separate terminal:

```powershell
npm ci
npm run web
```

On **Settings**, enter `http://localhost:8000` in **Backend server URL**, then select **Connect backend**. If Expo prints a different port, include that exact origin in `BACKEND_CORS_ORIGINS` and restart the backend.

For the deployed HTTPS website, use a reachable HTTPS backend with the site's origin in CORS. HTTP localhost is suitable for a local frontend; mixed-content and private-network restrictions can block it from a hosted website. On a phone, use a reachable HTTPS endpoint or approved development LAN configuration, not phone localhost. Android emulator host alias: `10.0.2.2`.

Connection selection is session-only and is not saved to storage or analytics. A full reload restores the build-time `EXPO_PUBLIC_API_BASE_URL`, or local demo if unset. **Use local demo** is an explicit switch, never an automatic fallback after a server failure. Switching is blocked while tasks/commands are active or a creation outcome is unknown.

The backend's `BACKEND_ADAPTER` chooses mock versus Gazebo. The frontend cannot identify that choice from the current robot API. For Luis's Gazebo scenario, follow David's repository README, start Gazebo and use matching `GZ_PARTITION`. Do not run competing keyboard publishers while the API drives the car.

## First End-to-End Mission

1. Connect the backend and open **Overview**.
2. Check `robot_01`, connected/idle status, and the **Fresh API response** indicator. The map shows live metre coordinates.
3. Select **Send to Station B** deliberately. The frontend posts `{"robot_id":"robot_01","destination":"station_b"}` to `/api/v1/tasks`.
4. Observe **queued**, then **running**, the position changes and 0–100% progress. Reads run every 500ms without overlapping requests.
5. Wait for the backend to report **completed** at B. Select **Send to Station A** to return.
6. If needed, **Cancel mission** requests cancellation of that exact active task. The backend's matching canceled response acknowledges it; an HTTP failure is not treated as success. This is not a certified emergency stop.
7. Open **Missions**, filter **completed**, inspect **Details**, and optionally **Export CSV**.

Live defaults: A=(-4, 0), B=(-14, 6), in metres; theta is radians. The map flips world +Y upward and uses a uniform 20 map pixels per metre. No invented warehouse shelves or planned route are overlaid in live mode.

David has not published a scenario/map endpoint. These station defaults are explicitly configured in `src/lib/backend-contract.ts`; synchronize them with `BACKEND_STATIONS` overrides before driving. Do not treat the sketch as an occupancy map or obstacle-avoidance system.

The mock robot's pose timestamp does not change while idle. **Fresh API response** means recent successful reads, not a newly measured pose. The original pose-update timestamp remains visible below the map. The backend owns robot connection detection.

## Button Reference

### Workspace

| Control                                        | Purpose                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| Pirate home / Overview                         | Return to map, status and quick dispatch.                          |
| Simulation studio / Settings                   | Open backend setup and preferences.                                |
| Robots / Warehouse 01                          | Detailed robot controls and the separate driving preview.          |
| Missions                                       | Search, filter and inspect backend or demo missions.               |
| Analytics                                      | Summaries of the loaded mission records.                           |
| Logbook / View logbook                         | Private device diagnostic events, separate from backend tasks.     |
| Notifications                                  | Open observed fleet events; Close dialog dismisses the list.       |
| Help / Help & documentation / Explore the demo | Local guidance and Ariel. No external AI service.                  |
| Start guided tour                              | Start or restart the highlighted walkthrough.                      |
| Previous step / Next step                      | Navigate explanations only, not robot commands.                    |
| Exit guide / Finish guide                      | Remove highlights and close the walkthrough.                       |
| Dismiss message                                | Hide the current message; does not repair an unhealthy connection. |

### Connection and Missions

| Control                               | Purpose                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Backend server URL                    | Enter a server base URL, without credentials, `/api/v1`, query or fragment. |
| Connect backend                       | Select that server and read robot/status/history. No movement is sent.      |
| Refresh telemetry                     | Request a new read; concurrent reads coalesce.                              |
| Use local demo                        | Explicitly leave live mode when no active/uncertain work remains.           |
| Send to Station B / Send to Station A | Create one autonomous task to that station.                                 |
| New mission                           | Open a chooser; no command is sent yet.                                     |
| Station A / Station B                 | Select the chooser's destination.                                           |
| Dispatch mission                      | Submit the selected destination once.                                       |
| Cancel mission                        | Cancel the specific active task through the backend.                        |
| Close dialog                          | Leave the chooser/details/help without submitting another action.           |

Dispatch is disabled for pending commands, unavailable/stale reads, an offline/busy robot, an active mission or local manual mode. An explanatory message appears beside quick dispatch. Battery is **not reported** in live mode because David's API does not provide it.

### Map and Reports

| Control                                                         | Purpose                                                                                  |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Zoom in / Zoom out                                              | Change map magnification, not robot motion.                                              |
| Center                                                          | Reset map zoom to the configured full extent.                                            |
| Labels                                                          | Toggle station and robot labels.                                                         |
| All time / Today / Last 7 days                                  | Filter loaded missions by creation time. Live history is capped at the newest 200 tasks. |
| Search missions                                                 | Narrow by task, robot or destination.                                                    |
| All statuses / queued / running / completed / failed / canceled | Filter mission state.                                                                    |
| Details                                                         | Inspect ID, state, timestamps, progress, duration and error.                             |
| Export CSV                                                      | Download the filtered mission records. Exports may contain task IDs.                     |
| Previous / Next                                                 | Page through mission results. Disabled at list boundaries.                               |
| Bar chart / Line chart                                          | Change presentation of the same activity data.                                           |
| 8 hours / 24 hours / 7 days                                     | Change the chart time window.                                                            |

### Logbook and Privacy

| Control                                          | Purpose                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| Search logbook                                   | Search fixed local event labels and mode.                           |
| All events / Successful / Failures / Information | Filter local diagnostic outcomes.                                   |
| Export logbook CSV                               | Download filtered local events. Nothing is uploaded.                |
| Previous events / Next events                    | Page through local events.                                          |
| Disable local recording / Enable local recording | Disable also clears saved records; enable records new local events. |
| Clear local logbook                              | Open a confirmation; does not affect backend missions.              |
| Confirm clear logbook / Keep logbook             | Delete device events or cancel deletion.                            |
| Allow optional page analytics                    | Opt in to limited GA4 tracking only when a measurement ID exists.   |
| Keep analytics off                               | Opt out. Logbook, robot poses and commands are never tracked.       |
| Ariel question buttons                           | Display curated local answers. No remote chatbot requests.          |

### Optional Local Practice

These controls do not send commands to David's backend. The warehouse manual controls and scenario settings are hidden in live mode; the separate driving preview remains explicitly local.

| Control                                          | Purpose                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Stop simulation                                  | Stop local demo work. Not a physical emergency stop.                                                |
| Enable / Disable manual control                  | Enter/leave discrete demo steps while idle.                                                         |
| Left / Up / Down / Right                         | Move the local demo robot by bounded map steps.                                                     |
| Normal delivery                                  | Select the normal local mission scenario.                                                           |
| Obstacle pause and recovery                      | Simulate a pause and local recovery.                                                                |
| Navigation timeout                               | Simulate mission failure after a timeout.                                                           |
| Simulate disconnect / Reconnect robot            | Change only local demo connection; failed work does not resume.                                     |
| Reset demo data                                  | Open a destructive confirmation.                                                                    |
| Confirm reset / Keep my data                     | Restore seeded local missions or cancel reset.                                                      |
| Preview forward / reverse / left arc / right arc | Inspect a local velocity command while held; release clears it.                                     |
| Clear driving preview                            | Set local preview velocity to zero.                                                                 |
| 0.2 / 0.5 / 1.0 / 1.5 / 2.0 m/s                  | Change requested preview speed only.                                                                |
| Enable / Disable driving keyboard                | Opt in/out of web arrow-key previews; Space/Escape or focus loss clears them.                       |
| Connect Gazebo (coming later)                    | Intentionally disabled. Live A/B navigation uses Connect backend and the task API, not this button. |

## Troubleshooting

- **Cannot connect:** check server `/health`, URL, network reachability, browser CORS, HTTPS and the exact frontend origin.
- **Robot offline:** check Luis's simulator and David's adapter; API reachability alone does not prove robot connectivity.
- **Dispatch locked after an unknown outcome:** ask the backend operator to reconcile tasks. Do not reload just to bypass the guard.
- **Map coordinates differ:** verify `BACKEND_STATIONS` and frame conventions with Luis/David. The app does not fetch a scenario.
- **No live manual controls:** intentional; no velocity lease/deadman endpoint is published.
- **No battery reading:** expected for this API, not a simulated value.

See [ROS Backend Integration](ROS_BACKEND_INTEGRATION.md) for payloads, verification commands and remaining safety requirements.

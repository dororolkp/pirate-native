# David's ROS Backend Integration

## Verified Contract

Repository: https://github.com/davidcheungo123/ros_backend

Verified revision: `5b35ea37dd44a69d05e8488fa201b53f5fe4168b`.

Felix's meeting brief assigns frontend integration, A/B dispatch, state polling and a 2D scenario map. This implementation keeps React Native/Expo instead of the attachment's Next.js suggestion. The meeting's proposed `/api/robot/state`, `/api/robot/navigate` and `/api/scenario` are **not implemented** in David's current repository; the frontend uses the actual versioned robot/task API.

| Endpoint                                        | Frontend use                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `GET /health`                                   | Operator/server verification; not a robot connectivity guarantee.             |
| `GET /api/v1/robots`                            | Read the configured robot, connection, state, world pose and current task ID. |
| `POST /api/v1/tasks`                            | Create a task for `robot_01` and `station_a` or `station_b`.                  |
| `GET /api/v1/tasks/{task_id}`                   | Read queued/running/completed/failed/canceled status and fractional progress. |
| `GET /api/v1/tasks?robot_id=robot_01&limit=200` | Load up to 200 recent tasks, including work created by another client.        |
| `POST /api/v1/tasks/{task_id}/cancel`           | Require a matching full task response in `canceled` state.                    |

The existing SSE endpoint is not required; portable polling supports web, iOS and Android. No frontend code talks directly to ROS/Gazebo or starts simulator processes.

## Robot Payload

```json
[
  {
    "robot_id": "robot_01",
    "connected": true,
    "state": "idle",
    "pose": { "x": -4.0, "y": 0.0, "theta": 0.0 },
    "current_task_id": null,
    "updated_at": "2026-11-25T12:00:00+00:00"
  }
]
```

`state`: idle/busy/offline. x/y are metres; theta is radians. No name, battery, manual state or `heartbeat_at` is supplied by this API. The frontend preserves `updated_at` and the raw world pose, maps `state` to its internal status, and shows **Battery not reported**.

The mock adapter does not update pose timestamps while idle. A separate local `api_received_at` records receipt of a valid API robot read. Dispatch requires successful transport, connected/idle state and a receipt no older than ten seconds; it does **not** pretend the stored pose was measured just now. The map labels this **Fresh API response** and separately exposes the source pose timestamp. David's backend remains responsible for truthful robot connectivity and pose age.

## Task Payloads

Create request:

```json
{ "robot_id": "robot_01", "destination": "station_b" }
```

Accepted response:

```json
{ "task_id": "t_001", "state": "queued" }
```

Read and cancel responses:

```json
{
  "task_id": "t_001",
  "robot_id": "robot_01",
  "destination": "station_b",
  "state": "running",
  "progress": 0.4,
  "created_at": "2026-11-25T12:00:00+00:00",
  "updated_at": "2026-11-25T12:00:01+00:00",
  "started_at": "2026-11-25T12:00:00.200000+00:00",
  "finished_at": null,
  "error": null
}
```

Progress is strictly 0–1 at the boundary and rendered as 0–100%. Nullable start/finish/error fields become absent internal fields. Completed tasks should report progress 1 and a finish timestamp. A cancel response must identify the requested task/configured robot and state `canceled`; an empty body or `cancel_requested` is not acknowledged by this adapter.

Both string `detail` and David's structured `detail: {code, message}` errors are readable in the UI. Cross-robot and mismatched task IDs, invalid states, non-finite coordinates and invalid progress are rejected.

## Coordinates and Scenario Limit

Default `BACKEND_STATIONS` from David's `config.py`:

| Destination | x   | y   | theta |
| ----------- | --- | --- | ----- |
| station_a   | -4  | 0   | 0     |
| station_b   | -14 | 6   | 0     |

`src/lib/backend-contract.ts` owns the presentation conversion, separate from navigation:

```text
map_x = 220 + (world_x - (-18)) * 20
map_y = 335 - (world_y - (-4)) * 20
map_yaw = -world_theta
```

This uniform scale preserves orientation; +Y is up, +X right. It places A at (500,255) and B at (300,135) in an 800x390 map. Original demo coordinates A=(140,220), B=(660,220) remain separate and are never used as live navigation goals.

No scenario/occupancy-map endpoint exists. The live drawing contains configured station markers and robot pose, not fabricated shelves or a claimed planned route. A robot outside configured bounds produces a warning. Synchronize frontend station constants with any backend/Luis scenario changes before control. A future scenario endpoint should provide frame, extent, stations and obstacles under an agreed versioned contract.

## Runtime and Safety

- Initial mode: `EXPO_PUBLIC_API_BASE_URL`, or safe local demo if unset.
- Settings provides a validated session-only server URL. URL changes do not persist, go to analytics or silently change mode after failure.
- Active/pending/ambiguous tasks block connection switching. Expired service callbacks are ignored.
- Healthy robot/current-task polling: 500ms. Task list: every five seconds and after mutations. Reads coalesce without overlap.
- Reads fail after eight seconds; outage delays are 4/8/16/30 seconds, or up to 60 for Retry-After.
- App backgrounding pauses polling. Commands never retry automatically.
- Accepted IDs are retained before follow-up reads. Revision checks prevent older telemetry/history from undoing an accepted/canceled task.
- Definitive 400/404/409/422 create rejection does not lock the session. Network/timeout/malformed reply/server errors can follow a side effect and conservatively lock dispatch until operator reconciliation.
- Backend owns global robot exclusivity. A successful cancellation response is backend acknowledgment, **not a certified physical emergency stop**.
- No auth, lease/deadman manual control or idempotency protocol is invented. Do not expose unauthenticated physical-robot control publicly.

## Verify Locally

Follow [Frontend Guide](FRONTEND_GUIDE.md) to start an isolated mock backend and local frontend. The separate real-backend browser test intentionally does not run in CI or on production by default:

```powershell
$env:TEST_BASE_URL = "http://localhost:8090"
$env:LIVE_BACKEND_TEST_URL = "http://127.0.0.1:8015"
npx playwright test tests/e2e/backend-live.spec.ts --project desktop
```

Only set `LIVE_BACKEND_TEST_URL` for an isolated **mock** server: this test sends tasks. Run it on one project at a time because the MVP has one shared robot. Normal browser regression tests intercept test API requests and verify payloads, failure handling, cancellation and guide behavior without contacting a robot.

The backend source was cloned into OS temporary storage for verification, not vendored into this application or modified. This client does not deploy a FastAPI server on Vercel; long-running adapters and the database require a suitable separately hosted service.

## Outstanding Team Work

- David: provide a reachable approved HTTPS backend, exact CORS origins and the final adapter/station configuration.
- Luis: verify the same scenario/frame and Gazebo partition with David; avoid competing command publishers.
- Felix/team: run the end-to-end B-arrival-A sequence on that shared Gazebo setup, then address auth, trusted stopping, reconciliation and native device testing before real-robot operation.

An actual mock-backend test is not proof that a physical robot or Luis's running Gazebo world was tested.

## Release Verification

- Frontend lint and typechecking passed; 168 unit/hook/adapter tests passed.
- Desktop and Pixel-browser acceptance: 46 passed; two project instances of the opt-in real-backend test are skipped by default.
- The opt-in desktop browser test against an actual isolated FastAPI mock server completed A → B → A with backend poses and terminal task history.
- David's unmodified backend suite: 61 passed (one upstream Starlette/httpx deprecation warning).
- Expo Doctor: 20/20 checks; npm audit: zero vulnerabilities.
- Web static output and Android/iOS Hermes bundles exported successfully. These exports are not signed APK/AAB/IPA files or native device tests.

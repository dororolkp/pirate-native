# Fleet API Contract

**Current authoritative contract:** [David's ROS Backend Integration](ROS_BACKEND_INTEGRATION.md). The React Native app now uses David's actual `/api/v1/robots` and `/api/v1/tasks` payloads, metre coordinates, fractional progress, task-list discovery and 500ms polling.

**The sections below are archived notes from the original integration handoff, not the current adapter contract.** Do not implement these legacy payloads (status/yaw/battery/heartbeat, 0–100 API progress, wrapped robots or cancel_requested responses) for this client. See the current contract and [Frontend Guide](FRONTEND_GUIDE.md) instead.

## Archived Original Handoff

## Ownership and Safety

```text
Pirate Native -> HTTP API -> Robot adapter -> ROS/Nav2/Gazebo or approved robot
             <- timestamped authoritative robot/task snapshots <-
```

The app is a frontend, not a backend, ROS node, map-coordinate converter, collision-avoidance controller or certified emergency stop. Public live controls require backend authentication/authorization, secure networking, audit logging, robot-side stopping and deadlines. No auth mechanism was supplied in the source contract, so none is invented here.

## Configuration and Conventions

```dotenv
EXPO_PUBLIC_API_BASE_URL=https://approved-backend.example
EXPO_PUBLIC_ROBOT_ID=robot_01
```

- API URL is the origin/base path **without** `/api/v1`; trailing slashes are removed.
- JSON over HTTPS for deployment. ISO 8601 UTC timestamps ending in `Z`.
- Supported destinations: `station_a`, `station_b`.
- Robot ID defaults to `robot_01`; robot name defaults to Atlas when absent.
- Map frame: 800x390 application units. A=(140,220), B=(660,220), yaw=radians.
- Convert physical pose on the robot/backend adapter side, never treat UI pixels as ROS meters.
- Server must enforce robot exclusivity across clients.

## GET /api/v1/robots

Array response or `{ "robots": [...] }`:

```json
[
  {
    "robot_id": "robot_01",
    "name": "Atlas",
    "connected": true,
    "status": "idle",
    "pose": { "x": 140, "y": 220, "yaw": 0 },
    "battery": 86,
    "heartbeat_at": "2026-11-14T12:00:00.000Z"
  }
]
```

`status`: idle, busy, manual, offline. Battery: 0..100. Pose values must be finite. Heartbeat must originate from fresh robot telemetry, not the moment an HTTP endpoint is called. Staleness after ten seconds and timestamps over ten seconds into the client's future disable dispatch; keep clocks synchronized.

## POST /api/v1/tasks

Request:

```json
{ "robot_id": "robot_01", "destination": "station_b" }
```

Successful HTTP response, normally 201:

```json
{ "task_id": "t_001", "state": "queued" }
```

`task_id` is a nonempty unique string. `state` must be queued. HTTP 200/202 are also accepted as success. Once accepted, the client retains the task ID before attempting a status refresh. It never resends the create request automatically.

## GET /api/v1/tasks/{task_id}

```json
{
  "task_id": "t_001",
  "robot_id": "robot_01",
  "destination": "station_b",
  "origin": { "x": 140, "y": 220 },
  "status": "running",
  "progress": 35,
  "created_at": "2026-11-14T12:00:00.000Z",
  "started_at": "2026-11-14T12:00:01.000Z",
  "updated_at": "2026-11-14T12:00:07.000Z"
}
```

Required: IDs, destination, status, progress, created and updated timestamps. Origin is optional for compatibility and defaults to A; provide actual origin when possible. Started/finished timestamps and readable error are optional. Origin values must be finite; progress=0..100. Completed tasks should supply 100 and a finished timestamp.

Responses must match the requested task and configured robot. Cross-robot/cross-task snapshots are rejected.

Lifecycle:

```text
queued -> running -> completed
queued/running -> failed
queued/running -> canceled (only after robot-side acknowledgment)
```

## POST /api/v1/tasks/{task_id}/cancel

Example acknowledgment:

```json
{ "task_id": "t_001", "state": "cancel_requested" }
```

Any successful JSON acknowledgment or empty success body is tolerated. **HTTP success is not proof the robot stopped.** The client continues polling and shows running/queued until the backend reports canceled or failed. Backend must cancel Nav2/actions and confirm protective stopping according to its safety architecture.

## Polling and Events

The client polls healthy authoritative snapshots every two seconds and refreshes on app resume. Failed reads back off to 4, 8, 16 and 30 seconds; a valid Retry-After header can extend the delay up to 60 seconds. Live polling pauses while backgrounded. Manual refresh bypasses the schedule delay but still coalesces with an in-flight read. Requests abort after eight seconds. Accepted task IDs cannot be overwritten by an older in-flight telemetry result. No automatic mutation retry is introduced by this read-backoff policy.

The original backend's SSE `/api/v1/events` endpoint may remain available to other clients. Pirate Native does not depend on EventSource or consume raw SSE payloads. Its timeline records local simulator events and observed backend task status transitions; it is not a full backend audit log.

## Errors, Ambiguity and Retries

```json
{ "detail": "Robot is busy. Complete or cancel the active mission." }
```

| HTTP Code | Expected Meaning                    |
| --------- | ----------------------------------- |
| 400/422   | Invalid request or destination      |
| 404       | Missing robot/task                  |
| 409       | Busy/manual/conflicting task        |
| 503       | Adapter disconnected or unavailable |
| 504       | Backend navigation/command deadline |

Readable string detail is shown; non-string errors use the HTTP status. Malformed telemetry yields a contract error, not a demo. Transport failures block new dispatch until snapshots are healthy.

Any failed/malformed create response can follow a side effect; the conservative client locks dispatch for that session after an ambiguous creation outcome. A healthy robot refresh alone does not unlock it. Ask the backend operator to reconcile accepted work before restarting. Do not reload merely to bypass the lock.

Backend idempotency keys, current-task lookup and globally persistent history are recommended extensions. They are not supplied by this MVP and must be agreed before extending the frontend.

## Networking Across Platforms

| Client           | Backend Address Guidance                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Local browser    | `localhost` reaches the development computer                                                                      |
| Android emulator | `10.0.2.2` normally reaches the host computer                                                                     |
| iOS simulator    | Host localhost is normally reachable on the Mac                                                                   |
| Physical phone   | Use reachable LAN address or approved HTTPS endpoint; localhost is the phone                                      |
| Deployed web     | Use a publicly/privately reachable HTTPS endpoint approved for that audience; cannot reach a teammate's localhost |

Local HTTP is useful for isolated development but may be blocked by Android cleartext or iOS transport policies. This repository does not weaken release transport security. Use HTTPS or an approved development-only network configuration.

Browser API CORS must allow `http://localhost:8081`, `https://pirate-native.vercel.app`, and explicitly approved preview origins, for GET/POST/OPTIONS and Content-Type. Native clients do not use browser CORS, but still need reachable, authenticated endpoints.

## Integration Limitations

- No task-list/current-task endpoint: live history only tracks tasks accepted in the current client session.
- Tasks created by other clients can set robot busy, but their IDs cannot be inspected/canceled without a backend discovery endpoint.
- Live reload does not restore historical task IDs; backend busy state still blocks new dispatch.
- No live velocity/deadman API: no manual teleoperation.
- No auth/token protocol: do not expose an unauthenticated physical robot API.
- No actual backend/Gazebo/robot was connected or tested during delivery.

For integration acceptance, verify create/status/cancel acknowledgment, robot-origin heartbeat, invalid payload rejection, network loss, duplicate prevention, ambiguity reconciliation, CORS/auth, and map conversion against the real backend and robot adapter.

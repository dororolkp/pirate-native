-- Backend-ready SQLite migration. Not loaded by the app or deployed as a server.
-- Use a persistent local volume for a future single-instance modular monolith.
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
BEGIN IMMEDIATE;

CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
) STRICT;

CREATE TABLE workspaces (
  workspace_id TEXT PRIMARY KEY CHECK(length(workspace_id) BETWEEN 1 AND 100),
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  created_at INTEGER NOT NULL CHECK(created_at >= 0)
) STRICT;

CREATE TABLE robots (
  workspace_id TEXT NOT NULL,
  robot_id TEXT NOT NULL CHECK(length(robot_id) BETWEEN 1 AND 100),
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  status TEXT NOT NULL CHECK(status IN ('idle','busy','manual','offline')),
  heartbeat_at INTEGER,
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  PRIMARY KEY(workspace_id, robot_id),
  FOREIGN KEY(workspace_id) REFERENCES workspaces(workspace_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE missions (
  workspace_id TEXT NOT NULL,
  task_id TEXT NOT NULL CHECK(length(task_id) BETWEEN 1 AND 100),
  robot_id TEXT NOT NULL,
  destination TEXT NOT NULL CHECK(destination IN ('station_a','station_b')),
  status TEXT NOT NULL CHECK(status IN ('queued','running','completed','failed','canceled')),
  progress REAL NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  created_at INTEGER NOT NULL CHECK(created_at >= 0),
  updated_at INTEGER NOT NULL CHECK(updated_at >= created_at),
  finished_at INTEGER CHECK(finished_at >= created_at),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  PRIMARY KEY(workspace_id, task_id),
  FOREIGN KEY(workspace_id, robot_id) REFERENCES robots(workspace_id, robot_id) ON DELETE RESTRICT,
  CHECK(status NOT IN ('completed','failed','canceled') OR finished_at IS NOT NULL),
  CHECK(status != 'completed' OR progress = 100)
) STRICT;
-- Database-level exclusivity, even when two API clients race.
CREATE UNIQUE INDEX one_active_mission_per_robot
  ON missions(workspace_id, robot_id) WHERE status IN ('queued','running');
CREATE INDEX mission_history
  ON missions(workspace_id, created_at DESC, task_id DESC);
CREATE INDEX mission_status_history
  ON missions(workspace_id, status, created_at DESC, task_id DESC);

CREATE TABLE command_requests (
  workspace_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL CHECK(length(idempotency_key) BETWEEN 16 AND 128),
  payload_hash TEXT NOT NULL CHECK(length(payload_hash) = 64),
  kind TEXT NOT NULL CHECK(kind IN ('dispatch','cancel')),
  state TEXT NOT NULL CHECK(state IN ('received','accepted','rejected','unknown')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK(expires_at > created_at),
  PRIMARY KEY(workspace_id, request_id),
  UNIQUE(workspace_id, idempotency_key),
  FOREIGN KEY(workspace_id) REFERENCES workspaces(workspace_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX command_expiry ON command_requests(expires_at);

CREATE TABLE operational_events (
  workspace_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  code TEXT NOT NULL CHECK(length(code) BETWEEN 1 AND 64),
  outcome TEXT NOT NULL CHECK(outcome IN ('ok','failed','info')),
  created_at INTEGER NOT NULL CHECK(created_at >= 0),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(metadata_json) AND length(metadata_json) <= 2048),
  PRIMARY KEY(workspace_id, event_id),
  FOREIGN KEY(workspace_id) REFERENCES workspaces(workspace_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX event_history ON operational_events(workspace_id, created_at DESC, event_id DESC);
CREATE INDEX event_retention ON operational_events(created_at);

INSERT INTO schema_migrations(version) VALUES(1);
COMMIT;

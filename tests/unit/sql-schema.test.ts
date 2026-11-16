import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let db: DatabaseSync;
beforeEach(() => {
  db = new DatabaseSync(":memory:");
  db.exec(
    readFileSync(
      new URL("../../backend/schema/001_workspace.sql", import.meta.url),
      "utf8",
    ),
  );
  db.prepare("INSERT INTO workspaces VALUES(?,?,?)").run(
    "w1",
    "Local lab",
    1000,
  );
  db.prepare(
    "INSERT INTO robots(workspace_id,robot_id,name,status) VALUES(?,?,?,?)",
  ).run("w1", "r1", "Atlas", "idle");
});
afterEach(() => db.close());
function mission(
  id: string,
  status = "queued",
  workspace = "w1",
  progress = 0,
  finished: number | null = null,
) {
  db.prepare(
    "INSERT INTO missions(workspace_id,task_id,robot_id,destination,status,progress,created_at,updated_at,finished_at) VALUES(?,?,?,?,?,?,?,?,?)",
  ).run(
    workspace,
    id,
    "r1",
    "station_b",
    status,
    progress,
    1000,
    2000,
    finished,
  );
}
describe("Backend-ready SQL constraints (no server connection)", () => {
  it("applies the versioned migration with foreign keys enabled", () => {
    expect(
      db.prepare("SELECT version FROM schema_migrations").get()?.version,
    ).toBe(1);
    expect(db.prepare("PRAGMA foreign_keys").get()?.foreign_keys).toBe(1);
  });
  it("enforces one queued/running mission per robot", () => {
    mission("t1");
    expect(() => mission("t2", "running")).toThrow(/UNIQUE/);
    db.prepare(
      "UPDATE missions SET status='canceled',finished_at=2000 WHERE task_id=?",
    ).run("t1");
    expect(() => mission("t2", "running")).not.toThrow();
  });
  it("rejects cross-workspace robot references", () => {
    db.prepare("INSERT INTO workspaces VALUES(?,?,?)").run(
      "w2",
      "Other lab",
      1000,
    );
    expect(() => mission("t2", "queued", "w2")).toThrow(/FOREIGN KEY/);
  });
  it("rejects invalid progress and terminal timestamps", () => {
    expect(() => mission("invalid", "queued", "w1", 150)).toThrow(/CHECK/);
    expect(() => mission("invalid", "completed", "w1", 99, 2000)).toThrow(
      /CHECK/,
    );
    expect(() => mission("invalid", "failed")).toThrow(/CHECK/);
    expect(() => mission("valid", "completed", "w1", 100, 2000)).not.toThrow();
  });
  it("enforces idempotency-key uniqueness and request expiry ordering", () => {
    const insert = db.prepare(
      "INSERT INTO command_requests VALUES(?,?,?,?,?,?,?,?)",
    );
    const key = "idempotency-key-01";
    insert.run(
      "w1",
      "req1",
      key,
      "a".repeat(64),
      "dispatch",
      "received",
      1000,
      2000,
    );
    expect(() =>
      insert.run(
        "w1",
        "req2",
        key,
        "b".repeat(64),
        "dispatch",
        "received",
        1000,
        2000,
      ),
    ).toThrow(/UNIQUE/);
    expect(() =>
      insert.run(
        "w1",
        "req3",
        "idempotency-key-02",
        "a".repeat(64),
        "dispatch",
        "received",
        2000,
        1000,
      ),
    ).toThrow(/CHECK/);
  });
  it("supports optimistic revision checks without overwriting concurrent updates", () => {
    mission("t1");
    const update = db.prepare(
      "UPDATE missions SET revision=revision+1,progress=? WHERE workspace_id=? AND task_id=? AND revision=?",
    );
    expect(update.run(10, "w1", "t1", 1).changes).toBe(1);
    expect(update.run(20, "w1", "t1", 1).changes).toBe(0);
  });
  it("uses indexed history queries rather than unbounded table scans", () => {
    const plan = db
      .prepare(
        "EXPLAIN QUERY PLAN SELECT task_id FROM missions WHERE workspace_id=? ORDER BY created_at DESC,task_id DESC LIMIT 10",
      )
      .all("w1");
    expect(
      plan.some((row) => String(row.detail).includes("mission_history")),
    ).toBe(true);
  });
  it("rejects invalid event JSON and can prune expired events", () => {
    const insert = db.prepare(
      "INSERT INTO operational_events VALUES(?,?,?,?,?,?)",
    );
    expect(() =>
      insert.run("w1", "bad", "workspace_opened", "info", 1000, "{bad"),
    ).toThrow(/CHECK/);
    insert.run("w1", "old", "workspace_opened", "info", 1000, "{}");
    insert.run("w1", "new", "workspace_opened", "info", 3000, "{}");
    db.prepare("DELETE FROM operational_events WHERE created_at < ?").run(2000);
    expect(db.prepare("SELECT event_id FROM operational_events").all()).toEqual(
      [{ event_id: "new" }],
    );
  });
});

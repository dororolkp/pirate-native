import { describe, expect, it } from "vitest";
import {
  pageMetadata,
  SITE_ROUTES,
  siteStructuredData,
} from "../../src/lib/site-metadata";
import { createDemo } from "../../src/lib/demo-simulator";
import { workspaceHealth } from "../../src/lib/workspace-health";
describe("Static SEO", () => {
  it.each(Object.keys(SITE_ROUTES))(
    "provides descriptive metadata and canonical URL for %s",
    (path) => {
      const metadata = pageMetadata(path);
      expect(String(metadata.title)).toContain("Pirate");
      expect(metadata.description?.length).toBeGreaterThan(40);
      expect(metadata.alternates?.canonical).toBe(
        `https://pirate-native.vercel.app${path}`,
      );
    },
  );
  it.each(["/settings", "/logbook", "/integrations", "/unknown", "toString"])(
    "does not index private or unknown route %s",
    (path) => {
      expect(pageMetadata(path).robots).toMatchObject({
        index: false,
        follow: true,
      });
    },
  );
  it("does not invent reviews or claim live robot control in structured data", () => {
    const data = siteStructuredData();
    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.description).toContain("not enabled");
    expect(data).not.toHaveProperty("aggregateRating");
  });
});

describe("Honest operations health", () => {
  it("distinguishes simulation readiness from live telemetry", () => {
    const snapshot = createDemo();
    expect(workspaceHealth(snapshot, Date.now(), false, false).label).toBe(
      "Local simulation ready",
    );
    expect(workspaceHealth(snapshot, Date.now(), true, false).label).toBe(
      "Live telemetry current",
    );
  });
  it("prioritizes transport, offline, stale and manual guards", () => {
    const snapshot = createDemo();
    expect(workspaceHealth(snapshot, Date.now(), true, true).tone).toBe("red");
    snapshot.robot.connected = false;
    expect(workspaceHealth(snapshot, Date.now(), false, false).label).toBe(
      "Robot disconnected",
    );
    snapshot.robot.connected = true;
    expect(
      workspaceHealth(snapshot, Date.now() + 11_000, true, false).label,
    ).toBe("Stale heartbeat");
    snapshot.manual = true;
    expect(workspaceHealth(snapshot, Date.now(), false, false).label).toBe(
      "Manual mode active",
    );
  });
});

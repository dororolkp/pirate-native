import { describe, expect, it } from "vitest";
import {
  GUIDE_ARTICLES,
  searchCatalog,
  STACK_CAPABILITIES,
  WORKSPACE_COMMANDS,
} from "../../src/lib/workspace-catalog";

describe("free workspace catalogues", () => {
  it("supports case-insensitive, multiword search without special prototypes", () => {
    expect(searchCatalog(WORKSPACE_COMMANDS, "BACKEND url")[0].id).toBe(
      "settings",
    );
    expect(searchCatalog(WORKSPACE_COMMANDS, "toString")).toEqual([]);
    expect(searchCatalog(GUIDE_ARTICLES, "  ")).toHaveLength(
      GUIDE_ARTICLES.length,
    );
  });
  it("limits command actions to known pages or the guided tour", () => {
    expect(new Set(WORKSPACE_COMMANDS.map((item) => item.id)).size).toBe(
      WORKSPACE_COMMANDS.length,
    );
    for (const command of WORKSPACE_COMMANDS) {
      if (!command.route) expect(command.id).toBe("tour");
      else
        expect(command.route).toMatch(
          /^\/(?:robots|missions|analytics|logbook|settings|docs|integrations)?$/,
        );
    }
    expect(WORKSPACE_COMMANDS).not.toHaveProperty("dispatch");
  });
  it("labels external dependencies instead of claiming paid SDKs are connected", () => {
    expect(STACK_CAPABILITIES.find((item) => item.id === "ga4")?.status).toBe(
      "Optional account",
    );
    expect(STACK_CAPABILITIES.find((item) => item.id === "ads")?.status).toBe(
      "Not connected",
    );
    expect(
      STACK_CAPABILITIES.find((item) => item.id === "business")?.status,
    ).toBe("Not connected");
    expect(
      STACK_CAPABILITIES.find((item) => item.id === "graphics")?.detail,
    ).toContain("not a 3D renderer");
  });
});

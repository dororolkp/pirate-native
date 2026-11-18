import { expect, it } from "vitest";
import { visualAttributes as native } from "../../src/lib/visual-attributes";
import { visualAttributes as web } from "../../src/lib/visual-attributes.web";

it("keeps DOM styling attributes out of native views", () => {
  expect(native("button", "danger")).toEqual({});
});

it("provides browser styling hooks without overriding accessibility props", () => {
  expect(web("button", "danger")).toEqual({
    dataSet: { ui: "button", variant: "danger" },
  });
  expect(web("metric")).toEqual({
    dataSet: { ui: "metric", variant: "regular" },
  });
});

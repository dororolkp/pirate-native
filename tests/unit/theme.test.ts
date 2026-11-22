import { describe, expect, it } from "vitest";
import { colors, maximalist } from "../../src/lib/theme";

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((value) => {
      const channel = parseInt(value, 16) / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("maximalist text palette", () => {
  for (const background of [
    colors.background,
    colors.surface,
    maximalist.pink,
    maximalist.lime,
    maximalist.teal,
    maximalist.yellow,
    "#fff0d4",
  ]) {
    it(`keeps body and muted text AA-readable on ${background}`, () => {
      expect(contrast(colors.ink, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.muted, background)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("keeps hero, primary and selected button text AA-readable", () => {
    for (const foreground of ["#ffffff", "#f6edff", maximalist.lime]) {
      expect(contrast(foreground, maximalist.violet)).toBeGreaterThanOrEqual(
        4.5,
      );
    }
    expect(contrast(maximalist.violet, maximalist.lime)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});

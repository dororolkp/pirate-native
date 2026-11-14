import { vi } from "vitest";
import { randomUUID } from "node:crypto";
vi.mock("expo-crypto", () => ({ randomUUID }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
  },
}));

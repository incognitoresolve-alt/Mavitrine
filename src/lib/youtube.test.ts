import { describe, expect, it } from "vitest";
import { isShort, isShortDuration } from "./youtube";

describe("isShortDuration", () => {
  it("treats videos of 60 seconds or less as Shorts", () => {
    expect(isShortDuration(1)).toBe(true);
    expect(isShortDuration(60)).toBe(true);
  });

  it("treats longer videos as regular uploads", () => {
    expect(isShortDuration(61)).toBe(false);
    expect(isShortDuration(180)).toBe(false);
  });

  it("treats a zero/unknown duration as not a Short", () => {
    expect(isShortDuration(0)).toBe(false);
  });
});

describe("isShort", () => {
  it("excludes videos listed in the Shorts playlist, whatever their length", () => {
    expect(isShort("abc", 170, new Set(["abc"]))).toBe(true);
  });

  it("keeps full tracks absent from the Shorts playlist", () => {
    expect(isShort("abc", 170, new Set(["xyz"]))).toBe(false);
  });

  it("falls back to duration when the Shorts playlist is unavailable", () => {
    expect(isShort("abc", 45, null)).toBe(true);
    expect(isShort("abc", 170, null)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { isShortDuration } from "./youtube";

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

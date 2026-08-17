import { describe, expect, it } from "vitest";
import { formatCompact, formatDate, formatFull } from "./format";

describe("formatCompact", () => {
  it("abbreviates large numbers", () => {
    expect(formatCompact(1500)).toMatch(/^1[,.]5.k$/i);
    expect(formatCompact(2_300_000)).toMatch(/^2[,.]3.M$/);
  });

  it("leaves small numbers unabbreviated", () => {
    expect(formatCompact(42)).toBe("42");
  });
});

describe("formatFull", () => {
  it("groups digits with the French thousands separator", () => {
    expect(formatFull(1234567)).toMatch(/^1.234.567$/);
  });
});

describe("formatDate", () => {
  it("formats an ISO date in French", () => {
    expect(formatDate("2026-01-15T10:00:00Z")).toBe("15 janvier 2026");
  });
});

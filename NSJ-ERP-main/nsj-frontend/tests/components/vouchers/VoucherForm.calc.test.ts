import { describe, it, expect } from "vitest";
import { computeLineValue } from "@/components/vouchers/VoucherForm";

describe("VoucherForm computeLineValue", () => {
  it("calculates value correctly with weight, rate, and no discount", () => {
    expect(computeLineValue(10, 100, 0)).toBe(1000);
  });

  it("applies discount percentage correctly", () => {
    expect(computeLineValue(10, 100, 10)).toBe(900);
  });

  it("handles 50% discount", () => {
    expect(computeLineValue(10, 100, 50)).toBe(500);
  });

  it("handles 100% discount", () => {
    expect(computeLineValue(10, 100, 100)).toBe(0);
  });

  it("returns 0 for null weight", () => {
    expect(computeLineValue(null, 100, 0)).toBe(0);
  });

  it("returns 0 for undefined weight", () => {
    expect(computeLineValue(undefined, 100, 0)).toBe(0);
  });

  it("returns 0 for null rate", () => {
    expect(computeLineValue(10, null, 0)).toBe(0);
  });

  it("handles string inputs", () => {
    expect(computeLineValue("10", "100", "10")).toBe(900);
  });

  it("handles empty string inputs", () => {
    expect(computeLineValue("", "", "")).toBe(0);
  });

  it("handles zero values", () => {
    expect(computeLineValue(0, 100, 0)).toBe(0);
    expect(computeLineValue(10, 0, 0)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const result = computeLineValue(10.5, 33.33, 0);
    expect(result).toBeCloseTo(349.97, 1);
  });

  it("handles very small discount", () => {
    expect(computeLineValue(100, 100, 0.5)).toBe(9950);
  });

  it("handles decimal weight and rate", () => {
    expect(computeLineValue(1.5, 200, 0)).toBe(300);
  });
});

import { describe, it, expect } from "vitest";
import { computeLineValue } from "@/components/vouchers/VoucherForm";

describe("computeLineValue", () => {
  it("returns 0 when inputs are missing or zero", () => {
    expect(computeLineValue()).toBe(0);
    expect(computeLineValue(0, 0, 0)).toBe(0);
  });

  it("calculates simple multiplication without discount", () => {
    expect(computeLineValue(2, 100, 0)).toBe(200);
    expect(computeLineValue("2", "100", "0")).toBe(200);
  });

  it("applies percentage discount correctly", () => {
    expect(computeLineValue(2, 100, 10)).toBe(180);
    expect(computeLineValue("2", "100", "10")).toBe(180);
  });

  it("returns rounded value to two decimals", () => {
    expect(computeLineValue(1.234, 99.99, 12.5)).toBe(
      Number((1.234 * 99.99 * (1 - 12.5 / 100)).toFixed(2))
    );
  });
});

/**
 * Unit tests for amountInWords (lib/numberToWords.ts)
 *
 * The function renders a numeric amount into English words using the Indian
 * numbering system (Thousand / Lakh / Crore) and appends " Only", as used on
 * vouchers, payment receipts and generated PDFs.
 *
 * These tests cover each magnitude tier, the boundaries between tiers, the
 * Indian-grouping contract (never "Million"/"Billion"), and the edge cases
 * around zero, invalid input, negatives, decimals and very large amounts.
 */
import { describe, it, expect } from "vitest";
import { amountInWords } from "@/lib/numberToWords";

describe("amountInWords", () => {
  describe("general contract", () => {
    it('always returns a string ending in " Only"', () => {
      for (const n of [0, 7, 99, 1500, 100000, 12345678, 1000000000]) {
        const result = amountInWords(n);
        expect(typeof result).toBe("string");
        expect(result.endsWith(" Only")).toBe(true);
      }
    });
  });

  describe("zero, falsy and invalid input", () => {
    it.each([
      [0, "Zero Only"],
      [-0, "Zero Only"],
      [NaN, "Zero Only"],
      [Infinity, "Zero Only"],
      [-Infinity, "Zero Only"],
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });

    it("treats undefined / null as zero (defensive, callers use `x || 0`)", () => {
      expect(amountInWords(undefined as unknown as number)).toBe("Zero Only");
      expect(amountInWords(null as unknown as number)).toBe("Zero Only");
    });

    it("does not throw or overflow the stack on ±Infinity", () => {
      expect(() => amountInWords(Infinity)).not.toThrow();
      expect(() => amountInWords(-Infinity)).not.toThrow();
    });
  });

  describe("units (1-9)", () => {
    it.each([
      [1, "One Only"],
      [5, "Five Only"],
      [9, "Nine Only"],
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });
  });

  describe("ten and teens (10-19)", () => {
    it.each([
      [10, "Ten Only"],
      [11, "Eleven Only"],
      [13, "Thirteen Only"],
      [15, "Fifteen Only"],
      [19, "Nineteen Only"],
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });
  });

  describe("tens (20-99)", () => {
    it.each([
      [20, "Twenty Only"], // exact multiple of ten: no trailing unit word
      [21, "Twenty One Only"],
      [50, "Fifty Only"],
      [42, "Forty Two Only"],
      [99, "Ninety Nine Only"],
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });
  });

  describe("hundreds (100-999)", () => {
    it.each([
      [100, "One Hundred Only"], // exact hundred: no trailing remainder
      [101, "One Hundred One Only"],
      [105, "One Hundred Five Only"],
      [110, "One Hundred Ten Only"],
      [115, "One Hundred Fifteen Only"],
      [119, "One Hundred Nineteen Only"],
      [200, "Two Hundred Only"],
      [999, "Nine Hundred Ninety Nine Only"],
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });
  });

  describe("thousands (1,000-99,999)", () => {
    it.each([
      [1000, "One Thousand Only"],
      [1001, "One Thousand One Only"],
      [1100, "One Thousand One Hundred Only"],
      [1500, "One Thousand Five Hundred Only"], // example from the original docstring
      [10000, "Ten Thousand Only"],
      [10500, "Ten Thousand Five Hundred Only"],
      [99999, "Ninety Nine Thousand Nine Hundred Ninety Nine Only"],
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });
  });

  describe("lakhs (1,00,000-99,99,999)", () => {
    it.each([
      [100000, "One Lakh Only"],
      [100001, "One Lakh One Only"],
      [100500, "One Lakh Five Hundred Only"],
      [101000, "One Lakh One Thousand Only"],
      [150000, "One Lakh Fifty Thousand Only"],
      [1000000, "Ten Lakh Only"],
      [1050000, "Ten Lakh Fifty Thousand Only"],
      [
        9999999,
        "Ninety Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine Only",
      ],
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });
  });

  describe("crores (1,00,00,000+)", () => {
    it.each([
      [10000000, "One Crore Only"],
      [10000001, "One Crore One Only"],
      [10000100, "One Crore One Hundred Only"],
      [10001000, "One Crore One Thousand Only"],
      [10100000, "One Crore One Lakh Only"],
      [
        12345678,
        "One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only",
      ],
      [
        99999999,
        "Nine Crore Ninety Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine Only",
      ],
      [100000000, "Ten Crore Only"],
      [990000000, "Ninety Nine Crore Only"],
      [1000000000, "One Hundred Crore Only"],
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });
  });

  describe("Indian numbering system (core requirement of this PR)", () => {
    it("groups by lakh/crore, never by million/billion", () => {
      // 1,00,000 is "One Lakh", not "Hundred Thousand"
      expect(amountInWords(100000)).toBe("One Lakh Only");
      // 10,00,000 is "Ten Lakh", not "One Million"
      expect(amountInWords(1000000)).toBe("Ten Lakh Only");
      // 1,00,00,000 is "One Crore", not "Ten Million"
      expect(amountInWords(10000000)).toBe("One Crore Only");
      // 1,00,00,00,000 is "One Hundred Crore", not "One Billion"
      expect(amountInWords(1000000000)).toBe("One Hundred Crore Only");
    });

    it('never emits "Million", "Billion" or "Thousand Thousand"', () => {
      for (const n of [
        100000, 1000000, 10000000, 12345678, 100000000, 1000000000, 9999999999,
      ]) {
        const result = amountInWords(n);
        expect(result).not.toMatch(/Million/i);
        expect(result).not.toMatch(/Billion/i);
        expect(result).not.toMatch(/Thousand Thousand/i);
      }
    });
  });

  describe("boundaries between tiers", () => {
    it("crosses hundreds -> thousands", () => {
      expect(amountInWords(999)).toBe("Nine Hundred Ninety Nine Only");
      expect(amountInWords(1000)).toBe("One Thousand Only");
    });

    it("crosses thousands -> lakh", () => {
      expect(amountInWords(99999)).toBe(
        "Ninety Nine Thousand Nine Hundred Ninety Nine Only"
      );
      expect(amountInWords(100000)).toBe("One Lakh Only");
    });

    it("crosses lakh -> crore", () => {
      expect(amountInWords(9999999)).toBe(
        "Ninety Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine Only"
      );
      expect(amountInWords(10000000)).toBe("One Crore Only");
    });
  });

  describe("very large amounts (>= 1000 crore)", () => {
    // Regression guard: previously the crore quotient could exceed 999 and
    // produced "undefined Hundred Crore Only".
    it.each([
      [10000000000, "One Thousand Crore Only"], // 1,000 crore
      [100000000000, "Ten Thousand Crore Only"], // 10,000 crore
      [1000000000000, "One Lakh Crore Only"], // 1,00,000 crore
      [10000000000000, "Ten Lakh Crore Only"], // 10,00,000 crore
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });

    it('never contains "undefined" or "NaN" for large values', () => {
      for (const n of [10000000000, 99999999999, 100000000000, 1000000000000]) {
        const result = amountInWords(n);
        expect(result).not.toMatch(/undefined/);
        expect(result).not.toMatch(/NaN/);
      }
    });
  });

  describe("negative amounts (rendered as absolute value)", () => {
    // The function uses Math.abs, so the sign is intentionally dropped — the
    // words match the equivalent positive amount.
    it.each([
      [-1, "One Only"],
      [-1500, "One Thousand Five Hundred Only"],
      [-100000, "One Lakh Only"],
      [-10000000, "One Crore Only"],
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });

    it("produces the same words for a value and its negation", () => {
      for (const n of [7, 250, 1500, 123456, 12345678]) {
        expect(amountInWords(-n)).toBe(amountInWords(n));
      }
    });
  });

  describe("decimal amounts (rounded to the nearest rupee)", () => {
    // Paise are not spelled out; the amount is rounded with Math.round before
    // conversion (e.g. 0.6 -> "One", 0.4 -> "Zero").
    it.each([
      [1234.56, "One Thousand Two Hundred Thirty Five Only"], // 1234.56 -> 1235
      [1500.5, "One Thousand Five Hundred One Only"], // .5 rounds up -> 1501
      [1500.49, "One Thousand Five Hundred Only"], // rounds down -> 1500
      [99.5, "One Hundred Only"], // 99.5 -> 100
      [0.6, "One Only"], // 0.6 -> 1
      [0.4, "Zero Only"], // 0.4 -> 0
      [-0.4, "Zero Only"], // -0.4 -> -0 -> 0
    ])("amountInWords(%p) -> %p", (input, expected) => {
      expect(amountInWords(input)).toBe(expected);
    });
  });

  describe("formatting invariants (swept across many values)", () => {
    const samples = [
      0, 1, 9, 10, 19, 20, 21, 99, 100, 101, 110, 999, 1000, 1500, 10000, 99999,
      100000, 100500, 101000, 150000, 1000000, 9999999, 10000000, 10000100,
      12345678, 99999999, 100000000, 1000000000, 9999999999, 10000000000,
      1000000000000,
    ];

    it.each(samples)(
      "amountInWords(%p) is well-formed (trimmed, single-spaced, suffixed)",
      (n) => {
        const result = amountInWords(n);
        expect(result.endsWith(" Only")).toBe(true);
        // no leading/trailing whitespace
        expect(result).toBe(result.trim());
        // no double spaces
        expect(result).not.toMatch(/ {2,}/);
        // no leaked placeholders from out-of-range array lookups
        expect(result).not.toMatch(/undefined|NaN/);
      }
    );
  });
});

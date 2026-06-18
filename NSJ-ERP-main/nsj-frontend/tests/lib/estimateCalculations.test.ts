/**
 * Unit tests for estimate calculation utilities
 * Tests the calculation functions for line items, totals, GST, and grand total
 */
import { describe, it, expect } from "vitest";
import {
  calculateLineAmount,
  calculateTotalTaxableValue,
  calculateGST,
  calculateGrandTotal,
  calculateEstimateTotals,
  type LineItem,
} from "@/lib/estimateCalculations";

describe("estimateCalculations", () => {
  describe("calculateLineAmount", () => {
    it("calculates amount correctly for valid weight and rate", () => {
      expect(calculateLineAmount(2.5, 1000)).toBe(2500);
      expect(calculateLineAmount(1.234, 500)).toBe(617);
      expect(calculateLineAmount(0.5, 2000)).toBe(1000);
    });

    it("rounds to 2 decimal places", () => {
      expect(calculateLineAmount(1.234, 1.567)).toBe(1.93);
      expect(calculateLineAmount(2.555, 3.333)).toBe(8.52);
    });

    it("handles null/undefined weight gracefully", () => {
      expect(calculateLineAmount(null, 1000)).toBe(0);
      expect(calculateLineAmount(undefined, 1000)).toBe(0);
    });

    it("handles null/undefined rate gracefully", () => {
      expect(calculateLineAmount(2.5, null)).toBe(0);
      expect(calculateLineAmount(2.5, undefined)).toBe(0);
    });

    it("handles both null/undefined gracefully", () => {
      expect(calculateLineAmount(null, null)).toBe(0);
      expect(calculateLineAmount(undefined, undefined)).toBe(0);
    });

    it("handles zero values", () => {
      expect(calculateLineAmount(0, 1000)).toBe(0);
      expect(calculateLineAmount(2.5, 0)).toBe(0);
      expect(calculateLineAmount(0, 0)).toBe(0);
    });

    it("handles invalid numbers (NaN, Infinity)", () => {
      expect(calculateLineAmount(NaN, 1000)).toBe(0);
      expect(calculateLineAmount(2.5, NaN)).toBe(0);
      expect(calculateLineAmount(Infinity, 1000)).toBe(0);
      expect(calculateLineAmount(2.5, Infinity)).toBe(0);
    });
  });

  describe("calculateTotalTaxableValue", () => {
    it("calculates total for multiple line items", () => {
      const lineItems: LineItem[] = [
        { particulars: "Item 1", amount: 1000 },
        { particulars: "Item 2", amount: 2500 },
        { particulars: "Item 3", amount: 500 },
      ];
      expect(calculateTotalTaxableValue(lineItems)).toBe(4000);
    });

    it("handles empty array", () => {
      expect(calculateTotalTaxableValue([])).toBe(0);
    });

    it("handles single line item", () => {
      const lineItems: LineItem[] = [
        { particulars: "Item 1", amount: 1234.56 },
      ];
      expect(calculateTotalTaxableValue(lineItems)).toBe(1234.56);
    });

    it("rounds to 2 decimal places", () => {
      const lineItems: LineItem[] = [
        { particulars: "Item 1", amount: 1.111 },
        { particulars: "Item 2", amount: 2.222 },
        { particulars: "Item 3", amount: 3.333 },
      ];
      expect(calculateTotalTaxableValue(lineItems)).toBe(6.67);
    });

    it("handles line items with zero amounts", () => {
      const lineItems: LineItem[] = [
        { particulars: "Item 1", amount: 1000 },
        { particulars: "Item 2", amount: 0 },
        { particulars: "Item 3", amount: 500 },
      ];
      expect(calculateTotalTaxableValue(lineItems)).toBe(1500);
    });
  });

  describe("calculateGST", () => {
    it("calculates 3% GST correctly", () => {
      expect(calculateGST(1000)).toBe(30);
      expect(calculateGST(5000)).toBe(150);
      expect(calculateGST(100)).toBe(3);
    });

    it("rounds to 2 decimal places", () => {
      expect(calculateGST(1234.56)).toBe(37.04);
      expect(calculateGST(999.99)).toBe(30);
    });

    it("handles null/undefined gracefully", () => {
      expect(calculateGST(null)).toBe(0);
      expect(calculateGST(undefined)).toBe(0);
    });

    it("handles zero value", () => {
      expect(calculateGST(0)).toBe(0);
    });

    it("handles invalid numbers", () => {
      expect(calculateGST(NaN)).toBe(0);
      expect(calculateGST(Infinity)).toBe(0);
    });
  });

  describe("calculateGrandTotal", () => {
    it("calculates grand total correctly", () => {
      expect(calculateGrandTotal(1000, 30)).toBe(1030);
      expect(calculateGrandTotal(5000, 150)).toBe(5150);
    });

    it("rounds to 2 decimal places", () => {
      expect(calculateGrandTotal(1234.567, 37.037)).toBe(1271.6);
    });

    it("handles null/undefined taxable value", () => {
      expect(calculateGrandTotal(null, 30)).toBe(30);
      expect(calculateGrandTotal(undefined, 30)).toBe(30);
    });

    it("handles null/undefined GST", () => {
      expect(calculateGrandTotal(1000, null)).toBe(1000);
      expect(calculateGrandTotal(1000, undefined)).toBe(1000);
    });

    it("handles both null/undefined", () => {
      expect(calculateGrandTotal(null, null)).toBe(0);
      expect(calculateGrandTotal(undefined, undefined)).toBe(0);
    });

    it("handles zero values", () => {
      expect(calculateGrandTotal(0, 0)).toBe(0);
      expect(calculateGrandTotal(1000, 0)).toBe(1000);
      expect(calculateGrandTotal(0, 30)).toBe(30);
    });

    it("handles invalid numbers", () => {
      expect(calculateGrandTotal(NaN, 30)).toBe(30);
      expect(calculateGrandTotal(1000, NaN)).toBe(1000);
      expect(calculateGrandTotal(Infinity, 30)).toBe(30);
      expect(calculateGrandTotal(1000, Infinity)).toBe(1000);
    });
  });

  describe("calculateEstimateTotals", () => {
    it("calculates all totals correctly in one go", () => {
      const lineItems: LineItem[] = [
        { particulars: "Diamond", amount: 10000 },
        { particulars: "Gold", amount: 5000 },
        { particulars: "Craftsmanship", amount: 2000 },
      ];

      const result = calculateEstimateTotals(lineItems);

      expect(result.totalTaxableValue).toBe(17000);
      expect(result.gst).toBe(510); // 3% of 17000
      expect(result.grandTotal).toBe(17510);
    });

    it("handles empty line items", () => {
      const result = calculateEstimateTotals([]);

      expect(result.totalTaxableValue).toBe(0);
      expect(result.gst).toBe(0);
      expect(result.grandTotal).toBe(0);
    });

    it("maintains precision through calculation chain", () => {
      const lineItems: LineItem[] = [
        { particulars: "Item 1", amount: 1234.56 },
        { particulars: "Item 2", amount: 789.12 },
      ];

      const result = calculateEstimateTotals(lineItems);

      expect(result.totalTaxableValue).toBe(2023.68);
      expect(result.gst).toBe(60.71); // 3% of 2023.68
      expect(result.grandTotal).toBe(2084.39);
    });
  });
});

import { describe, it, expect } from "vitest";

// Test validation logic for EstimateVoucherForm
describe("EstimateVoucherForm Validation", () => {
  // Helper function to simulate validation logic
  const validateLineItem = (item: {
    particulars: string;
    weight: number | null;
    rate: number | null;
    pc: number | null;
    amount: number;
  }) => {
    const errors: Record<string, string> = {};

    const hasWeightAndRate =
      item.weight !== null &&
      item.weight > 0 &&
      item.rate !== null &&
      item.rate > 0;
    const hasAmount = item.amount > 0;

    // Validate Particulars required if Weight and Rate provided
    if (hasWeightAndRate && !item.particulars.trim()) {
      errors.particulars =
        "Particulars field is required for line items with weight and rate";
    }

    // Validate numeric fields contain valid numbers
    if (item.weight !== null && (isNaN(item.weight) || item.weight < 0)) {
      errors.weight = "Weight must be a valid positive number";
    }

    if (item.rate !== null && (isNaN(item.rate) || item.rate < 0)) {
      errors.rate = "Rate must be a valid positive number";
    }

    if (item.pc !== null && (isNaN(item.pc) || item.pc < 0)) {
      errors.pc = "PC must be a valid positive number";
    }

    if (isNaN(item.amount) || item.amount < 0) {
      errors.amount = "Amount must be a valid positive number";
    }

    return errors;
  };

  describe("Particulars validation", () => {
    it("should require Particulars when Weight and Rate are provided", () => {
      const item = {
        particulars: "",
        weight: 10,
        rate: 100,
        pc: null,
        amount: 1000,
      };

      const errors = validateLineItem(item);
      expect(errors.particulars).toBe(
        "Particulars field is required for line items with weight and rate"
      );
    });

    it("should not require Particulars when Weight or Rate is missing", () => {
      const item1 = {
        particulars: "",
        weight: null,
        rate: 100,
        pc: null,
        amount: 0,
      };

      const item2 = {
        particulars: "",
        weight: 10,
        rate: null,
        pc: null,
        amount: 0,
      };

      const errors1 = validateLineItem(item1);
      const errors2 = validateLineItem(item2);

      expect(errors1.particulars).toBeUndefined();
      expect(errors2.particulars).toBeUndefined();
    });

    it("should allow Particulars with whitespace to be trimmed", () => {
      const item = {
        particulars: "   ",
        weight: 10,
        rate: 100,
        pc: null,
        amount: 1000,
      };

      const errors = validateLineItem(item);
      expect(errors.particulars).toBe(
        "Particulars field is required for line items with weight and rate"
      );
    });
  });

  describe("Numeric field validation", () => {
    it("should reject negative weight", () => {
      const item = {
        particulars: "Diamond",
        weight: -5,
        rate: 100,
        pc: null,
        amount: 0,
      };

      const errors = validateLineItem(item);
      expect(errors.weight).toBe("Weight must be a valid positive number");
    });

    it("should reject negative rate", () => {
      const item = {
        particulars: "Diamond",
        weight: 10,
        rate: -100,
        pc: null,
        amount: 0,
      };

      const errors = validateLineItem(item);
      expect(errors.rate).toBe("Rate must be a valid positive number");
    });

    it("should reject negative PC", () => {
      const item = {
        particulars: "Diamond",
        weight: 10,
        rate: 100,
        pc: -5,
        amount: 1000,
      };

      const errors = validateLineItem(item);
      expect(errors.pc).toBe("PC must be a valid positive number");
    });

    it("should reject negative amount", () => {
      const item = {
        particulars: "Diamond",
        weight: 10,
        rate: 100,
        pc: null,
        amount: -1000,
      };

      const errors = validateLineItem(item);
      expect(errors.amount).toBe("Amount must be a valid positive number");
    });

    it("should accept valid positive numbers", () => {
      const item = {
        particulars: "Diamond",
        weight: 10.5,
        rate: 100.25,
        pc: 5,
        amount: 1052.625,
      };

      const errors = validateLineItem(item);
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe("Flexible validation", () => {
    it("should allow Amount without Rate if provided", () => {
      const item = {
        particulars: "Craftsmanship Fee",
        weight: null,
        rate: null,
        pc: null,
        amount: 500,
      };

      const errors = validateLineItem(item);
      expect(Object.keys(errors).length).toBe(0);
    });

    it("should allow line items with only Particulars and Amount", () => {
      const item = {
        particulars: "Gold Weight",
        weight: null,
        rate: null,
        pc: null,
        amount: 1500,
      };

      const errors = validateLineItem(item);
      expect(Object.keys(errors).length).toBe(0);
    });
  });
});

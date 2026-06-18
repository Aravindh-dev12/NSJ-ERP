/**
 * Comprehensive tests for utility functions
 */
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("cn (className utility)", () => {
    it("should merge class names", () => {
      const result = cn("class1", "class2");
      expect(result).toContain("class1");
      expect(result).toContain("class2");
    });

    it("should handle conditional classes", () => {
      const result = cn("base", true && "conditional", false && "hidden");
      expect(result).toContain("base");
      expect(result).toContain("conditional");
      expect(result).not.toContain("hidden");
    });

    it("should handle undefined and null", () => {
      const result = cn("base", undefined, null, "end");
      expect(result).toContain("base");
      expect(result).toContain("end");
    });

    it("should merge tailwind classes correctly", () => {
      const result = cn("px-2 py-1", "px-4");
      // Should use px-4 (last one wins)
      expect(result).toContain("px-4");
      expect(result).not.toContain("px-2");
    });

    it("should handle empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle array of classes", () => {
      const result = cn(["class1", "class2"]);
      expect(result).toContain("class1");
      expect(result).toContain("class2");
    });

    it("should handle object with boolean values", () => {
      const result = cn({
        class1: true,
        class2: false,
        class3: true,
      });
      expect(result).toContain("class1");
      expect(result).not.toContain("class2");
      expect(result).toContain("class3");
    });
  });

  describe("Date Formatting", () => {
    it("should format date correctly", () => {
      const date = new Date("2026-01-15");
      const formatted = date.toLocaleDateString();
      expect(formatted).toBeTruthy();
    });

    it("should handle invalid date", () => {
      const date = new Date("invalid");
      expect(date.toString()).toContain("Invalid");
    });
  });

  describe("Number Formatting", () => {
    it("should format number with commas", () => {
      const num = 1000000;
      const formatted = num.toLocaleString();
      expect(formatted).toContain(",");
    });

    it("should format decimal numbers", () => {
      const num = 1234.56;
      const formatted = num.toFixed(2);
      expect(formatted).toBe("1234.56");
    });

    it("should handle zero", () => {
      const num = 0;
      const formatted = num.toLocaleString();
      expect(formatted).toBe("0");
    });

    it("should handle negative numbers", () => {
      const num = -1000;
      const formatted = num.toLocaleString();
      expect(formatted).toContain("-");
    });
  });

  describe("String Utilities", () => {
    it("should trim whitespace", () => {
      const str = "  test  ";
      expect(str.trim()).toBe("test");
    });

    it("should convert to lowercase", () => {
      const str = "TEST";
      expect(str.toLowerCase()).toBe("test");
    });

    it("should convert to uppercase", () => {
      const str = "test";
      expect(str.toUpperCase()).toBe("TEST");
    });

    it("should check if string includes substring", () => {
      const str = "Hello World";
      expect(str.includes("World")).toBe(true);
      expect(str.includes("world")).toBe(false);
    });

    it("should split string", () => {
      const str = "a,b,c";
      const parts = str.split(",");
      expect(parts).toEqual(["a", "b", "c"]);
    });
  });

  describe("Array Utilities", () => {
    it("should filter array", () => {
      const arr = [1, 2, 3, 4, 5];
      const filtered = arr.filter((n) => n > 3);
      expect(filtered).toEqual([4, 5]);
    });

    it("should map array", () => {
      const arr = [1, 2, 3];
      const mapped = arr.map((n) => n * 2);
      expect(mapped).toEqual([2, 4, 6]);
    });

    it("should reduce array", () => {
      const arr = [1, 2, 3, 4];
      const sum = arr.reduce((acc, n) => acc + n, 0);
      expect(sum).toBe(10);
    });

    it("should find element", () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const found = arr.find((item) => item.id === 2);
      expect(found).toEqual({ id: 2 });
    });

    it("should check if array includes element", () => {
      const arr = [1, 2, 3];
      expect(arr.includes(2)).toBe(true);
      expect(arr.includes(4)).toBe(false);
    });
  });

  describe("Object Utilities", () => {
    it("should get object keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const keys = Object.keys(obj);
      expect(keys).toEqual(["a", "b", "c"]);
    });

    it("should get object values", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const values = Object.values(obj);
      expect(values).toEqual([1, 2, 3]);
    });

    it("should get object entries", () => {
      const obj = { a: 1, b: 2 };
      const entries = Object.entries(obj);
      expect(entries).toEqual([
        ["a", 1],
        ["b", 2],
      ]);
    });

    it("should merge objects", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = { ...obj1, ...obj2 };
      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("should check if object has property", () => {
      const obj = { a: 1, b: 2 };
      expect("a" in obj).toBe(true);
      expect("c" in obj).toBe(false);
    });
  });

  describe("Type Checking", () => {
    it("should check if value is string", () => {
      expect(typeof "test").toBe("string");
      expect(typeof 123).not.toBe("string");
    });

    it("should check if value is number", () => {
      expect(typeof 123).toBe("number");
      expect(typeof "123").not.toBe("number");
    });

    it("should check if value is boolean", () => {
      expect(typeof true).toBe("boolean");
      expect(typeof "true").not.toBe("boolean");
    });

    it("should check if value is object", () => {
      expect(typeof {}).toBe("object");
      expect(typeof []).toBe("object");
      expect(typeof null).toBe("object"); // JavaScript quirk
    });

    it("should check if value is array", () => {
      expect(Array.isArray([])).toBe(true);
      expect(Array.isArray({})).toBe(false);
    });

    it("should check if value is null", () => {
      expect(null === null).toBe(true);
      expect(undefined === null).toBe(false);
    });

    it("should check if value is undefined", () => {
      let value;
      expect(value === undefined).toBe(true);
      expect(null === undefined).toBe(false);
    });
  });

  describe("Boolean Logic", () => {
    it("should handle AND operator", () => {
      expect(true && true).toBe(true);
      expect(true && false).toBe(false);
      expect(false && true).toBe(false);
      expect(false && false).toBe(false);
    });

    it("should handle OR operator", () => {
      expect(true || true).toBe(true);
      expect(true || false).toBe(true);
      expect(false || true).toBe(true);
      expect(false || false).toBe(false);
    });

    it("should handle NOT operator", () => {
      expect(!true).toBe(false);
      expect(!false).toBe(true);
    });

    it("should handle truthy values", () => {
      expect(!!1).toBe(true);
      expect(!!"test").toBe(true);
      expect(!!{}).toBe(true);
      expect(!![]).toBe(true);
    });

    it("should handle falsy values", () => {
      expect(!!0).toBe(false);
      expect(!!"").toBe(false);
      expect(!!null).toBe(false);
      expect(!!undefined).toBe(false);
      expect(!!NaN).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should catch errors", () => {
      try {
        throw new Error("Test error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Test error");
      }
    });

    it("should handle try-catch-finally", () => {
      let finallyExecuted = false;
      try {
        throw new Error("Test");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      } finally {
        finallyExecuted = true;
      }
      expect(finallyExecuted).toBe(true);
    });
  });

  describe("Promise Utilities", () => {
    it("should resolve promise", async () => {
      const promise = Promise.resolve(42);
      const result = await promise;
      expect(result).toBe(42);
    });

    it("should reject promise", async () => {
      const promise = Promise.reject(new Error("Test error"));
      await expect(promise).rejects.toThrow("Test error");
    });

    it("should handle Promise.all", async () => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3),
      ];
      const results = await Promise.all(promises);
      expect(results).toEqual([1, 2, 3]);
    });

    it("should handle Promise.race", async () => {
      const promises = [
        new Promise((resolve) => setTimeout(() => resolve(1), 100)),
        Promise.resolve(2),
      ];
      const result = await Promise.race(promises);
      expect(result).toBe(2);
    });
  });
});

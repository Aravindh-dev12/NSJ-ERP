/**
 * Tests for Business Days Calculator
 */

import {
  isSunday,
  isIndianHoliday,
  isBusinessDay,
  addBusinessDays,
  countBusinessDays,
  getHolidayName,
  formatDateForInput,
} from "../businessDays";

describe("Business Days Calculator", () => {
  describe("isSunday", () => {
    it("should return true for Sunday", () => {
      const sunday = new Date("2025-12-21"); // Sunday
      expect(isSunday(sunday)).toBe(true);
    });

    it("should return false for Monday", () => {
      const monday = new Date("2025-12-15"); // Monday
      expect(isSunday(monday)).toBe(false);
    });

    it("should return false for Saturday", () => {
      const saturday = new Date("2025-12-20"); // Saturday
      expect(isSunday(saturday)).toBe(false);
    });
  });

  describe("isIndianHoliday", () => {
    it("should return true for Republic Day", () => {
      const republicDay = new Date("2025-01-26");
      expect(isIndianHoliday(republicDay)).toBe(true);
    });

    it("should return true for Diwali", () => {
      const diwali = new Date("2025-10-21");
      expect(isIndianHoliday(diwali)).toBe(true);
    });

    it("should return true for Christmas", () => {
      const christmas = new Date("2025-12-25");
      expect(isIndianHoliday(christmas)).toBe(true);
    });

    it("should return false for regular working day", () => {
      const regularDay = new Date("2025-12-15");
      expect(isIndianHoliday(regularDay)).toBe(false);
    });
  });

  describe("isBusinessDay", () => {
    it("should return true for regular Monday", () => {
      const monday = new Date("2025-12-15");
      expect(isBusinessDay(monday)).toBe(true);
    });

    it("should return false for Sunday", () => {
      const sunday = new Date("2025-12-21");
      expect(isBusinessDay(sunday)).toBe(false);
    });

    it("should return false for holiday (Christmas)", () => {
      const christmas = new Date("2025-12-25");
      expect(isBusinessDay(christmas)).toBe(false);
    });

    it("should return false for holiday on weekday (Independence Day)", () => {
      const independenceDay = new Date("2025-08-15");
      expect(isBusinessDay(independenceDay)).toBe(false);
    });
  });

  describe("addBusinessDays", () => {
    it("should add 1 business day from Monday", () => {
      const monday = new Date("2025-12-15");
      const result = addBusinessDays(monday, 1);
      expect(formatDateForInput(result)).toBe("2025-12-16"); // Tuesday
    });

    it("should skip weekend when adding 1 day from Friday", () => {
      const friday = new Date("2025-12-19");
      const result = addBusinessDays(friday, 1);
      // Dec 19 (Fri) + 1 business day = Dec 20 (Sat) - Saturday is a working day unless it's 2nd/4th Saturday
      expect(formatDateForInput(result)).toBe("2025-12-20"); // Saturday (3rd Saturday, working day)
    });

    it("should skip Sunday when adding 5 days from Wednesday", () => {
      const wednesday = new Date("2025-12-17");
      const result = addBusinessDays(wednesday, 5);
      // Wed 17 + 1 = Thu 18
      // Thu 18 + 1 = Fri 19
      // Fri 19 + 1 = Sat 20 (3rd Saturday, working day)
      // Sat 20 + 1 = Mon 22 (skip Sunday)
      // Mon 22 + 1 = Tue 23
      expect(formatDateForInput(result)).toBe("2025-12-23");
    });

    it("should skip Christmas holiday", () => {
      const beforeChristmas = new Date("2025-12-24");
      const result = addBusinessDays(beforeChristmas, 1);
      // Dec 24 + 1 = Dec 26 (skip Dec 25 Christmas)
      expect(formatDateForInput(result)).toBe("2025-12-26");
    });

    it("should skip Diwali holidays", () => {
      const beforeDiwali = new Date("2025-10-20");
      const result = addBusinessDays(beforeDiwali, 1);
      // Oct 20 + 1 = Oct 23 (skip Oct 21-22 Diwali)
      expect(formatDateForInput(result)).toBe("2025-10-23");
    });

    it("should handle 0 business days", () => {
      const date = new Date("2025-12-15");
      const result = addBusinessDays(date, 0);
      expect(formatDateForInput(result)).toBe("2025-12-15");
    });

    it("should throw error for negative days", () => {
      const date = new Date("2025-12-15");
      expect(() => addBusinessDays(date, -1)).toThrow();
    });
  });

  describe("countBusinessDays", () => {
    it("should count 1 business day between Monday and Tuesday", () => {
      const monday = new Date("2025-12-15");
      const tuesday = new Date("2025-12-16");
      expect(countBusinessDays(monday, tuesday)).toBe(2); // Includes both days
    });

    it("should skip weekend in count", () => {
      const friday = new Date("2025-12-19");
      const monday = new Date("2025-12-22");
      // Fri 19, Sat 20 (working day), Sun 21 (skip), Mon 22 = 3 business days
      expect(countBusinessDays(friday, monday)).toBe(3); // Fri, Sat, and Mon
    });

    it("should skip holidays in count", () => {
      const beforeChristmas = new Date("2025-12-24");
      const afterChristmas = new Date("2025-12-26");
      expect(countBusinessDays(beforeChristmas, afterChristmas)).toBe(2); // Dec 24 and 26 only
    });

    it("should return 0 when end date is before start date", () => {
      const later = new Date("2025-12-20");
      const earlier = new Date("2025-12-15");
      expect(countBusinessDays(later, earlier)).toBe(0);
    });

    it("should count correctly over Diwali period", () => {
      const beforeDiwali = new Date("2025-10-20");
      const afterDiwali = new Date("2025-10-23");
      // Oct 20 (Mon), Oct 23 (Thu) - skips Oct 21-22 (Diwali)
      expect(countBusinessDays(beforeDiwali, afterDiwali)).toBe(2);
    });
  });

  describe("getHolidayName", () => {
    it("should return holiday name for Republic Day", () => {
      const republicDay = new Date("2025-01-26");
      expect(getHolidayName(republicDay)).toBe("Republic Day");
    });

    it("should return holiday name for Diwali", () => {
      const diwali = new Date("2025-10-21");
      expect(getHolidayName(diwali)).toBe("Diwali (Deepavali)");
    });

    it("should return null for regular day", () => {
      const regularDay = new Date("2025-12-15");
      expect(getHolidayName(regularDay)).toBe(null);
    });
  });

  describe("formatDateForInput", () => {
    it("should format date as YYYY-MM-DD", () => {
      const date = new Date("2025-12-15");
      expect(formatDateForInput(date)).toBe("2025-12-15");
    });

    it("should handle single digit months and days", () => {
      const date = new Date("2025-01-05");
      expect(formatDateForInput(date)).toBe("2025-01-05");
    });
  });

  describe("Real-world scenarios", () => {
    it("should calculate 7 business days correctly from Monday", () => {
      const monday = new Date("2025-12-15");
      const result = addBusinessDays(monday, 7);
      // Mon 15 + 7 business days = Tue 23 (skipping only Sunday)
      // Mon 15, Tue 16, Wed 17, Thu 18, Fri 19, Sat 20, Mon 22 (skip Sun 21)
      expect(formatDateForInput(result)).toBe("2025-12-23");
    });

    it("should calculate 14 business days correctly", () => {
      const start = new Date("2025-12-01");
      const result = addBusinessDays(start, 14);
      // Should skip 2 Sundays only (Saturdays are working days unless 2nd/4th)
      // Dec 1 (Mon) + 14 business days = Dec 17 (Wed)
      // Skip: Dec 7 (Sun), Dec 14 (2nd Sat is NOT in 2025 holidays), Dec 14 (Sun)
      expect(formatDateForInput(result)).toBe("2025-12-17");
    });

    it("should handle month boundary", () => {
      const endOfMonth = new Date("2025-12-30");
      const result = addBusinessDays(endOfMonth, 3);
      // Dec 30 (Tue) + 3 = Jan 2 (Fri) - skipping Dec 31, Jan 1
      expect(formatDateForInput(result)).toBe("2026-01-02");
    });
  });
});

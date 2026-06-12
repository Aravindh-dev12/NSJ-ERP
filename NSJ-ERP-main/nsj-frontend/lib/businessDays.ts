/**
 * Business Days Calculator for India
 * Skips Sundays and Indian public/bank holidays
 */

// Indian Public/Bank Holidays for 2025-2026
// Update this list annually
// Includes: National holidays, religious festivals, and bank holidays (2nd & 4th Saturdays)
export const INDIAN_HOLIDAYS_2025_2026: Record<string, string> = {
  // 2025
  "2025-01-26": "Republic Day",
  "2025-03-14": "Holi",
  "2025-03-31": "Id-ul-Fitr (Ramadan Eid)",
  "2025-04-10": "Mahavir Jayanti",
  "2025-04-14": "Ambedkar Jayanti / Tamil New Year",
  "2025-04-18": "Good Friday",
  "2025-05-01": "May Day",
  "2025-05-12": "Buddha Purnima",
  "2025-06-07": "Id-ul-Zuha (Bakrid)",
  "2025-07-06": "Muharram",
  "2025-08-15": "Independence Day",
  "2025-08-16": "Parsi New Year",
  "2025-08-27": "Janmashtami",
  "2025-09-05": "Milad-un-Nabi",
  "2025-10-02": "Gandhi Jayanti / Mahatma Gandhi's Birthday/Dussehra",
  "2025-10-21": "Diwali (Deepavali)",
  "2025-10-22": "Diwali (Deepavali) - Day 2",
  "2025-11-05": "Guru Nanak Jayanti",
  "2025-12-25": "Christmas",

  // 2026 - Complete Bank Holiday List
  // Second Saturdays
  "2026-01-10": "Second Saturday",
  "2026-02-14": "Second Saturday",
  "2026-03-14": "Second Saturday",
  "2026-04-11": "Second Saturday",
  "2026-05-09": "Second Saturday",
  "2026-06-13": "Second Saturday",
  "2026-07-11": "Second Saturday",
  "2026-08-08": "Second Saturday",
  "2026-09-12": "Second Saturday",
  "2026-10-10": "Second Saturday",
  "2026-11-14": "Second Saturday",
  "2026-12-12": "Second Saturday",

  // Fourth Saturdays
  "2026-01-24": "Fourth Saturday",
  "2026-02-28": "Fourth Saturday",
  "2026-03-28": "Fourth Saturday",
  "2026-04-25": "Fourth Saturday",
  "2026-05-23": "Fourth Saturday",
  "2026-06-27": "Fourth Saturday",
  "2026-07-25": "Fourth Saturday",
  "2026-08-22": "Fourth Saturday",
  "2026-09-26": "Fourth Saturday",
  "2026-10-24": "Fourth Saturday",
  "2026-11-28": "Fourth Saturday",
  "2026-12-26": "Fourth Saturday",

  // National & Religious Holidays 2026
  "2026-01-26": "Republic Day",
  "2026-02-15": "Maha Shivaratri",
  "2026-03-03": "Holi",
  "2026-03-21": "Idul Fitr",
  "2026-03-27": "Ram Navami",
  "2026-03-31": "Mahavir Jayanti",
  "2026-04-03": "Good Friday",
  "2026-04-14": "Dr Ambedkar Jayanti",
  "2026-05-01": "Buddha Purnima",
  "2026-05-27": "Bakrid / Eid al Adha",
  "2026-06-26": "Muharram",
  "2026-08-15": "Independence Day",
  "2026-08-16": "Parsi New Year",
  "2026-08-25": "Eid e Milad",
  "2026-09-15": "Ganesh Chaturthi",
  "2026-10-02": "Gandhi Jayanti",
  "2026-10-21": "Vijaya Dashami",
  "2026-11-08": "Diwali",
  "2026-11-09": "Deepavali Holiday",
  "2026-11-24": "Guru Nanak Jayanti",
  "2026-12-25": "Christmas Day",
};

/**
 * Check if a date is a Sunday
 */
export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

/**
 * Check if a date is an Indian public/bank holiday
 */
export function isIndianHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return dateStr in INDIAN_HOLIDAYS_2025_2026;
}

/**
 * Check if a date is a business day (not Sunday, not holiday)
 */
export function isBusinessDay(date: Date): boolean {
  return !isSunday(date) && !isIndianHoliday(date);
}

/**
 * Add business days to a date (skipping Sundays and Indian holidays)
 * @param startDate - The starting date
 * @param businessDays - Number of business days to add
 * @returns The resulting date after adding business days
 */
export function addBusinessDays(startDate: Date, businessDays: number): Date {
  if (businessDays < 0) {
    throw new Error("Business days must be a positive number");
  }

  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);

    // Only count if it's a business day
    if (isBusinessDay(result)) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Calculate the number of business days between two dates
 * @param startDate - The starting date
 * @param endDate - The ending date
 * @returns Number of business days between the dates
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  if (endDate < startDate) {
    return 0;
  }

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Get the holiday name for a given date (if it's a holiday)
 */
export function getHolidayName(date: Date): string | null {
  const dateStr = date.toISOString().split("T")[0];
  return INDIAN_HOLIDAYS_2025_2026[dateStr] || null;
}

/**
 * Format a date as YYYY-MM-DD for input fields
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

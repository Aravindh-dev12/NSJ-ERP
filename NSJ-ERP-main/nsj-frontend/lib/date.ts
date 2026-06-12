/**
 * Timezone-safe date utilities
 * These functions use local date components instead of UTC conversion
 * to avoid timezone shifts for users in IST and other non-UTC timezones
 */

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 */
export const getLocalToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Get first day of current month in YYYY-MM-DD format using local timezone
 */
export const getLocalFirstOfMonth = (): string => {
  const d = new Date();
  d.setDate(1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Get a date in YYYY-MM-DD format using local timezone
 * @param date - Date object to format
 */
export const formatLocalDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

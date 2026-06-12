/**
 * Estimate Voucher Calculation Utilities
 *
 * This module provides calculation functions for estimate vouchers,
 * including line item amounts, totals, GST, and grand totals.
 */

/**
 * Line Item interface for calculations
 */
export interface LineItem {
  id?: string;
  particulars: string;
  shape?: string;
  colour?: string;
  clarity?: string;
  pc?: number | null;
  weight?: number | null;
  unit?: "CT" | "GM" | "";
  rate?: number | null;
  amount: number;
}

/**
 * Calculate the amount for a line item based on weight and rate.
 * Amount = Weight × Rate, rounded to 2 decimal places.
 *
 * @param weight - The weight value (can be null/undefined)
 * @param rate - The rate value (can be null/undefined)
 * @returns The calculated amount rounded to 2 decimal places, or 0 if inputs are invalid
 *
 * Requirements: 2.1
 */
export function calculateLineAmount(
  weight: number | null | undefined,
  rate: number | null | undefined
): number {
  // Handle null/undefined inputs gracefully
  if (weight == null || rate == null) {
    return 0;
  }

  // Handle invalid numbers (NaN, Infinity)
  if (!isFinite(weight) || !isFinite(rate)) {
    return 0;
  }

  // Calculate amount and round to 2 decimal places
  const amount = weight * rate;
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate the total taxable value by summing all line item amounts.
 *
 * @param lineItems - Array of line items
 * @returns The sum of all line item amounts, rounded to 2 decimal places
 *
 * Requirements: 2.3
 */
export function calculateTotalTaxableValue(lineItems: LineItem[]): number {
  // Handle empty or invalid array
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return 0;
  }

  // Sum all line item amounts
  const total = lineItems.reduce((sum, item) => {
    const amount = item.amount ?? 0;
    // Ensure amount is a valid number
    return sum + (isFinite(amount) ? amount : 0);
  }, 0);

  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}

/**
 * Calculate GST at 3% of the total taxable value.
 *
 * @param totalTaxableValue - The total taxable value
 * @returns GST amount (3% of total), rounded to 2 decimal places
 *
 * Requirements: 2.4
 */
export function calculateGST(
  totalTaxableValue: number | null | undefined
): number {
  // Handle null/undefined inputs
  if (totalTaxableValue == null) {
    return 0;
  }

  // Handle invalid numbers
  if (!isFinite(totalTaxableValue)) {
    return 0;
  }

  // Calculate 3% GST
  const gst = totalTaxableValue * 0.03;

  // Round to 2 decimal places
  return Math.round(gst * 100) / 100;
}

/**
 * Calculate the grand total by adding total taxable value and GST.
 *
 * @param totalTaxableValue - The total taxable value
 * @param gst - The GST amount
 * @returns Grand total (total + GST), rounded to 2 decimal places
 *
 * Requirements: 2.5
 */
export function calculateGrandTotal(
  totalTaxableValue: number | null | undefined,
  gst: number | null | undefined
): number {
  // Handle null/undefined inputs and invalid numbers
  const taxableValue =
    totalTaxableValue != null && isFinite(totalTaxableValue)
      ? totalTaxableValue
      : 0;
  const gstAmount = gst != null && isFinite(gst) ? gst : 0;

  // Calculate grand total
  const grandTotal = taxableValue + gstAmount;

  // Round to 2 decimal places
  return Math.round(grandTotal * 100) / 100;
}

/**
 * Calculate all totals for an estimate in one go.
 * This is a convenience function that combines all calculation steps.
 *
 * @param lineItems - Array of line items
 * @returns Object containing totalTaxableValue, gst, and grandTotal
 */
export function calculateEstimateTotals(lineItems: LineItem[]): {
  totalTaxableValue: number;
  gst: number;
  grandTotal: number;
} {
  const totalTaxableValue = calculateTotalTaxableValue(lineItems);
  const gst = calculateGST(totalTaxableValue);
  const grandTotal = calculateGrandTotal(totalTaxableValue, gst);

  return {
    totalTaxableValue,
    gst,
    grandTotal,
  };
}

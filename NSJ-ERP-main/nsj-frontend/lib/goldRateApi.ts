/**
 * Gold Rate API Client
 * Handles all API calls related to gold rate management
 */

import { api } from "./api";

export interface DailyGoldRate {
  id: string;
  rate_date: string;
  rate_type: "OPENING" | "INTERMEDIATE" | "CLOSING";
  gold_24k_999: string;
  gold_24k_995: string;
  gold_22k: string;
  gold_18k: string;
  gold_14k: string;
  silver_rate: string | null;
  is_locked: boolean;
  entered_by: string;
  entered_by_name: string;
  entered_at: string;
  last_modified_by: string | null;
  last_modified_by_name: string | null;
  last_modified_at: string | null;
  correction_notes: string | null;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoldRateChangeLog {
  id: string;
  action: "CREATE" | "UPDATE" | "LOCK" | "OVERRIDE";
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_by_name: string;
  changed_at: string;
  notes: string | null;
  ip_address: string | null;
}

export interface GoldRateSummary {
  rate_date: string;
  has_opening_rate: boolean;
  has_closing_rate: boolean;
  intermediate_count: number;
  opening_rate: DailyGoldRate | null;
  closing_rate: DailyGoldRate | null;
  intermediate_rates: DailyGoldRate[];
  current_active_rate: DailyGoldRate | null;
}

export interface CreateGoldRateRequest {
  rate_date: string;
  rate_type: "OPENING" | "INTERMEDIATE" | "CLOSING";
  gold_24k_999: string;
  gold_24k_995: string;
  silver_rate?: string;
}

export interface UpdateGoldRateRequest {
  gold_24k_999?: string;
  gold_24k_995?: string;
  silver_rate?: string;
  correction_notes?: string;
}

export interface GoldRatePopupStatus {
  show_popup: boolean;
  gold_rate_missing: boolean;
  can_enter_rate: boolean;
  can_skip_popup: boolean;
  must_enter: boolean;
  date: string;
  today_rates: DailyGoldRate[] | null;
  user_info: {
    username: string;
    is_admin: boolean;
    can_enter_gold_rate: boolean;
    role: "admin" | "accountant" | "user";
  };
}

export interface ValidateWorkflowRequest {
  workflow_type: string;
  allow_draft: boolean;
}

export interface ValidateWorkflowResponse {
  can_proceed: boolean;
  can_save_draft: boolean;
  can_skip: boolean;
  reason: string;
  message: string;
  gold_rate_required: boolean;
  date: string;
}

/**
 * Get all gold rates with optional filters
 */
export async function getGoldRates(params?: {
  date?: string;
  type?: string;
}): Promise<DailyGoldRate[]> {
  const queryParams = new URLSearchParams();
  if (params?.date) queryParams.append("date", params.date);
  if (params?.type) queryParams.append("type", params.type);

  const url = `/masters/gold-rates/${queryParams.toString() ? `?${queryParams}` : ""}`;
  return api.get<DailyGoldRate[]>(url);
}

/**
 * Create a new gold rate
 */
export async function createGoldRate(
  data: CreateGoldRateRequest
): Promise<DailyGoldRate> {
  return api.post<DailyGoldRate>("/masters/gold-rates/", data);
}

/**
 * Get today's gold rates
 */
export async function getTodayRates(): Promise<{
  date: string;
  rates: DailyGoldRate[];
  count: number;
}> {
  return api.get("/masters/gold-rates/today/");
}

/**
 * Get currently active gold rate
 */
export async function getActiveRate(): Promise<
  DailyGoldRate & { is_previous_day?: boolean; message?: string }
> {
  return api.get("/masters/gold-rates/active/");
}

/**
 * Get daily summary for a specific date
 */
export async function getDailySummary(date?: string): Promise<GoldRateSummary> {
  const url = date
    ? `/masters/gold-rates/summary/?date=${date}`
    : "/masters/gold-rates/summary/";
  return api.get(url);
}

/**
 * Check if gold rate entry is required
 */
export async function checkRateRequired(): Promise<{
  required: boolean;
  can_skip: boolean;
  can_enter: boolean;
  reason: string;
  date?: string;
  message?: string;
  user_role?: "admin" | "accountant" | "user";
}> {
  return api.get("/core/gold-rates/check_required/");
}

/**
 * Get popup status for dashboard
 */
export async function getPopupStatus(): Promise<GoldRatePopupStatus> {
  return api.get("/core/gold-rates/popup_status/");
}

/**
 * Validate workflow progression
 */
export async function validateWorkflow(
  data: ValidateWorkflowRequest
): Promise<ValidateWorkflowResponse> {
  return api.post<ValidateWorkflowResponse>(
    "/core/gold-rates/validate_workflow/",
    data
  );
}

/**
 * Get change logs for a specific gold rate
 */
export async function getGoldRateLogs(rateId: string): Promise<{
  gold_rate_id: string;
  rate_date: string;
  rate_type: string;
  logs: GoldRateChangeLog[];
  total_changes: number;
}> {
  return api.get(`/masters/gold-rates/${rateId}/logs/`);
}

/**
 * Get gold rate history
 */
export async function getGoldRateHistory(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{
  start_date: string;
  end_date: string;
  rates_by_date: Record<string, DailyGoldRate[]>;
  total_entries: number;
}> {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);

  const url = `/masters/gold-rates/history/${queryParams.toString() ? `?${queryParams}` : ""}`;
  return api.get(url);
}

/**
 * Update a gold rate (admin override)
 */
export async function updateGoldRate(
  rateId: string,
  data: UpdateGoldRateRequest
): Promise<DailyGoldRate> {
  return api.patch<DailyGoldRate>(`/masters/gold-rates/${rateId}/`, data);
}

/**
 * Format gold rate for display
 */
export function formatGoldRate(rate: string | number): string {
  const num = typeof rate === "string" ? parseFloat(rate) : rate;
  return `₹${num.toFixed(2)}`;
}

/**
 * Calculate derived rates
 */
export function calculateDerivedRates(gold24k999: string) {
  const base = parseFloat(gold24k999);
  return {
    gold_22k: (base * 0.91).toFixed(2),
    gold_18k: (base * 0.75).toFixed(2),
    gold_14k: (base * 0.6).toFixed(2),
  };
}

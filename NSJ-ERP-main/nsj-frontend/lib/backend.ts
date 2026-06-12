import {
  api,
  apiFetch,
  ApiError,
  clearAuthToken,
  fetchWithAuth,
  getAuthToken,
  setAuthToken,
} from "./api";
import { API_BASE_URL, API_ENDPOINTS } from "./constants";
import type { EstimateVoucher } from "@/components/vouchers/EstimateVoucherForm";

type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | null | undefined | QueryPrimitive[];

export function withQuery(
  path: string,
  params?: Record<string, QueryValue>
): string {
  if (!params) return path;
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      value
        .filter((item) => item !== null && item !== undefined && item !== "")
        .forEach((item) => search.append(key, String(item)));
      continue;
    }
    search.append(key, String(value));
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function createUploadFormData(
  file: Blob | File,
  fieldName = "file",
  fallbackName = "upload.csv"
): FormData {
  const formData = new FormData();
  const FileCtor: typeof File | undefined =
    typeof File !== "undefined" ? File : undefined;
  const hasName = typeof (file as File).name === "string";

  if (FileCtor && !(file instanceof FileCtor)) {
    const inferredName = hasName ? (file as File).name : fallbackName;
    const constructed = new FileCtor([file], inferredName || fallbackName, {
      type: (file as Blob).type || "application/octet-stream",
    });
    formData.append(fieldName, constructed);
    return formData;
  }

  if (file instanceof Blob && !hasName) {
    formData.append(fieldName, file, fallbackName);
  } else {
    formData.append(fieldName, file as File);
  }

  return formData;
}

export function parseFileNameFromDisposition(
  disposition: string | null | undefined
): string | undefined {
  if (!disposition) return undefined;
  // RFC5987 style: filename*=charset''encoded
  const starMatch = disposition.match(/filename\*\s*=\s*([^;]+)/i);
  if (starMatch && starMatch[1]) {
    let raw = starMatch[1].trim();
    // remove surrounding quotes if present
    raw = raw.replace(/^"|"$/g, "");
    const parts = raw.split("''");
    // parts[0] = charset, rest = encoded (may contain additional '' if weird)
    const encoded = parts.length > 1 ? parts.slice(1).join("''") : parts[0];
    try {
      return decodeURIComponent(encoded);
    } catch {
      // Fallback: return the percent-encoded portion (without the charset prefix)
      return encoded;
    }
  }

  // Quoted filename may contain semicolons; prefer quoted match first
  const quotedMatch = disposition.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1];
  }

  // Unquoted filename (until semicolon or end)
  const plainMatch = disposition.match(/filename\s*=\s*([^;\s]+)/i);
  if (plainMatch && plainMatch[1]) {
    return plainMatch[1].trim().replace(/^"|"$/g, "");
  }

  return undefined;
}

export type Identifier = string | number;

export type Company = {
  id: string;
  name: string;
  display_name?: string;
  is_active: boolean;
  created_at: string;
  [key: string]: unknown;
};

export type User = {
  id: Identifier;
  email: string;
  name?: string;
  [key: string]: unknown;
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
  department: string;
  is_active: boolean;
  plain_password: string;
  created_at: string;
};

export type ManagedUserPayload = {
  name: string;
  email: string;
  password?: string;
  department: string;
  role?: string;
  is_active?: boolean;
};

export async function usersList(): Promise<ManagedUser[]> {
  const data = await api.get<{ results: ManagedUser[] }>("/users/");
  return data.results ?? [];
}

export async function userCreate(
  payload: ManagedUserPayload
): Promise<ManagedUser> {
  return api.post<ManagedUser>("/users/", payload);
}

export async function userUpdate(
  id: string,
  payload: Partial<ManagedUserPayload>
): Promise<ManagedUser> {
  return api.patch<ManagedUser>(`/users/${id}/`, payload);
}

export async function userDelete(id: string): Promise<void> {
  await api.delete<void>(`/users/${id}/`);
}

export async function activeUsersList(
  department?: string
): Promise<{ id: string; name: string; email: string; department: string }[]> {
  const params = department ? `?department=${department}` : "";
  return api.get<
    { id: string; name: string; email: string; department: string }[]
  >(`/users/active/${params}`);
}

export type Template = {
  id: Identifier;
  name: string;
  content?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type Vendor = {
  id: Identifier;
  name: string;
  email?: string;
  whatsapp_number?: string;
  default_template_id?: Identifier | null;
  [key: string]: unknown;
};

export type Invoice = {
  id: Identifier;
  invoice_number?: string;
  vendor_id?: Identifier;
  payment_amount?: number;
  invoice_date?: string;
  status?: string;
  [key: string]: unknown;
};

export type Reminder = {
  id: Identifier;
  invoice_id: Identifier;
  template_id?: Identifier | null;
  message_content?: string;
  [key: string]: unknown;
};

export type SalesRecordValue = string | number | boolean | null | undefined;
export type SalesRecord = Record<string, SalesRecordValue>;

export type SalesRankingEntry = Record<string, SalesRecordValue> & {
  total_sales?: SalesRecordValue;
  value?: SalesRecordValue;
  total?: SalesRecordValue;
};

type NumericLike = string | number | null | undefined;

export type SalesRecordAggregates = {
  total_sales?: NumericLike;
  total_orders?: NumericLike;
  total_quantity?: NumericLike;
  average_order_value?: NumericLike;
  latest_month_label?: string | null;
  by_vendor?: SalesRankingEntry[];
  top_vendors_by_sales?: SalesRankingEntry[];
  by_category?: SalesRankingEntry[];
  top_products_by_sales?: SalesRankingEntry[];
  top_cat_no_by_sales?: SalesRankingEntry[];
  [key: string]: unknown;
};

export type AccountReference = {
  id: string;
  name?: string | null;
  code?: string | null;
};

export type AccountContact = {
  address_line?: string | null;
  city?: AccountReference | null;
  state?: AccountReference | null;
  country?: AccountReference | null;
  pin_code?: string | null;
  phone?: string | null;
  mobile_ccode?: string | null;
  mobile?: string | null;
  email?: string | null;
};

export type AccountBank = {
  bank_name?: string | null;
  branch?: string | null;
  ifsc?: string | null;
  account_number?: string | null;
  upi_id?: string | null;
};

export type AccountTax = {
  gstin?: string | null;
  pan?: string | null;
  tan?: string | null;
  tcs?: string | null;
  tds?: string | null;
  hm_no?: string | null;
  cst_no?: string | null;
};

export type AccountOpeningBalance = {
  balance_date?: string | null;
  gold_fine?: string | null;
  gold_drcr?: string | null;
  silver_fine?: string | null;
  silver_drcr?: string | null;
  amount?: string | null;
  amount_drcr?: string | null;
  profit_pct?: string | null;
};

export type Account = {
  id: string;
  company?: string | null;
  branch?: AccountReference | null;
  account_no?: string | null;
  account_name?: string | null;
  ledger_role?: string | null;
  group_code?: string | null;
  spark_account_group?: ACGroupMaster | null;
  tally_parent_group?: string | null;
  financial_statement?: string | null;
  normal_balance?: string | null;
  party_category?: string | null;
  gst_registration_type?: string | null;
  bill_wise_required?: string | null;
  cost_centre_required?: string | null;
  export_to_tally?: string | null;
  status?: string | null;
  tally_ledger_name_override?: string | null;
  team_notice?: string | null;
  validation_status?: string | null;
  location?: AccountReference | null;
  remarks?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  contact?: AccountContact | null;
  bank?: AccountBank | null;
  tax?: AccountTax | null;
  opening_balance?: AccountOpeningBalance | null;
};

export type Voucher = {
  id: string;
  voucher_number?: string | null;
  bill_no?: string | null;
  date?: string | null;
  item_name?: string | null;
  account?: Account | string | null;
  advance_payment_received?: number | null;
  amount?: number | null;
  status?: string | null;
  tag_no?: string | null;
  order_no?: string | null;
  unit?: string | null;
  net_wt?: number | string | null;
  upload_file?: string | null;
  stamp?: string | null;
  size?: string | null;
  [key: string]: unknown;
};

export type QueryResponse = {
  id: string;
  account?: {
    id: string;
    account_name: string;
    name: string;
  } | null;
  subaccount?: string | null;
  item_name?: {
    id: string;
    name: string;
  } | null;
  item_name_custom?: string | null;
  gold_carat: string;
  gender?: string | null;
  size: string;
  location?: string | null;
  delivery_type?: string | null;
  query_in_date: string;
  expiry_date?: string | null;
  reference_image?: string | null;
  linked_estimate_id?: string | null;
  status: "pending" | "converted_to_order" | "archived" | "rejected";
  is_expired: boolean;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
};

export type ReceiptResponse = {
  id: string;
  type?: "Cr" | "Dr" | null;
  party_name?: {
    id: string;
    account_name: string;
    name: string;
  } | null;
  balance?: number | null;
  dr?: number | null;
  cr?: number | null;
  narration?: string | null;
  date?: string | null;
  created_at: string;
  updated_at: string;
};

export type QueryListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: QueryResponse[];
};

export type VouchersListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Voucher[];
};

export type AccountsListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Account[];
};

export type AccountsQueryParams = {
  page?: number;
  page_size?: number;
  search?: string;
  group?: string;
  status?: string;
};

export type AccountsMastersBranch = {
  id: string;
  name: string;
  code?: string | null;
};

export type AccountsMastersLocation = {
  id: string;
  name: string;
};

export type AccountsMastersState = {
  id: string;
  name: string;
  code?: string | null;
  country_id?: string | null;
};

export type AccountsMastersCity = {
  id: string;
  name: string;
  code?: string | null;
  state_id?: string | null;
  country_id?: string | null;
};

export type AccountsMastersCountry = {
  id: string;
  name: string;
  code?: string | null;
};

export type AccountsMastersResponse = {
  branches: AccountsMastersBranch[];
  locations: AccountsMastersLocation[];
  states: AccountsMastersState[];
  cities: AccountsMastersCity[];
  countries: AccountsMastersCountry[];
};

export type AccountsMastersQuery = {
  state?: string;
  state_id?: string;
  stateId?: string;
};

export type AccountPayload = {
  // Basic Account Info
  account_no?: string; // Spark Account Code (auto-generated)
  account_name?: string; // Ledger / Account Name
  ledger_role?: string | null; // Ledger Role

  // Group Information
  spark_account_group_id?: string | null; // Spark Account Group (FK to ACGroupMaster)
  group_code?: string; // Legacy group code
  tally_parent_group?: string | null; // Derived from ACGroupMaster
  financial_statement?: "Balance Sheet" | "Profit & Loss" | null; // Derived from ACGroupMaster
  normal_balance?: "Dr" | "Cr" | null; // Derived from ACGroupMaster

  // Party & Tax Details
  party_category?: string | null; // Party Category
  gst_registration_type?: string | null; // GST Registration Type
  // GSTN and PAN are in tax object

  // Opening Balance (stored in opening_balance object)

  // Settings & Flags
  bill_wise_required?: "YES" | "NO" | null;
  cost_centre_required?: "YES" | "NO" | null;
  export_to_tally?: "YES" | "NO" | null;
  status?: "ACTIVE" | "INACTIVE";

  // Additional Fields
  tally_ledger_name_override?: string | null;
  team_notice?: string | null;
  validation_status?: string | null;

  remarks?: string | null;

  // Nested objects
  contact?: {
    address_line?: string | null;
    country_master_id?: string | null;
    state?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    pin_code?: string | null;
  } | null;
  bank?: {
    bank_name?: string | null;
    branch?: string | null;
    ifsc?: string | null;
    account_number?: string | null;
    upi_id?: string | null;
  } | null;
  tax?: {
    gstin?: string | null; // GSTN
    pan?: string | null; // PAN
    tan?: string | null;
    tcs?: string | null;
    tds?: string | null;
    hm_no?: string | null;
    cst_no?: string | null;
  } | null;
  opening_balance?: {
    balance_date?: string | null;
    gold_fine?: string | null;
    gold_drcr?: string | null;
    silver_fine?: string | null;
    silver_drcr?: string | null;
    amount?: string | null; // Opening Balance Amount
    amount_drcr?: "Dr" | "Cr" | null; // Dr/Cr
    profit_pct?: string | null;
  } | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  results?: T[];
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  [key: string]: unknown;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  token_type?: string;
  user?: User;
  [key: string]: unknown;
};

export type UploadSummary = {
  imported?: number;
  skipped?: number;
  [key: string]: unknown;
};

export type SalesRecordListParams = {
  page?: number;
  page_size?: number;
  [key: string]: QueryValue;
};

export type ExportSalesRecordsPayload = {
  filters?: Record<string, unknown>;
  file_name?: string;
  include_columns?: string[];
};

export type ExportSalesRecordsResult = {
  blob: Blob;
  fileName?: string;
};

export type HealthResponse = {
  status?: string;
  [key: string]: unknown;
};

export function normalizePaginated<T>(
  data: PaginatedResponse<T> | T[] | undefined
): PaginatedResponse<T> {
  // Accepts either an array, a paginated shape, or undefined and
  // returns a normalized PaginatedResponse with an `items` array.
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }

  if (!data) {
    return { items: [] };
  }

  // If the object only has `results` (common DRF shape), use that as items.
  if (!("items" in data) && Array.isArray((data as any).results)) {
    return Object.assign({}, data as any, {
      items: (data as any).results,
    }) as PaginatedResponse<T>;
  }

  // If items missing, ensure we at least provide an empty array while preserving
  // any other fields (page, total, extras).
  if (!("items" in data)) {
    return Object.assign({}, data as any, {
      items: [],
    }) as PaginatedResponse<T>;
  }

  // Already normalized
  return data as PaginatedResponse<T>;
}

// Company endpoints
export async function companiesList(): Promise<Company[]> {
  const data = await api.get<PaginatedResponse<Company> | Company[]>(
    API_ENDPOINTS.COMPANIES
  );
  return normalizePaginated(data).items;
}

export async function companyCreate(body: Partial<Company>) {
  return api.post<Company>(API_ENDPOINTS.COMPANIES, body);
}

export async function companyUpdate(id: Identifier, body: Partial<Company>) {
  return api.put<Company>(`${API_ENDPOINTS.COMPANIES}${id}/`, body);
}

export async function companyDelete(id: Identifier) {
  return api.delete<void>(`${API_ENDPOINTS.COMPANIES}${id}/`);
}

export async function accountsList(
  params?: AccountsQueryParams
): Promise<AccountsListResponse> {
  return api.get<AccountsListResponse>(
    withQuery(API_ENDPOINTS.ACCOUNTS.ROOT, params)
  );
}

export async function accountDetail(id: Identifier): Promise<Account> {
  return api.get<Account>(API_ENDPOINTS.ACCOUNTS.DETAIL(id));
}

export async function accountBalance(id: Identifier): Promise<{
  balance: number;
  balance_type: "Dr" | "Cr";
  account_name: string;
  balance_display?: string;
}> {
  return api.get<{
    balance: number;
    balance_type: "Dr" | "Cr";
    account_name: string;
  }>(API_ENDPOINTS.ACCOUNTS.LEDGER_BALANCE(id));
}

export async function accountCreate(payload: AccountPayload): Promise<Account> {
  return api.post<Account>(API_ENDPOINTS.ACCOUNTS.ROOT, payload);
}

export async function accountUpdate(
  id: Identifier,
  payload: AccountPayload
): Promise<Account> {
  return api.patch<Account>(API_ENDPOINTS.ACCOUNTS.DETAIL(id), payload);
}

export async function accountDelete(id: Identifier) {
  await api.delete<void>(API_ENDPOINTS.ACCOUNTS.DETAIL(id));
}

export type ACGroupMaster = {
  id: string;
  name: string; // Spark Account Group
  tally_parent_group: string; // Tally Parent Group
  financial_statement: "Balance Sheet" | "Profit & Loss";
  universal_nature: "Asset" | "Liability" | "Income" | "Expense" | "Capital";
  normal_balance: "Dr" | "Cr";
  use_in_spark: "YES" | "NO";
  ledger_examples?: string | null;
  export_rule?: string | null;
  status: "Active" | "Restricted";
};

export type ACGroup = {
  id: string;
  ac_group?: ACGroupMaster | null;
  ac_group_id?: string | null;
  // Core fields from ACGroupMaster
  name?: string;
  tally_parent_group?: string;
  financial_statement?: "Balance Sheet" | "Profit & Loss";
  universal_nature?: "Asset" | "Liability" | "Income" | "Expense" | "Capital";
  normal_balance?: "Dr" | "Cr";
  status?: "Active" | "Restricted";
  // Usage flags
  incl_in_sale?: "YES" | "NO" | null;
  incl_in_pur?: "YES" | "NO" | null;
  incl_in_out?: "YES" | "NO" | null;
  incl_in_ir?: "YES" | "NO" | null;
  address_req?: "YES" | "NO" | null;
  restrict_credit_facility?: "YES" | "NO" | null;
  // Additional fields
  ledger_examples?: string | null;
  export_rule?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function acGroupMastersList(): Promise<ACGroupMaster[]> {
  const data = await api.get<{ ac_groups: ACGroupMaster[] }>(
    API_ENDPOINTS.ACCOUNTS.AC_GROUPS.MASTERS
  );
  return data?.ac_groups ?? [];
}

export type SubAccount = {
  id: string;
  account?: { id: string; name?: string } | string | null;
  account_detail?: { id: string; name?: string | null } | null;
  account_id?: string | null;
  sub_account_name?: string | null;
  address?: string | null;
  phone_number?: string | null;
  email?: string | null; // Added for contact info
  ring_size?: string | null;
  bangle_size?: string | null;
  gender?: string | null;
  item_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function accountsDropdown(params?: {
  type?: string;
  group?: string;
}): Promise<{ id: string; name: string }[]> {
  const url = withQuery(API_ENDPOINTS.ACCOUNTS.DROPDOWN, params);
  const data = await api.get<{ accounts: { id: string; name: string }[] }>(url);
  return data?.accounts ?? [];
}

export type GoldQuality = {
  id: string;
  name: string;
  code: string;
};

// Fetch gold qualities for dropdown
export async function getGoldQualities(): Promise<GoldQuality[]> {
  const data = await api.get<any>(API_ENDPOINTS.CORE.GOLD_QUALITIES);
  return Array.isArray(data) ? data : data?.results || [];
}

export async function subaccountsList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<SubAccount>> {
  const data = await api.get<PaginatedResponse<SubAccount> | SubAccount[]>(
    withQuery(API_ENDPOINTS.ACCOUNTS.SUBACCOUNTS.ROOT, params)
  );
  return normalizePaginated(data) as PaginatedResponse<SubAccount>;
}

// Fetch sub-accounts filtered by account_id
export async function getSubAccountsByAccountId(
  accountId: string
): Promise<SubAccount[]> {
  const data = await api.get<any>(
    withQuery(API_ENDPOINTS.ACCOUNTS.SUBACCOUNTS.ROOT, {
      account_id: accountId,
    })
  );
  return Array.isArray(data) ? data : data?.results || [];
}

export async function subaccountCreate(
  payload: Partial<SubAccount>
): Promise<SubAccount> {
  return api.post<SubAccount>(API_ENDPOINTS.ACCOUNTS.SUBACCOUNTS.ROOT, payload);
}

export async function subaccountDetail(id: Identifier): Promise<SubAccount> {
  return api.get<SubAccount>(API_ENDPOINTS.ACCOUNTS.SUBACCOUNTS.DETAIL(id));
}

export async function subaccountUpdate(
  id: Identifier,
  payload: Partial<SubAccount>
): Promise<SubAccount> {
  return api.patch<SubAccount>(
    API_ENDPOINTS.ACCOUNTS.SUBACCOUNTS.DETAIL(id),
    payload
  );
}

export async function subaccountDelete(id: Identifier) {
  await api.delete<void>(API_ENDPOINTS.ACCOUNTS.SUBACCOUNTS.DETAIL(id));
}

export async function acGroupsList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<ACGroup>> {
  const data = await api.get<PaginatedResponse<ACGroup> | ACGroup[]>(
    withQuery(API_ENDPOINTS.ACCOUNTS.AC_GROUPS.ROOT, params)
  );
  return normalizePaginated(data) as PaginatedResponse<ACGroup>;
}

export async function acGroupCreate(
  payload: Partial<ACGroup>
): Promise<ACGroup> {
  return api.post<ACGroup>(API_ENDPOINTS.ACCOUNTS.AC_GROUPS.ROOT, payload);
}

export async function acGroupDetail(id: Identifier): Promise<ACGroup> {
  return api.get<ACGroup>(API_ENDPOINTS.ACCOUNTS.AC_GROUPS.DETAIL(id));
}

export async function acGroupUpdate(
  id: Identifier,
  payload: Partial<ACGroup>
): Promise<ACGroup> {
  return api.patch<ACGroup>(
    API_ENDPOINTS.ACCOUNTS.AC_GROUPS.DETAIL(id),
    payload
  );
}

export async function acGroupDelete(id: Identifier) {
  await api.delete<void>(API_ENDPOINTS.ACCOUNTS.AC_GROUPS.DETAIL(id));
}

export async function acGroupsExport(params?: {
  start_date?: string;
  end_date?: string;
  group_id?: string;
}): Promise<Blob> {
  const url = withQuery("/accounts/ac-groups/tally-export/", params);
  const response = await fetchWithAuth(`${API_BASE_URL}${url}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*",
    },
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.blob();
}

export async function accountsTallyExport(params?: {
  start_date?: string;
  end_date?: string;
  account_id?: string;
  format?: string;
}): Promise<Blob> {
  const url = withQuery("/accounts/tally-export/", params);
  const response = await fetchWithAuth(`${API_BASE_URL}${url}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*",
    },
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.blob();
}

export type AccountTransaction = {
  id: string;
  transaction_type: string;
  reference_no: string;
  date: string;
  account_id: string | null;
  account_name: string;
  account_no: string;
  account_group_name?: string;
  tally_parent_group: string;
  financial_statement?: string;
  normal_balance?: string;
  gst_registration_type?: string;
  gstin?: string;
  pan?: string;
  bill_wise_required?: string;
  cost_centre_required?: string;
  ledger_role?: string;
  notes?: string;
  opening_balance?: number | string;
  amount: number;
  created_at: string;
  item_name?: string;
  type?: string;
  narration?: string;
};

export async function accountTransactionsList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<AccountTransaction>> {
  const data = await api.get<PaginatedResponse<AccountTransaction>>(
    withQuery(API_ENDPOINTS.ACCOUNTS.TRANSACTIONS.ROOT, params)
  );
  return data;
}

export async function accountTransactionsTallyExport(params?: {
  start_date?: string;
  end_date?: string;
  account_id?: string;
}): Promise<Blob> {
  const url = withQuery(
    API_ENDPOINTS.ACCOUNTS.TRANSACTIONS.TALLY_EXPORT,
    params
  );
  const response = await fetchWithAuth(`${API_BASE_URL}${url}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*",
    },
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.blob();
}

export type ApprovalLoose = {
  id: string;
  company?: string | null;
  account?: { id: string; name?: string } | string | null;
  account_id?: string | null;
  account_detail?: { id: string; name?: string | null } | null;
  item_name?: { id: string; name?: string } | string | null;
  item_name_id?: string | null;
  order_number?: string | null;
  stamp?: { id: string; name?: string } | string | null;
  remark?: string | null;
  piece?: number | null;
  gross_wt?: number | null;
  net_wt?: number | null;
  unit?: { id: string; name?: string } | string | null;
  tunch?: number | null;
  rate?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function approvalLooseCreate(
  payload: Partial<ApprovalLoose>
): Promise<ApprovalLoose> {
  return api.post<ApprovalLoose>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.APPROVAL_LOOSE.ROOT,
    payload
  );
}

export async function approvalLooseList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<ApprovalLoose>> {
  const data = await api.get<
    PaginatedResponse<ApprovalLoose> | ApprovalLoose[]
  >(withQuery(API_ENDPOINTS.VOUCHERS.PAYMENTS.APPROVAL_LOOSE.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<ApprovalLoose>;
}

export async function approvalTagCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post(API_ENDPOINTS.VOUCHERS.PAYMENTS.APPROVAL_TAG.ROOT, payload);
}

export async function approvalTagList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.VOUCHERS.PAYMENTS.APPROVAL_TAG.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function purAndApprovalCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.PUR_AND_APPROVAL.ROOT,
    payload
  );
}

export async function purAndApprovalList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.VOUCHERS.PAYMENTS.PUR_AND_APPROVAL.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function purchaseDiamondCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_DIAMOND.ROOT,
    payload
  );
}

export async function purchaseDiamondList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_DIAMOND.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function purchaseMCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_M.ROOT,
    payload
  );
}

export async function purchaseMList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_M.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function purchaseMDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_M.DETAIL(id)
  );
}

export async function purchaseMUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_M.DETAIL(id),
    payload
  );
}

export async function purchaseMDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_M.DETAIL(id));
}

export async function purchaseTagwiseCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_TAGWISE.ROOT,
    payload
  );
}

export async function purchaseTagwiseList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_TAGWISE.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function purchaseTagwiseDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_TAGWISE.DETAIL(id)
  );
}

export async function purchaseTagwiseUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_TAGWISE.DETAIL(id),
    payload
  );
}

export async function purchaseTagwiseDelete(id: Identifier): Promise<void> {
  await api.delete<void>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.PURCHASE_TAGWISE.DETAIL(id)
  );
}

export async function repairCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.REPAIR.ROOT,
    payload
  );
}

export async function repairList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.VOUCHERS.PAYMENTS.REPAIR.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function repairDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.REPAIR.DETAIL(id)
  );
}

export async function repairUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.VOUCHERS.PAYMENTS.REPAIR.DETAIL(id),
    payload
  );
}

export async function repairDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.VOUCHERS.PAYMENTS.REPAIR.DETAIL(id));
}

export async function repairIssueCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.ISSUES.REPAIR_ISSUES.ROOT,
    payload
  );
}

export async function repairIssueList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.ISSUES.REPAIR_ISSUES.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function repairIssueDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(
    API_ENDPOINTS.ISSUES.REPAIR_ISSUES.DETAIL(id)
  );
}

export async function repairIssueUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.ISSUES.REPAIR_ISSUES.DETAIL(id),
    payload
  );
}

export async function repairIssueDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.ISSUES.REPAIR_ISSUES.DETAIL(id));
}

export async function orderIssueCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.ISSUES.ORDER_ISSUES.ROOT,
    payload
  );
}

export async function orderIssueList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.ISSUES.ORDER_ISSUES.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function orderIssueDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(
    API_ENDPOINTS.ISSUES.ORDER_ISSUES.DETAIL(id)
  );
}

export async function orderIssueUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.ISSUES.ORDER_ISSUES.DETAIL(id),
    payload
  );
}

export async function orderIssueDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.ISSUES.ORDER_ISSUES.DETAIL(id));
}

export type OrderIssue = {
  id: string;
  account?: string | { id: string; account_name?: string; name?: string };
  item_name?: string | { id: string; name: string };
  metal?: string;
  base_metal_colour?: string;
  total_size?: string;
  rhodium_instructions?: string;
  delivery_date?: string;
  created_at?: string;
};

export async function accountReportList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.REPORTS.ACCOUNT_REPORT.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

// Vouchers endpoints (scaffold)
export async function vouchersList(
  params?: Record<string, QueryValue>
): Promise<VouchersListResponse> {
  return api.get<VouchersListResponse>(
    withQuery(API_ENDPOINTS.VOUCHERS.ROOT, params)
  );
}

export async function vouchersArchivesList(
  params?: Record<string, QueryValue>
): Promise<VouchersListResponse> {
  return api.get<VouchersListResponse>(
    withQuery(API_ENDPOINTS.VOUCHERS.ROOT + "archives/", params)
  );
}

export async function vouchersAggregates(): Promise<{
  total: number;
  with_advance: number;
  recent_7_days: number;
}> {
  return api.get<{
    total: number;
    with_advance: number;
    recent_7_days: number;
  }>(API_ENDPOINTS.VOUCHERS.AGGREGATES);
}

export async function vouchersMasters(): Promise<{
  series: { id: string; name: string }[];
  stamps: { id: string; name: string; code?: string | null }[];
  base_metals: { id: string; name: string; code?: string | null }[];
  units?: { id: string; name: string; code?: string | null }[];
  shapes?: { id: string; name: string; code?: string | null }[];
  sizes?: { id: string; name: string; code?: string | null }[];
  colours?: { id: string; name: string; code?: string | null }[];
  clarities?: { id: string; name: string; code?: string | null }[];
  labs?: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.ROOT);
}

// Per-master endpoints (item names, clarities, shapes, units)
export async function vouchersItemNames(): Promise<{
  item_names: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.ROOT + "item-names/");
}

// Helper function to get item names for jewellery type dropdown
export async function getItemNamesForDropdown(): Promise<
  {
    value: string;
    label: string;
  }[]
> {
  const response = await vouchersItemNames();
  return (response.item_names || []).map((item) => ({
    value: item.id,
    label: item.name,
  }));
}

export async function vouchersClarities(): Promise<{
  clarities: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.CLARITIES);
}

export async function vouchersShapes(): Promise<{
  shapes: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.SHAPES);
}

export async function vouchersUnits(): Promise<{
  units: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.ROOT + "units/");
}

export async function vouchersMetalTypes(): Promise<{
  metal_types: { id: string; name: string }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.METAL_TYPES);
}

export async function vouchersColours(): Promise<{
  colours: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.COLOURS);
}

export async function vouchersLabs(): Promise<{
  labs: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.LABS);
}

export async function vouchersOrigins(materialType?: string): Promise<{
  origins: { id: string; name: string; material_type: string }[];
}> {
  return api.get(
    withQuery(API_ENDPOINTS.VOUCHERS.MASTERS.ORIGINS, {
      material_type: materialType,
    })
  );
}

export async function vouchersGemstones(): Promise<{
  gemstones: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.GEMSTONES);
}

export async function vouchersGemstoneShapes(): Promise<{
  gemstone_shapes: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.GEMSTONE_SHAPES);
}

export async function vouchersGemstoneColors(): Promise<{
  gemstone_colors: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.GEMSTONE_COLORS);
}

export async function vouchersGemstoneClarities(): Promise<{
  gemstone_clarities: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.GEMSTONE_CLARITIES);
}

export async function vouchersGemstoneTreatments(): Promise<{
  gemstone_treatments: { id: string; name: string; code?: string | null }[];
}> {
  return api.get(API_ENDPOINTS.VOUCHERS.MASTERS.GEMSTONE_TREATMENTS);
}

export async function vouchersMasterSizes(
  materialType?: string
): Promise<{ id: string; name: string }[]> {
  const url = materialType
    ? `${API_ENDPOINTS.MASTERS.SIZES}?material_type=${materialType}`
    : API_ENDPOINTS.MASTERS.SIZES;

  const data = await api.get<
    { id: string; name: string }[] | { results: { id: string; name: string }[] }
  >(url);
  if (Array.isArray(data)) return data;
  if (data && "results" in data && Array.isArray(data.results))
    return data.results;
  return [];
}

export async function rawMaterialSuppliers(): Promise<{
  suppliers: { id: string; account_name: string; account_no: string }[];
}> {
  return api.get(API_ENDPOINTS.RAW_MATERIAL_PURCHASES.SUPPLIERS);
}

// export async function getLiveRates(): Promise<any> {
//   return api.get(API_ENDPOINTS.LIVE_RATES);
// }

export async function getCurrencyExchange(): Promise<{
  exchange_rate: number;
  usd_to_inr?: number;
  source?: string;
  last_updated?: string;
  cached?: boolean;
}> {
  const data = await api.get<any>(API_ENDPOINTS.CURRENCY_EXCHANGE);
  return {
    ...data,
    exchange_rate: data.exchange_rate || data.usd_to_inr || 0,
  };
}

export async function calculateMaterialPrice(payload: any): Promise<{
  price_per_ct_inr?: number;
  total_inr?: number;
  [key: string]: any;
}> {
  return api.post(API_ENDPOINTS.CALCULATE_MATERIAL_PRICE, payload);
}

// Live Rates API
export async function getLiveRates(): Promise<{
  timestamp: string;
  cached: boolean;
  gold: {
    price_per_gram_24k: number;
    price_per_gram_22k: number;
    price_per_gram_18k: number;
    change: number;
    change_percent: number;
    source: string;
  };
  silver: {
    price_per_gram: number;
    price_per_oz_usd: number;
    change: number;
    change_percent: number;
    source: string;
  };
  platinum: {
    price_per_gram: number;
    price_per_oz_usd: number;
    change: number;
    change_percent: number;
    source: string;
  };
  exchange_rate: {
    usd_to_inr: number;
    source: string;
  };
}> {
  return api.get("/live-rates/");
}

export async function voucherDetail(id: Identifier): Promise<Voucher> {
  return api.get<Voucher>(API_ENDPOINTS.VOUCHERS.DETAIL(id));
}

export async function voucherCreate(
  payload: Partial<Voucher>
): Promise<Voucher> {
  return api.post<Voucher>(API_ENDPOINTS.VOUCHERS.ROOT, payload);
}

export async function voucherUpdate(
  id: Identifier,
  payload: Partial<Voucher>
): Promise<Voucher> {
  return api.patch<Voucher>(API_ENDPOINTS.VOUCHERS.DETAIL(id), payload);
}

export async function voucherDelete(id: Identifier) {
  try {
    await api.delete<void>(API_ENDPOINTS.VOUCHERS.DETAIL(id));
  } catch (error) {
    // If it's an ApiError with a 403 status and error message, rethrow with the message
    if (error instanceof ApiError && error.status === 403) {
      const errorData = error.data;
      if (errorData && typeof errorData === "object" && "error" in errorData) {
        throw new Error(errorData.error as string);
      }
    }
    throw error;
  }
}

// Archives (pending queries) helpers
export async function archiveDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/vouchers/archives/${id}/`);
}

export async function exportArchive(
  id: Identifier
): Promise<{ blob: Blob; fileName?: string }> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}/vouchers/archives/${id}/export/`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      "Failed to export archive";
    throw new ApiError(response.status, "EXPORT_FAILED", message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}

// Query endpoints - Customer inquiries before advance payment
export async function queryList(
  params?: Record<string, QueryValue>
): Promise<QueryListResponse> {
  return api.get<QueryListResponse>(
    withQuery(API_ENDPOINTS.ISSUES.QUERIES.ROOT, params)
  );
}
export type SalesQueryPayload = {
  order_date: string;
  sales_person: string;
  vendor: string;
  account_id: string;
  sub_account_record_id?: string; // NEW: Sub account dropdown ID
  sub_account?: string; // OLD: Keep for backward compatibility
  phone_number: string;
  email: string;
  city: string;
  client_delivery_type: string;
  pan_gstin: string;
  occasion: string[];
  required_delivery_date: string | null;
  stock_in_deadline: string | null;
  purpose: string[];
  jewellery_type_master_id?: string; // NEW: From Item Master dropdown
  jewellery_type: string; // OLD: Keep for backward compatibility
  gold_quality: string;
  size_details: string;
  fit_details: string;
  follow_up_log: string;
  style_preference: string[];
  metal_preference: string[];
  diamond_shape: string;
  color_clarity: string;
  origin: string;
  diamond_budget: string;
  diamond_priority: string[];
  sample_details: string;
  gemstone_preference: string;
  gemstone_color_clarity: string;
  gemstone_origin: string;
  other_details: string;
  budget_range: string;
  urgency_level: string[];
  reference_source: string[];
  must_have: string;
  must_avoid: string;
  special_instructions: string;
  transfer_department?: string;
  follow_up_logs?: {
    date: string;
    mode: string;
    outcome: string;
    next_action: string;
    next_follow_up_date: string;
    comments: string;
  }[];
  advance_handling: {
    advance_type: string;
    amount_weight: string;
    date_received: string;
    receipt_generated: boolean;
    accounts_notified: boolean;
    erp_entry_done: boolean;
    gold_rate_locked: boolean;
    gold_rate_fixed: string;
    gold_rate_date: string;
    next_dept_triggered: string[];
    verified_by: string;
    colour_stone_demand: string;
    raw_material_instructions: string;
  };
  department_instructions: {
    design: string;
    production: string;
    accounts: string;
    reminders: string;
  };
  design_delivery: {
    rough_work_notes: string;
    final_design_url: string;
    delivery_notes: string;
  };
  reference_photo?: File | string | null;
  workflow_status?: string;
};

export const createSalesQuery = async (data: SalesQueryPayload | FormData) => {
  return api.post<SalesQuery>(API_ENDPOINTS.SALES_QUERIES.ROOT, data);
};

export async function getSalesQueries(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<SalesQuery>> {
  const data = await api.get<PaginatedResponse<SalesQuery> | SalesQuery[]>(
    withQuery(API_ENDPOINTS.SALES_QUERIES.ROOT, params)
  );
  return normalizePaginated(data) as PaginatedResponse<SalesQuery>;
}

export const getSalesQuery = async (id: string) => {
  return api.get<SalesQuery>(API_ENDPOINTS.SALES_QUERIES.DETAIL(id));
};

export async function getSalesQueryEstimates(id: string): Promise<{
  results: any[];
  count: number;
}> {
  const data = await api.get<any>(
    API_ENDPOINTS.SALES_QUERIES.LIST_ESTIMATES(id)
  );
  return {
    results: data?.results || (Array.isArray(data) ? data : []),
    count: data?.count || (Array.isArray(data) ? data.length : 0),
  };
}

export async function getSalesQueriesStats() {
  return api.get<{ total_queries: number; active_queries: number }>(
    API_ENDPOINTS.SALES_QUERIES.STATS
  );
}

export const updateSalesQuery = async (
  id: string,
  data: SalesQueryPayload | FormData
) => {
  return api.put<SalesQuery>(API_ENDPOINTS.SALES_QUERIES.DETAIL(id), data);
};

export const deleteSalesQuery = async (id: string) => {
  return api.delete(API_ENDPOINTS.SALES_QUERIES.DETAIL(id), {
    headers: { "Content-Type": "application/json" },
  });
};

export async function queryDetail(id: Identifier): Promise<QueryResponse> {
  return api.get<QueryResponse>(API_ENDPOINTS.ISSUES.QUERIES.DETAIL(id));
}

export async function queryCreate(
  payload: Partial<QueryResponse>
): Promise<QueryResponse> {
  return api.post<QueryResponse>(API_ENDPOINTS.ISSUES.QUERIES.ROOT, payload);
}

export async function queryUpdate(
  id: Identifier,
  payload: Partial<QueryResponse>
): Promise<QueryResponse> {
  return api.patch<QueryResponse>(
    API_ENDPOINTS.ISSUES.QUERIES.DETAIL(id),
    payload
  );
}

export async function queryDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.ISSUES.QUERIES.DETAIL(id));
}

export async function queryArchive(id: Identifier): Promise<QueryResponse> {
  return api.post<QueryResponse>(API_ENDPOINTS.ISSUES.QUERIES.ARCHIVE(id), {});
}

export async function queryReopen(id: Identifier): Promise<QueryResponse> {
  return api.post<QueryResponse>(API_ENDPOINTS.ISSUES.QUERIES.REOPEN(id), {});
}

export async function queryAddFollowUp(
  id: Identifier,
  payload: { follow_up_note: string; follow_up_date?: string }
): Promise<QueryResponse> {
  return api.post<QueryResponse>(
    `${API_ENDPOINTS.ISSUES.QUERIES.DETAIL(id)}add-follow-up/`,
    payload
  );
}

export async function queryConvertToOrder(
  id: Identifier,
  payload: { receipt_voucher_id: string }
): Promise<{
  order_id: string;
  order_bill_no: string;
  query_id: string;
  status: string;
  message: string;
}> {
  return api.post(API_ENDPOINTS.ISSUES.QUERIES.CONVERT_TO_ORDER(id), payload);
}

export async function queryAutoArchive(): Promise<{ message: string }> {
  return api.post<{ message: string }>(
    API_ENDPOINTS.ISSUES.QUERIES.AUTO_ARCHIVE,
    {}
  );
}

// Sales endpoints (new)
export async function salesList(
  params?: Record<string, QueryValue>
): Promise<VouchersListResponse> {
  return api.get<VouchersListResponse>(
    withQuery(API_ENDPOINTS.SALES.ROOT, params)
  );
}

export async function saleDetail(id: Identifier): Promise<Voucher> {
  return api.get<Voucher>(API_ENDPOINTS.SALES.DETAIL(id));
}

export async function saleCreate(payload: Partial<Voucher>): Promise<Voucher> {
  return api.post<Voucher>(API_ENDPOINTS.SALES.ROOT, payload);
}

export async function saleUpdate(
  id: Identifier,
  payload: Partial<Voucher>
): Promise<Voucher> {
  return api.patch<Voucher>(API_ENDPOINTS.SALES.DETAIL(id), payload);
}

export async function saleDelete(id: Identifier) {
  await api.delete<void>(API_ENDPOINTS.SALES.DETAIL(id));
}

/**
 * Get all estimates linked to a sale.
 */
export async function getSaleEstimates(id: Identifier): Promise<{
  sale_id: string;
  item_name: string;
  selected_estimate_id: string | null;
  all_estimates: any[];
  estimates_count: number;
}> {
  return api.get(API_ENDPOINTS.SALES.ESTIMATES(id));
}

/**
 * Select an estimate for a sale (marks it as primary).
 */
export async function selectSaleEstimate(
  saleId: Identifier,
  estimateId: string
): Promise<{
  message: string;
  sale_id: string;
  selected_estimate_id: string;
}> {
  return api.post(API_ENDPOINTS.SALES.SELECT_ESTIMATE(saleId), {
    estimate_id: estimateId,
  });
}

/**
 * Deselect the currently selected estimate for a sale.
 */
export async function deselectSaleEstimate(saleId: Identifier): Promise<{
  message: string;
  sale_id: string;
}> {
  return api.post(API_ENDPOINTS.SALES.DESELECT_ESTIMATE(saleId), {});
}

export async function convertSaleToOrder(saleId: Identifier): Promise<{
  message: string;
  sale_id: string;
  order_id: string;
  order_bill_no: string;
  order_job_no: string;
}> {
  return api.post(API_ENDPOINTS.SALES.CONVERT_TO_ORDER(saleId), {});
}

export type OrderProcessStepStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REMOVED";
export type OrderProcessLockLevel =
  | "UNLOCKED"
  | "LOCKED_FOR_EDIT"
  | "FULLY_LOCKED";

export interface OrderProcessStep {
  id: string;
  step_name: string;
  task_name?: string;
  description?: string;
  department?: string;
  status: OrderProcessStepStatus;
  position: number;
  notes?: string;
  completed_at?: string;
  color?: string;
  reference_id?: string;
  is_locked?: boolean;
  has_been_saved?: boolean;
  saved_at?: string;
  marked_done_at?: string;
}

export interface OrderDraft {
  id: string;
  order_id?: string;
  sale_id: string;
  process_steps: OrderProcessStep[];
  steps?: OrderProcessStep[]; // deprecated
  sales_query_id?: string;
  query_id?: string;
  can_modify?: boolean;
}

export interface OrderProcess {
  order_id: string;
  lock_level: OrderProcessLockLevel;
  can_modify_steps?: boolean;
  can_update_status?: boolean;
  process_steps: OrderProcessStep[];
  steps?: OrderProcessStep[]; // deprecated
}

/**
 * Get receipts dropdown for order conversion.
 */
export async function getReceiptsDropdown(): Promise<
  { id: string; name: string }[]
> {
  const tryFetch = async (endpoint: string, desc: string) => {
    try {
      console.log(
        `[DEBUG] Attempting fetch RECEIPTS from ${desc}: ${endpoint}`
      );
      const data = await api.get<any>(endpoint);
      const results = data?.results || (Array.isArray(data) ? data : []);
      if (results && results.length > 0) {
        console.log(
          `[DEBUG] SUCCESS: Found ${results.length} receipts at ${desc}`
        );
        return results.map((r: any) => ({
          id: String(r.id || r.voucher_id || r.pk),
          name:
            r.voucher_no ||
            r.receipt_no ||
            r.name ||
            (r.party_name?.name
              ? `${r.party_name.name} (#${r.id || r.pk})`
              : `Voucher #${r.id || r.pk}`),
        }));
      }
      console.warn(`[DEBUG] No results found at ${desc}`);
    } catch (err: any) {
      console.warn(`[DEBUG] FAILED fetch from ${desc}:`, err.message || err);
    }
    return null;
  };

  const d1 = await tryFetch(API_ENDPOINTS.RECEIPT.DROPDOWN, "Plural Dropdown");
  if (d1) return d1;

  const d2 = await tryFetch("/receipt/list/", "Singular List");
  if (d2) return d2;

  const d3 = await tryFetch("/receipts/list/", "Plural List");
  if (d3) return d3;

  const d4 = await tryFetch("/receipt/", "Singular Root");
  if (d4) return d4;

  const d5 = await tryFetch("/receipts/", "Plural Root");
  if (d5) return d5;

  console.error("[DEBUG] ALL receipt fetch attempts failed.");
  return [];
}

/**
 * Initiate order conversion process.
 */
export async function initiateOrderConversion(
  saleId: Identifier,
  data: {
    receipt_voucher_id: string;
    advance_amount: number;
    advance_notes?: string;
    item_name: string;
    design_details?: string;
  }
): Promise<{ draft_id: string; message: string }> {
  // 1. Validate Sale ID presence
  if (!saleId || saleId === "undefined" || saleId === "null") {
    throw new Error("No valid Sale ID provided for order conversion.");
  }

  // 2. Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const idStr = String(saleId);
  if (!uuidRegex.test(idStr)) {
    console.error("[DEBUG] Invalid Sale ID format detected:", idStr);
    throw new Error(
      `Invalid Sale ID format: "${idStr}". Expected a valid UUID. Please ensure the inquiry has been converted to a sale first.`
    );
  }

  console.log("[DEBUG] Initiating order conversion for sale:", idStr);
  return api.post(API_ENDPOINTS.SALES.INITIATE_ORDER_CONVERSION(saleId), data);
}

/**
 * List all Sales Queries.
 */
export async function salesLeadsList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<SalesQuery>> {
  return api.get<PaginatedResponse<SalesQuery>>(
    withQuery(API_ENDPOINTS.SALES_QUERIES.ROOT, params)
  );
}

/**
 * Initiate order conversion process for a Sales Query.
 */
export async function initiateSalesQueryOrderConversion(
  queryId: Identifier,
  data: {
    receipt_voucher_id?: string;
    advance_amount?: number;
    advance_notes?: string;
    item_name?: string;
    design_details?: string;
    order_data?: any;
  }
): Promise<{ draft_id: string; message: string }> {
  return api.post(API_ENDPOINTS.SALES_QUERIES.CONVERT_TO_ORDER(queryId), data);
}

export async function getOrderFromSalesQuery(
  salesQueryId: Identifier
): Promise<{
  success: boolean;
  order_id?: string;
  order_bill_no?: string;
  order_job_no?: string;
  workflow_status?: string;
  created_at?: string;
  error?: string;
  message?: string;
  can_convert?: boolean;
}> {
  return api.get(
    API_ENDPOINTS.SALES_QUERIES.DETAIL(salesQueryId) + "get-order/"
  );
}

/**
 * Create a new order with process steps (from Order Form).
 */
export async function createOrderWithProcess(data: {
  order_data: any;
  receipt_voucher_id?: string;
  query_id?: string; // Query ID to mark as converted
  advance_amount?: number;
  advance_notes?: string;
}): Promise<{ draft_id: string; message: string }> {
  return api.post(API_ENDPOINTS.ORDERS.CREATE_WITH_PROCESS, data);
}

/**
 * Get order draft details. */
export async function getOrderDraft(draftId: Identifier): Promise<OrderDraft> {
  return api.get<OrderDraft>(API_ENDPOINTS.ORDER_DRAFTS.DETAIL(draftId));
}

/**
 * Update steps in an order draft.
 */
export async function updateDraftSteps(
  draftId: Identifier,
  steps: Partial<OrderProcessStep>[]
): Promise<{ message: string; process_steps: OrderProcessStep[] }> {
  const payload = {
    steps: steps.map((s) => ({
      step_name: s.step_name || s.task_name,
      description: s.description,
      department: s.department,
      position: s.position,
      status: s.status,
      notes: s.notes || "",
      completed_at: s.completed_at || null,
      id: s.id?.toString().startsWith("temp-") ? undefined : s.id,
    })),
  };
  return api.put(API_ENDPOINTS.ORDER_DRAFTS.PROCESS_STEPS(draftId), payload);
}

/**
 * Confirm order creation from draft.
 */
export async function confirmOrderCreation(
  draftId: Identifier,
  data: { steps?: any[]; process_steps?: any[] } = {}
): Promise<{
  order_id: string;
  message: string;
  lock_level?: OrderProcessLockLevel;
  has_linked_estimate?: boolean;
}> {
  return api.post(API_ENDPOINTS.ORDER_DRAFTS.CONFIRM(draftId), data);
}

/**
 * Get order process steps.
 * Sub-tasks for reorder log and status explanation:
 * - [x] Add checkmark icons and visual confirmation in `OrderProcessManager.tsx`
 * - [x] Implement activity history log in the sequence card in `OrderProcessManager.tsx`
 * - [x] Add status progression guide note in `OrderProcessManager.tsx`
 * - [x] Implement multi-level fallbacks for item names in `VouchersList.tsx`
 */
export async function getOrderProcessSteps(
  orderId: Identifier
): Promise<OrderProcess> {
  return api.get<OrderProcess>(API_ENDPOINTS.ORDERS.PROCESS_STEPS(orderId));
}

/**
 * Order Search Result interface for Process Steps search
 */
export interface OrderSearchStep {
  id: string;
  step_name: string;
  task_name?: string;
  description?: string;
  department?: string;
  status: OrderProcessStepStatus;
  position: number;
  notes?: string;
  completed_at?: string;
  reference_id?: string;
  is_locked?: boolean;
  has_been_saved?: boolean;
  saved_at?: string;
  marked_done_at?: string;
}

export interface OrderSearchResult {
  order_id: string;
  bill_no?: string;
  job_no?: string;
  date?: string;
  item_name?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  account_name?: string;
  progress?: {
    percentage: number;
    completed: number;
    total: number;
  };
  lock_level?: OrderProcessLockLevel;
  process_steps?: {
    previous: OrderSearchStep[];
    current: OrderSearchStep | null;
    upcoming: OrderSearchStep[];
  };
  // Fallback - flat list if categorized not available
  steps?: OrderSearchStep[];
}

export interface EstimateApprovalResponse {
  estimate: EstimateVoucher;
  is_new: boolean;
  is_locked: boolean;
  step_status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  flow: "sale_conversion" | "direct_order" | "linked" | "query_linked";
}

/**
 * Get estimate approval data for an order.
 */
export async function getOrderEstimateApproval(
  orderId: Identifier
): Promise<EstimateApprovalResponse> {
  return api.get<EstimateApprovalResponse>(
    API_ENDPOINTS.ORDERS.ESTIMATE_APPROVAL(orderId)
  );
}

/**
 * Mark an order step as done.
 */
export async function markOrderStepDone(
  orderId: Identifier,
  stepId: Identifier
): Promise<{ message: string }> {
  return api.post<{ message: string }>(
    API_ENDPOINTS.ORDERS.MARK_DONE_STEP(String(orderId), String(stepId)),
    {}
  );
}

/**
 * Search for an order by Bill No or Job No and get complete process steps.
 */
export async function searchOrderById(
  orderId: string
): Promise<OrderSearchResult> {
  const params = new URLSearchParams({ order_id: orderId });
  return api.get<OrderSearchResult>(
    `${API_ENDPOINTS.ORDERS.SEARCH}?${params.toString()}`
  );
}

/**
 * Update the status of a specific step in an order.
 */
export async function updateOrderStepStatus(
  orderId: Identifier,
  stepId: Identifier,
  data: { status: OrderProcessStepStatus; notes?: string }
): Promise<{ message: string; step: OrderProcessStep }> {
  return api.patch(
    API_ENDPOINTS.ORDERS.STEP_STATUS(String(orderId), String(stepId)),
    data
  );
}

/**
 * Mark an order as courier dispatched.
 */
export async function markOrderCourierDispatched(
  orderId: Identifier
): Promise<{ message: string }> {
  return api.post(API_ENDPOINTS.ORDERS.COURIER_DISPATCHED(String(orderId)), {});
}

/**
 * Update order process steps (reorder/add/remove).
 */
export async function updateOrderProcessSteps(
  orderId: Identifier,
  steps: Partial<OrderProcessStep>[]
): Promise<{ message: string; steps: OrderProcessStep[] }> {
  return api.put(API_ENDPOINTS.ORDERS.PROCESS_STEPS(orderId), { steps });
}

/**
 * Update an individual step status in an order.
 */
export async function updateStepStatus(
  orderId: Identifier,
  stepId: Identifier,
  data: { status: OrderProcessStepStatus; notes?: string }
): Promise<{ message: string; step: OrderProcessStep }> {
  return api.patch(
    API_ENDPOINTS.ORDERS.STEP_STATUS(String(orderId), String(stepId)),
    data
  );
}

/**
 * Mark order as courier dispatched (Full Lock).
 */
export async function markCourierDispatched(
  orderId: Identifier
): Promise<{ message: string }> {
  return api.post(API_ENDPOINTS.ORDERS.COURIER_DISPATCHED(orderId), {});
}

/**
 * Generate sales PDF using backend template overlay approach.
 * Returns a Blob that can be downloaded directly.
 */
export async function saleGeneratePDF(
  payload: Record<string, any>
): Promise<{ blob: Blob; fileName: string }> {
  // Use fetch directly for binary PDF response (not apiFetch which parses JSON)
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.SALES.PDF}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = "PDF generation failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // If not JSON, try text
      try {
        errorMessage = (await response.text()) || errorMessage;
      } catch {
        // Use default message
      }
    }
    throw new ApiError(response.status, "PDF_GENERATION_FAILED", errorMessage);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const fileName =
    parseFileNameFromDisposition(disposition) || "Sales_Query.pdf";

  return { blob, fileName };
}

// Pur. Return endpoints
export async function purReturnOverview(): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.PUR_RETURN.OVERVIEW);
}

export async function purReturnList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.PUR_RETURN.LIST, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function purReturnDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.PUR_RETURN.DETAIL(id));
}

export async function purReturnCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(API_ENDPOINTS.PUR_RETURN.ROOT, payload);
}

export async function purReturnUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.PUR_RETURN.DETAIL(id),
    payload
  );
}

export async function receiveOverview(): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.RECEIVE.OVERVIEW);
}

export async function receiveList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.RECEIVE.LIST, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function receiveDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.RECEIVE.DETAIL(id));
}

export async function receiveCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(API_ENDPOINTS.RECEIVE.ROOT, payload);
}

export async function receiveUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.RECEIVE.DETAIL(id),
    payload
  );
}

export async function receiveDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.RECEIVE.DETAIL(id));
}

export async function receiptOverview(): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.RECEIPT.OVERVIEW);
}

export async function receiptList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.RECEIPT.LIST, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function receiptDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.RECEIPT.DETAIL(id));
}

export async function receiptCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(API_ENDPOINTS.RECEIPT.ROOT, payload);
}

export async function receiptUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.RECEIPT.DETAIL(id),
    payload
  );
}

export async function receiptDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.RECEIPT.DETAIL(id));
}

export async function receiptNextVoucherNo(): Promise<{
  data: { voucher_no: string };
}> {
  return api.get<{ data: { voucher_no: string } }>(
    API_ENDPOINTS.RECEIPT.NEXT_VOUCHER_NO
  );
}

// Contra Voucher endpoints
export async function contraOverview(): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.CONTRA_VOUCHERS.OVERVIEW);
}

export async function contraList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.CONTRA_VOUCHERS.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function contraDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.CONTRA_VOUCHERS.DETAIL(id));
}

export async function contraCreate(
  payload: Record<string, any>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.CONTRA_VOUCHERS.ROOT,
    payload
  );
}

export async function contraUpdate(
  id: Identifier,
  payload: Record<string, any>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.CONTRA_VOUCHERS.DETAIL(id),
    payload
  );
}

export async function contraDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.CONTRA_VOUCHERS.DETAIL(id));
}

export async function contraNextVoucherNo(): Promise<{ voucher_no: string }> {
  return api.get<{ voucher_no: string }>(API_ENDPOINTS.CONTRA_VOUCHERS.NEXT_NO);
}

export async function paymentNextVoucherNo(): Promise<{ voucher_no: string }> {
  return api.get<{ voucher_no: string }>(
    API_ENDPOINTS.PAYMENT_VOUCHERS.NEXT_NO
  );
}

export async function journalNextVoucherNo(): Promise<{ voucher_no: string }> {
  return api.get<{ voucher_no: string }>(
    API_ENDPOINTS.JOURNAL_VOUCHERS.NEXT_NO
  );
}

export async function purReturnDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.PUR_RETURN.DETAIL(id));
}

// Sales Return endpoints
export async function salesReturnOverview(): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.SALES_RETURN.OVERVIEW);
}

export async function salesReturnList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.SALES_RETURN.LIST, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function salesReturnDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.SALES_RETURN.DETAIL(id));
}

export async function salesReturnCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.SALES_RETURN.ROOT,
    payload
  );
}

export async function salesReturnUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.SALES_RETURN.DETAIL(id),
    payload
  );
}

export async function salesReturnDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.SALES_RETURN.DETAIL(id));
}

// Estimate Voucher endpoints
export async function estimatesList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.ESTIMATES.ROOT, params));
  return normalizePaginated(data);
}

export async function estimateDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.ESTIMATES.DETAIL(id));
}

export async function estimateCreate(
  payload: Partial<Record<string, any>> | FormData
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(API_ENDPOINTS.ESTIMATES.ROOT, payload);
}

export async function estimateUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>> | FormData
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.ESTIMATES.DETAIL(id),
    payload
  );
}

export async function estimateDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.ESTIMATES.DETAIL(id));
}

/**
 * Generate estimate PDF using backend template overlay approach.
 * Returns a Blob that can be downloaded directly.
 */
export async function estimateGeneratePDF(payload: {
  item_name: string;
  line_items: Array<{
    particulars: string;
    shape?: string;
    colour?: string;
    clarity?: string;
    pc?: number | null;
    weight?: number | null;
    unit?: string;
    rate?: number | null;
    amount: number;
  }>;
  totals: {
    taxable_value: number;
    gst: number;
    grand_total: number;
  };
  image_base64?: string;
}): Promise<{ blob: Blob; fileName: string }> {
  // Use fetch directly for binary PDF response (not apiFetch which parses JSON)
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.ESTIMATES.PDF}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = "PDF generation failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // If not JSON, try text
      try {
        errorMessage = (await response.text()) || errorMessage;
      } catch {
        // Use default message
      }
    }
    throw new ApiError(response.status, "PDF_GENERATION_FAILED", errorMessage);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const fileName = parseFileNameFromDisposition(disposition) || "Estimate.pdf";

  return { blob, fileName };
}

/**
 * Generate a landscape estimate PDF using the landscape template.
 * Returns a Blob that can be downloaded directly.
 */
export async function estimateGenerateLandscapePDF(payload: {
  item_name: string;
  line_items: Array<{
    particulars: string;
    shape?: string;
    colour?: string;
    clarity?: string;
    pc?: number | null;
    weight?: number | null;
    unit?: string;
    rate?: number | null;
    amount: number;
  }>;
  totals: {
    taxable_value: number;
    gst: number;
    discount?: number;
    discount_percent?: number;
    grand_total: number;
  };
  customer_details?: {
    main_account: string;
    sub_account: string;
    phone: string;
    sales_person_name: string;
    nsj_representative?: string;
  };
  jewellery_details?: {
    jewellery_type: string;
    size_details: string;
  };
  estimate_details?: {
    date: string;
    expiry_date: string;
  };
  image_base64?: string;
}): Promise<{ blob: Blob; fileName: string }> {
  // Use fetch directly for binary PDF response (not apiFetch which parses JSON)
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.ESTIMATES.LANDSCAPE_PDF}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = "Landscape PDF generation failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // If not JSON, try text
      try {
        errorMessage = (await response.text()) || errorMessage;
      } catch {
        // Use default message
      }
    }
    throw new ApiError(
      response.status,
      "LANDSCAPE_PDF_GENERATION_FAILED",
      errorMessage
    );
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const fileName =
    parseFileNameFromDisposition(disposition) || "Estimate_Landscape.pdf";

  return { blob, fileName };
}

// Payment Voucher endpoints
export async function paymentOverview(): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.PAYMENT_VOUCHERS.OVERVIEW);
}

export async function paymentsList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.PAYMENT_VOUCHERS.ROOT, params));
  return normalizePaginated(data);
}

export async function paymentDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(
    API_ENDPOINTS.PAYMENT_VOUCHERS.DETAIL(id)
  );
}

export async function paymentCreate(
  payload: FormData | Record<string, any>
): Promise<Record<string, any>> {
  if (payload instanceof FormData) {
    return api.postFormData<Record<string, any>>(
      API_ENDPOINTS.PAYMENT_VOUCHERS.ROOT,
      payload
    );
  }
  return api.post<Record<string, any>>(
    API_ENDPOINTS.PAYMENT_VOUCHERS.ROOT,
    payload
  );
}

export async function paymentUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.PAYMENT_VOUCHERS.DETAIL(id),
    payload
  );
}

export async function paymentDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.PAYMENT_VOUCHERS.DETAIL(id));
}

// Helpers: masters & aggregates for payments
export async function paymentMasters(): Promise<{
  accounts: { id: string; name?: string }[];
  sub_accounts: SubAccount[];
}> {
  return api.get<{
    accounts: { id: string; name?: string }[];
    sub_accounts: SubAccount[];
  }>("/payments/payment/masters/");
}

export async function paymentAggregates(): Promise<{
  total?: number;
  recent_7_days?: number;
  sum_dr?: number;
  sum_cr?: number;
}> {
  return api.get<{
    total?: number;
    recent_7_days?: number;
    sum_dr?: number;
    sum_cr?: number;
  }>("/payments/payment/aggregates/");
}

// Journal Voucher endpoints
export async function journalOverview(): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(API_ENDPOINTS.JOURNAL_VOUCHERS.OVERVIEW);
}

export async function journalsList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.JOURNAL_VOUCHERS.ROOT, params));
  return normalizePaginated(data);
}

export async function journalDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(
    API_ENDPOINTS.JOURNAL_VOUCHERS.DETAIL(id)
  );
}

export async function journalCreate(
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.JOURNAL_VOUCHERS.ROOT,
    payload
  );
}

export async function journalUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>>
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.JOURNAL_VOUCHERS.DETAIL(id),
    payload
  );
}

export async function journalDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.JOURNAL_VOUCHERS.DETAIL(id));
}

// Journal masters & aggregates (reuse payment masters if needed)
export async function journalMasters(): Promise<{
  accounts: { id: string; name?: string }[];
  sub_accounts: SubAccount[];
}> {
  return api.get<{
    accounts: { id: string; name?: string }[];
    sub_accounts: SubAccount[];
  }>("/payments/journal/masters/");
}

export async function journalAggregates(): Promise<{
  total?: number;
  recent_7_days?: number;
  sum_dr?: number;
  sum_cr?: number;
}> {
  return api.get<{
    total?: number;
    recent_7_days?: number;
    sum_dr?: number;
    sum_cr?: number;
  }>("/payments/journal/aggregates/");
}

export async function accountsMasters(
  params?: AccountsMastersQuery
): Promise<AccountsMastersResponse> {
  return api.get<AccountsMastersResponse>(
    withQuery(API_ENDPOINTS.ACCOUNTS.MASTERS, params)
  );
}

async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    payload
  );
  const token =
    response?.access_token || response?.accessToken || response?.token;
  if (typeof token === "string" && token) {
    setAuthToken(token);
  }
  const refreshToken =
    (response as any)?.refresh_token || (response as any)?.refreshToken;
  if (typeof refreshToken === "string" && refreshToken) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("refreshToken", refreshToken);
    }
  }
  return response;
}

async function logout(): Promise<Record<string, unknown>> {
  let data: Record<string, unknown> | undefined;
  try {
    data = await apiFetch<Record<string, unknown>>(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
      skipRefresh: true,
    });
    return data ?? {};
  } catch (error) {
    // Silently handle logout errors - 401 is expected when token is already invalid
    // The important part is clearing the local token in the finally block
    return {};
  } finally {
    clearAuthToken();
  }
}

async function refresh(): Promise<Record<string, unknown>> {
  const data = await apiFetch<Record<string, unknown>>(
    API_ENDPOINTS.AUTH.REFRESH,
    { method: "POST", skipRefresh: true }
  );
  const token = data?.access_token || data?.accessToken || data?.token || null;
  if (typeof token === "string" && token) {
    setAuthToken(token);
  }
  return data;
}

async function me(): Promise<User> {
  try {
    return await api.get<User>(API_ENDPOINTS.AUTH.ME);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return api.get<User>(API_ENDPOINTS.USERS.ME);
    }
    throw error;
  }
}

async function getCurrentUser(): Promise<User> {
  return api.get<User>(API_ENDPOINTS.USERS.ME);
}

async function getHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>(API_ENDPOINTS.HEALTH);
}

async function listTemplates(): Promise<Template[]> {
  return api.get<Template[]>(API_ENDPOINTS.TEMPLATES.ROOT);
}

async function createTemplate(payload: Partial<Template>): Promise<Template> {
  return api.post<Template>(API_ENDPOINTS.TEMPLATES.ROOT, payload);
}

async function getTemplate(id: Identifier): Promise<Template> {
  return api.get<Template>(API_ENDPOINTS.TEMPLATES.DETAIL(id));
}

async function updateTemplate(
  id: Identifier,
  payload: Partial<Template>
): Promise<Template> {
  return api.put<Template>(API_ENDPOINTS.TEMPLATES.DETAIL(id), payload);
}

async function deleteTemplate(id: Identifier): Promise<Record<string, never>> {
  await api.delete(API_ENDPOINTS.TEMPLATES.DETAIL(id));
  return {};
}

async function createVendor(payload: Partial<Vendor>): Promise<Vendor> {
  return api.post<Vendor>(API_ENDPOINTS.VENDORS.ROOT, payload);
}

async function listVendors(): Promise<Vendor[]> {
  return api.get<Vendor[]>(API_ENDPOINTS.VENDORS.ROOT);
}

async function getVendor(id: Identifier): Promise<Vendor> {
  return api.get<Vendor>(API_ENDPOINTS.VENDORS.DETAIL(id));
}

async function updateVendor(
  id: Identifier,
  payload: Partial<Vendor>
): Promise<Vendor> {
  return api.put<Vendor>(API_ENDPOINTS.VENDORS.DETAIL(id), payload);
}

async function deleteVendor(id: Identifier): Promise<Record<string, never>> {
  await api.delete(API_ENDPOINTS.VENDORS.DETAIL(id));
  return {};
}

async function createInvoice(payload: Partial<Invoice>): Promise<Invoice> {
  return api.post<Invoice>(API_ENDPOINTS.INVOICES.ROOT, payload);
}

async function getInvoice(id: Identifier): Promise<Invoice> {
  return api.get<Invoice>(API_ENDPOINTS.INVOICES.DETAIL(id));
}

async function updateInvoice(
  id: Identifier,
  payload: Partial<Invoice>
): Promise<Invoice> {
  return api.put<Invoice>(API_ENDPOINTS.INVOICES.DETAIL(id), payload);
}

async function deleteInvoice(id: Identifier): Promise<Record<string, never>> {
  await api.delete(API_ENDPOINTS.INVOICES.DETAIL(id));
  return {};
}

async function listPendingInvoices(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Invoice>> {
  const data = await api.get<PaginatedResponse<Invoice> | Invoice[]>(
    withQuery(API_ENDPOINTS.INVOICES.PENDING, params)
  );
  return normalizePaginated(data);
}

async function uploadInvoices(file: Blob | File): Promise<UploadSummary> {
  const formData = createUploadFormData(file, "file", "invoices-upload.xlsx");
  return apiFetch<UploadSummary>(API_ENDPOINTS.INVOICES.UPLOAD, {
    method: "POST",
    body: formData,
  });
}

async function listReminders(): Promise<PaginatedResponse<Reminder>> {
  const data = await api.get<PaginatedResponse<Reminder> | Reminder[]>(
    API_ENDPOINTS.REMINDERS.ROOT
  );
  return normalizePaginated(data);
}

async function listRemindersByInvoice(
  invoiceId: Identifier
): Promise<Reminder[]> {
  return api.get<Reminder[]>(API_ENDPOINTS.REMINDERS.BY_INVOICE(invoiceId));
}

async function getReminder(id: Identifier): Promise<Reminder> {
  return api.get<Reminder>(API_ENDPOINTS.REMINDERS.DETAIL(id));
}

async function sendReminder(payload: Partial<Reminder>): Promise<Reminder> {
  return api.post<Reminder>(API_ENDPOINTS.REMINDERS.ROOT, payload);
}

async function uploadSalesRecords(file: Blob | File): Promise<UploadSummary> {
  const formData = createUploadFormData(
    file,
    "file",
    "sales-records-upload.csv"
  );
  return apiFetch<UploadSummary>(API_ENDPOINTS.SALES_RECORDS.UPLOAD, {
    method: "POST",
    body: formData,
  });
}

async function listSalesRecords(
  params?: SalesRecordListParams
): Promise<PaginatedResponse<SalesRecord>> {
  const data = await api.get<PaginatedResponse<SalesRecord> | SalesRecord[]>(
    withQuery(API_ENDPOINTS.SALES_RECORDS.ROOT, params)
  );
  return normalizePaginated(data);
}

async function getSalesAggregates(): Promise<SalesRecordAggregates> {
  return api.get<SalesRecordAggregates>(API_ENDPOINTS.SALES_RECORDS.AGGREGATES);
}

async function exportSalesRecords(
  payload: ExportSalesRecordsPayload
): Promise<ExportSalesRecordsResult> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.SALES_RECORDS.EXPORT}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/csv,application/octet-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload ?? {}),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      (typeof data.message === "string" && data.message) ||
      "Failed to export records";
    const code = typeof data.code === "string" ? data.code : "UNKNOWN_ERROR";
    throw new ApiError(response.status, code, message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}

export async function exportAccount(
  id: Identifier
): Promise<{ blob: Blob; fileName?: string }> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.ACCOUNTS.EXPORT(id)}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      "Failed to export account";
    throw new ApiError(response.status, "EXPORT_FAILED", message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}

export async function exportAccountsAll(): Promise<{
  blob: Blob;
  fileName?: string;
}> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.ACCOUNTS.EXPORT_ALL}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      "Failed to export accounts";
    throw new ApiError(response.status, "EXPORT_FAILED", message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}

export async function exportVoucher(
  id: Identifier
): Promise<{ blob: Blob; fileName?: string }> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.VOUCHERS.EXPORT(id)}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      "Failed to export order";
    throw new ApiError(response.status, "EXPORT_FAILED", message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}

export async function exportVouchersAll(): Promise<{
  blob: Blob;
  fileName?: string;
}> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.VOUCHERS.EXPORT_ALL}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      "Failed to export orders";
    throw new ApiError(response.status, "EXPORT_FAILED", message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}

export async function exportSale(
  id: Identifier
): Promise<{ blob: Blob; fileName?: string }> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.SALES.EXPORT(id)}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      "Failed to export sale";
    throw new ApiError(response.status, "EXPORT_FAILED", message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}

export async function exportRepair(
  id: Identifier
): Promise<{ blob: Blob; fileName?: string }> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.VOUCHERS.PAYMENTS.REPAIR.EXPORT(id)}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      "Failed to export repair";
    throw new ApiError(response.status, "EXPORT_FAILED", message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}

export async function exportRepairsAll(): Promise<{
  blob: Blob;
  fileName?: string;
}> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.VOUCHERS.PAYMENTS.REPAIR.EXPORT_ALL}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      "Failed to export repairs";
    throw new ApiError(response.status, "EXPORT_FAILED", message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}

export async function exportSalesAll(): Promise<{
  blob: Blob;
  fileName?: string;
}> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.SALES.EXPORT_ALL}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      "Failed to export sales";
    throw new ApiError(response.status, "EXPORT_FAILED", message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}

export async function exportSubaccountsAll(): Promise<{
  blob: Blob;
  fileName?: string;
}> {
  const token = getAuthToken();
  const response = await fetchWithAuth(
    `${API_BASE_URL}${API_ENDPOINTS.ACCOUNTS.SUBACCOUNTS.EXPORT}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (typeof data.detail === "string" && data.detail) ||
      "Failed to export subaccounts";
    throw new ApiError(response.status, "EXPORT_FAILED", message);
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(
    response.headers.get("content-disposition")
  );
  return { blob, fileName };
}
// Sales Queries Endpoint
export type SalesQuery = {
  id: string;
  order_date: string;
  sales_person: string;
  vendor: string;
  account: {
    id: string;
    account_name: string;
    name: string;
  };
  sub_account: string; // OLD: text field (backward compatibility)
  sub_account_record?: {
    // NEW: Full sub account object
    id: string;
    sub_account_name: string;
    name: string;
    phone_number?: string;
    email?: string;
  } | null;
  phone_number: string;
  email: string;
  city: string;
  client_delivery_type: string;
  pan_gstin: string;
  occasion: string[];
  required_delivery_date: string;
  stock_in_deadline: string;
  purpose: string[];
  jewellery_type: string; // OLD: text field (backward compatibility)
  jewellery_type_master?: {
    // NEW: Full item master object
    id: string;
    name: string;
    code?: string;
  } | null;
  gold_quality: string;
  size_details: string;
  fit_details: string;
  follow_up_log: string;
  style_preference: string[];
  metal_preference: string[];
  diamond_shape: string;
  color_clarity: string;
  origin: string;
  diamond_budget: string;
  diamond_priority: string[];
  sample_details: string;
  gemstone_preference: string;
  gemstone_color_clarity: string;
  gemstone_origin: string;
  other_details: string;
  budget_range: string;
  urgency_level: string[];
  reference_source: string[];
  must_have: string;
  must_avoid: string;
  special_instructions: string;
  transfer_department: string;
  follow_up_logs: {
    date: string;
    mode: string;
    outcome: string;
    next_action: string;
    next_follow_up_date: string;
    comments: string;
  }[];

  advance_handling: Record<string, any>;
  department_instructions: Record<string, any>;
  design_delivery: Record<string, any>;
  ledger_entries: Record<string, any>[];
  reference_photo: string | null;
  workflow_status: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export const createEstimateVariation = async (
  id: string | number,
  payload: any
) =>
  api.post(API_ENDPOINTS.SALES_QUERIES.CREATE_ESTIMATE_VARIATION(id), payload);

export const getEstimateSummary = async (id: string | number) =>
  api.get<any>(API_ENDPOINTS.SALES_QUERIES.ESTIMATE_SUMMARY(id));

export const selectFinalEstimate = async (
  id: string | number,
  payload: { estimate_id: string; notes?: string }
) => api.post(API_ENDPOINTS.SALES_QUERIES.SELECT_FINAL_ESTIMATE(id), payload);

export const convertToSale = async (
  id: string | number,
  payload: {
    confirm_conversion: boolean;
    sale_notes?: string;
    advance_amount?: number;
    item_name?: string;
    selected_estimate_id?: string;
  }
) => api.post(API_ENDPOINTS.SALES_QUERIES.CONVERT_TO_SALE(id), payload);

export const updateWorkflowStatus = async (
  id: string | number,
  status: string
) =>
  api.post(API_ENDPOINTS.SALES_QUERIES.UPDATE_WORKFLOW_STATUS(id), {
    workflow_status: status,
  });

export const getAvailableBaseEstimates = async (id: string | number) =>
  api.get<{ base_estimate_options: { value: string; label: string }[] }>(
    API_ENDPOINTS.SALES_QUERIES.AVAILABLE_BASE_ESTIMATES(id)
  );

export const getJewelryTypes = async () =>
  api.get<{ jewelry_types: { value: string; label: string }[] }>(
    API_ENDPOINTS.SALES_QUERIES.JEWELRY_TYPES
  );

export const getVouchersMaster = async () =>
  api.get<{ item_names: { id: string; name: string }[] }>(
    API_ENDPOINTS.MASTERS.VOUCHERS_MASTER
  );

export const backend = {
  login,
  logout,
  refresh,
  me,
  getCurrentUser,
  getHealth,
  listTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  createVendor,
  listVendors,
  getVendor,
  updateVendor,
  deleteVendor,
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  listPendingInvoices,
  uploadInvoices,
  listReminders,
  listRemindersByInvoice,
  getReminder,
  sendReminder,
  uploadSalesRecords,
  listSalesRecords,
  getSalesAggregates,
  exportSalesRecords,
  exportAccount,
  exportAccountsAll,
  exportVoucher,
  exportArchive,
  exportSale,
  exportVouchersAll,
  exportSalesAll,
  exportSubaccountsAll,
  vouchersList,
  approvalLooseCreate,
  approvalLooseList,
  approvalTagCreate,
  approvalTagList,
  purAndApprovalCreate,
  purAndApprovalList,
  purchaseDiamondCreate,
  purchaseDiamondList,
  purchaseMCreate,
  purchaseMList,
  purchaseMDetail,
  purchaseMUpdate,
  purchaseMDelete,
  purchaseTagwiseCreate,
  purchaseTagwiseList,
  purchaseTagwiseDetail,
  purchaseTagwiseUpdate,
  purchaseTagwiseDelete,
  repairCreate,
  repairList,
  repairDetail,
  repairUpdate,
  repairDelete,
  repairIssueCreate,
  repairIssueList,
  repairIssueDetail,
  repairIssueUpdate,
  repairIssueDelete,
  orderIssueCreate,
  orderIssueList,
  orderIssueDetail,
  orderIssueUpdate,
  orderIssueDelete,
  accountReportList,
  voucherDetail,
  voucherCreate,
  voucherUpdate,
  voucherDelete,
  archiveDelete,
  salesList,
  saleDetail,
  saleCreate,
  saleUpdate,
  saleDelete,
  salesLeadsList,
  purReturnOverview,
  purReturnList,
  purReturnDetail,
  purReturnCreate,
  purReturnUpdate,
  purReturnDelete,
  receiveOverview,
  receiveList,
  receiveDetail,
  receiveCreate,
  receiveUpdate,
  receiveDelete,
  salesReturnOverview,
  salesReturnList,
  salesReturnDetail,
  salesReturnCreate,
  salesReturnUpdate,
  salesReturnDelete,
  paymentsList,
  paymentDetail,
  paymentCreate,
  paymentUpdate,
  paymentDelete,
  paymentMasters,
  paymentAggregates,
  journalsList,
  journalDetail,
  journalCreate,
  journalUpdate,
  journalDelete,
  journalMasters,
  journalAggregates,
  companiesList,
  companyCreate,
  companyUpdate,
  companyDelete,
  acGroupMastersList,
  acGroupsList,
  acGroupCreate,
  acGroupDetail,
  acGroupUpdate,
  acGroupDelete,
  acGroupsExport,
  accountsTallyExport,
  accountTransactionsList,
  accountTransactionsTallyExport,
  accountsDropdown,
  subaccountsList,
  subaccountCreate,
  subaccountDetail,
  subaccountUpdate,
  subaccountDelete,
  queryList,
  queryDetail,
  queryCreate,
  queryUpdate,
  queryDelete,
  queryArchive,
  queryReopen,
  queryAddFollowUp,
  queryConvertToOrder,
  queryAutoArchive,
  receiptOverview,
  receiptList,
  receiptDetail,
  receiptCreate,
  receiptUpdate,
  receiptDelete,
  getSalesQueries,
  getSalesQuery,
  createSalesQuery,
  getSalesQueriesStats,
  updateSalesQuery,
  deleteSalesQuery,
  getEstimateSummary,
  selectFinalEstimate,
  convertToSale,
  updateWorkflowStatus,
  getAvailableBaseEstimates,
  getJewelryTypes,
  getSubAccountsByAccountId,
  getItemNamesForDropdown,
  getVouchersMaster,
};

// ============================================================================
// Raw Material Purchase
// ============================================================================
export async function rawMaterialPurchaseCreate(
  payload: Partial<Record<string, any>> | FormData
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.RAW_MATERIAL_PURCHASES.ROOT,
    payload
  );
}

export async function rawMaterialPurchaseList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.RAW_MATERIAL_PURCHASES.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function rawMaterialPurchaseDetail(
  id: Identifier
): Promise<Record<string, any>> {
  return api.get<Record<string, any>>(
    API_ENDPOINTS.RAW_MATERIAL_PURCHASES.DETAIL(id)
  );
}

export async function rawMaterialPurchaseUpdate(
  id: Identifier,
  payload: Partial<Record<string, any>> | FormData
): Promise<Record<string, any>> {
  return api.patch<Record<string, any>>(
    API_ENDPOINTS.RAW_MATERIAL_PURCHASES.DETAIL(id),
    payload
  );
}

export async function rawMaterialPurchaseDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.RAW_MATERIAL_PURCHASES.DETAIL(id));
}

export async function rawMaterialPurchaseAggregates(): Promise<
  Record<string, any>
> {
  return api.get<Record<string, any>>(
    API_ENDPOINTS.RAW_MATERIAL_PURCHASES.AGGREGATES
  );
}

// ============================================================================
// Orders Dropdown
// ============================================================================
export async function ordersDropdown(): Promise<{ orders: any[] }> {
  return api.get<{ orders: any[] }>(API_ENDPOINTS.ORDERS_DROPDOWN);
}

// ============================================================================
// Raw Material Inventory
// ============================================================================
export async function rawMaterialInventoryList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.RAW_MATERIAL_INVENTORY.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function rawMaterialInventorySummary(): Promise<
  Record<string, any>
> {
  return api.get<Record<string, any>>(
    API_ENDPOINTS.RAW_MATERIAL_INVENTORY.SUMMARY
  );
}

// ============================================================================
// Raw Material Issuance
// ============================================================================
export async function rawMaterialIssuanceCreate(
  payload: Record<string, any>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.RAW_MATERIAL_ISSUANCES.ROOT,
    payload
  );
}

export async function rawMaterialIssuanceList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.RAW_MATERIAL_ISSUANCES.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function rawMaterialIssuanceDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.RAW_MATERIAL_ISSUANCES.DETAIL(id));
}

// ============================================================================
// Daily Book Close
// ============================================================================
export async function dailyBookCloseList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.DAILY_BOOK_CLOSE.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function dailyBookCloseCreate(
  payload: Record<string, any>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.DAILY_BOOK_CLOSE.ROOT,
    payload
  );
}

export async function dailyBookCloseStatus(
  date?: string
): Promise<Record<string, any>> {
  const params = date ? { date } : {};
  return api.get<Record<string, any>>(
    withQuery(API_ENDPOINTS.DAILY_BOOK_CLOSE.STATUS, params)
  );
}

// ============================================================================
// Daily Reports
// ============================================================================
export async function dailyReportList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<Record<string, any>>> {
  const data = await api.get<
    PaginatedResponse<Record<string, any>> | Record<string, any>[]
  >(withQuery(API_ENDPOINTS.DAILY_REPORTS.ROOT, params));
  return normalizePaginated(data) as PaginatedResponse<Record<string, any>>;
}

export async function dailyReportCreate(
  payload: Record<string, any>
): Promise<Record<string, any>> {
  return api.post<Record<string, any>>(
    API_ENDPOINTS.DAILY_REPORTS.ROOT,
    payload
  );
}

export async function dailyReportDashboard(
  date?: string
): Promise<Record<string, any>> {
  const params = date ? { date } : {};
  return api.get<Record<string, any>>(
    withQuery(API_ENDPOINTS.DAILY_REPORTS.DASHBOARD, params)
  );
}

// ============================================================================
// Master Data Management
// ============================================================================

export interface MasterDataItem {
  id: string;
  name: string;
  code?: string | null;
}

export interface GoldCarat extends MasterDataItem {
  value: number;
  is_standard: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetalType extends MasterDataItem {
  created_at: string;
  updated_at: string;
}

export interface MetalColor extends MasterDataItem {
  metal_type?: string;
  metal_type_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemGroup extends MasterDataItem {
  created_at: string;
  updated_at: string;
}

// Raw Material Purchase Masters
export interface GemstoneType extends MasterDataItem {
  created_at: string;
  updated_at: string;
}

export interface GemstoneShape extends MasterDataItem {
  created_at: string;
  updated_at: string;
}

export interface GemstoneColor extends MasterDataItem {
  created_at: string;
  updated_at: string;
}

export interface GemstoneClarity extends MasterDataItem {
  created_at: string;
  updated_at: string;
}

export interface GemstoneTreatment extends MasterDataItem {
  created_at: string;
  updated_at: string;
}

export interface Origin extends MasterDataItem {
  material_type?: "diamond" | "gemstone" | "all";
  material_type_display?: string;
  created_at: string;
  updated_at: string;
}

export interface Cut extends MasterDataItem {
  created_at: string;
  updated_at: string;
}

export interface Polish extends MasterDataItem {
  created_at: string;
  updated_at: string;
}

export interface Symmetry extends MasterDataItem {
  created_at: string;
  updated_at: string;
}

export interface MasterDataRequest {
  id: string;
  master_type: string;
  master_type_display: string;
  requested_value: string;
  additional_info?: string;
  status: "pending" | "approved" | "rejected";
  status_display: string;
  requested_by: string;
  requested_by_name: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

// Gold Carats
export async function goldCaratsList(): Promise<GoldCarat[]> {
  const response = await api.get<{ results: GoldCarat[] }>(
    "/masters/gold-carats/"
  );
  return response.results || [];
}

export async function goldCaratCreate(
  payload: Partial<GoldCarat>
): Promise<GoldCarat> {
  return api.post<GoldCarat>("/masters/gold-carats/", payload);
}

export async function goldCaratUpdate(
  id: Identifier,
  payload: Partial<GoldCarat>
): Promise<GoldCarat> {
  return api.put<GoldCarat>(`/masters/gold-carats/${id}/`, payload);
}

export async function goldCaratDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/gold-carats/${id}/`);
}

// Metal Types
export async function metalTypesList(): Promise<MetalType[]> {
  const response = await api.get<{ results: MetalType[] }>(
    "/masters/metal-types/"
  );
  return response.results || [];
}

export async function metalTypeCreate(
  payload: Partial<MetalType>
): Promise<MetalType> {
  return api.post<MetalType>("/masters/metal-types/", payload);
}

export async function metalTypeUpdate(
  id: Identifier,
  payload: Partial<MetalType>
): Promise<MetalType> {
  return api.put<MetalType>(`/masters/metal-types/${id}/`, payload);
}

export async function metalTypeDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/metal-types/${id}/`);
}

// Metal Colors
export async function metalColorsList(): Promise<MetalColor[]> {
  const response = await api.get<{ results: MetalColor[] }>(
    "/masters/metal-colors/"
  );
  return response.results || [];
}

export async function metalColorCreate(
  payload: Partial<MetalColor>
): Promise<MetalColor> {
  return api.post<MetalColor>("/masters/metal-colors/", payload);
}

export async function metalColorUpdate(
  id: Identifier,
  payload: Partial<MetalColor>
): Promise<MetalColor> {
  return api.put<MetalColor>(`/masters/metal-colors/${id}/`, payload);
}

export async function metalColorDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/metal-colors/${id}/`);
}

// Item Groups
export async function itemGroupsList(): Promise<ItemGroup[]> {
  const response = await api.get<{ results: ItemGroup[] }>(
    "/masters/item-groups/"
  );
  return response.results || [];
}

export async function itemGroupCreate(
  payload: Partial<ItemGroup>
): Promise<ItemGroup> {
  return api.post<ItemGroup>("/masters/item-groups/", payload);
}

export async function itemGroupUpdate(
  id: Identifier,
  payload: Partial<ItemGroup>
): Promise<ItemGroup> {
  return api.put<ItemGroup>(`/masters/item-groups/${id}/`, payload);
}

export async function itemGroupDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/item-groups/${id}/`);
}

// Item Names
export async function itemNamesList(): Promise<MasterDataItem[]> {
  const response = await api.get<{ results: MasterDataItem[] }>(
    "/masters/item-names/"
  );
  return response.results || [];
}

export async function itemNameCreate(
  payload: Partial<MasterDataItem>
): Promise<MasterDataItem> {
  return api.post<MasterDataItem>("/masters/item-names/", payload);
}

export async function itemNameUpdate(
  id: Identifier,
  payload: Partial<MasterDataItem>
): Promise<MasterDataItem> {
  return api.put<MasterDataItem>(`/masters/item-names/${id}/`, payload);
}

export async function itemNameDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/item-names/${id}/`);
}

// Clarities
export async function claritiesList(): Promise<MasterDataItem[]> {
  const response = await api.get<{ results: MasterDataItem[] }>(
    "/masters/clarities/"
  );
  return response.results || [];
}

export async function clarityCreate(
  payload: Partial<MasterDataItem>
): Promise<MasterDataItem> {
  return api.post<MasterDataItem>("/masters/clarities/", payload);
}

export async function clarityUpdate(
  id: Identifier,
  payload: Partial<MasterDataItem>
): Promise<MasterDataItem> {
  return api.put<MasterDataItem>(`/masters/clarities/${id}/`, payload);
}

export async function clarityDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/clarities/${id}/`);
}

// Shapes
export async function shapesList(): Promise<MasterDataItem[]> {
  const response = await api.get<{ results: MasterDataItem[] }>(
    "/masters/shapes/"
  );
  return response.results || [];
}

export async function shapeCreate(
  payload: Partial<MasterDataItem>
): Promise<MasterDataItem> {
  return api.post<MasterDataItem>("/masters/shapes/", payload);
}

export async function shapeUpdate(
  id: Identifier,
  payload: Partial<MasterDataItem>
): Promise<MasterDataItem> {
  return api.put<MasterDataItem>(`/masters/shapes/${id}/`, payload);
}

export async function shapeDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/shapes/${id}/`);
}

// Colours
export async function coloursList(): Promise<MasterDataItem[]> {
  const response = await api.get<{ results: MasterDataItem[] }>(
    "/masters/colours/"
  );
  return response.results || [];
}

// Sizes
export async function sizesList(): Promise<MasterDataItem[]> {
  const response = await api.get<{ results: MasterDataItem[] }>(
    "/masters/sizes/"
  );
  return response.results || [];
}

export async function sizeCreate(
  payload: Partial<MasterDataItem>
): Promise<MasterDataItem> {
  return api.post<MasterDataItem>("/masters/sizes/", payload);
}

export async function sizeUpdate(
  id: Identifier,
  payload: Partial<MasterDataItem>
): Promise<MasterDataItem> {
  return api.put<MasterDataItem>(`/masters/sizes/${id}/`, payload);
}

export async function sizeDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/sizes/${id}/`);
}

// Units
export async function unitsList(): Promise<MasterDataItem[]> {
  const response = await api.get<{ results: MasterDataItem[] }>(
    "/masters/units/"
  );
  return response.results || [];
}

// Labs
export async function labsList(): Promise<MasterDataItem[]> {
  const response = await api.get<{ results: MasterDataItem[] }>(
    "/masters/labs/"
  );
  return response.results || [];
}

export async function labCreate(
  payload: Partial<MasterDataItem>
): Promise<MasterDataItem> {
  return api.post<MasterDataItem>("/masters/labs/", payload);
}

export async function labUpdate(
  id: Identifier,
  payload: Partial<MasterDataItem>
): Promise<MasterDataItem> {
  return api.put<MasterDataItem>(`/masters/labs/${id}/`, payload);
}

export async function labDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/labs/${id}/`);
}

// ============================================================================
// Raw Material Purchase Masters CRUD
// ============================================================================

// Gemstone Types
export async function gemstoneTypesList(): Promise<GemstoneType[]> {
  const response = await api.get<{ results: GemstoneType[] }>(
    "/masters/gemstone-types/"
  );
  return response.results || [];
}

export async function gemstoneTypeCreate(
  payload: Partial<GemstoneType>
): Promise<GemstoneType> {
  return api.post<GemstoneType>("/masters/gemstone-types/", payload);
}

export async function gemstoneTypeUpdate(
  id: Identifier,
  payload: Partial<GemstoneType>
): Promise<GemstoneType> {
  return api.put<GemstoneType>(`/masters/gemstone-types/${id}/`, payload);
}

export async function gemstoneTypeDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/gemstone-types/${id}/`);
}

// Gemstone Shapes
export async function gemstoneShapesList(): Promise<GemstoneShape[]> {
  const response = await api.get<{ results: GemstoneShape[] }>(
    "/masters/gemstone-shapes/"
  );
  return response.results || [];
}

export async function gemstoneShapeCreate(
  payload: Partial<GemstoneShape>
): Promise<GemstoneShape> {
  return api.post<GemstoneShape>("/masters/gemstone-shapes/", payload);
}

export async function gemstoneShapeUpdate(
  id: Identifier,
  payload: Partial<GemstoneShape>
): Promise<GemstoneShape> {
  return api.put<GemstoneShape>(`/masters/gemstone-shapes/${id}/`, payload);
}

export async function gemstoneShapeDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/gemstone-shapes/${id}/`);
}

// Gemstone Colors
export async function gemstoneColorsList(): Promise<GemstoneColor[]> {
  const response = await api.get<{ results: GemstoneColor[] }>(
    "/masters/gemstone-colors/"
  );
  return response.results || [];
}

export async function gemstoneColorCreate(
  payload: Partial<GemstoneColor>
): Promise<GemstoneColor> {
  return api.post<GemstoneColor>("/masters/gemstone-colors/", payload);
}

export async function gemstoneColorUpdate(
  id: Identifier,
  payload: Partial<GemstoneColor>
): Promise<GemstoneColor> {
  return api.put<GemstoneColor>(`/masters/gemstone-colors/${id}/`, payload);
}

export async function gemstoneColorDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/gemstone-colors/${id}/`);
}

// Gemstone Clarities
export async function gemstoneClaritiesList(): Promise<GemstoneClarity[]> {
  const response = await api.get<{ results: GemstoneClarity[] }>(
    "/masters/gemstone-clarities/"
  );
  return response.results || [];
}

export async function gemstoneClarityCreate(
  payload: Partial<GemstoneClarity>
): Promise<GemstoneClarity> {
  return api.post<GemstoneClarity>("/masters/gemstone-clarities/", payload);
}

export async function gemstoneClarityUpdate(
  id: Identifier,
  payload: Partial<GemstoneClarity>
): Promise<GemstoneClarity> {
  return api.put<GemstoneClarity>(
    `/masters/gemstone-clarities/${id}/`,
    payload
  );
}

export async function gemstoneClarityDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/gemstone-clarities/${id}/`);
}

// Gemstone Treatments
export async function gemstoneTreatmentsList(): Promise<GemstoneTreatment[]> {
  const response = await api.get<{ results: GemstoneTreatment[] }>(
    "/masters/gemstone-treatments/"
  );
  return response.results || [];
}

export async function gemstoneTreatmentCreate(
  payload: Partial<GemstoneTreatment>
): Promise<GemstoneTreatment> {
  return api.post<GemstoneTreatment>("/masters/gemstone-treatments/", payload);
}

export async function gemstoneTreatmentUpdate(
  id: Identifier,
  payload: Partial<GemstoneTreatment>
): Promise<GemstoneTreatment> {
  return api.put<GemstoneTreatment>(
    `/masters/gemstone-treatments/${id}/`,
    payload
  );
}

export async function gemstoneTreatmentDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/gemstone-treatments/${id}/`);
}

// Origins
export async function originsList(
  params?: Record<string, QueryValue>
): Promise<Origin[]> {
  const url = withQuery("/masters/origins/", params);
  const response = await api.get<{ results: Origin[] }>(url);
  return response.results || [];
}

export async function originCreate(payload: Partial<Origin>): Promise<Origin> {
  return api.post<Origin>("/masters/origins/", payload);
}

export async function originUpdate(
  id: Identifier,
  payload: Partial<Origin>
): Promise<Origin> {
  return api.put<Origin>(`/masters/origins/${id}/`, payload);
}

export async function originDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/origins/${id}/`);
}

// Cuts
export async function cutsList(): Promise<Cut[]> {
  const response = await api.get<{ results: Cut[] }>("/masters/cuts/");
  return response.results || [];
}

export async function cutCreate(payload: Partial<Cut>): Promise<Cut> {
  return api.post<Cut>("/masters/cuts/", payload);
}

export async function cutUpdate(
  id: Identifier,
  payload: Partial<Cut>
): Promise<Cut> {
  return api.put<Cut>(`/masters/cuts/${id}/`, payload);
}

export async function cutDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/cuts/${id}/`);
}

// Polishes
export async function polishesList(): Promise<Polish[]> {
  const response = await api.get<{ results: Polish[] }>("/masters/polishes/");
  return response.results || [];
}

export async function polishCreate(payload: Partial<Polish>): Promise<Polish> {
  return api.post<Polish>("/masters/polishes/", payload);
}

export async function polishUpdate(
  id: Identifier,
  payload: Partial<Polish>
): Promise<Polish> {
  return api.put<Polish>(`/masters/polishes/${id}/`, payload);
}

export async function polishDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/polishes/${id}/`);
}

// Symmetries
export async function symmetriesList(): Promise<Symmetry[]> {
  const response = await api.get<{ results: Symmetry[] }>(
    "/masters/symmetries/"
  );
  return response.results || [];
}

export async function symmetryCreate(
  payload: Partial<Symmetry>
): Promise<Symmetry> {
  return api.post<Symmetry>("/masters/symmetries/", payload);
}

export async function symmetryUpdate(
  id: Identifier,
  payload: Partial<Symmetry>
): Promise<Symmetry> {
  return api.put<Symmetry>(`/masters/symmetries/${id}/`, payload);
}

export async function symmetryDelete(id: Identifier): Promise<void> {
  await api.delete<void>(`/masters/symmetries/${id}/`);
}

// Master Data Requests
export async function masterRequestsList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<MasterDataRequest>> {
  const url = withQuery("/masters/master-requests/", params);
  return api.get<PaginatedResponse<MasterDataRequest>>(url);
}

export async function masterRequestCreate(payload: {
  master_type: string;
  requested_value: string;
  additional_info?: string;
}): Promise<MasterDataRequest> {
  return api.post<MasterDataRequest>("/masters/master-requests/", payload);
}

export async function masterRequestPending(): Promise<MasterDataRequest[]> {
  return api.get<MasterDataRequest[]>("/masters/master-requests/pending/");
}

export async function masterRequestApprove(
  id: Identifier
): Promise<{ message: string }> {
  return api.post<{ message: string }>(
    `/masters/master-requests/${id}/approve/`,
    {}
  );
}

export async function masterRequestReject(
  id: Identifier,
  rejection_reason?: string
): Promise<{ message: string }> {
  return api.post<{ message: string }>(
    `/masters/master-requests/${id}/reject/`,
    { rejection_reason }
  );
}

// ============================================================================
// 2D Design endpoints
// ============================================================================
export type TwoDDesign = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  is_draft?: boolean;
  images?: {
    id: string;
    image: string;
    image_url?: string;
    field_type?: string;
  }[];
  created_at: string;
  updated_at: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function twoDDesignDetail(id: Identifier): Promise<TwoDDesign> {
  return api.get<TwoDDesign>(API_ENDPOINTS.TWO_D_DESIGNS.DETAIL(id));
}

export async function twoDDesignCreate(payload: FormData): Promise<TwoDDesign> {
  return api.postFormData<TwoDDesign>(
    API_ENDPOINTS.TWO_D_DESIGNS.ROOT,
    payload
  );
}

export async function twoDDesignUpdate(
  id: Identifier,
  payload: FormData
): Promise<TwoDDesign> {
  return api.patchFormData<TwoDDesign>(
    API_ENDPOINTS.TWO_D_DESIGNS.DETAIL(id),
    payload
  );
}

// ============================================================================
// 3D Design endpoints
// ============================================================================
export type ThreeDDesign = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  design_image?: string;
  design_image_url?: string;
  approved_design_image?: string;
  approved_design_image_url?: string;
  is_draft?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function threeDDesignList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<ThreeDDesign>> {
  const data = await api.get<PaginatedResponse<ThreeDDesign> | ThreeDDesign[]>(
    withQuery(API_ENDPOINTS.THREE_D_DESIGNS.ROOT, params)
  );
  return normalizePaginated(data);
}

export async function threeDDesignDetail(
  id: Identifier
): Promise<ThreeDDesign> {
  return api.get<ThreeDDesign>(API_ENDPOINTS.THREE_D_DESIGNS.DETAIL(id));
}

export async function threeDDesignCreate(
  payload: FormData
): Promise<ThreeDDesign> {
  return api.postFormData<ThreeDDesign>(
    API_ENDPOINTS.THREE_D_DESIGNS.ROOT,
    payload
  );
}

export async function threeDDesignUpdate(
  id: Identifier,
  payload: FormData
): Promise<ThreeDDesign> {
  return api.patchFormData<ThreeDDesign>(
    API_ENDPOINTS.THREE_D_DESIGNS.DETAIL(id),
    payload
  );
}

export async function threeDDesignDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.THREE_D_DESIGNS.DETAIL(id));
}

// ============================================================================
// 3D Printing/CAM Piece endpoints
// ============================================================================
export type ThreeDPrintingCAM = {
  id: string;
  account_order_id: string;
  cam_piece_image?: string;
  cam_piece_image_url?: string;
  cam_piece_quality_check?: boolean;
  qc_failure_reasons?: string;
  approved_cam_piece?: string;
  approved_cam_piece_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
};

// Overview/Statistics API
export async function threeDPrintingCAMOverview(): Promise<{
  total_records: number;
  recent_records_count: number;
  latest_records: ThreeDPrintingCAM[];
}> {
  return api.get(API_ENDPOINTS.THREE_D_PRINTING_CAM.OVERVIEW);
}

export async function threeDPrintingCAMList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<ThreeDPrintingCAM>> {
  const data = await api.get<
    PaginatedResponse<ThreeDPrintingCAM> | ThreeDPrintingCAM[]
  >(withQuery(API_ENDPOINTS.THREE_D_PRINTING_CAM.ROOT, params));
  return normalizePaginated(data);
}

export async function threeDPrintingCAMDetail(
  id: Identifier
): Promise<ThreeDPrintingCAM> {
  return api.get<ThreeDPrintingCAM>(
    API_ENDPOINTS.THREE_D_PRINTING_CAM.DETAIL(id)
  );
}

export async function threeDPrintingCAMCreate(
  payload: FormData
): Promise<ThreeDPrintingCAM> {
  return api.postFormData<ThreeDPrintingCAM>(
    API_ENDPOINTS.THREE_D_PRINTING_CAM.ROOT,
    payload
  );
}

export async function threeDPrintingCAMUpdate(
  id: Identifier,
  payload: FormData
): Promise<ThreeDPrintingCAM> {
  return api.patchFormData<ThreeDPrintingCAM>(
    API_ENDPOINTS.THREE_D_PRINTING_CAM.DETAIL(id),
    payload
  );
}

export async function threeDPrintingCAMDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.THREE_D_PRINTING_CAM.DETAIL(id));
}

// ============================================================================
// Ghat Approval endpoints
// ============================================================================
export type GhatApproval = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  ghat_approval: boolean;
  carry_forward_image?: string;
  carry_forward_image_url?: string;
  is_draft?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function ghatApprovalList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<GhatApproval>> {
  const data = await api.get<PaginatedResponse<GhatApproval> | GhatApproval[]>(
    withQuery(API_ENDPOINTS.GHAT_APPROVALS.ROOT, params)
  );
  return normalizePaginated(data);
}

export async function ghatApprovalDetail(
  id: Identifier
): Promise<GhatApproval> {
  return api.get<GhatApproval>(API_ENDPOINTS.GHAT_APPROVALS.DETAIL(id));
}

export async function ghatApprovalCreate(
  payload: FormData
): Promise<GhatApproval> {
  return api.postFormData<GhatApproval>(
    API_ENDPOINTS.GHAT_APPROVALS.ROOT,
    payload
  );
}

export async function ghatApprovalUpdate(
  id: Identifier,
  payload: FormData
): Promise<GhatApproval> {
  return api.patchFormData<GhatApproval>(
    API_ENDPOINTS.GHAT_APPROVALS.DETAIL(id),
    payload
  );
}

export async function ghatApprovalDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.GHAT_APPROVALS.DETAIL(id));
}

export async function ghatApprovalOverview(): Promise<{
  total_records: number;
  recent_activity: number;
  approved_count: number;
}> {
  // For now, we'll get stats from the list endpoint
  // In future, backend can provide a dedicated overview endpoint
  try {
    const response = await ghatApprovalList({ page_size: 100 });
    const records = response.results || response.items || [];

    // Calculate recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentActivity = records.filter((record: GhatApproval) => {
      const createdAt = new Date(record.created_at || "");
      return createdAt >= oneWeekAgo;
    }).length;

    // Count approved records
    const approvedCount = records.filter(
      (record: GhatApproval) => record.ghat_approval === true
    ).length;

    return {
      total_records: records.length,
      recent_activity: recentActivity,
      approved_count: approvedCount,
    };
  } catch (error) {
    console.error("Failed to fetch overview data:", error);
    return {
      total_records: 0,
      recent_activity: 0,
      approved_count: 0,
    };
  }
}

// ============================================================================
// Ghat Quality Check endpoints
// ============================================================================
export type GhatQualityCheck = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  carry_forward_image?: string;
  carry_forward_image_url?: string;
  is_draft?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function ghatQualityCheckList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<GhatQualityCheck>> {
  const data = await api.get<
    PaginatedResponse<GhatQualityCheck> | GhatQualityCheck[]
  >(withQuery(API_ENDPOINTS.GHAT_QUALITY_CHECKS.ROOT, params));
  return normalizePaginated(data);
}

export async function ghatQualityCheckDetail(
  id: Identifier
): Promise<GhatQualityCheck> {
  return api.get<GhatQualityCheck>(
    API_ENDPOINTS.GHAT_QUALITY_CHECKS.DETAIL(id)
  );
}

export async function ghatQualityCheckCreate(
  payload: FormData
): Promise<GhatQualityCheck> {
  return api.postFormData<GhatQualityCheck>(
    API_ENDPOINTS.GHAT_QUALITY_CHECKS.ROOT,
    payload
  );
}

export async function ghatQualityCheckUpdate(
  id: Identifier,
  payload: FormData
): Promise<GhatQualityCheck> {
  return api.patchFormData<GhatQualityCheck>(
    API_ENDPOINTS.GHAT_QUALITY_CHECKS.DETAIL(id),
    payload
  );
}

export async function ghatQualityCheckDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.GHAT_QUALITY_CHECKS.DETAIL(id));
}

export async function ghatQualityCheckOverview(): Promise<{
  total_records: number;
  recent_activity: number;
}> {
  // For now, we'll get stats from the list endpoint
  // In future, backend can provide a dedicated overview endpoint
  try {
    const response = await ghatQualityCheckList({ page_size: 100 });
    const records = response.results || response.items || [];

    // Calculate recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentActivity = records.filter((record: GhatQualityCheck) => {
      const createdAt = new Date(record.created_at || "");
      return createdAt >= oneWeekAgo;
    }).length;

    return {
      total_records: records.length,
      recent_activity: recentActivity,
    };
  } catch (error) {
    console.error("Failed to fetch overview data:", error);
    return {
      total_records: 0,
      recent_activity: 0,
    };
  }
}

// ============================================================================
// Stone Demand to Bagging endpoints
// ============================================================================
export type StoneDemandToBagging = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  // New fields
  diamond_color_stone?: string;
  batch_id?: string;
  master_size?: string;
  shape?: string;
  mm_size?: string;
  no_of_pieces?: number;
  estimated_total_carat_weight?: number | string;
  // Multiple items support
  stone_items?: Array<{
    diamond_color_stone?: string;
    batch_id?: string;
    master_size?: string;
    shape?: string;
    mm_size?: string;
    no_of_pieces?: number;
    estimated_total_carat_weight?: string;
  }>;
  // Legacy fields (kept for backward compatibility)
  measurement_details?: Array<{
    column?: string;
    type?: string;
    details?: string;
  }>;
  sent?: Array<{
    pieces?: number;
    total_ct?: number;
    weight?: number;
  }>;
  total?: Array<{
    pieces?: number;
    total_ct?: number;
    weight?: number;
  }>;
  approved_bagging_list?: string;
  approved_bagging_list_url?: string;
  carry_forward_image?: string;
  carry_forward_image_url?: string;
  is_draft?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function stoneDemandToBaggingList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<StoneDemandToBagging>> {
  const data = await api.get<
    PaginatedResponse<StoneDemandToBagging> | StoneDemandToBagging[]
  >(withQuery(API_ENDPOINTS.STONE_DEMAND_TO_BAGGING.ROOT, params));
  return normalizePaginated(data);
}

export async function stoneDemandToBaggingDetail(
  id: Identifier
): Promise<StoneDemandToBagging> {
  return api.get<StoneDemandToBagging>(
    API_ENDPOINTS.STONE_DEMAND_TO_BAGGING.DETAIL(id)
  );
}

export async function stoneDemandToBaggingCreate(
  payload: FormData
): Promise<StoneDemandToBagging> {
  return api.postFormData<StoneDemandToBagging>(
    API_ENDPOINTS.STONE_DEMAND_TO_BAGGING.ROOT,
    payload
  );
}

export async function stoneDemandToBaggingUpdate(
  id: Identifier,
  payload: FormData
): Promise<StoneDemandToBagging> {
  return api.patchFormData<StoneDemandToBagging>(
    API_ENDPOINTS.STONE_DEMAND_TO_BAGGING.DETAIL(id),
    payload
  );
}

export async function stoneDemandToBaggingDelete(
  id: Identifier
): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.STONE_DEMAND_TO_BAGGING.DETAIL(id));
}

export async function stoneDemandToBaggingOverview(): Promise<{
  total_records: number;
  recent_activity: number;
  recent_records: StoneDemandToBagging[];
}> {
  try {
    // Get all records to calculate statistics
    const response = await stoneDemandToBaggingList({
      page: 1,
      page_size: 100,
    });
    const records = response.results || response.items || [];

    // Calculate recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentActivity = records.filter((record: StoneDemandToBagging) => {
      const createdAt = new Date(record.created_at || "");
      return createdAt >= oneWeekAgo;
    }).length;

    // Get latest 5 records
    const recentRecords = records.slice(0, 5);

    return {
      total_records: records.length,
      recent_activity: recentActivity,
      recent_records: recentRecords,
    };
  } catch (error) {
    console.error("Failed to fetch overview stats:", error);
    return {
      total_records: 0,
      recent_activity: 0,
      recent_records: [],
    };
  }
}

// ============================================================================
// Pre-Rhodium Quality Check endpoints
// ============================================================================
export type PreRhodiumQualityCheck = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  quality_check?: boolean;
  quality_check_image?: string;
  quality_check_image_url?: string;
  is_draft?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function preRhodiumQualityCheckList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<PreRhodiumQualityCheck>> {
  const data = await api.get<
    PaginatedResponse<PreRhodiumQualityCheck> | PreRhodiumQualityCheck[]
  >(withQuery(API_ENDPOINTS.PRE_RHODIUM_QUALITY_CHECKS.ROOT, params));
  return normalizePaginated(data);
}

export async function preRhodiumQualityCheckDetail(
  id: Identifier
): Promise<PreRhodiumQualityCheck> {
  return api.get<PreRhodiumQualityCheck>(
    API_ENDPOINTS.PRE_RHODIUM_QUALITY_CHECKS.DETAIL(id)
  );
}

export async function preRhodiumQualityCheckCreate(
  payload: FormData
): Promise<PreRhodiumQualityCheck> {
  return api.postFormData<PreRhodiumQualityCheck>(
    API_ENDPOINTS.PRE_RHODIUM_QUALITY_CHECKS.ROOT,
    payload
  );
}

export async function preRhodiumQualityCheckUpdate(
  id: Identifier,
  payload: FormData
): Promise<PreRhodiumQualityCheck> {
  return api.patchFormData<PreRhodiumQualityCheck>(
    API_ENDPOINTS.PRE_RHODIUM_QUALITY_CHECKS.DETAIL(id),
    payload
  );
}

export async function preRhodiumQualityCheckDelete(
  id: Identifier
): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.PRE_RHODIUM_QUALITY_CHECKS.DETAIL(id));
}

export async function preRhodiumQualityCheckOverview(): Promise<{
  total_records: number;
  recent_activity: number;
}> {
  // For now, we'll get stats from the list endpoint
  // In future, backend can provide a dedicated overview endpoint
  try {
    const response = await preRhodiumQualityCheckList({ page_size: 100 });
    const records = response.results || response.items || [];

    // Calculate recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentActivity = records.filter((record: PreRhodiumQualityCheck) => {
      const createdAt = new Date(record.created_at || "");
      return createdAt >= oneWeekAgo;
    }).length;

    return {
      total_records: records.length,
      recent_activity: recentActivity,
    };
  } catch (error) {
    console.error("Failed to fetch overview stats:", error);
    return {
      total_records: 0,
      recent_activity: 0,
    };
  }
}

// ============================================================================
// Final Quality Check endpoints
// ============================================================================
export type FinalQualityCheck = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  final_quality_check?: boolean;
  final_quality_check_image?: string;
  final_quality_check_image_url?: string;
  is_draft?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function finalQualityCheckList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<FinalQualityCheck>> {
  const data = await api.get<
    PaginatedResponse<FinalQualityCheck> | FinalQualityCheck[]
  >(withQuery(API_ENDPOINTS.FINAL_QUALITY_CHECKS.ROOT, params));
  return normalizePaginated(data);
}

export async function finalQualityCheckDetail(
  id: Identifier
): Promise<FinalQualityCheck> {
  return api.get<FinalQualityCheck>(
    API_ENDPOINTS.FINAL_QUALITY_CHECKS.DETAIL(id)
  );
}

export async function finalQualityCheckCreate(
  payload: FormData
): Promise<FinalQualityCheck> {
  return api.postFormData<FinalQualityCheck>(
    API_ENDPOINTS.FINAL_QUALITY_CHECKS.ROOT,
    payload
  );
}

export async function finalQualityCheckUpdate(
  id: Identifier,
  payload: FormData
): Promise<FinalQualityCheck> {
  return api.patchFormData<FinalQualityCheck>(
    API_ENDPOINTS.FINAL_QUALITY_CHECKS.DETAIL(id),
    payload
  );
}

export async function finalQualityCheckDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.FINAL_QUALITY_CHECKS.DETAIL(id));
}

// ============================================================================
// Item Final Packing List endpoints
// ============================================================================
export type ItemFinalPackingList = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  jewellery_piece_image?: string;
  jewellery_piece_image_url?: string;
  is_draft?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function itemFinalPackingListList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<ItemFinalPackingList>> {
  const data = await api.get<
    PaginatedResponse<ItemFinalPackingList> | ItemFinalPackingList[]
  >(withQuery(API_ENDPOINTS.ITEM_FINAL_PACKING_LISTS.ROOT, params));
  return normalizePaginated(data);
}

export async function itemFinalPackingListDetail(
  id: Identifier
): Promise<ItemFinalPackingList> {
  return api.get<ItemFinalPackingList>(
    API_ENDPOINTS.ITEM_FINAL_PACKING_LISTS.DETAIL(id)
  );
}

export async function itemFinalPackingListCreate(
  payload: FormData
): Promise<ItemFinalPackingList> {
  return api.postFormData<ItemFinalPackingList>(
    API_ENDPOINTS.ITEM_FINAL_PACKING_LISTS.ROOT,
    payload
  );
}

export async function itemFinalPackingListUpdate(
  id: Identifier,
  payload: FormData
): Promise<ItemFinalPackingList> {
  return api.patchFormData<ItemFinalPackingList>(
    API_ENDPOINTS.ITEM_FINAL_PACKING_LISTS.DETAIL(id),
    payload
  );
}

export async function itemFinalPackingListDelete(
  id: Identifier
): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.ITEM_FINAL_PACKING_LISTS.DETAIL(id));
}

export async function itemFinalPackingListOverview(): Promise<{
  total_records: number;
  recent_activity: number;
  recent_records: ItemFinalPackingList[];
}> {
  try {
    // Get all records to calculate statistics
    const response = await itemFinalPackingListList({
      page: 1,
      page_size: 100,
    });
    const records = response.results || response.items || [];

    // Calculate recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentActivity = records.filter((record: ItemFinalPackingList) => {
      const createdAt = new Date(record.created_at || "");
      return createdAt >= oneWeekAgo;
    }).length;

    // Get latest 5 records
    const recentRecords = records.slice(0, 5);

    return {
      total_records: records.length,
      recent_activity: recentActivity,
      recent_records: recentRecords,
    };
  } catch (error) {
    console.error("Failed to fetch overview stats:", error);
    return {
      total_records: 0,
      recent_activity: 0,
      recent_records: [],
    };
  }
}

// ============================================================================
// Raw Material Tally endpoints
// ============================================================================
export type RawMaterialTally = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  carry_forward_image?: string;
  carry_forward_image_url?: string;
  raw_material_movement?: Array<{
    material?: string;
    quantity?: number | string;
    unit?: string;
  }>;
  is_draft?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function rawMaterialTallyOverview(): Promise<{
  total_records: number;
  recent_activity: number;
  recent_records: RawMaterialTally[];
}> {
  try {
    const data = await api.get<{
      total_records?: number;
      recent_activity?: number;
      recent_records?: RawMaterialTally[];
    }>(API_ENDPOINTS.RAW_MATERIAL_TALLIES.OVERVIEW);
    return {
      total_records: data.total_records || 0,
      recent_activity: data.recent_activity || 0,
      recent_records: data.recent_records || [],
    };
  } catch (error) {
    console.warn(
      "Failed to fetch raw material tally overview, using fallback:",
      error
    );
    return {
      total_records: 0,
      recent_activity: 0,
      recent_records: [],
    };
  }
}

export async function rawMaterialTallyList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<RawMaterialTally>> {
  const data = await api.get<
    PaginatedResponse<RawMaterialTally> | RawMaterialTally[]
  >(withQuery(API_ENDPOINTS.RAW_MATERIAL_TALLIES.ROOT, params));
  return normalizePaginated(data);
}

export async function rawMaterialTallyDetail(
  id: Identifier
): Promise<RawMaterialTally> {
  return api.get<RawMaterialTally>(
    API_ENDPOINTS.RAW_MATERIAL_TALLIES.DETAIL(id)
  );
}

export async function rawMaterialTallyCreate(
  payload: FormData
): Promise<RawMaterialTally> {
  return api.postFormData<RawMaterialTally>(
    API_ENDPOINTS.RAW_MATERIAL_TALLIES.ROOT,
    payload
  );
}

export async function rawMaterialTallyUpdate(
  id: Identifier,
  payload: FormData
): Promise<RawMaterialTally> {
  return api.patchFormData<RawMaterialTally>(
    API_ENDPOINTS.RAW_MATERIAL_TALLIES.DETAIL(id),
    payload
  );
}

export async function rawMaterialTallyDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.RAW_MATERIAL_TALLIES.DETAIL(id));
}

// ============================================================================
// Metal Issue endpoints
// ============================================================================
export type MetalIssue = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  carry_forward_image?: string;
  carry_forward_image_url?: string;
  is_draft?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function metalIssueList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<MetalIssue>> {
  const data = await api.get<PaginatedResponse<MetalIssue> | MetalIssue[]>(
    withQuery(API_ENDPOINTS.METAL_ISSUES.ROOT, params)
  );
  return normalizePaginated(data);
}

export async function metalIssueDetail(id: Identifier): Promise<MetalIssue> {
  return api.get<MetalIssue>(API_ENDPOINTS.METAL_ISSUES.DETAIL(id));
}

export async function metalIssueCreate(payload: FormData): Promise<MetalIssue> {
  return api.postFormData<MetalIssue>(API_ENDPOINTS.METAL_ISSUES.ROOT, payload);
}

export async function metalIssueUpdate(
  id: Identifier,
  payload: FormData
): Promise<MetalIssue> {
  return api.patchFormData<MetalIssue>(
    API_ENDPOINTS.METAL_ISSUES.DETAIL(id),
    payload
  );
}

export async function metalIssueDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.METAL_ISSUES.DETAIL(id));
}

// ============================================================================
// Bagging Ready endpoints
// ============================================================================
export type BaggingReady = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  carry_forward_image?: string;
  carry_forward_image_url?: string;
  is_draft?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function baggingReadyList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<BaggingReady>> {
  const data = await api.get<PaginatedResponse<BaggingReady> | BaggingReady[]>(
    withQuery(API_ENDPOINTS.BAGGING_READY.ROOT, params)
  );
  return normalizePaginated(data);
}

export async function baggingReadyDetail(
  id: Identifier
): Promise<BaggingReady> {
  return api.get<BaggingReady>(API_ENDPOINTS.BAGGING_READY.DETAIL(id));
}

export async function baggingReadyCreate(
  payload: FormData
): Promise<BaggingReady> {
  return api.postFormData<BaggingReady>(
    API_ENDPOINTS.BAGGING_READY.ROOT,
    payload
  );
}

export async function baggingReadyUpdate(
  id: Identifier,
  payload: FormData
): Promise<BaggingReady> {
  return api.patchFormData<BaggingReady>(
    API_ENDPOINTS.BAGGING_READY.DETAIL(id),
    payload
  );
}

export async function baggingReadyDelete(id: Identifier): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.BAGGING_READY.DETAIL(id));
}

// ============================================================================
// Diamond Purchase/Issue endpoints
// ============================================================================
export type DiamondPurchaseIssue = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  carry_forward_image?: string;
  carry_forward_image_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function diamondPurchaseIssueList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<DiamondPurchaseIssue>> {
  const data = await api.get<
    PaginatedResponse<DiamondPurchaseIssue> | DiamondPurchaseIssue[]
  >(withQuery(API_ENDPOINTS.DIAMOND_PURCHASE_ISSUE.ROOT, params));
  return normalizePaginated(data);
}

export async function diamondPurchaseIssueDetail(
  id: Identifier
): Promise<DiamondPurchaseIssue> {
  return api.get<DiamondPurchaseIssue>(
    API_ENDPOINTS.DIAMOND_PURCHASE_ISSUE.DETAIL(id)
  );
}

export async function diamondPurchaseIssueCreate(
  payload: FormData
): Promise<DiamondPurchaseIssue> {
  return api.postFormData<DiamondPurchaseIssue>(
    API_ENDPOINTS.DIAMOND_PURCHASE_ISSUE.ROOT,
    payload
  );
}

export async function diamondPurchaseIssueUpdate(
  id: Identifier,
  payload: FormData
): Promise<DiamondPurchaseIssue> {
  return api.patchFormData<DiamondPurchaseIssue>(
    API_ENDPOINTS.DIAMOND_PURCHASE_ISSUE.DETAIL(id),
    payload
  );
}

export async function diamondPurchaseIssueDelete(
  id: Identifier
): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.DIAMOND_PURCHASE_ISSUE.DETAIL(id));
}

// ============================================================================
// Gemstone Purchase/Issue endpoints
// ============================================================================
export type GemstonePurchaseIssue = {
  id: string;
  account_order_id?: string;
  order?: Identifier;
  order_id?: string;
  carry_forward_image?: string;
  carry_forward_image_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: Identifier;
  updated_by?: Identifier;
  company?: Identifier;
};

export async function gemstonePurchaseIssueList(
  params?: Record<string, QueryValue>
): Promise<PaginatedResponse<GemstonePurchaseIssue>> {
  const data = await api.get<
    PaginatedResponse<GemstonePurchaseIssue> | GemstonePurchaseIssue[]
  >(withQuery(API_ENDPOINTS.GEMSTONE_PURCHASE_ISSUE.ROOT, params));
  return normalizePaginated(data);
}

export async function gemstonePurchaseIssueDetail(
  id: Identifier
): Promise<GemstonePurchaseIssue> {
  return api.get<GemstonePurchaseIssue>(
    API_ENDPOINTS.GEMSTONE_PURCHASE_ISSUE.DETAIL(id)
  );
}

export async function gemstonePurchaseIssueCreate(
  payload: FormData
): Promise<GemstonePurchaseIssue> {
  return api.postFormData<GemstonePurchaseIssue>(
    API_ENDPOINTS.GEMSTONE_PURCHASE_ISSUE.ROOT,
    payload
  );
}

export async function gemstonePurchaseIssueUpdate(
  id: Identifier,
  payload: FormData
): Promise<GemstonePurchaseIssue> {
  return api.patchFormData<GemstonePurchaseIssue>(
    API_ENDPOINTS.GEMSTONE_PURCHASE_ISSUE.DETAIL(id),
    payload
  );
}

export async function gemstonePurchaseIssueDelete(
  id: Identifier
): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.GEMSTONE_PURCHASE_ISSUE.DETAIL(id));
}

// ============================================================================
// Gold Price Feeding API
// ============================================================================

export interface GoldPriceRate {
  id: string;
  gold_24k_rate: string;
  gold_22k_rate: string;
  silver_rate?: string;
  update_type: "OPENING" | "CLOSING";
  feeding_date: string;
  fed_by?: string;
  fed_by_name?: string;
  fed_at: string;
  updated_at: string;
  notes?: string;
}

export interface GoldPriceCurrentResponse {
  is_locked: boolean;
  needs_feeding: boolean;
  rate: GoldPriceRate | null;
}

export interface GoldPriceCreateData {
  gold_24k_rate: string | number;
  gold_22k_rate: string | number;
  silver_rate?: string | number;
  update_type: "OPENING" | "CLOSING";
  feeding_date: string;
  notes?: string;
}

export async function goldPricesCurrent(): Promise<GoldPriceCurrentResponse> {
  return api.get("/masters/gold-prices/current/");
}

export async function goldPricesCheckPermission(): Promise<{
  can_update: boolean;
}> {
  return api.get("/masters/gold-prices/check_permission/");
}

export async function goldPricesCreate(
  data: GoldPriceCreateData
): Promise<GoldPriceRate> {
  return api.post("/masters/gold-prices/", data);
}

export async function goldPricesList(
  params?: Record<string, QueryValue>
): Promise<{
  count: number;
  next: string | null;
  previous: string | null;
  results: GoldPriceRate[];
}> {
  return api.get(withQuery("/masters/gold-prices/", params));
}

// ============================================================================
// Department & Dashboard API
// ============================================================================

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  features: string[];
  can_edit_gold_price: boolean;
  can_view_accounting: boolean;
  can_view_production: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  type: string;
  position: number;
  size: string;
}

export interface DashboardConfiguration {
  id: string;
  department: Department;
  widgets: DashboardWidget[];
  layout_type: "GRID" | "LIST" | "CUSTOM";
  created_at: string;
  updated_at: string;
}

export async function departmentsMyDepartments(): Promise<Department[]> {
  return api.get("/masters/departments/my_departments/");
}

export async function departmentsCurrentActive(): Promise<Department> {
  return api.get("/masters/departments/current_active/");
}

export async function departmentsSetActive(departmentId: string): Promise<{
  message: string;
  department: Department;
}> {
  return api.post(`/masters/departments/${departmentId}/set_active/`);
}

export async function departmentsList(
  params?: Record<string, QueryValue>
): Promise<{
  count: number;
  next: string | null;
  previous: string | null;
  results: Department[];
}> {
  return api.get(withQuery("/masters/departments/", params));
}

export async function dashboardConfigCurrent(): Promise<DashboardConfiguration> {
  return api.get("/masters/dashboard-configs/current/");
}

/**
 * Convert Sales Query to Sale (Stage 2) - Migration Wrapper
 */
export const convertSalesQueryToSale = async (
  queryId: string | number,
  data: {
    item_name: string;
    selected_estimate_id?: string;
    confirm_conversion?: boolean;
    sale_notes?: string;
    advance_amount?: number;
  }
) => {
  // Ensure confirm_conversion is set
  const payload = { ...data, confirm_conversion: true };
  return api.post(
    API_ENDPOINTS.SALES_QUERIES.CONVERT_TO_SALE(queryId),
    payload
  );
};

/**
 * Convert Sale to Order (Stage 4) - Migration Wrapper
 */
export const initiateSaleOrderConversion = async (
  saleId: string | number,
  data: {
    receipt_voucher_id: string;
    advance_amount: number;
    advance_notes?: string;
    item_name: string;
    design_details?: string;
  }
) => {
  return api.post(API_ENDPOINTS.SALES.INITIATE_ORDER_CONVERSION(saleId), data);
};

/**
 * Confirm Order Draft (Stage 5) - Migration Wrapper
 */
export const confirmOrderDraft = async (
  draftId: string | number,
  data?: { process_steps: any[] }
) => {
  return api.post(API_ENDPOINTS.ORDER_DRAFTS.CONFIRM(draftId), data || {});
};

export async function saveProcessStepData(
  orderId: Identifier,
  stepName: string,
  referenceId?: string,
  notes?: string
): Promise<{
  success: boolean;
  step_id?: string;
  status: string;
  saved_at: string;
  has_been_saved: boolean;
}> {
  console.log("[Backend saveProcessStepData] Called with:", {
    orderId,
    stepName,
    referenceId,
    notes,
  });

  try {
    const endpoint = API_ENDPOINTS.ORDERS.SAVE_STEP(orderId, stepName);
    console.log("[Backend saveProcessStepData] Making API call to:", endpoint);
    console.log("[Backend saveProcessStepData] Request payload:", {
      reference_id: referenceId,
      notes,
    });

    const result = await api.post<{
      success: boolean;
      step_id?: string;
      status: string;
      saved_at: string;
      has_been_saved: boolean;
    }>(endpoint, {
      reference_id: referenceId,
      notes,
    });

    console.log("[Backend saveProcessStepData] API Response:", result);
    console.log("[Backend saveProcessStepData] Success:", result.success);
    return result;
  } catch (error) {
    console.error("[Backend saveProcessStepData] Error:", error);
    console.error("[Backend saveProcessStepData] Error details:", {
      orderId,
      stepName,
      referenceId,
      notes,
      error: error instanceof Error ? error.message : String(error),
    });

    // Log more detailed error information if available
    if (error instanceof Error && "response" in error) {
      const apiError = error as any;
      console.error(
        "[Backend saveProcessStepData] API Error Response:",
        apiError.response?.data
      );
      console.error(
        "[Backend saveProcessStepData] API Error Status:",
        apiError.response?.status
      );
    }

    throw error;
  }
}

export async function autoCompleteStep(
  orderId: Identifier,
  stepName: string,
  referenceId?: string,
  notes?: string
): Promise<{
  success: boolean;
  message: string;
  step_id?: string;
  completed_at?: string;
  already_completed?: boolean;
}> {
  console.log("[Backend autoCompleteStep] Called with:", {
    orderId,
    stepName,
    referenceId,
    notes,
  });

  try {
    console.log(
      "[Backend autoCompleteStep] Making API call to:",
      API_ENDPOINTS.ORDERS.AUTO_COMPLETE_STEP(orderId)
    );
    console.log("[Backend autoCompleteStep] Request payload:", {
      step_name: stepName,
      reference_id: referenceId,
      notes,
    });

    const result = await api.post<{
      success: boolean;
      message: string;
      step_id?: string;
      completed_at?: string;
      already_completed?: boolean;
    }>(API_ENDPOINTS.ORDERS.AUTO_COMPLETE_STEP(orderId), {
      step_name: stepName,
      reference_id: referenceId,
      notes,
    });

    console.log("[Backend autoCompleteStep] API Response:", result);
    console.log("[Backend autoCompleteStep] Success:", result.success);
    return result;
  } catch (error) {
    console.error("[Backend autoCompleteStep] Error:", error);
    console.error("[Backend autoCompleteStep] Error details:", {
      orderId,
      stepName,
      referenceId,
      notes,
      error: error instanceof Error ? error.message : String(error),
    });

    // Log more detailed error information if available
    if (error instanceof Error && "response" in error) {
      const apiError = error as any;
      console.error(
        "[Backend autoCompleteStep] API Error Response:",
        apiError.response?.data
      );
      console.error(
        "[Backend autoCompleteStep] API Error Status:",
        apiError.response?.status
      );
    }

    throw error;
  }
}

/**
 * Get company users for assignee dropdown
 * @param department - Optional department filter (e.g., 'PRODUCT_DESIGN', 'PRODUCTION')
 */
export async function getCompanyUsers(department?: string): Promise<
  {
    id: string;
    name: string;
    email: string;
    role?: string;
    department?: string;
  }[]
> {
  const endpoint = department
    ? `/tasks/users/?department=${department}`
    : "/tasks/users/";
  return api.get(endpoint);
}

/**
 * Mark step as done - Step 1 (without deadline/assignee)
 */
export async function markStepDone(
  orderId: string,
  stepId: string,
  notes: string = ""
): Promise<{
  success: boolean;
  message: string;
  step_id: string;
  marked_done_at: string;
  requires_confirmation?: boolean;
  next_step_name?: string;
  next_step?: {
    assignee_name?: string;
    deadline?: string;
  };
}> {
  const endpoint = `/orders/${orderId}/process-steps/${stepId}/mark-done/`;
  return api.post(endpoint, { notes });
}

/**
 * Mark step as done - Step 2 (with deadline and assignee)
 */
export async function markStepDoneWithAssignment(
  orderId: string,
  stepId: string,
  notes: string,
  nextStepDeadline: string,
  nextStepAssigneeId: string
): Promise<{
  success: boolean;
  message: string;
  step_id: string;
  marked_done_at: string;
  next_step?: {
    assignee_name?: string;
    deadline?: string;
    step_name?: string;
  };
}> {
  const endpoint = `/orders/${orderId}/process-steps/${stepId}/mark-done/`;

  console.log("[API] markStepDoneWithAssignment called:", {
    endpoint,
    payload: {
      notes,
      next_step_deadline: nextStepDeadline,
      next_step_assignee_id: nextStepAssigneeId,
    },
  });

  return api.post(endpoint, {
    notes,
    next_step_deadline: nextStepDeadline,
    next_step_assignee_id: nextStepAssigneeId,
  });
}

/**
 * Get step status by step name
 */
export async function getStepStatus(
  orderId: string,
  stepName: string
): Promise<{
  step_id: string;
  step_name: string;
  status: string;
  is_locked: boolean;
  reference_id: string | null;
  has_been_saved: boolean;
  is_draft: boolean;
  saved_at: string | null;
  marked_done_at: string | null;
}> {
  const endpoint = API_ENDPOINTS.ORDERS.STEP_STATUS(orderId, stepName);
  return api.get(endpoint);
}

/**
 * Mark step as done from Process Steps tab
 */
export async function markDoneStep(
  orderId: string,
  stepId: string,
  notes: string = ""
): Promise<{
  success: boolean;
  message: string;
  step_id: string;
  marked_done_at: string;
}> {
  const endpoint = API_ENDPOINTS.ORDERS.MARK_DONE_STEP(orderId, stepId);
  return api.post(endpoint, { notes });
}

"use client";

import { useState, type ChangeEvent } from "react";
import { backend } from "@/lib/backend";
import { ApiError } from "@/lib/api";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiResult {
  ok: boolean;
  label: string;
  status?: number;
  message: string;
  payload?: unknown;
  timestamp: string;
  request?: RequestMeta;
}

interface RequestMeta {
  method: string;
  path: string;
  params?: Record<string, unknown>;
  body?: unknown;
}

const DEFAULT_CREDENTIALS = {
  email: "admin@example.com",
  password: "admin123",
};

const DEFAULT_SALES_FILTERS = {
  page: "1",
  pageSize: "5",
  minAmount: "",
  maxAmount: "",
  startDate: "",
  endDate: "",
  salesPerson: "",
  city: "",
  state: "",
} as const;

function createSuccess(
  label: string,
  payload: unknown,
  status: number | undefined,
  request: RequestMeta
): ApiResult {
  return {
    ok: true,
    label,
    status,
    message: "Success",
    payload,
    timestamp: new Date().toISOString(),
    request,
  };
}

function createError(
  label: string,
  err: unknown,
  request: RequestMeta
): ApiResult {
  if (err instanceof ApiError) {
    return {
      ok: false,
      label,
      status: err.status,
      message: err.message,
      payload: { code: err.code },
      timestamp: new Date().toISOString(),
      request,
    };
  }

  if (err instanceof Error) {
    return {
      ok: false,
      label,
      message: err.message,
      timestamp: new Date().toISOString(),
      request,
    };
  }

  return {
    ok: false,
    label,
    message: "Unknown error",
    payload: err,
    timestamp: new Date().toISOString(),
    request,
  };
}

export default function ApiTestPage() {
  const [credentials, setCredentials] = useState(DEFAULT_CREDENTIALS);
  const [results, setResults] = useState<ApiResult[]>([]);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [salesFilters, setSalesFilters] = useState({
    ...DEFAULT_SALES_FILTERS,
  });

  const runTest = async (
    label: string,
    request: RequestMeta,
    action: () => Promise<unknown>
  ) => {
    if (loadingKey) return;
    setLoadingKey(label);
    try {
      const payload = await action();
      const result = createSuccess(label, payload, undefined, request);
      setResults((prev) => [result, ...prev]);
    } catch (err) {
      const result = createError(label, err, request);
      setResults((prev) => [result, ...prev]);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleInputChange =
    (field: "email" | "password") => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setCredentials((prev) => ({ ...prev, [field]: value }));
    };

  const handleSalesFilterChange =
    (field: keyof typeof DEFAULT_SALES_FILTERS) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setSalesFilters((prev) => ({ ...prev, [field]: value }));
    };

  const resetSalesFilters = () => {
    setSalesFilters({ ...DEFAULT_SALES_FILTERS });
  };

  const buildSalesParams = () => {
    const params: Record<string, string | number> = {};

    const page = parseInt(salesFilters.page, 10);
    if (!Number.isNaN(page) && page > 0) {
      params.page = page;
    }

    const pageSize = parseInt(salesFilters.pageSize, 10);
    if (!Number.isNaN(pageSize) && pageSize > 0) {
      params.page_size = pageSize;
    }

    const minAmount = parseFloat(salesFilters.minAmount);
    if (!Number.isNaN(minAmount)) {
      params.total_amt_min = minAmount;
    }

    const maxAmount = parseFloat(salesFilters.maxAmount);
    if (!Number.isNaN(maxAmount)) {
      params.total_amt_max = maxAmount;
    }

    if (salesFilters.startDate) {
      params.start_date = salesFilters.startDate;
    }

    if (salesFilters.endDate) {
      params.end_date = salesFilters.endDate;
    }

    const trimmedSalesPerson = salesFilters.salesPerson.trim();
    if (trimmedSalesPerson) {
      params.sales_person = trimmedSalesPerson;
    }

    const trimmedCity = salesFilters.city.trim();
    if (trimmedCity) {
      params.city = trimmedCity;
    }

    const trimmedState = salesFilters.state.trim();
    if (trimmedState) {
      params.state = trimmedState;
    }

    return params;
  };

  const hasEntries = (value: Record<string, unknown> | undefined) =>
    value ? Object.keys(value).length > 0 : false;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">API Test Lab</h1>
        <p className="text-sm text-muted-foreground">
          Fire backend requests through the shared API client and inspect raw
          responses.
        </p>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Authentication Payload
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              value={credentials.email}
              onChange={handleInputChange("email")}
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              value={credentials.password}
              onChange={handleInputChange("password")}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button
            variant="default"
            disabled={loadingKey === "login"}
            onClick={() =>
              runTest(
                "login",
                {
                  method: "POST",
                  path: "/auth/login",
                  body: {
                    ...credentials,
                    password: credentials.password
                      ? "••••••••"
                      : credentials.password,
                  },
                },
                () => backend.login(credentials)
              )
            }
          >
            {loadingKey === "login" ? "Logging in..." : "Login"}
          </Button>
          <Button
            variant="outline"
            disabled={loadingKey === "me"}
            onClick={() =>
              runTest(
                "me",
                {
                  method: "GET",
                  path: "/users/me",
                },
                () => backend.getCurrentUser()
              )
            }
          >
            {loadingKey === "me" ? "Fetching profile..." : "Get Current User"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Sales Data Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These requests mirror the dashboard data dependencies. Use them to
            verify the aggregates endpoint and paginated sales records API.
          </p>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Sales Record Filters
                </h3>
                <p className="text-xs text-muted-foreground">
                  Adjust params before fetching to test backend filtering.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={resetSalesFilters}>
                Reset Filters
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sales-page">Page</Label>
                <Input
                  id="sales-page"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={salesFilters.page}
                  onChange={handleSalesFilterChange("page")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-page-size">Page Size</Label>
                <Input
                  id="sales-page-size"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={salesFilters.pageSize}
                  onChange={handleSalesFilterChange("pageSize")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-min-amount">Min Amount</Label>
                <Input
                  id="sales-min-amount"
                  type="number"
                  inputMode="decimal"
                  value={salesFilters.minAmount}
                  onChange={handleSalesFilterChange("minAmount")}
                  placeholder="e.g. 10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-max-amount">Max Amount</Label>
                <Input
                  id="sales-max-amount"
                  type="number"
                  inputMode="decimal"
                  value={salesFilters.maxAmount}
                  onChange={handleSalesFilterChange("maxAmount")}
                  placeholder="e.g. 500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-start-date">Start Date</Label>
                <Input
                  id="sales-start-date"
                  type="date"
                  value={salesFilters.startDate}
                  onChange={handleSalesFilterChange("startDate")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-end-date">End Date</Label>
                <Input
                  id="sales-end-date"
                  type="date"
                  value={salesFilters.endDate}
                  onChange={handleSalesFilterChange("endDate")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-person">Salesperson</Label>
                <Input
                  id="sales-person"
                  value={salesFilters.salesPerson}
                  onChange={handleSalesFilterChange("salesPerson")}
                  placeholder="Name contains..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-city">City</Label>
                <Input
                  id="sales-city"
                  value={salesFilters.city}
                  onChange={handleSalesFilterChange("city")}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-state">State</Label>
                <Input
                  id="sales-state"
                  value={salesFilters.state}
                  onChange={handleSalesFilterChange("state")}
                  placeholder="State"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button
            variant="default"
            disabled={loadingKey === "aggregates"}
            onClick={() =>
              runTest(
                "aggregates",
                {
                  method: "GET",
                  path: "/sales-records/aggregates",
                },
                () => backend.getSalesAggregates()
              )
            }
          >
            {loadingKey === "aggregates"
              ? "Fetching aggregates..."
              : "Fetch Aggregates"}
          </Button>
          <Button
            variant="outline"
            disabled={loadingKey === "sales-records"}
            onClick={() => {
              const params = buildSalesParams();
              runTest(
                "sales-records",
                {
                  method: "GET",
                  path: "/sales-records",
                  params,
                },
                () => backend.listSalesRecords(params)
              );
            }}
          >
            {loadingKey === "sales-records"
              ? "Fetching sales records..."
              : "Fetch Sales Records"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Response Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No API calls executed yet. Use the buttons above to generate log
              entries.
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={`${result.timestamp}-${index}`}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        result.ok ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {result.label.toUpperCase()} • {result.message}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {result.request && (
                    <div className="mt-3 space-y-2 rounded-md border border-gray-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-gray-700">
                        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono uppercase tracking-wide">
                          {result.request.method}
                        </span>
                        <span className="flex-1 text-right font-mono text-gray-600">
                          {result.request.path}
                        </span>
                      </div>
                      {hasEntries(result.request.params) && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Query Params
                          </p>
                          <pre className="max-h-48 overflow-auto rounded bg-gray-900 p-2 text-xs text-gray-100">
                            {JSON.stringify(result.request.params, null, 2)}
                          </pre>
                        </div>
                      )}
                      {typeof result.request.body !== "undefined" && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Request Body
                          </p>
                          <pre className="max-h-48 overflow-auto rounded bg-gray-900 p-2 text-xs text-gray-100">
                            {JSON.stringify(result.request.body, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  {typeof result.status !== "undefined" && (
                    <p className="text-xs text-gray-500">
                      Status: {result.status}
                    </p>
                  )}
                  {typeof result.payload !== "undefined" && (
                    <pre className="mt-2 max-h-56 overflow-auto rounded bg-white p-2 text-xs text-gray-700">
                      {JSON.stringify(result.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

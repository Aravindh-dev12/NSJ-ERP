import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backend, SalesRecord } from "@/lib/backend";
import { ApiError } from "@/lib/api";

const PAGE_SIZE = 10;

const DEFAULT_FILTERS = {
  minAmount: "",
  maxAmount: "",
  startDate: "",
  endDate: "",
  salesPerson: "",
  city: "",
  state: "",
} as const;

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface DashboardRecentOrdersProps {
  onFiltersChanged?: (params: Record<string, string | number>) => void;
  refreshKey?: number;
}

export function DashboardRecentOrders({
  onFiltersChanged,
  refreshKey,
}: DashboardRecentOrdersProps = {}) {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...DEFAULT_FILTERS });
  const lastFiltersRef = useRef<string>("");

  const buildQueryParams = useCallback(() => {
    const params: Record<string, string | number> = {};

    const parseNumeric = (value: string) => {
      if (!value) return undefined;
      const num = Number(value);
      return Number.isNaN(num) ? undefined : num;
    };

    const trimmedSalesPerson = appliedFilters.salesPerson.trim();
    const trimmedCity = appliedFilters.city.trim();
    const trimmedState = appliedFilters.state.trim();

    const minAmount = parseNumeric(appliedFilters.minAmount);
    const maxAmount = parseNumeric(appliedFilters.maxAmount);

    if (minAmount !== undefined) params.total_amt_min = minAmount;
    if (maxAmount !== undefined) params.total_amt_max = maxAmount;
    if (appliedFilters.startDate)
      params.invoice_date_from = appliedFilters.startDate;
    if (appliedFilters.endDate) params.invoice_date_to = appliedFilters.endDate;
    // Map to backend's expected key
    if (trimmedSalesPerson) params.sales_person_name = trimmedSalesPerson;
    if (trimmedCity) params.city = trimmedCity;
    if (trimmedState) params.state = trimmedState;

    return params;
  }, [appliedFilters]);

  useEffect(() => {
    if (!onFiltersChanged) return;
    const params = buildQueryParams();
    const serialized = JSON.stringify(params);
    if (lastFiltersRef.current === serialized) return;
    lastFiltersRef.current = serialized;
    onFiltersChanged(params);
  }, [buildQueryParams, onFiltersChanged]);

  const fetchRecords = useCallback(
    async (pageToLoad = 1, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setRecords([]);
        setTotalRecords(0);
      }

      try {
        const response = await backend.listSalesRecords({
          page: pageToLoad,
          page_size: PAGE_SIZE,
          ...buildQueryParams(),
        });

        const items = (response.items ?? []) as SalesRecord[];

        setRecords((prev) => (append ? [...prev, ...items] : items));
        setPage(response.page ?? pageToLoad);
        setTotalPages(response.total_pages ?? 1);
        setTotalRecords((prev) =>
          typeof response.total === "number"
            ? response.total
            : append
              ? prev + items.length
              : items.length
        );
        setError(null);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load sales records.";
        if (!append) {
          setRecords([]);
        }
        setError(message);
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [buildQueryParams]
  );

  useEffect(() => {
    fetchRecords(1, false);
  }, [fetchRecords, refreshKey]);

  const hasMore = records.length < totalRecords && page < totalPages;

  const columnKeys = useMemo(() => {
    const orderedKeys: string[] = [];
    const seen = new Set<string>();
    records.forEach((record) => {
      Object.keys(record || {}).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key);
          orderedKeys.push(key);
        }
      });
    });
    return orderedKeys;
  }, [records]);

  const formatValue = useCallback((key: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return "--";

    const numericValue =
      typeof value === "number"
        ? value
        : typeof value === "string" && value.trim() !== ""
          ? Number(value)
          : null;

    if (
      numericValue !== null &&
      !Number.isNaN(numericValue) &&
      /amount|total|price|revenue|payment/i.test(key)
    ) {
      return formatCurrency(numericValue);
    }

    if (typeof value === "string" && /(date|_at)$/i.test(key)) {
      return formatDate(value);
    }

    if (typeof value === "number") {
      return value.toLocaleString("en-IN");
    }

    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "--";
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }, []);

  const renderStatusBadge = useCallback((value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-gray-500">--</span>;
    }
    const status = String(value).toLowerCase();
    let classes = "bg-yellow-100 text-yellow-700";
    if (status === "paid") classes = "bg-green-100 text-green-700";
    else if (status === "overdue") classes = "bg-red-100 text-red-700";
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
      >
        {String(value).toUpperCase()}
      </span>
    );
  }, []);

  const getRecordKey = useCallback((record: SalesRecord, index: number) => {
    const raw = (record as Record<string, unknown>).id ?? record.invoice_number;
    if (typeof raw === "number" || typeof raw === "string") {
      return `${raw}`;
    }
    return `record-${index}`;
  }, []);

  const formatColumnLabel = useCallback((key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof typeof DEFAULT_FILTERS) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setFilters((prev) => ({ ...prev, [key]: value }));
      },
    []
  );

  const handleApplyFilters = useCallback(() => {
    setPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setRecords([]);
    setAppliedFilters({ ...filters });
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setRecords([]);
    setAppliedFilters({ ...DEFAULT_FILTERS });
  }, []);

  if (loading && records.length === 0) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse h-4 bg-gray-200 rounded"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && records.length === 0) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex flex-col items-center justify-center text-center gap-2">
            <p className="text-red-500 text-sm font-medium">
              Unable to load sales records.
            </p>
            <p className="text-xs text-gray-500">{error}</p>
            <Button size="sm" onClick={() => fetchRecords(1, false)}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        <div className="text-xs text-muted-foreground">
          Showing {records.length} of {totalRecords || records.length} records
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Sales Record Filters
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                disabled={loading}
              >
                Reset
              </Button>
              <Button size="sm" onClick={handleApplyFilters} disabled={loading}>
                Go
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="filter-min-amount">Minimum Amount</Label>
              <Input
                id="filter-min-amount"
                type="number"
                inputMode="decimal"
                value={filters.minAmount}
                onChange={handleFilterChange("minAmount")}
                placeholder="e.g. 10000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-max-amount">Maximum Amount</Label>
              <Input
                id="filter-max-amount"
                type="number"
                inputMode="decimal"
                value={filters.maxAmount}
                onChange={handleFilterChange("maxAmount")}
                placeholder="e.g. 500000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-sales-person">Salesperson Name</Label>
              <Input
                id="filter-sales-person"
                value={filters.salesPerson}
                onChange={handleFilterChange("salesPerson")}
                placeholder="Search by name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-start-date">Start Date</Label>
              <Input
                id="filter-start-date"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange("startDate")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-end-date">End Date</Label>
              <Input
                id="filter-end-date"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange("endDate")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-city">City</Label>
              <Input
                id="filter-city"
                value={filters.city}
                onChange={handleFilterChange("city")}
                placeholder="Search by city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-state">State</Label>
              <Input
                id="filter-state"
                value={filters.state}
                onChange={handleFilterChange("state")}
                placeholder="Search by state"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                {columnKeys.map((key) => (
                  <th
                    key={key}
                    className="py-2 px-3 font-medium text-gray-600 whitespace-nowrap"
                  >
                    {formatColumnLabel(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnKeys.length || 1}
                    className="py-6 px-3 text-center text-sm text-muted-foreground"
                  >
                    No sales records match the selected filters.
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr
                    key={getRecordKey(record, index)}
                    className="border-b last:border-0"
                  >
                    {columnKeys.map((key) => {
                      const rawValue = (record as Record<string, unknown>)[key];
                      const isStatusColumn = key.toLowerCase() === "status";
                      return (
                        <td
                          key={key}
                          className="py-3 px-3 whitespace-nowrap text-gray-800 align-middle max-w-[220px] overflow-hidden text-ellipsis"
                          title={
                            rawValue === null || rawValue === undefined
                              ? "--"
                              : typeof rawValue === "string"
                                ? rawValue
                                : Array.isArray(rawValue)
                                  ? rawValue.join(", ")
                                  : typeof rawValue === "object"
                                    ? (() => {
                                        try {
                                          return JSON.stringify(rawValue);
                                        } catch {
                                          return String(rawValue);
                                        }
                                      })()
                                    : String(rawValue)
                          }
                        >
                          {isStatusColumn
                            ? renderStatusBadge(rawValue)
                            : formatValue(key, rawValue)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRecords(page + 1, true)}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
        {error && records.length > 0 && (
          <div className="mt-4 text-center text-xs text-red-500">{error}</div>
        )}
      </CardContent>
    </Card>
  );
}

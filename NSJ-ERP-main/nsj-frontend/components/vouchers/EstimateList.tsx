"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { estimatesList, estimateDelete, type QueryValue } from "@/lib/backend";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";
import {
  Eye,
  Search,
  X,
  Calendar,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PAGE_SIZE = 20;

function buildQuery(
  page: number,
  search: string,
  startDate?: string,
  endDate?: string
) {
  const params: Record<string, QueryValue> = { page, page_size: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  return params;
}

export function EstimateList() {
  const router = useRouter();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [meta, setMeta] = useState({ count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState(getLocalFirstOfMonth());
  const [dateTo, setDateTo] = useState(getLocalToday());

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(meta.count / PAGE_SIZE)),
    [meta.count]
  );

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildQuery(page, search, dateFrom, dateTo);
      const response = await estimatesList(params);
      setRecords(response.results ?? response.items ?? []);
      setMeta({
        count: (response.count as number) ?? response.results?.length ?? 0,
      });
    } catch (err) {
      setRecords([]);
      setMeta({ count: 0 });
      setError("Failed to load estimates. Please try again.");
      toast({
        variant: "destructive",
        title: "Unable to load estimates",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, dateFrom, dateTo, toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this estimate?")) return;
    setDeletingId(id);
    try {
      await estimateDelete(id);
      toast({
        title: "Deleted",
        description: "Estimate deleted successfully.",
      });
      fetchRecords();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description:
          err instanceof Error ? err.message : "Could not delete estimate.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const hasFilters = Boolean(search.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estimates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and view all estimates
          </p>
        </div>
        <Button asChild className="bg-amber-600 hover:bg-amber-700">
          <Link href="/vouchers/estimates/new">
            <Plus className="h-4 w-4 mr-2" />
            New Estimate
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by item name or account..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
          <span className="text-gray-500 text-sm">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {loading
          ? "Loading..."
          : `Showing ${records.length} of ${meta.count} estimates`}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
          <Button
            onClick={fetchRecords}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-muted-foreground text-sm">No estimates found</p>
          {hasFilters && (
            <Button
              onClick={handleClearFilters}
              variant="ghost"
              size="sm"
              className="mt-3 text-blue-600"
            >
              Clear filters to see all estimates
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-700">
                  Date
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-700">
                  Item Name
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-700">
                  Account
                </th>
                <th className="px-5 py-3 text-right font-semibold text-gray-700">
                  Grand Total
                </th>
                <th className="px-5 py-3 text-center font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((estimate) => (
                <tr key={estimate.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                    {estimate.date
                      ? new Date(estimate.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {estimate.item_name || "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {estimate.account?.account_name ||
                      estimate.account?.name ||
                      "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    ₹{" "}
                    {Number(estimate.grand_total || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/vouchers/estimate/${estimate.id}`)
                        }
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(estimate.id)}
                        disabled={deletingId === estimate.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

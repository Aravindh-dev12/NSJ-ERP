"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  RefreshCw,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchOrderById, OrderSearchResult } from "@/lib/backend";
import { OrderProgressTracker } from "./OrderProgressTracker";
import { useToast } from "@/hooks/use-toast";

interface SearchHistoryItem {
  result: OrderSearchResult;
  timestamp: Date;
}

export function ProcessStepsSearch() {
  const searchParams = useSearchParams();
  const { toast: _toast } = useToast();

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchedId, setSearchedId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const handleSearch = useCallback(
    async (id?: string) => {
      const query = (id ?? inputValue).trim();
      if (!query) {
        setError("Please enter an Order ID");
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);
      setSearchedId(query);

      try {
        const data = await searchOrderById(query);
        setResult(data);

        // Add to search history
        setSearchHistory((prev) => {
          const filtered = prev.filter(
            (item) => item.result.order_id !== data.order_id
          );
          return [{ result: data, timestamp: new Date() }, ...filtered].slice(
            0,
            5
          );
        });

        const url = new URL(window.location.href);
        url.searchParams.set("order_id", query);
        window.history.pushState({}, "", url.toString());
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          setError(
            `No order found with ID: "${query}". Please check and try again.`
          );
        } else {
          setError("Unable to load order. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [inputValue]
  );

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (orderId) {
      setInputValue(orderId);
      handleSearch(orderId);
    }
  }, [searchParams, handleSearch]);

  const handleRefresh = () => {
    if (searchedId) handleSearch(searchedId);
  };

  return (
    <div className="space-y-6">
      {/* ─── Search Card ─── */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Query Orders Lookup</CardTitle>
              <CardDescription className="mt-1">
                Enter a Bill No or Job No to view the complete order workflow.
              </CardDescription>
            </div>
            {result && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="gap-1.5 text-xs"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="process-steps-search-input"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter Bill No or Job No (e.g., A0190)"
                className={`pl-9 ${error && !inputValue ? "border-destructive ring-1 ring-destructive/20" : ""}`}
                disabled={loading}
                autoComplete="off"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    setError(null);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? "Searching…" : "Search"}
            </Button>
          </form>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Search failed</p>
                <p className="text-xs mt-0.5 text-destructive/80">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-4">
          <div className="h-40 w-full animate-pulse rounded-xl bg-muted/40" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-muted/40" />
        </div>
      )}

      {result && !loading && (
        <div className="pt-4 border-t border-dashed">
          <OrderProgressTracker orderId={result.order_id} />
        </div>
      )}

      {!result && !loading && !error && (
        <>
          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="pt-4 border-t border-dashed">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Searches
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchHistory.map((item) => (
                  <Card
                    key={item.result.order_id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setInputValue(item.result.order_id);
                      handleSearch(item.result.order_id);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground">
                            {item.result.bill_no ||
                              item.result.job_no ||
                              item.result.order_id}
                          </p>
                          {item.result.item_name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.result.item_name}
                            </p>
                          )}
                          {item.result.customer?.name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.result.customer.name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {item.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInputValue(item.result.order_id);
                            handleSearch(item.result.order_id);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 border border-blue-100">
              <Search className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Search for an Order
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Enter a Bill No or Job No above to view the complete production
              workflow for that order.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getDailySummary,
  formatGoldRate,
  type GoldRateSummary,
} from "@/lib/goldRateApi";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react";

interface GoldRateChangeLogProps {
  refreshTrigger?: number;
}

export function GoldRateChangeLog({ refreshTrigger }: GoldRateChangeLogProps) {
  const [summary, setSummary] = useState<GoldRateSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
    // Refresh every 30 seconds to show real-time updates
    const interval = setInterval(loadSummary, 30 * 1000);

    // Listen for gold rate updates
    const handleGoldRateUpdate = () => {
      console.log("[GoldRateChangeLog] Gold rate updated, reloading...");
      loadSummary();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("goldRateUpdated", handleGoldRateUpdate);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("goldRateUpdated", handleGoldRateUpdate);
      }
    };
  }, []);

  // Reload when refreshTrigger changes (when new rate is added)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadSummary();
    }
  }, [refreshTrigger]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("[GoldRateChangeLog] Loading summary...");
      const data = await getDailySummary();
      console.log("[GoldRateChangeLog] Loaded summary:", {
        date: data.rate_date,
        hasOpening: data.has_opening_rate,
        hasClosing: data.has_closing_rate,
        intermediateCount: data.intermediate_count,
        openingRate: data.opening_rate
          ? `₹${data.opening_rate.gold_24k_999}`
          : null,
        intermediateRates: data.intermediate_rates.map(
          (r) => `₹${r.gold_24k_999}`
        ),
        closingRate: data.closing_rate
          ? `₹${data.closing_rate.gold_24k_999}`
          : null,
      });
      setSummary(data);
    } catch (err: any) {
      console.error("[GoldRateChangeLog] Error loading summary:", {
        error: err,
        message: err?.message,
        status: err?.status,
        data: err?.data,
      });
      // Silently handle errors - no data yet
      setSummary(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const calculateChange = (current: string, previous: string | null) => {
    if (!previous) return null;
    const diff = parseFloat(current) - parseFloat(previous);
    return diff;
  };

  const getTrendIcon = (change: number | null) => {
    if (change === null || change === 0) return <Minus className="h-3 w-3" />;
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = (change: number | null) => {
    if (change === null || change === 0) return "text-gray-500";
    if (change > 0) return "text-green-600";
    return "text-red-600";
  };

  if (loading && !summary) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-600" />
            Today&apos;s Gold Rate Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (
    !summary ||
    (!summary.opening_rate &&
      summary.intermediate_rates.length === 0 &&
      !summary.closing_rate)
  ) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-600" />
            Today&apos;s Gold Rate Changes
          </CardTitle>
          <CardDescription>No rates entered yet for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No gold rates have been entered for today yet.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Go to the Gold Rates page to enter the opening rate.
            </p>
            <a
              href="/gold-rates"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              Go to Gold Rates
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build timeline of all changes
  const allRates = [
    ...(summary.opening_rate ? [summary.opening_rate] : []),
    ...summary.intermediate_rates,
    ...(summary.closing_rate ? [summary.closing_rate] : []),
  ].sort(
    (a, b) =>
      new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime()
  );

  return (
    <Card className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-6 px-8 pt-8">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2.5 text-xl font-black text-gray-800 tracking-tight">
            <div className="p-2 rounded-xl bg-blue-50 shadow-inner">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            Gold Rate Timeline
          </CardTitle>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-12">
            {formatDate(summary.rate_date)} • {allRates.length}{" "}
            {allRates.length === 1 ? "Update" : "Updates"} Today
          </p>
        </div>
        <button
          onClick={loadSummary}
          className="rounded-full p-2.5 hover:bg-gray-50 transition-all active:scale-95 group"
          title="Refresh Timeline"
        >
          <RefreshCw
            className={`h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </CardHeader>

      <CardContent className="px-8 pb-8 pt-6">
        <div className="space-y-8">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-3 gap-4 p-1 rounded-2xl bg-gray-50/50 border border-gray-100/50">
            <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-white shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                Opening
              </span>
              <div
                className={`h-2 w-2 rounded-full mb-1.5 ${summary.has_opening_rate ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-gray-200"}`}
              ></div>
              <span
                className={`text-[10px] font-bold ${summary.has_opening_rate ? "text-emerald-600" : "text-gray-400"}`}
              >
                {summary.has_opening_rate ? "Entered" : "Pending"}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-white shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                Updates
              </span>
              <span className="text-lg font-black text-gray-800 mb-0.5">
                {summary.intermediate_count}
              </span>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tight">
                Changes
              </span>
            </div>
            <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-white shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                Closing
              </span>
              <div
                className={`h-2 w-2 rounded-full mb-1.5 ${summary.has_closing_rate ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" : "bg-gray-200"}`}
              ></div>
              <span
                className={`text-[10px] font-bold ${summary.has_closing_rate ? "text-blue-600" : "text-gray-400"}`}
              >
                {summary.has_closing_rate ? "Entered" : "Pending"}
              </span>
            </div>
          </div>

          {/* Timeline - Styled with a luxurious vertical thread */}
          <div className="relative pl-10 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-emerald-500 before:via-orange-400 before:to-blue-500 before:opacity-20">
            {allRates.map((rate, index) => {
              const previousRate = index > 0 ? allRates[index - 1] : null;
              const change24k = calculateChange(
                rate.gold_24k_999,
                previousRate?.gold_24k_999 || null
              );
              const change22k = calculateChange(
                rate.gold_22k,
                previousRate?.gold_22k || null
              );
              const changeSilver =
                rate.silver_rate && previousRate?.silver_rate
                  ? calculateChange(rate.silver_rate, previousRate.silver_rate)
                  : null;

              const isOpening = rate.rate_type === "OPENING";
              const isClosing = rate.rate_type === "CLOSING";

              return (
                <div key={rate.id} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-[10px] left-[-29px] top-1.5 h-6 w-6 rounded-full border-4 border-white z-10 shadow-sm transition-transform group-hover:scale-125
                    ${
                      isOpening
                        ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        : isClosing
                          ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                          : "bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.3)]"
                    }`}
                  />

                  <div className="flex flex-col gap-4">
                    {/* Entry Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-black tracking-tight ${isOpening ? "text-emerald-700" : isClosing ? "text-blue-700" : "text-orange-700"}`}
                        >
                          {isOpening
                            ? "MARKET OPENING"
                            : isClosing
                              ? "MARKET CLOSING"
                              : `QUOTATION UPDATE #${index}`}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                        <span className="text-[11px] font-bold text-gray-500 tabular-nums">
                          {formatTime(rate.entered_at)}
                        </span>
                        {rate.is_locked && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Locked
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">
                        by {rate.entered_by_name}
                      </span>
                    </div>

                    {/* Rates Grid - Modern 4-column display */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3.5 rounded-2xl bg-gray-50/30 border border-gray-100/50 group-hover:bg-white group-hover:shadow-lg group-hover:border-transparent transition-all duration-500">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          24K Fine
                        </span>
                        <span className="text-lg font-black text-gray-800 tracking-tighter">
                          ₹{parseFloat(rate.gold_24k_999).toLocaleString()}
                        </span>
                        {change24k !== null && change24k !== 0 && (
                          <div
                            className={`text-[9px] font-black flex items-center gap-1 ${getTrendColor(change24k)}`}
                          >
                            {getTrendIcon(change24k)} {change24k > 0 ? "+" : ""}
                            {change24k.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          24K (995)
                        </span>
                        <span className="text-lg font-black text-gray-800 tracking-tighter">
                          ₹{parseFloat(rate.gold_24k_995).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          22K Standard
                        </span>
                        <span className="text-lg font-black text-gray-800 tracking-tighter">
                          ₹{parseFloat(rate.gold_22k).toLocaleString()}
                        </span>
                        {change22k !== null && change22k !== 0 && (
                          <div
                            className={`text-[9px] font-black flex items-center gap-1 ${getTrendColor(change22k)}`}
                          >
                            {getTrendIcon(change22k)} {change22k > 0 ? "+" : ""}
                            {change22k.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          Pure Silver
                        </span>
                        <span className="text-lg font-black text-gray-800 tracking-tighter">
                          ₹
                          {rate.silver_rate
                            ? parseFloat(rate.silver_rate).toLocaleString()
                            : "—"}
                        </span>
                        {changeSilver !== null && changeSilver !== 0 && (
                          <div
                            className={`text-[9px] font-black flex items-center gap-1 ${getTrendColor(changeSilver)}`}
                          >
                            {getTrendIcon(changeSilver)}{" "}
                            {changeSilver > 0 ? "+" : ""}
                            {changeSilver.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Entry Notes */}
                    {rate.correction_notes && (
                      <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                        <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-[11px] font-medium text-gray-600 line-clamp-2 leading-relaxed">
                          <span className="font-black text-gray-400 uppercase tracking-widest mr-2">
                            Audit Note:
                          </span>
                          {rate.correction_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Live Indicator */}
          {summary.current_active_rate && (
            <div className="flex items-center justify-between p-3.5 px-6 rounded-2xl bg-gray-900 shadow-xl shadow-gray-200 group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3 z-10">
                <div className="relative">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    Active Market Rate
                  </span>
                  <span className="text-white text-sm font-black tracking-tight">
                    ₹
                    {parseFloat(
                      summary.current_active_rate.gold_24k_999
                    ).toLocaleString()}{" "}
                    <span className="text-gray-400 text-[10px] ml-1 uppercase">
                      (24K Gold)
                    </span>
                  </span>
                </div>
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-500 opacity-50 group-hover:scale-125 transition-transform duration-500" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

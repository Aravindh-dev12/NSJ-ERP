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
  type DailyGoldRate,
} from "@/lib/goldRateApi";
import { Clock, CheckCircle2, TrendingUp, Lock } from "lucide-react";

interface DailyRateSummaryProps {
  date?: string;
}

export function DailyRateSummary({ date }: DailyRateSummaryProps) {
  const [summary, setSummary] = useState<GoldRateSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, [date]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDailySummary(date);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const RateCard = ({
    rate,
    label,
  }: {
    rate: DailyGoldRate | null;
    label: string;
  }) => {
    if (!rate) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-500">{label}</h4>
            <Badge variant="outline" className="text-gray-500">
              Not Entered
            </Badge>
          </div>
          <p className="text-xs text-gray-400">No rate entered yet</p>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">{label}</h4>
          <div className="flex items-center gap-2">
            {rate.is_locked && <Lock className="h-3 w-3 text-gray-500" />}
            <Badge
              variant={rate.is_locked ? "default" : "outline"}
              className={rate.is_locked ? "bg-green-100 text-green-800" : ""}
            >
              {rate.is_locked ? "Locked" : "Active"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-600">24K 999:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatGoldRate(rate.gold_24k_999)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-600">22K:</span>
            <span className="text-sm font-semibold text-gray-700">
              {formatGoldRate(rate.gold_22k)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-600">18K:</span>
            <span className="text-sm font-semibold text-gray-700">
              {formatGoldRate(rate.gold_18k)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{formatTime(rate.entered_at)}</span>
            <span>•</span>
            <span>{rate.entered_by_name}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Gold Rate Summary</CardTitle>
            <CardDescription>{formatDate(summary.rate_date)}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {summary.has_opening_rate && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Opening ✓
              </Badge>
            )}
            {summary.has_closing_rate && (
              <Badge className="bg-blue-100 text-blue-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Closing ✓
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Opening Rate */}
        <RateCard rate={summary.opening_rate} label="Opening Rate" />

        {/* Intermediate Rates */}
        {summary.intermediate_count > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <h4 className="text-sm font-medium text-gray-700">
                Intermediate Updates ({summary.intermediate_count})
              </h4>
            </div>
            <div className="space-y-2">
              {summary.intermediate_rates.map((rate, index) => (
                <div
                  key={rate.id}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-orange-700">
                      Update #{index + 1}
                    </span>
                    <span className="text-xs text-orange-600">
                      {formatTime(rate.entered_at)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-orange-700">24K 999:</span>
                    <span className="text-base font-bold text-orange-900">
                      {formatGoldRate(rate.gold_24k_999)}
                    </span>
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    By {rate.entered_by_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closing Rate */}
        <RateCard rate={summary.closing_rate} label="Closing Rate" />

        {/* Current Active Rate */}
        {summary.current_active_rate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Currently Active Rate
            </h4>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-blue-700">24K 999:</span>
              <span className="text-2xl font-bold text-blue-900">
                {formatGoldRate(summary.current_active_rate.gold_24k_999)}
              </span>
            </div>
            <div className="text-xs text-blue-600 mt-2">
              {summary.current_active_rate.rate_type} rate •{" "}
              {formatTime(summary.current_active_rate.entered_at)}
            </div>
          </div>
        )}

        {/* Status Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.has_opening_rate ? "✓" : "✗"}
              </div>
              <div className="text-xs text-gray-600">Opening</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.intermediate_count}
              </div>
              <div className="text-xs text-gray-600">Updates</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.has_closing_rate ? "✓" : "✗"}
              </div>
              <div className="text-xs text-gray-600">Closing</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Box, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface InventorySummary {
  gold_stock_grams: number;
  silver_stock_grams: number;
  platinum_stock_grams: number;
  diamond_count: number;
  gemstone_count: number;
  total_value: number;
}

export function InventorySummaryWidget() {
  const router = useRouter();
  const { toast } = useToast();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventorySummary();
  }, []);

  const loadInventorySummary = async () => {
    try {
      const response = await api.get<InventorySummary>(
        "/raw-material-inventory/summary/"
      );
      setSummary(response);
    } catch (error: any) {
      console.error("Failed to load inventory summary:", error);
      // Don't show error toast for 404 - endpoint might not exist yet
      if (error.status !== 404) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load inventory summary",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatWeight = (grams: number) => {
    return `${grams.toFixed(2)}g`;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border-white/60 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-white/60 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Inventory Summary</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/raw-material-purchase/inventory")}
          className="gap-2"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Metal Stock */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Box className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                Metal Stock
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-700">Gold</span>
                <span className="text-lg font-bold text-amber-800">
                  {formatWeight(summary?.gold_stock_grams || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-700">Silver</span>
                <span className="text-lg font-bold text-amber-800">
                  {formatWeight(summary?.silver_stock_grams || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-700">Platinum</span>
                <span className="text-lg font-bold text-amber-800">
                  {formatWeight(summary?.platinum_stock_grams || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Stones */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Box className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                Stones
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Diamonds</span>
                <span className="text-lg font-bold text-purple-800">
                  {summary?.diamond_count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Gemstones</span>
                <span className="text-lg font-bold text-purple-800">
                  {summary?.gemstone_count || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-green-900">
                Total Inventory Value
              </span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(summary?.total_value || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

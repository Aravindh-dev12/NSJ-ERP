"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GoldRateEntryForm } from "@/components/gold-rate/GoldRateEntryForm";
import { GoldRateChangeLog } from "@/components/gold-rate/GoldRateChangeLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTodayRates, type DailyGoldRate } from "@/lib/goldRateApi";
import { TrendingUp, AlertCircle } from "lucide-react";

export default function GoldRatesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [openingRate, setOpeningRate] = useState<DailyGoldRate | null>(null);
  const [closingRate, setClosingRate] = useState<DailyGoldRate | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showMandatoryAlert, setShowMandatoryAlert] = useState(false);

  useEffect(() => {
    loadTodayRates();
  }, [refreshKey]);

  useEffect(() => {
    // Check if opening rate is missing
    if (openingRate === null && refreshKey === 0) {
      setShowMandatoryAlert(true);
    } else if (openingRate !== null) {
      setShowMandatoryAlert(false);
    }
  }, [openingRate, refreshKey]);

  const loadTodayRates = async () => {
    try {
      const { rates } = await getTodayRates();
      const opening = rates.find((r) => r.rate_type === "OPENING");
      const closing = rates.find((r) => r.rate_type === "CLOSING");
      setOpeningRate(opening || null);
      setClosingRate(closing || null);
    } catch (error) {
      console.error("Failed to load today's rates:", error);
    }
  };

  const handleSuccess = (rate?: DailyGoldRate) => {
    // Increment refresh key to trigger re-render of all components
    setRefreshKey((prev) => prev + 1);
    // Also reload today's rates immediately
    loadTodayRates();

    // If opening rate was just submitted, redirect to dashboard
    if (rate && rate.rate_type === "OPENING") {
      router.push("/dashboard");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-yellow-600" />
        <div>
          <h1 className="text-3xl font-bold">Gold Rate Management</h1>
          <p className="text-gray-600">
            Enter and manage daily gold rates for your business
          </p>
        </div>
      </div>

      {/* Mandatory Alert */}
      {showMandatoryAlert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Action Required:</strong> Today&apos;s opening gold rate has
            not been entered yet. Please enter the opening rate below to
            continue using the system.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="entry" className="space-y-6">
        <TabsList>
          <TabsTrigger value="entry">Rate Entry</TabsTrigger>
          <TabsTrigger value="summary">Daily Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-6">
          {/* Opening Rate */}
          <GoldRateEntryForm
            rateType="OPENING"
            existingRate={openingRate}
            onSuccess={handleSuccess}
          />

          {/* Intermediate Rate */}
          <GoldRateEntryForm
            rateType="INTERMEDIATE"
            onSuccess={handleSuccess}
          />

          {/* Closing Rate */}
          <GoldRateEntryForm
            rateType="CLOSING"
            existingRate={closingRate}
            onSuccess={handleSuccess}
          />
        </TabsContent>

        <TabsContent value="summary">
          <GoldRateChangeLog key={refreshKey} refreshTrigger={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

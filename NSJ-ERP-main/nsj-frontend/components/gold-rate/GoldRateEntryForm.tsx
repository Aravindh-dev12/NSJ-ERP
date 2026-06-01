"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createGoldRate,
  calculateDerivedRates,
  formatGoldRate,
  type DailyGoldRate,
} from "@/lib/goldRateApi";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";

interface GoldRateEntryFormProps {
  rateType: "OPENING" | "INTERMEDIATE" | "CLOSING";
  existingRate?: DailyGoldRate | null;
  onSuccess?: (rate: DailyGoldRate) => void;
  onCancel?: () => void;
  flat?: boolean;
}

export function GoldRateEntryForm({
  rateType,
  existingRate,
  onSuccess,
  onCancel,
  flat = false,
}: GoldRateEntryFormProps) {
  const [gold24k999, setGold24k999] = useState("");
  const [gold24k995, setGold24k995] = useState("");
  const [silverRate, setSilverRate] = useState("");
  const [correctionNotes, setCorrectionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-populate form when existingRate is loaded
  React.useEffect(() => {
    if (existingRate) {
      setGold24k999(existingRate.gold_24k_999 || "");
      setGold24k995(existingRate.gold_24k_995 || "");
      setSilverRate(existingRate.silver_rate || "");
    }
  }, [existingRate]);

  // Calculate derived rates
  const derivedRates = gold24k999
    ? calculateDerivedRates(gold24k999)
    : { gold_22k: "0.00", gold_18k: "0.00", gold_14k: "0.00" };

  // Check if rate is locked
  const isLocked = existingRate?.is_locked || false;
  const canEdit = existingRate?.can_edit ?? true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!gold24k999 || !gold24k995) {
      setError("Please enter both 24K 999 and 24K 995 rates");
      return;
    }

    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const rate = await createGoldRate({
        rate_date: today,
        rate_type: rateType,
        gold_24k_999: gold24k999,
        gold_24k_995: gold24k995,
        silver_rate: silverRate || undefined,
      });

      setSuccess(true);
      if (onSuccess) {
        onSuccess(rate);
      }

      // Dispatch custom event for dashboard to listen
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("goldRateUpdated", { detail: rate })
        );
      }

      // Reset form for intermediate rates only
      if (rateType === "INTERMEDIATE") {
        setTimeout(() => {
          setGold24k999("");
          setGold24k995("");
          setSilverRate("");
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      // Extract detailed error message from API response
      let errorMessage = "Failed to create gold rate";

      // Check if it's an ApiError with data
      if (err?.data && typeof err.data === "object") {
        const errorData = err.data;

        // Handle validation errors (field-specific)
        const fieldErrors: string[] = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            fieldErrors.push(`${field}: ${messages.join(", ")}`);
          } else if (typeof messages === "string") {
            fieldErrors.push(`${field}: ${messages}`);
          }
        }

        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join("\n");
        }
      }
      // Fallback to error message
      else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get title and description based on rate type
  const getTitle = () => {
    switch (rateType) {
      case "OPENING":
        return "Opening Rate";
      case "INTERMEDIATE":
        return "Intermediate Rate";
      case "CLOSING":
        return "Closing Rate";
    }
  };

  const getDescription = () => {
    switch (rateType) {
      case "OPENING":
        return "Enter the opening gold rate for today. This will be locked after submission.";
      case "INTERMEDIATE":
        return "Update intermediate rate as many times as needed during the day.";
      case "CLOSING":
        return "Enter the closing gold rate for today. This will be locked after submission.";
    }
  };

  const renderForm = () => (
    <div className={flat ? "space-y-6" : ""}>
      {/* Show existing rate if locked */}
      {existingRate && isLocked && (
        <Alert className="mb-4 bg-emerald-50 border-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            {rateType} rate already entered:{" "}
            {formatGoldRate(existingRate.gold_24k_999)}
            <br />
            <span className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">
              By {existingRate.entered_by_name} •{" "}
              {new Date(existingRate.entered_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Show error */}
      {error && (
        <Alert className="mb-4 bg-red-50 border-red-100">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-xs font-bold uppercase tracking-wide">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Show success */}
      {success && (
        <Alert className="mb-4 bg-emerald-50 border-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 text-xs font-bold uppercase tracking-wide">
            {rateType} rate saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Manual Input Rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="gold24k999"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1"
            >
              24K Fine (999.9) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                ₹
              </span>
              <Input
                id="gold24k999"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8 py-6 rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white transition-all text-lg font-black"
                value={gold24k999}
                onChange={(e) => setGold24k999(e.target.value)}
                disabled={isLocked || loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="gold24k995"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1"
            >
              24K Standard (995) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                ₹
              </span>
              <Input
                id="gold24k995"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8 py-6 rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white transition-all text-lg font-black"
                value={gold24k995}
                onChange={(e) => setGold24k995(e.target.value)}
                disabled={isLocked || loading}
                required
              />
            </div>
          </div>
        </div>

        {/* Auto-Calculated Rates */}
        <div className="p-6 rounded-[2rem] bg-amber-50/30 border border-amber-100/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
              Dynamic Calculations
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600/50">
                22K Standard
              </span>
              <span className="text-xl font-black text-gray-800">
                {formatGoldRate(derivedRates.gold_22k)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600/50">
                18K Hallmark
              </span>
              <span className="text-xl font-black text-gray-800">
                {formatGoldRate(derivedRates.gold_18k)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600/50">
                14K Hallmark
              </span>
              <span className="text-xl font-black text-gray-800">
                {formatGoldRate(derivedRates.gold_14k)}
              </span>
            </div>
          </div>
        </div>

        {/* Silver Rate */}
        <div className="space-y-2">
          <Label
            htmlFor="silverRate"
            className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1"
          >
            Pure Silver Rate (Optional)
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
              ₹
            </span>
            <Input
              id="silverRate"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="pl-8 py-6 rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white transition-all text-lg font-black"
              value={silverRate}
              onChange={(e) => setSilverRate(e.target.value)}
              disabled={isLocked || loading}
            />
          </div>
        </div>

        {/* Correction Notes */}
        {existingRate && canEdit && (
          <div className="space-y-2">
            <Label
              htmlFor="correctionNotes"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1"
            >
              Market Correction Audit Note
            </Label>
            <Textarea
              id="correctionNotes"
              placeholder="Justify this change for audit log..."
              className="rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white transition-all resize-none min-h-[100px] p-4 text-sm font-medium"
              value={correctionNotes}
              onChange={(e) => setCorrectionNotes(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-2">
          {!isLocked && (
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 hover:bg-black text-white py-7 rounded-2xl shadow-xl shadow-gray-200 group transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Broadcasting...
                  </span>
                </div>
              ) : (
                <span className="text-[11px] font-black uppercase tracking-[0.2em] group-hover:scale-105 transition-transform">
                  Publish {rateType} Market Rate
                </span>
              )}
            </Button>
          )}

          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
              className="py-7 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Discard
            </Button>
          )}
        </div>

        {/* Locking Info */}
        {rateType !== "INTERMEDIATE" && !isLocked && (
          <div className="flex items-center gap-2 px-1">
            <AlertCircle className="h-3 w-3 text-amber-500" />
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              Live broadcast will lock this entry for internal audits
            </p>
          </div>
        )}
      </form>
    </div>
  );

  if (flat) {
    return renderForm();
  }

  return (
    <Card className="rounded-[2.5rem] border-gray-100 shadow-xl overflow-hidden bg-white">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-2xl font-black text-gray-800 tracking-tight flex items-center justify-between">
          {getTitle()}
          {isLocked && <Lock className="h-5 w-5 text-gray-300" />}
        </CardTitle>
        <CardDescription className="text-sm font-medium text-gray-400 mt-2">
          {getDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-4">{renderForm()}</CardContent>
    </Card>
  );
}

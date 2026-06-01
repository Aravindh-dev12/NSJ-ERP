"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getActiveRate,
  formatGoldRate,
  type DailyGoldRate,
} from "@/lib/goldRateApi";
import { TrendingUp, ExternalLink, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoldRateEntryForm } from "./GoldRateEntryForm";
import { getPopupStatus, type GoldRatePopupStatus } from "@/lib/goldRateApi";

export function GoldRateDashboardCard() {
  const [activeRate, setActiveRate] = useState<DailyGoldRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rateStatus, setRateStatus] = useState<GoldRatePopupStatus | null>(
    null
  );

  useEffect(() => {
    loadRates();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(loadRates, 30 * 1000);

    // Listen for gold rate updates
    const handleGoldRateUpdate = () => {
      console.log("[GoldRateDashboardCard] Gold rate updated, reloading...");
      loadRates();
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

  const loadRates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch popup status to know if we need OPENING or INTERMEDIATE
      try {
        const status = await getPopupStatus();
        setRateStatus(status);
      } catch (err) {
        console.error("Failed to fetch rate status:", err);
      }

      // Get active rate - suppress all errors
      try {
        const active = await getActiveRate();
        setActiveRate(active);
      } catch (err) {
        // Silently handle - no rates exist yet
        setActiveRate(null);
      }
    } catch (err) {
      // Silently handle all errors
      setError(null);
      setActiveRate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = () => {
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    loadRates(); // Refresh display
  };

  if (loading) {
    return null; // Don't show loading state
  }

  if (error || !activeRate) {
    return null; // Don't show card if no data yet
  }

  return (
    <Card className="rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative group transition-all duration-500 hover:shadow-[0_20px_50px_rgba(251,191,36,0.1)]">
      {/* Dynamic Background Element */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-amber-100/40 to-orange-50/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />

      <CardHeader className="pb-4 z-10 relative border-b border-orange-50/50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="flex items-center gap-2.5 text-xl font-black text-gray-800 tracking-tight">
              <div className="p-2 rounded-xl bg-amber-50 shadow-inner">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              Market Analytics
            </CardTitle>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600/60 ml-12">
              Real-time Trading Rates
            </p>
          </div>
          <Link href="/gold-rates">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-amber-50 text-amber-600 rounded-full px-3 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest mr-2">
                Full View
              </span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6 z-10 relative">
        {activeRate && (
          <div className="grid grid-cols-3 gap-5">
            {/* 24K Gold Tile */}
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-b from-amber-50/50 to-white rounded-[2rem] border border-amber-100/30 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-700/50 mb-3">
                24K Fine Gold
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-amber-600">₹</span>
                <span className="text-3xl font-black text-gray-800 tracking-tighter">
                  {parseFloat(activeRate.gold_24k_999).toLocaleString()}
                </span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 mt-2">
                per gram
              </span>
            </div>

            {/* 22K Gold Tile */}
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-b from-orange-50/50 to-white rounded-[2rem] border border-orange-100/30 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-700/50 mb-3">
                22K Standard
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-orange-600">₹</span>
                <span className="text-3xl font-black text-gray-800 tracking-tighter">
                  {parseFloat(activeRate.gold_22k).toLocaleString()}
                </span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 mt-2">
                per gram
              </span>
            </div>

            {/* Silver Tile */}
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-b from-slate-50/50 to-white rounded-[2rem] border border-slate-200/30 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500/50 mb-3">
                925 Silver
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-slate-500">₹</span>
                <span className="text-3xl font-black text-gray-800 tracking-tighter">
                  {activeRate.silver_rate
                    ? parseFloat(activeRate.silver_rate).toLocaleString()
                    : "—"}
                </span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 mt-2">
                per gram
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleUpdateClick}
          className="w-full bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-200 transition-all duration-300 rounded-2xl py-7 group"
        >
          <span className="tracking-[0.2em] font-black text-[11px] uppercase group-hover:scale-105 transition-transform">
            Update Gold Rates
          </span>
        </Button>

        {/* Update Rate Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[60vw] max-h-[90vh] overflow-y-auto rounded-3xl border-none bg-white p-0 overflow-hidden shadow-2xl">
            <div className="relative p-8">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-6 top-6 rounded-full hover:bg-gray-100 transition-colors z-50 text-gray-400"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-50 shadow-inner">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                  </div>
                  Daily Rate Update
                </h3>
                <p className="text-sm font-bold text-gray-400 mt-2 ml-14 uppercase tracking-widest">
                  Adjust Live Market Portfolio
                </p>
              </div>

              <div className="mt-8">
                <GoldRateEntryForm
                  rateType={
                    rateStatus?.gold_rate_missing ? "OPENING" : "INTERMEDIATE"
                  }
                  onSuccess={handleSuccess}
                  onCancel={() => setIsModalOpen(false)}
                  flat
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

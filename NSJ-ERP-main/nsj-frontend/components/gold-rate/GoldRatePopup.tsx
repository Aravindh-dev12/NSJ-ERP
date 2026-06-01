"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoldRateEntryForm } from "./GoldRateEntryForm";
import { getPopupStatus, type GoldRatePopupStatus } from "@/lib/goldRateApi";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoldRatePopupProps {
  onComplete?: () => void;
}

export function GoldRatePopup({ onComplete }: GoldRatePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<GoldRatePopupStatus | null>(null);

  useEffect(() => {
    console.log("[GoldRatePopup] Component MOUNTED.");
    checkPopupStatus();
    return () => console.log("[GoldRatePopup] Component UNMOUNTED.");
  }, []);

  const checkPopupStatus = async () => {
    try {
      setLoading(true);
      console.log("[GoldRatePopup] Calling getPopupStatus()...");
      const result = await getPopupStatus();
      console.log("[GoldRatePopup] result:", result);
      setStatus(result);
      if (result.show_popup) {
        setIsRequired(true);
        setIsOpen(true);
      } else {
        setIsRequired(false);
        setIsOpen(false);
      }
    } catch (error) {
      console.log("[GoldRatePopup] error from getPopupStatus:", error);
      setIsRequired(false);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsOpen(false);
    setIsRequired(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    setIsRequired(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (loading || !isRequired || !status) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!status.must_enter) setIsOpen(open);
      }}
    >
      <DialogContent className="max-w-xl md:max-w-2xl lg:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-none bg-white p-0 overflow-hidden shadow-2xl">
        <div className="relative p-8">
          <DialogHeader className="mb-6 p-0 border-none">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 shadow-inner">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-gray-800 tracking-tight">
                  Opening Rate Required
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  {status.must_enter
                    ? "Mandatory Daily Market Initialization"
                    : "Market rates not initialized for today"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4">
            <GoldRateEntryForm
              rateType="OPENING"
              onSuccess={handleSuccess}
              flat
            />
          </div>

          {!status.must_enter && status.can_skip_popup && (
            <div className="mt-6 pt-6 border-t border-gray-50 flex justify-end">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
              >
                Skip Market Initialization
              </Button>
            </div>
          )}

          {status.must_enter && (
            <div className="mt-4 flex items-center gap-2 px-1">
              <AlertCircle className="h-3 w-3 text-amber-500" />
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Entry is required to unlock trading workflows
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

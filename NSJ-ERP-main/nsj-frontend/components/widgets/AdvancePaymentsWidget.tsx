"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AdvancePaymentSummary {
  total_received: number;
  pending_allocation: number;
  allocated_count: number;
}

export function AdvancePaymentsWidget() {
  const router = useRouter();
  const { toast } = useToast();
  const [summary, setSummary] = useState<AdvancePaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdvancePaymentSummary();
  }, []);

  const loadAdvancePaymentSummary = async () => {
    try {
      const response = await api.get<AdvancePaymentSummary>(
        "/accounts/advance-payments/summary/"
      );
      setSummary(response);
    } catch (error: any) {
      console.error("Failed to load advance payment summary:", error);
      // Don't show error toast for 404 - endpoint might not exist yet
      if (error.status !== 404) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load advance payment summary",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border-white/60 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Advance Payments</CardTitle>
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
        <CardTitle>Advance Payments</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/accounts/advance-payments")}
          className="gap-2"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Received */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Total Received
              </span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(summary?.total_received || 0)}
            </p>
          </div>

          {/* Pending Allocation */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                Pending Allocation
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {formatCurrency(summary?.pending_allocation || 0)}
            </p>
            <p className="text-sm text-amber-600 mt-1">
              {summary?.allocated_count || 0} payments
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

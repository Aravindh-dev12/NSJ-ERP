"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface InvoiceSummary {
  pending_count: number;
  pending_amount: number;
  overdue_count: number;
  overdue_amount: number;
}

export function PendingInvoicesWidget() {
  const router = useRouter();
  const { toast } = useToast();
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoiceSummary();
  }, []);

  const loadInvoiceSummary = async () => {
    try {
      const response = await api.get<InvoiceSummary>(
        "/accounts/invoices/summary/"
      );
      setSummary(response);
    } catch (error: any) {
      console.error("Failed to load invoice summary:", error);
      // Don't show error toast for 404 - endpoint might not exist yet
      if (error.status !== 404) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load invoice summary",
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
          <CardTitle>Pending Invoices</CardTitle>
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
        <CardTitle>Pending Invoices</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/accounts/invoices")}
          className="gap-2"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pending Invoices */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Pending</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {summary?.pending_count || 0} invoices
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {formatCurrency(summary?.pending_amount || 0)}
            </p>
          </div>

          {/* Overdue Invoices */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-700">
              {summary?.overdue_count || 0} invoices
            </p>
            <p className="text-sm text-red-600 mt-1">
              {formatCurrency(summary?.overdue_amount || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

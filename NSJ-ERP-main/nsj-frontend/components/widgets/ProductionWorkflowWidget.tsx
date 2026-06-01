"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProductionSummary {
  in_progress: number;
  pending_approval: number;
  completed_today: number;
  total_active: number;
}

export function ProductionWorkflowWidget() {
  const router = useRouter();
  const { toast } = useToast();
  const [summary, setSummary] = useState<ProductionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductionSummary();
  }, []);

  const loadProductionSummary = async () => {
    try {
      const response = await api.get<ProductionSummary>("/production/summary/");
      setSummary(response);
    } catch (error: any) {
      console.error("Failed to load production summary:", error);
      // Don't show error toast for 404 - endpoint might not exist yet
      if (error.status !== 404) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load production summary",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border-white/60 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Production Workflow</CardTitle>
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
        <CardTitle>Production Workflow</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/production/workflow")}
          className="gap-2"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* In Progress */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                In Progress
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-700">
              {summary?.in_progress || 0}
            </p>
          </div>

          {/* Pending Approval */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                Pending Approval
              </span>
            </div>
            <p className="text-3xl font-bold text-amber-700">
              {summary?.pending_approval || 0}
            </p>
          </div>

          {/* Completed Today */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Completed Today
              </span>
            </div>
            <p className="text-3xl font-bold text-green-700">
              {summary?.completed_today || 0}
            </p>
          </div>

          {/* Total Active */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                Total Active
              </span>
            </div>
            <p className="text-3xl font-bold text-purple-700">
              {summary?.total_active || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SalesQueryStats {
  active_queries: number;
  estimates_pending: number;
  queries_converted: number;
  avg_response_time_hours: number;
  pending_followups: number;
}

export function SalesLeadDashboardWidget() {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<SalesQueryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get<SalesQueryStats>(
        "/sales-queries/dashboard-stats/"
      );
      setStats(response);
    } catch (error: any) {
      console.error("Failed to load sales lead stats:", error);
      // Don't show error toast for 404 - endpoint might not exist yet
      if (error.status !== 404) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load sales lead statistics",
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
          <CardTitle>Sales Leads & Estimate</CardTitle>
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
        <CardTitle>Sales Lead Management</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/vouchers/sales-leads/list")}
            className="gap-2"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/vouchers/sales-leads/new")}
            className="gap-2"
          >
            New Query
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Active Queries */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Active Queries
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-700">
              {stats?.active_queries || 0}
            </p>
          </div>

          {/* Estimates Pending */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                Estimates Pending
              </span>
            </div>
            <p className="text-3xl font-bold text-amber-700">
              {stats?.estimates_pending || 0}
            </p>
          </div>

          {/* Queries Converted */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Converted to Sales
              </span>
            </div>
            <p className="text-3xl font-bold text-green-700">
              {stats?.queries_converted || 0}
            </p>
          </div>

          {/* Avg Response Time */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                Avg Response Time
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {stats?.avg_response_time_hours || 0}h
            </p>
          </div>

          {/* Pending Follow-ups */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                Pending Follow-ups
              </span>
            </div>
            <p className="text-3xl font-bold text-red-700">
              {stats?.pending_followups || 0}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Requires immediate attention
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm font-semibold text-muted-foreground mb-3">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push("/vouchers/sales-leads/list?status=pending")
              }
            >
              View Pending Queries
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  "/vouchers/sales-leads/list?status=estimate_pending"
                )
              }
            >
              Pending Estimates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push("/vouchers/sales-leads/list?followup=due")
              }
            >
              Follow-up Due
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

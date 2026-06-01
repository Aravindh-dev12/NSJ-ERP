"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface TaskSummary {
  pending: number;
  completed: number;
  need_founder: number;
  total: number;
}

export function TaskManagementWidget() {
  const router = useRouter();
  const { toast } = useToast();
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaskSummary();
  }, []);

  const loadTaskSummary = async () => {
    try {
      const response = await api.get<TaskSummary>("/tasks/summary/");
      setSummary(response);
    } catch (error: any) {
      console.error("Failed to load task summary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load task summary",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border-white/60 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
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
        <CardTitle>Task Management</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/tasks/dashboard")}
          className="gap-2"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Pending Tasks */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                Pending
              </span>
            </div>
            <p className="text-3xl font-bold text-amber-700">
              {summary?.pending || 0}
            </p>
          </div>

          {/* Completed Tasks */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Completed
              </span>
            </div>
            <p className="text-3xl font-bold text-green-700">
              {summary?.completed || 0}
            </p>
          </div>

          {/* Need Founder */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                Need Founder
              </span>
            </div>
            <p className="text-3xl font-bold text-red-700">
              {summary?.need_founder || 0}
            </p>
          </div>

          {/* Total Tasks */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-blue-900">
                Total Tasks
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-700">
              {summary?.total || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  RefreshCw,
} from "lucide-react";
import { subscribeToAllTaskEvents } from "@/lib/taskEvents";
import { API_BASE_URL } from "@/lib/constants";

interface DepartmentStats {
  [key: string]: {
    total: number;
    completed: number;
    pending: number;
    stuck: number;
    need_founder: number;
    completion_rate: number;
  };
}

interface Bottleneck {
  id: string;
  title: string;
  department: string;
  status: string;
  assigned_to: string;
  days_stuck: number;
  is_overdue: boolean;
}

interface PerformanceData {
  user_id: string;
  name: string;
  department: string;
  total_tasks: number;
  completed: number;
  completion_rate: number;
  avg_completion_time_days: number;
  on_time_rate: number;
}

interface ResourceUtilization {
  department: string;
  active_tasks: number;
  user_count: number;
  tasks_per_user: number;
  utilization_level: string;
}

interface AnalyticsDashboard {
  department_stats: DepartmentStats;
  bottlenecks: Bottleneck[];
  individual_performance: PerformanceData[];
  resource_utilization: ResourceUtilization[];
  productivity_trends: { period: string; completed: number }[];
  urgency_distribution: { [key: string]: number };
  overdue_summary: {
    total_overdue: number;
    avg_days_overdue: number;
    by_department: { [key: string]: number };
  };
  order_timeline: {
    avg_days: number;
    min_days: number;
    max_days: number;
    total_orders: number;
  };
}

const DEPARTMENT_LABELS: { [key: string]: string } = {
  PRODUCT_DESIGN: "Product Design",
  SALES: "Sales",
  SOURCING: "Sourcing",
  FOUNDER: "Founder",
  ACCOUNTS: "Accounts",
  RAW_MATERIAL_INVENTORY: "Raw Material",
  ADMINISTRATION: "Administration",
  PRODUCTION: "Production",
  PRODUCT_INVENTORY: "Product Inventory",
  LOGISTICS: "Logistics",
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Default date range: Dec 24, 2025 to Jan 24, 2026
  const [dateRange, setDateRange] = useState({
    from: "2025-12-24",
    to: "2026-01-24",
  });

  // Check if user is Niti (Founder)
  useEffect(() => {
    if (user) {
      // Check if user is Niti (Founder) by name, email, or task_role
      const isNiti =
        user.name === "Niti" ||
        user.email === "niti@nsj.com" ||
        (user as Record<string, unknown>).task_role === "FOUNDER";

      if (!isNiti) {
        // Redirect non-Founder users to dashboard
        router.push("/tasks/dashboard");
      } else {
        setAuthorized(true);
      }
    }
  }, [user, router]);

  const fetchAnalytics = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await fetch(
          `${API_BASE_URL}/tasks/analytics_dashboard/?date_from=${dateRange.from}&date_to=${dateRange.to}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange]
  );

  // Initial fetch and when date range changes
  useEffect(() => {
    if (authorized) {
      fetchAnalytics();
    }
  }, [dateRange, authorized, fetchAnalytics]);

  // Subscribe to task events for real-time updates
  useEffect(() => {
    if (!authorized) return;

    // Subscribe to all task events (created, updated, status changed, deleted)
    const unsubscribe = subscribeToAllTaskEvents(() => {
      // Immediately refresh analytics when any task event occurs
      fetchAnalytics(true);
    });

    return () => unsubscribe();
  }, [authorized, fetchAnalytics]);

  // Auto-refresh every 60 seconds as a fallback (reduced from 30s since we have real-time events)
  useEffect(() => {
    if (!authorized) return;

    const interval = setInterval(() => {
      fetchAnalytics(true); // Silent refresh
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [authorized, fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  // Show loading while checking authorization
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Failed to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            Task Analytics & Reports
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Comprehensive insights into task management performance
            {lastUpdated && (
              <span className="ml-2 text-xs">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
              From:
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
              className="border rounded px-2 py-1 text-xs md:text-sm flex-1 md:flex-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
              To:
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
              className="border rounded px-2 py-1 text-xs md:text-sm flex-1 md:flex-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Timeline</p>
                <p className="text-2xl font-bold">
                  {analytics.order_timeline.avg_days} days
                </p>
                <p className="text-xs text-muted-foreground">avg completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Tasks</p>
                <p className="text-2xl font-bold">
                  {analytics.overdue_summary.total_overdue}
                </p>
                <p className="text-xs text-muted-foreground">
                  avg {analytics.overdue_summary.avg_days_overdue} days late
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Performers</p>
                <p className="text-2xl font-bold">
                  {analytics.individual_performance[0]?.name || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analytics.individual_performance[0]?.completion_rate || 0}%
                  completion
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bottlenecks</p>
                <p className="text-2xl font-bold">
                  {analytics.bottlenecks.length}
                </p>
                <p className="text-xs text-muted-foreground">tasks stuck</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Department Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-center py-3 px-4">Total</th>
                  <th className="text-center py-3 px-4">Completed</th>
                  <th className="text-center py-3 px-4">Pending</th>
                  <th className="text-center py-3 px-4">Stuck</th>
                  <th className="text-center py-3 px-4">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.department_stats).map(
                  ([dept, stats]) => (
                    <tr key={dept} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">
                        {DEPARTMENT_LABELS[dept] || dept}
                      </td>
                      <td className="text-center py-3 px-4">{stats.total}</td>
                      <td className="text-center py-3 px-4 text-green-600">
                        {stats.completed}
                      </td>
                      <td className="text-center py-3 px-4 text-yellow-600">
                        {stats.pending}
                      </td>
                      <td className="text-center py-3 px-4 text-red-600">
                        {stats.stuck}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            stats.completion_rate >= 80
                              ? "bg-green-100 text-green-700"
                              : stats.completion_rate >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {stats.completion_rate}%
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bottlenecks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Bottleneck Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.bottlenecks.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No bottlenecks identified
                </p>
              ) : (
                analytics.bottlenecks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {DEPARTMENT_LABELS[task.department] || task.department}{" "}
                        • {task.assigned_to || "Unassigned"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          task.is_overdue
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {task.days_stuck} days
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Individual Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.individual_performance.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No performance data available
                </p>
              ) : (
                analytics.individual_performance
                  .slice(0, 5)
                  .map((person, index) => (
                    <div
                      key={person.user_id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0
                              ? "bg-yellow-400 text-yellow-900"
                              : index === 1
                                ? "bg-gray-300 text-gray-700"
                                : index === 2
                                  ? "bg-amber-600 text-white"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{person.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {person.completed}/{person.total_tasks} tasks •{" "}
                            {person.avg_completion_time_days}d avg
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          person.completion_rate >= 80
                            ? "bg-green-100 text-green-700"
                            : person.completion_rate >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {person.completion_rate}%
                      </span>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resource Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.resource_utilization.map((dept) => (
              <div
                key={dept.department}
                className={`p-4 rounded-lg border ${
                  dept.utilization_level === "HIGH"
                    ? "border-red-200 bg-red-50"
                    : dept.utilization_level === "MEDIUM"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-green-200 bg-green-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {DEPARTMENT_LABELS[dept.department] || dept.department}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      dept.utilization_level === "HIGH"
                        ? "bg-red-200 text-red-800"
                        : dept.utilization_level === "MEDIUM"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-green-200 text-green-800"
                    }`}
                  >
                    {dept.utilization_level}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Active Tasks: {dept.active_tasks}</p>
                  <p>Team Size: {dept.user_count}</p>
                  <p>Tasks/Person: {dept.tasks_per_user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Urgency Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Task Urgency Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {Object.entries(analytics.urgency_distribution).map(
              ([urgency, count]) => (
                <div key={urgency} className="flex-1 text-center">
                  <div
                    className={`h-24 rounded-lg flex items-end justify-center ${
                      urgency === "URGENT"
                        ? "bg-red-100"
                        : urgency === "HIGH"
                          ? "bg-orange-100"
                          : urgency === "MEDIUM"
                            ? "bg-yellow-100"
                            : "bg-green-100"
                    }`}
                  >
                    <div
                      className={`w-full rounded-lg ${
                        urgency === "URGENT"
                          ? "bg-red-500"
                          : urgency === "HIGH"
                            ? "bg-orange-500"
                            : urgency === "MEDIUM"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                      }`}
                      style={{
                        height: `${Math.min(100, (count / 10) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium">{urgency}</p>
                  <p className="text-xs text-muted-foreground">{count} tasks</p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";
import { api, clearAuthToken } from "@/lib/api";
import { GoldRateDashboardCard } from "@/components/gold-rate/GoldRateDashboardCard";
import { GoldRateChangeLog } from "@/components/gold-rate/GoldRateChangeLog";
import { DepartmentSwitcher } from "@/components/department/DepartmentSwitcher";
import { departmentsCurrentActive, type Department } from "@/lib/backend";
import { NotificationBell } from "@/components/NotificationBell";
import { GoldRatePopup } from "@/components/gold-rate/GoldRatePopup";

// Helper function to get initials from name
function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper function to generate username from name
function getUsername(name: string): string {
  if (!name) return "user";
  return "@" + name.toLowerCase().replace(/\s+/g, "");
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString("en-IN");
}

// Format currency
function formatCurrency(num: number): string {
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

interface DashboardStats {
  active_orders: number;
  completed_orders: number;
  total_orders: number;
  total_sales: number;
  avg_order_value: number;
  orders_trend: number;
  monthly_data: Array<{ month: string; orders: number }>;
}

interface GoldRate {
  price: number;
  change: number;
  changePercent: number;
}

interface TaskSummary {
  pending: number;
  completed: number;
  need_founder: number;
  total: number;
}

interface SalesQueryStats {
  active_queries: number;
  estimates_pending: number;
  queries_converted: number;
  avg_response_time_hours: number;
  pending_followups: number;
}

interface ProductionStats {
  orders_in_progress: number;
  completed_today: number;
  pending_approvals: number;
  quality_checks_needed: number;
}

interface AccountsStats {
  outstanding_payments: number;
  collections_this_month: number;
  pending_invoices: number;
  advance_payments: number;
}

interface InventoryStats {
  low_stock_items: number;
  pending_purchases: number;
  total_inventory_value: number;
  recent_receipts: number;
}

interface LogisticsStats {
  shipments_in_transit: number;
  pending_deliveries: number;
  completed_deliveries: number;
  delivery_success_rate: number;
}

interface FounderTask {
  id: string;
  title: string;
  description: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  department: string;
  assigned_to_details: {
    name: string;
    email: string;
  } | null;
  created_at: string;
  days_pending: number;
}

export function DashboardShell() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [goldRate, setGoldRate] = useState<GoldRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState<Department | null>(
    null
  );
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [salesQueryStats, setSalesQueryStats] =
    useState<SalesQueryStats | null>(null);
  const [productionStats, setProductionStats] =
    useState<ProductionStats | null>(null);
  const [accountsStats, setAccountsStats] = useState<AccountsStats | null>(
    null
  );
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(
    null
  );
  const [logisticsStats, setLogisticsStats] = useState<LogisticsStats | null>(
    null
  );
  const [founderTasks, setFounderTasks] = useState<FounderTask[]>([]);
  const [loadingFounderTasks, setLoadingFounderTasks] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Get user display info
  const userName = user?.name || "Guest";
  const userInitials = getInitials(userName);
  const userHandle = getUsername(userName);

  // Load active department on mount
  useEffect(() => {
    const loadActiveDepartment = async () => {
      try {
        const dept = await departmentsCurrentActive();
        setActiveDepartment(dept);
      } catch (e) {
        // User has no departments - this is fine
        console.log("No active department: ", e);
      }
    };
    loadActiveDepartment();
  }, []);

  // Listen for department changes
  useEffect(() => {
    const handleDepartmentChange = (event: CustomEvent) => {
      setActiveDepartment(event.detail.department);
      // Refetch stats when department changes
      fetchStats(event.detail.departmentId);
      fetchDepartmentData(event.detail.department);
    };

    window.addEventListener(
      "departmentChanged" as unknown as keyof WindowEventMap,
      handleDepartmentChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "departmentChanged" as unknown as keyof WindowEventMap,
        handleDepartmentChange as EventListener
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthToken();
      router.push("/login");
    }
  };

  // Fetch dashboard stats
  const fetchStats = async (departmentId?: string | null) => {
    setLoading(true);
    try {
      const url = departmentId
        ? `${API_BASE_URL}/dashboard/stats/?department=${departmentId}`
        : `${API_BASE_URL}/dashboard/stats/`;

      const response = await fetch(url, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch department-specific data
  const fetchDepartmentData = async (department: Department | null) => {
    if (!department) {
      // Clear all stats if no department
      setTaskSummary(null);
      setSalesQueryStats(null);
      setProductionStats(null);
      setAccountsStats(null);
      setInventoryStats(null);
      setLogisticsStats(null);
      setFounderTasks([]);
      return;
    }

    // Reset all department stats
    setTaskSummary(null);
    setSalesQueryStats(null);
    setProductionStats(null);
    setAccountsStats(null);
    setInventoryStats(null);
    setLogisticsStats(null);

    // Always fetch task summary for all departments
    try {
      const response = await api.get<TaskSummary>(
        `/tasks/summary/?department=${department.id}`
      );
      setTaskSummary(response);

      // If there are tasks needing founder, fetch the details
      if (response.need_founder > 0) {
        fetchFounderTasks(department.id);
      } else {
        setFounderTasks([]);
      }
    } catch (error) {
      console.error("Failed to fetch task summary:", error);
      // Set empty task summary on error so card still shows
      setTaskSummary({
        pending: 0,
        completed: 0,
        need_founder: 0,
        total: 0,
      });
    }

    // Fetch department-specific stats based on department name
    switch (department.name) {
      case "Sales/Query":
        try {
          const response = await api.get<SalesQueryStats>(
            "/sales-queries/dashboard-stats/"
          );
          setSalesQueryStats(response);
        } catch (error) {
          console.error("Failed to fetch sales lead stats:", error);
        }
        break;

      case "Production":
        try {
          // Mock data for now - replace with actual API call
          setProductionStats({
            orders_in_progress: 15,
            completed_today: 8,
            pending_approvals: 3,
            quality_checks_needed: 5,
          });
        } catch (error) {
          console.error("Failed to fetch production stats:", error);
        }
        break;

      case "Accounts":
        try {
          // Use mock data since API endpoint doesn't exist yet
          setAccountsStats({
            outstanding_payments: 12,
            collections_this_month: 450000,
            pending_invoices: 8,
            advance_payments: 23,
          });
        } catch (error) {
          console.error("Failed to set accounts stats:", error);
        }
        break;

      case "Raw Material Inventory":
        try {
          // Mock data for now - replace with actual API call
          setInventoryStats({
            low_stock_items: 7,
            pending_purchases: 4,
            total_inventory_value: 2500000,
            recent_receipts: 12,
          });
        } catch (error) {
          console.error("Failed to fetch inventory stats:", error);
        }
        break;

      case "Logistics":
        try {
          // Mock data for now - replace with actual API call
          setLogisticsStats({
            shipments_in_transit: 18,
            pending_deliveries: 9,
            completed_deliveries: 45,
            delivery_success_rate: 96,
          });
        } catch (error) {
          console.error("Failed to fetch logistics stats:", error);
        }
        break;

      case "Administration":
        // Administration uses task summary only
        break;
    }
  };

  // Fetch tasks needing founder intervention
  const fetchFounderTasks = async (departmentId?: string) => {
    setLoadingFounderTasks(true);
    try {
      const url = departmentId
        ? `/tasks/?status=NEED_FOUNDER&department=${departmentId}&page_size=5`
        : `/tasks/?status=NEED_FOUNDER&page_size=5`;

      const response = await api.get<{ results: FounderTask[]; count: number }>(
        url
      );
      setFounderTasks(response.results || []);
    } catch (error) {
      console.error("Failed to fetch founder tasks:", error);
      setFounderTasks([]);
    } finally {
      setLoadingFounderTasks(false);
    }
  };

  useEffect(() => {
    fetchStats(activeDepartment?.id);
    fetchDepartmentData(activeDepartment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDepartment]);

  // Fetch gold rate from API
  useEffect(() => {
    const fetchGoldRate = async () => {
      try {
        // Fetch from our backend which proxies goldapi.io
        const response = await fetch(`${API_BASE_URL}/gold-rate/`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setGoldRate({
            price: data.price_per_gram_24k,
            change: data.change || 0,
            changePercent: data.change_percent || 0,
          });
        } else {
          // Fallback to approximate rate if API fails
          setGoldRate({
            price: 7900,
            change: 0,
            changePercent: 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch gold rate:", error);
        // Fallback rate - approximate 24K gold rate
        setGoldRate({
          price: 7900,
          change: 0,
          changePercent: 0,
        });
      }
    };

    fetchGoldRate();
    // Refresh gold rate every 5 minutes
    const interval = setInterval(fetchGoldRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Build KPI cards with real data - No base cards, only department-specific
  const baseKpiCards: Record<string, never>[] = [];

  // Add department-specific cards
  const departmentCards = [];

  // Task Management Cards (for all departments) - Always show if department is active
  if (taskSummary && activeDepartment) {
    departmentCards.push({
      label: "Pending Tasks",
      value: formatNumber(taskSummary.pending),
      trend: `${taskSummary.total} total`,
      tone: "bg-purple-100 text-purple-700",
      badgeTone: "bg-purple-500 text-white",
    });

    if (taskSummary.need_founder > 0) {
      departmentCards.push({
        label: "Need Founder",
        value: formatNumber(taskSummary.need_founder),
        trend: "Urgent",
        tone: "bg-red-100 text-red-700",
        badgeTone: "bg-red-500 text-white",
      });
    }
  }

  // Sales/Query Department Cards
  if (salesQueryStats && activeDepartment?.name === "Sales/Query") {
    departmentCards.push(
      {
        label: "Active Queries",
        value: formatNumber(salesQueryStats.active_queries),
        trend: `${salesQueryStats.pending_followups} follow-ups`,
        tone: "bg-blue-100 text-blue-700",
        badgeTone: "bg-blue-500 text-white",
      },
      {
        label: "Estimates Pending",
        value: formatNumber(salesQueryStats.estimates_pending),
        trend: `${salesQueryStats.avg_response_time_hours}h avg`,
        tone: "bg-amber-100 text-amber-700",
        badgeTone: "bg-amber-500 text-white",
      },
      {
        label: "Converted to Sales",
        value: formatNumber(salesQueryStats.queries_converted),
        trend: "This month",
        tone: "bg-green-100 text-green-700",
        badgeTone: "bg-green-500 text-white",
      }
    );
  }

  // Production Department Cards
  if (productionStats && activeDepartment?.name === "Production") {
    departmentCards.push(
      {
        label: "Orders in Progress",
        value: formatNumber(productionStats.orders_in_progress),
        trend: "Active",
        tone: "bg-blue-100 text-blue-700",
        badgeTone: "bg-blue-500 text-white",
      },
      {
        label: "Completed Today",
        value: formatNumber(productionStats.completed_today),
        trend: "Today",
        tone: "bg-green-100 text-green-700",
        badgeTone: "bg-green-500 text-white",
      },
      {
        label: "Pending Approvals",
        value: formatNumber(productionStats.pending_approvals),
        trend: "Needs review",
        tone: "bg-orange-100 text-orange-700",
        badgeTone: "bg-orange-500 text-white",
      },
      {
        label: "Quality Checks",
        value: formatNumber(productionStats.quality_checks_needed),
        trend: "Pending",
        tone: "bg-purple-100 text-purple-700",
        badgeTone: "bg-purple-500 text-white",
      }
    );
  }

  // Accounts Department Cards
  if (accountsStats && activeDepartment?.name === "Accounts") {
    departmentCards.push(
      {
        label: "Outstanding Payments",
        value: formatNumber(accountsStats.outstanding_payments),
        trend: "Pending",
        tone: "bg-red-100 text-red-700",
        badgeTone: "bg-red-500 text-white",
      },
      {
        label: "Collections This Month",
        value: formatCurrency(accountsStats.collections_this_month),
        trend: "Collected",
        tone: "bg-green-100 text-green-700",
        badgeTone: "bg-green-500 text-white",
      },
      {
        label: "Pending Invoices",
        value: formatNumber(accountsStats.pending_invoices),
        trend: "To process",
        tone: "bg-amber-100 text-amber-700",
        badgeTone: "bg-amber-500 text-white",
      },
      {
        label: "Advance Payments",
        value: formatNumber(accountsStats.advance_payments),
        trend: "Received",
        tone: "bg-blue-100 text-blue-700",
        badgeTone: "bg-blue-500 text-white",
      }
    );
  }

  // Raw Material Inventory Department Cards
  if (inventoryStats && activeDepartment?.name === "Raw Material Inventory") {
    departmentCards.push(
      {
        label: "Low Stock Items",
        value: formatNumber(inventoryStats.low_stock_items),
        trend: "Reorder needed",
        tone: "bg-red-100 text-red-700",
        badgeTone: "bg-red-500 text-white",
      },
      {
        label: "Pending Purchases",
        value: formatNumber(inventoryStats.pending_purchases),
        trend: "In process",
        tone: "bg-amber-100 text-amber-700",
        badgeTone: "bg-amber-500 text-white",
      },
      {
        label: "Inventory Value",
        value: formatCurrency(inventoryStats.total_inventory_value),
        trend: "Total",
        tone: "bg-blue-100 text-blue-700",
        badgeTone: "bg-blue-500 text-white",
      },
      {
        label: "Recent Receipts",
        value: formatNumber(inventoryStats.recent_receipts),
        trend: "Last 7 days",
        tone: "bg-green-100 text-green-700",
        badgeTone: "bg-green-500 text-white",
      }
    );
  }

  // Logistics Department Cards
  if (logisticsStats && activeDepartment?.name === "Logistics") {
    departmentCards.push(
      {
        label: "In Transit",
        value: formatNumber(logisticsStats.shipments_in_transit),
        trend: "Shipments",
        tone: "bg-blue-100 text-blue-700",
        badgeTone: "bg-blue-500 text-white",
      },
      {
        label: "Pending Deliveries",
        value: formatNumber(logisticsStats.pending_deliveries),
        trend: "To deliver",
        tone: "bg-amber-100 text-amber-700",
        badgeTone: "bg-amber-500 text-white",
      },
      {
        label: "Completed Deliveries",
        value: formatNumber(logisticsStats.completed_deliveries),
        trend: "This month",
        tone: "bg-green-100 text-green-700",
        badgeTone: "bg-green-500 text-white",
      },
      {
        label: "Success Rate",
        value: `${logisticsStats.delivery_success_rate}%`,
        trend: "Delivery",
        tone: "bg-emerald-100 text-emerald-700",
        badgeTone: "bg-emerald-500 text-white",
      }
    );
  }

  // Administration / Overview Department Cards (Default when no specific department logic matches)
  if (
    stats &&
    (activeDepartment?.name === "Administration" ||
      activeDepartment?.name === "Founder")
  ) {
    departmentCards.push(
      {
        label: "Total Orders",
        value: formatNumber(stats.total_orders),
        trend: "Overall",
        tone: "bg-blue-100 text-blue-700",
        badgeTone: "bg-blue-500 text-white",
      },
      {
        label: "Active Orders",
        value: formatNumber(stats.active_orders),
        trend: "In progress",
        tone: "bg-emerald-100 text-emerald-700",
        badgeTone: "bg-emerald-500 text-white",
      },
      {
        label: "Total Sales",
        value: formatCurrency(stats.total_sales),
        trend: "Revenue",
        tone: "bg-amber-100 text-amber-700",
        badgeTone: "bg-amber-500 text-white",
      }
    );
  }

  // Combine all cards
  const kpiCards = [...baseKpiCards, ...departmentCards];

  // Chart data from API or fallback - ensure unique months
  const rawChartData = stats?.monthly_data || [
    { month: "Jan", orders: 0 },
    { month: "Feb", orders: 0 },
    { month: "Mar", orders: 0 },
    { month: "Apr", orders: 0 },
    { month: "May", orders: 0 },
    { month: "Jun", orders: 0 },
    { month: "Jul", orders: 0 },
    { month: "Aug", orders: 0 },
    { month: "Sep", orders: 0 },
    { month: "Oct", orders: 0 },
    { month: "Nov", orders: 0 },
    { month: "Dec", orders: 0 },
  ];

  // Remove duplicate months by keeping only the last occurrence
  const chartData = rawChartData.reduce(
    (acc: Array<{ month: string; orders: number }>, curr) => {
      const existingIndex = acc.findIndex((item) => item.month === curr.month);
      if (existingIndex >= 0) {
        // Replace existing with current (keep last occurrence)
        acc[existingIndex] = curr;
      } else {
        acc.push(curr);
      }
      return acc;
    },
    []
  );

  const MAX_ORDER = Math.max(...chartData.map((p) => p.orders), 1);

  // Summary balances
  const summaryBalances = [
    { label: formatNumber(stats?.total_orders || 0), sublabel: "Total Orders" },
    {
      label: formatCurrency(stats?.avg_order_value || 0),
      sublabel: "Avg order value",
    },
    { label: formatCurrency(stats?.total_sales || 0), sublabel: "Total sales" },
  ];

  return (
    <div className="space-y-6">
      <GoldRatePopup />
      {/* Top bar with department switcher and account info */}
      <div className="flex justify-between items-center">
        {/* Department Switcher on the left */}
        <DepartmentSwitcher />

        {/* Right side controls — always pushed to the far right */}
        <div className="flex items-center gap-4 ml-auto">
          <NotificationBell />

          {/* Account info on the right */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 rounded-full border border-white/70 bg-white px-4 py-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground">{userHandle}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {userInitials}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/70 bg-white py-2 shadow-lg z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-foreground">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gold Rate Management Card - New System */}
      <GoldRateDashboardCard />

      {/* Need Founder Intervention Section (Key Actions) - Moved up for focus */}
      {founderTasks.length > 0 && (
        <Card className="rounded-3xl border-red-200 bg-red-50/30 shadow-sm">
          <CardHeader className="border-b border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-red-700">
                    Need Founder Intervention
                  </CardTitle>
                  <p className="text-sm text-red-600 mt-1">
                    {founderTasks.length}{" "}
                    {founderTasks.length === 1
                      ? "task requires"
                      : "tasks require"}{" "}
                    immediate attention
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  router.push("/tasks/dashboard?status=NEED_FOUNDER")
                }
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                View All
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingFounderTasks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-red-500" />
              </div>
            ) : (
              <div className="space-y-3">
                {founderTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-red-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              task.urgency === "URGENT"
                                ? "bg-red-500 text-white"
                                : task.urgency === "HIGH"
                                  ? "bg-orange-500 text-white"
                                  : task.urgency === "MEDIUM"
                                    ? "bg-yellow-500 text-white"
                                    : "bg-blue-500 text-white"
                            }`}
                          >
                            {task.urgency}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                            {task.department}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-foreground mb-1 truncate">
                          {task.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {task.assigned_to_details?.name || "Unassigned"}
                          </div>
                          <div className="flex items-center gap-1">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {task.days_pending || 0} days pending
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/tasks/${task.id}`);
                        }}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                      >
                        Take Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <Card
            key={`${card.label}-${index}`}
            className={`rounded-2xl border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] overflow-hidden group transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] hover:-translate-y-1 relative`}
          >
            {/* Background Accent */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${card.tone}`}
            />

            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6 z-10 relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 group-hover:text-gray-600 transition-colors">
                {card.label}
              </p>
              <div
                className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${card.badgeTone} shadow-sm backdrop-blur-md`}
              >
                {card.trend || "—"}
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 z-10 relative">
              <div className="flex flex-col gap-2">
                <span className="text-4xl font-black tracking-tight text-gray-800 drop-shadow-sm">
                  {card.value}
                </span>
                <div className="flex w-full items-center mt-3">
                  <div className="h-2 w-full rounded-xl bg-gray-100 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-xl transition-all duration-1000 ease-out ${card.badgeTone.split(" ")[0]} w-[70%] shadow-[0_0_12px_rgba(0,0,0,0.05)]`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="rounded-3xl border-white/60 bg-white shadow-sm mt-6">
        <CardHeader className="flex flex-col gap-6 border-b border-muted/60 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-2xl font-semibold text-foreground">
              Overview
            </CardTitle>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-primary">
                <span className="h-3 w-3 rounded-full bg-primary"></span>
                Orders
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {summaryBalances.map((item, idx) => (
                <div
                  key={item.sublabel}
                  className={`flex flex-col gap-2 rounded-3xl border border-white/40 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.03] ${
                    idx === 0
                      ? "bg-gradient-to-br from-indigo-50/80 to-blue-50/50"
                      : idx === 1
                        ? "bg-gradient-to-br from-emerald-50/80 to-teal-50/50"
                        : "bg-gradient-to-br from-rose-50/80 to-orange-50/50"
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    {item.sublabel}
                  </p>
                  <p className="text-2xl font-black text-gray-800 tracking-tight">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                    ) : (
                      item.label
                    )}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-between">
              <div className="h-64 w-full">
                <div className="grid h-full grid-cols-12 items-end gap-4 rounded-2xl border border-muted/60 bg-gradient-to-b from-white via-white to-muted/60 px-6 pb-6 pt-8">
                  {chartData.map((item) => {
                    const ordersHeight = Math.max(
                      8,
                      Math.round((item.orders / MAX_ORDER) * 100)
                    );
                    return (
                      <div
                        key={item.month}
                        className="relative flex h-full flex-col items-center justify-end gap-3 text-xs text-muted-foreground"
                      >
                        <span
                          className="text-sm font-semibold text-foreground"
                          style={{
                            position: "absolute",
                            bottom: `${ordersHeight + 6}%`,
                            left: "50%",
                            transform: "translateX(-50%)",
                          }}
                        >
                          {item.orders}
                        </span>

                        <div className="flex h-full w-full items-end justify-center group/bar">
                          <div
                            className="w-1/2 rounded-t-2xl bg-gradient-to-t from-primary/80 to-primary transition-all duration-500 group-hover/bar:w-2/3 group-hover/bar:shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                            style={{ height: `${ordersHeight}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-500">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-2xl border border-white/80 bg-slate-50/50 p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/80 mb-4">
              Latest Dashboard Updates
            </p>
            <ul className="space-y-3 text-sm text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                {stats?.total_orders || 0} total orders processed.{" "}
                <span className="text-slate-900 font-bold">
                  {stats?.active_orders || 0} currently active.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                Gold rate: ₹{formatNumber(Math.round(goldRate?.price || 0))}/g
                (24K).{" "}
                <span
                  className={
                    goldRate?.changePercent !== undefined &&
                    goldRate?.changePercent >= 0
                      ? "text-green-600 font-bold"
                      : "text-red-500 font-bold"
                  }
                >
                  {goldRate?.changePercent !== undefined &&
                  goldRate?.changePercent >= 0
                    ? "Up"
                    : "Down"}{" "}
                  {Math.abs(goldRate?.changePercent || 0).toFixed(2)}% today.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                Average order value:{" "}
                <span className="text-slate-900 font-bold">
                  {formatCurrency(stats?.avg_order_value || 0)}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                {stats?.completed_orders || 0} orders completed with advance
                payment received.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Gold Rate Change Log */}
      <div className="mt-8">
        <GoldRateChangeLog />
      </div>
    </div>
  );
}

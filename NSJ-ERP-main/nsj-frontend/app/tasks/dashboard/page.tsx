"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  API_BASE_URL,
  TASK_URGENCY_COLORS,
  TASK_STATUS_COLORS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Plus,
  Calendar,
  AlertCircle,
  Filter,
  Users,
  Building,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { emitTaskEvent, TASK_EVENTS } from "@/lib/taskEvents";
import { NotificationBell } from "@/components/NotificationBell";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  urgency: string;
  urgency_display: string;
  status: string;
  status_display: string;
  department: string;
  department_display: string;
  sub_department: string | null;
  sub_department_display: string | null;
  assigned_to_name: string | null;
  assigned_person_name: string;
  all_assignee_names?: string[];
  assignees_details?: { id: string; name: string; email: string }[];
  created_by_details: { id: string; name: string; email: string } | null;
  is_overdue: boolean;
  requires_completion_proof: boolean;
  completion_proof: string | null;
  completion_proof_url: string | null;
  is_read?: boolean;
}

interface UserInfo {
  id: string | null;
  name: string;
  email: string;
  task_role: string;
  task_role_display: string;
  department: string | null;
  department_display: string | null;
  sub_department: string | null;
  sub_department_display: string | null;
  can_view_all_tasks: boolean;
  can_view_department_tasks: boolean;
  can_view_sub_department_tasks: boolean;
  is_authenticated: boolean;
  is_simulated?: boolean;
  show_switch_user?: boolean;
}

interface Stats {
  my_pending: number;
  my_completed: number;
  my_stuck: number;
  my_need_founder: number;
  my_total: number;
  visible_pending: number;
  visible_completed: number;
  visible_need_founder: number;
  visible_total: number;
  task_role: string;
  can_view_all: boolean;
}

interface FilterOptions {
  users: Array<{ id: string; name: string; email: string }>;
  departments: Array<{ value: string; label: string }>;
  sub_departments: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
  urgencies: Array<{ value: string; label: string }>;
  is_founder: boolean;
  is_dept_head: boolean;
  task_role: string;
}

// Local color maps removed in favor of global constants

export default function TaskDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    sub_department: "",
    assigned_to_name: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProofImage, setExpandedProofImage] = useState<string | null>(
    null
  );

  // Check URL query parameters on mount to set initial filter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get("status");

    if (statusParam) {
      setFilters((prev) => ({
        ...prev,
        status: statusParam,
      }));
    }
  }, []);

  useEffect(() => {
    // Initialize dashboard - always fetch user info first
    const initializeDashboard = async () => {
      try {
        // Fetch current user info - backend will handle both session auth and simulated users
        const response = await fetch(
          `${API_BASE_URL}/tasks/current_user_info/`,
          {
            headers: { Accept: "application/json" },
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data);

          // If user is authenticated via real session, clear any simulated user data
          if (data.is_authenticated) {
            localStorage.removeItem("currentTaskUser");
            localStorage.removeItem("currentTaskUserName");
            localStorage.removeItem("currentTaskUserRole");
          }
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      }
    };

    initializeDashboard();
  }, []);

  useEffect(() => {
    if (userInfo) {
      // Now that we know the user's auth status, fetch the rest of the data
      // Pass the auth status directly to avoid closure issues
      const isAuth = userInfo.is_authenticated;
      fetchStats(isAuth);
      fetchFilterOptions(isAuth);
      fetchTasks(isAuth);
    }
  }, [userInfo]);

  // Refetch tasks when filters change
  useEffect(() => {
    if (userInfo) {
      fetchTasks(userInfo.is_authenticated);
    }
  }, [filters]);

  const getHeaders = (isAuthenticated?: boolean) => {
    const headers: Record<string, string> = { Accept: "application/json" };

    // Only send simulated user header if NOT authenticated via session
    // When user is logged in via session, the session cookie handles auth
    const authStatus = isAuthenticated ?? userInfo?.is_authenticated;
    if (authStatus) {
      // User is logged in via session - don't send simulated user header
      return headers;
    }

    // Only for development/testing when not logged in via session
    const simulatedUserId = localStorage.getItem("currentTaskUser");
    if (simulatedUserId) {
      headers["X-Simulated-User-Id"] = simulatedUserId;
    }
    return headers;
  };

  const fetchStats = async (isAuthenticated?: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/stats/`, {
        headers: getHeaders(isAuthenticated),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchFilterOptions = async (isAuthenticated?: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/filter_options/`, {
        headers: getHeaders(isAuthenticated),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchTasks = async (isAuthenticated?: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`${API_BASE_URL}/tasks/?${params}`, {
        headers: getHeaders(isAuthenticated),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const taskList = Array.isArray(data) ? data : data.results || [];
        setTasks(taskList);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    // Find the task to get previous status
    const task = tasks.find((t) => t.id === taskId);
    const previousStatus = task?.status;

    try {
      const response = await fetch(
        `${API_BASE_URL}/tasks/${taskId}/update_status/`,
        {
          method: "PATCH",
          headers: {
            ...getHeaders(userInfo?.is_authenticated),
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        // Emit event for real-time updates across the app
        emitTaskEvent(TASK_EVENTS.TASK_STATUS_CHANGED, {
          taskId,
          status: newStatus,
          previousStatus,
          assignedTo: task?.assigned_to_name || task?.assigned_person_name,
          department: task?.department,
        });

        toast({
          title: "Status Updated",
          description: `Task status changed to ${newStatus}.`,
        });
        fetchTasks(userInfo?.is_authenticated);
        fetchStats(userInfo?.is_authenticated);
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update task status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getRoleTitle = () => {
    if (!userInfo) return "Task Dashboard";
    switch (userInfo.task_role) {
      case "FOUNDER":
        return "Founder Dashboard - All Tasks";
      case "DEPT_HEAD":
        return `${userInfo.department_display || "Department"} Dashboard`;
      case "SUB_DEPT_HEAD":
        return `${userInfo.sub_department_display || "Sub-Department"} Dashboard`;
      default:
        return "My Tasks";
    }
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      department: "",
      sub_department: "",
      assigned_to_name: "",
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Expanded Proof Image Modal */}
      {expandedProofImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setExpandedProofImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setExpandedProofImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={expandedProofImage}
              alt="Completion Proof"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 md:mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{getRoleTitle()}</h1>
          {userInfo && (
            <p className="text-sm md:text-base text-muted-foreground">
              Logged in as: {userInfo.name} ({userInfo.task_role_display})
              {userInfo.department_display &&
                ` • ${userInfo.department_display}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <NotificationBell />
          <Button
            onClick={() => router.push("/tasks/new")}
            className="flex-1 md:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Stats Cards - Clean Design */}
      {stats && (
        <section className="mb-6 grid gap-6 lg:grid-cols-4">
          <Card className="rounded-3xl border-white/60 bg-white p-0 shadow-sm">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Pending
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {stats.visible_pending}
              </p>
              <div className="mt-4 h-2 rounded-full bg-yellow-400"></div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/60 bg-white p-0 shadow-sm">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Completed
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {stats.visible_completed}
              </p>
              <div className="mt-4 h-2 rounded-full bg-green-400"></div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/60 bg-white p-0 shadow-sm">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Need Founder
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {stats.visible_need_founder}
              </p>
              <div className="mt-4 h-2 rounded-full bg-purple-400"></div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/60 bg-white p-0 shadow-sm">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Total Tasks
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {stats.visible_total}
              </p>
              <div className="mt-4 h-2 rounded-full bg-blue-400"></div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Quick Filters - Updated Design */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button
          variant={filters.status === "" ? "default" : "outline"}
          onClick={() => setFilters({ ...filters, status: "" })}
          size="sm"
          className={
            filters.status === "" ? "bg-primary text-primary-foreground" : ""
          }
        >
          All
        </Button>
        <Button
          variant={filters.status === "PENDING" ? "default" : "outline"}
          onClick={() => setFilters({ ...filters, status: "PENDING" })}
          size="sm"
          className={
            filters.status === "PENDING"
              ? "bg-primary text-primary-foreground"
              : ""
          }
        >
          PENDING
        </Button>
        <Button
          variant={filters.status === "COMPLETED" ? "default" : "outline"}
          onClick={() => setFilters({ ...filters, status: "COMPLETED" })}
          size="sm"
          className={
            filters.status === "COMPLETED"
              ? "bg-primary text-primary-foreground"
              : ""
          }
        >
          COMPLETED
        </Button>
        <Button
          variant={filters.status === "NEED_FOUNDER" ? "default" : "outline"}
          onClick={() => setFilters({ ...filters, status: "NEED_FOUNDER" })}
          size="sm"
          className={
            filters.status === "NEED_FOUNDER"
              ? "bg-primary text-primary-foreground"
              : ""
          }
        >
          Need Founder
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="ml-auto"
        >
          <Filter className="mr-2 h-4 w-4" />
          {showFilters ? "Hide Filters" : "More Filters"}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && filterOptions && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {filterOptions.is_founder && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Department
                  </label>
                  <Select
                    value={filters.department}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        department: e.target.value,
                        sub_department: "",
                      })
                    }
                  >
                    <option value="">All Departments</option>
                    {filterOptions.departments.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {(filterOptions.is_founder || filterOptions.is_dept_head) && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Sub-Department
                  </label>
                  <Select
                    value={filters.sub_department}
                    onChange={(e) =>
                      setFilters({ ...filters, sub_department: e.target.value })
                    }
                  >
                    <option value="">All Sub-Departments</option>
                    {filterOptions.sub_departments.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Assigned To
                </label>
                <Select
                  value={filters.assigned_to_name}
                  onChange={(e) =>
                    setFilters({ ...filters, assigned_to_name: e.target.value })
                  }
                >
                  <option value="">All People</option>
                  {filterOptions.users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List - Asana-Style Table Layout */}
      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tasks found
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b bg-gray-50 font-medium text-sm text-gray-700">
            <div className="col-span-3">Task Title</div>
            <div className="col-span-2">Assigned to</div>
            <div className="col-span-2">
              Department →
              <br />
              Sub-Department
            </div>
            <div className="col-span-1">Importance</div>
            <div className="col-span-2">
              Deadline Date
              <br />
              <span className="text-xs font-normal">no of days left</span>
            </div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">
              View
              <br />
              Details
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${task.is_overdue ? "bg-red-50" : ""
                  }`}
              >
                {/* Task Title Column */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm ${task.is_read === false ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                      {task.title}
                    </h3>
                    {task.is_read === false && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {task.description}
                  </p>
                </div>

                {/* Assigned to Column */}
                <div className="col-span-2 flex items-center">
                  <div
                    className="px-3 py-1.5 bg-gray-100 rounded-md text-xs text-gray-700 whitespace-normal line-clamp-2"
                    title={
                      task.all_assignee_names?.join(", ") ||
                      task.assigned_person_name
                    }
                  >
                    {(() => {
                      if (
                        task.all_assignee_names &&
                        task.all_assignee_names.length > 0
                      ) {
                        return task.all_assignee_names.join(", ");
                      }
                      if (
                        task.assignees_details &&
                        task.assignees_details.length > 0
                      ) {
                        return task.assignees_details
                          .map((a) => a.name)
                          .join(", ");
                      }
                      return task.assigned_person_name;
                    })()}
                  </div>
                </div>

                {/* Department → Sub-Department Column */}
                <div className="col-span-2 flex items-center">
                  <div className="px-3 py-1.5 bg-gray-100 rounded-md text-xs text-gray-700 whitespace-normal">
                    {task.department_display}
                    {task.sub_department_display &&
                      ` → ${task.sub_department_display}`}
                  </div>
                </div>

                {/* Importance Column */}
                <div className="col-span-1 flex items-center">
                  <div
                    className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap border ${TASK_URGENCY_COLORS[task.urgency as keyof typeof TASK_URGENCY_COLORS]}`}
                  >
                    {task.urgency_display}
                  </div>
                </div>

                {/* Deadline Column */}
                <div className="col-span-2 flex items-center">
                  <div className="px-3 py-1.5 bg-gray-100 rounded-md text-xs text-gray-700">
                    <div>{new Date(task.deadline).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {(() => {
                        const today = new Date();
                        const deadline = new Date(task.deadline);
                        const diffTime = deadline.getTime() - today.getTime();
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24)
                        );
                        if (diffDays < 0)
                          return `${Math.abs(diffDays)} days overdue`;
                        if (diffDays === 0) return "Due today";
                        return `${diffDays} days left`;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Status Column */}
                <div className="col-span-1 flex items-center justify-center">
                  <div
                    className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-normal text-center leading-tight border ${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS]}`}
                  >
                    {task.status_display}
                  </div>
                </div>

                {/* View Details Column */}
                <div className="col-span-1 flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

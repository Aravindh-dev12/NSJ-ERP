"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Calendar, AlertCircle, Filter, ShieldAlert } from "lucide-react";

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
  assigned_to_details: { id: string; name: string; email: string } | null;
  assigned_person_name: string;
  created_by_details: { id: string; name: string; email: string };
  is_overdue: boolean;
}

interface FilterOptions {
  users: Array<{ id: string; name: string; email: string }>;
  departments: Array<{ value: string; label: string }>;
  sub_departments: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
  urgencies: Array<{ value: string; label: string }>;
  is_founder: boolean;
  task_role: string;
}

const urgencyColors = {
  LOW: "bg-gray-200 text-gray-800",
  MEDIUM: "bg-blue-200 text-blue-800",
  HIGH: "bg-orange-200 text-orange-800",
  URGENT: "bg-red-200 text-red-800",
};

const statusColors = {
  PENDING: "bg-yellow-200 text-yellow-800",
  COMPLETED: "bg-green-200 text-green-800",
  STUCK: "bg-red-200 text-red-800",
  NEED_FOUNDER: "bg-purple-200 text-purple-800",
  TRANSFERRED: "bg-blue-200 text-blue-800",
};

export default function AllTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    sub_department: "",
    urgency: "",
    assigned_to: "",
  });

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tasks/current_user_info/`,
          {
            headers: { Accept: "application/json" },
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.is_authenticated);
          // If authenticated, clear any simulated user from localStorage
          if (data.is_authenticated) {
            localStorage.removeItem("currentTaskUser");
            localStorage.removeItem("currentTaskUserName");
            localStorage.removeItem("currentTaskUserRole");
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [isAuthenticated]);

  useEffect(() => {
    if (filterOptions && filterOptions.is_founder) {
      fetchTasks();
    }
  }, [filters, filterOptions]);

  const getHeaders = () => {
    const headers: Record<string, string> = { Accept: "application/json" };
    // IMPORTANT: Only send simulated user header if NOT authenticated
    // When user is logged in via session, the session cookie handles auth
    if (!isAuthenticated) {
      const simulatedUserId = localStorage.getItem("currentTaskUser");
      if (simulatedUserId) {
        headers["X-Simulated-User-Id"] = simulatedUserId;
      }
    }
    return headers;
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/filter_options/`, {
        headers: getHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Only founders can access this page
        if (!data.is_founder) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        setFilterOptions(data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`${API_BASE_URL}/tasks/?${params}`, {
        headers: getHeaders(),
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

  const clearFilters = () => {
    setFilters({
      status: "",
      department: "",
      sub_department: "",
      urgency: "",
      assigned_to: "",
    });
  };

  // Access denied for non-founders
  if (accessDenied) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-300">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <ShieldAlert className="mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-bold">Access Denied</h2>
            <p className="mb-4 text-muted-foreground">
              Only the Founder (Niti) can view all tasks across the
              organization.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Please use the Dashboard to view tasks based on your role.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/tasks/dashboard")}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push("/tasks")}>
                My Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!filterOptions) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">All Tasks (Admin View)</h1>
        <p className="text-muted-foreground">
          View and manage all tasks across the organization
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All statuses</option>
                {filterOptions.statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Department
              </label>
              <Select
                value={filters.department}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value })
                }
              >
                <option value="">All departments</option>
                {filterOptions.departments.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Sub-Department
              </label>
              <Select
                value={filters.sub_department}
                onChange={(e) =>
                  setFilters({ ...filters, sub_department: e.target.value })
                }
              >
                <option value="">All sub-departments</option>
                {filterOptions.sub_departments.map((subDept) => (
                  <option key={subDept.value} value={subDept.value}>
                    {subDept.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Urgency</label>
              <Select
                value={filters.urgency}
                onChange={(e) =>
                  setFilters({ ...filters, urgency: e.target.value })
                }
              >
                <option value="">All urgencies</option>
                {filterOptions.urgencies.map((urgency) => (
                  <option key={urgency.value} value={urgency.value}>
                    {urgency.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Assigned To
              </label>
              <Select
                value={filters.assigned_to}
                onChange={(e) =>
                  setFilters({ ...filters, assigned_to: e.target.value })
                }
              >
                <option value="">All users</option>
                {filterOptions.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tasks found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className={task.is_overdue ? "border-red-300" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{task.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={
                        urgencyColors[
                          task.urgency as keyof typeof urgencyColors
                        ]
                      }
                    >
                      {task.urgency_display}
                    </Badge>
                    <Badge
                      className={
                        statusColors[task.status as keyof typeof statusColors]
                      }
                    >
                      {task.status_display}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex gap-4 text-sm text-muted-foreground">
                  <span>
                    Assigned to: {task.assigned_person_name || "Unassigned"}
                  </span>
                  <span>
                    Created by: {task.created_by_details?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                      {task.is_overdue && (
                        <AlertCircle className="ml-1 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <span>
                      Department: {task.department_display}
                      {task.sub_department_display &&
                        ` → ${task.sub_department_display}`}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

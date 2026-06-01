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
import {
  Plus,
  Calendar,
  AlertCircle,
  FileText,
  Building,
  User,
  Printer,
} from "lucide-react";

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
  assigned_to_details: { id: string; name: string; email: string };
  assigned_to_name?: string;
  // New fields for multi-select
  all_assignee_names?: string[];
  assignees_details?: { id: string; name: string; email: string }[];
  created_by_details: { id: string; name: string; email: string };
  is_overdue: boolean;
}

// Local color maps removed in favor of global constants

export default function MyTasksPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // State for user details
  const [userInfo, setUserInfo] = useState<{
    id: string;
    name: string;
    department: string;
    role: string;
  } | null>(null);

  // Check authentication and get user info on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tasks/current_user_info/`,
          {
            headers: { Accept: "application/json" },
            credentials: "include", // Ensure cookies are sent
          }
        );
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.is_authenticated);

          if (data.is_authenticated) {
            setUserInfo({
              id: data.user_id,
              name: data.username,
              // Map backend data to frontend structure if needed
              // detailed_user info might be needed here
              department: data.department || "", // You might need to update backend to send this
              role: data.role || "",
            });

            localStorage.removeItem("currentTaskUser");
            localStorage.removeItem("currentTaskUserName");
            localStorage.removeItem("currentTaskUserRole");
          } else {
            // Fallback for simulated user
            const simulatedUserId = localStorage.getItem("currentTaskUser");
            const simulatedUserName = localStorage.getItem(
              "currentTaskUserName"
            );
            // For simulation, we need to know the simulated user's Department/Role clearly.
            // Usually this simple simulation might lack department info.
            // We'll rely on name-based inference or stored metadata if available.
            if (simulatedUserId) {
              setUserInfo({
                id: simulatedUserId,
                name: simulatedUserName || "Simulated User",
                department: "", // Unknown in simple sim
                role: "",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filter, isAuthenticated]);

  const getHeaders = () => {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (!isAuthenticated) {
      const simulatedUserId = localStorage.getItem("currentTaskUser");
      if (simulatedUserId) {
        headers["X-Simulated-User-Id"] = simulatedUserId;
      }
    }
    return headers;
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/tasks/${filter !== "all" ? `?status=${filter}` : ""}`;
      const response = await fetch(url, {
        headers: getHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        let taskList: Task[] = Array.isArray(data) ? data : data.results || [];

        // --- CLIENT-SIDE VISIBILITY FILTERING ---
        // Founder "Niti" sees EVERYTHING.
        // Others see:
        // 1. Tasks assigned TO them.
        // 2. Tasks where their Department matches the task Department.
        // 3. Tasks they created.

        // We need to identify if current user is Niti (Founder).
        // Using Name check for safety if ID isn't stable across envs,
        // but ID "1" is hardcoded in new/page.tsx for Niti.
        const currentUserId =
          userInfo?.id || localStorage.getItem("currentTaskUser");
        const currentUserName =
          userInfo?.name || localStorage.getItem("currentTaskUserName");
        const isFounder = currentUserName === "Niti" || currentUserId === "1"; // Match Niti/Founder ID

        // If we are NOT the founder, apply strict filtering
        if (!isFounder && currentUserId) {
          // We need to infer department for the detailed check.
          // If we don't have department in userInfo, we might rely on assigned_to check predominantly.
          // For improvement: If backend doesn't filter, we filter here.

          taskList = taskList.filter((task) => {
            // 1. Assigned to me (Check both single and multi fields)
            if (task.assigned_to_details?.id === currentUserId) return true;
            if (task.assignees_details?.some((u) => u.id === currentUserId))
              return true;

            // 2. Created by me
            if (task.created_by_details?.id === currentUserId) return true;

            // 3. Department match (Harder without clean user department data on frontend)
            // If we had user department, we'd check: task.department === userDepartment

            return false;
          });
        }

        console.log("✅ First task from API:", taskList[0]);
        console.log("✅ Assignee fields:", {
          all_assignee_names: taskList[0]?.all_assignee_names,
          assignees_details: taskList[0]?.assignees_details,
          assigned_to_details: taskList[0]?.assigned_to_details,
          assigned_to_name: taskList[0]?.assigned_to_name,
        });

        setTasks(taskList);
      } else {
        const error = await response.text();
        console.error("Fetch failed:", error);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tasks/${taskId}/update_status/`,
        {
          method: "PATCH",
          headers: { ...getHeaders(), "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        await fetchTasks();
      } else {
        const error = await response.text();
        alert(`Failed to update task status: ${error}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Error updating task: ${error}`);
    }
  };

  // Helper for deadline urgency color
  const getDeadlineStyle = (deadline: string, isOverdue: boolean) => {
    if (isOverdue) return "text-red-600 font-bold animate-pulse";

    const today = new Date();
    const d = new Date(deadline);
    const diffTime = d.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 2) return "text-orange-600 font-semibold"; // Due soon
    return "text-muted-foreground";
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Task Board
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your team&apos;s workflow and deadlines.
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="shadow-sm font-bold"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={() => router.push("/tasks/new")}
            className="shadow-md bg-black text-white hover:bg-gray-800 font-bold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Task
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 p-1 bg-muted/30 rounded-lg w-fit no-print">
        {["all", "PENDING", "COMPLETED", "NEED_FOUNDER"].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "ghost"}
            onClick={() => setFilter(status)}
            size="sm"
            className={filter === status ? "shadow-sm" : ""}
          >
            {status === "all"
              ? "All Tasks"
              : status === "NEED_FOUNDER"
                ? "Founder Action"
                : status.charAt(0) + status.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No tasks found
            </h3>
            <p className="text-muted-foreground mt-1">
              Get started by creating a new task.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className={`transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 border-l-4 bg-white ${
                task.is_overdue || task.urgency === "URGENT"
                  ? "border-l-red-500 shadow-red-50"
                  : task.status === "COMPLETED"
                    ? "border-l-green-500 shadow-green-50"
                    : "border-l-blue-500 shadow-blue-50"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                  {/* Left: Main Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <Badge
                        variant="outline"
                        className={`${TASK_URGENCY_COLORS[task.urgency as keyof typeof TASK_URGENCY_COLORS]} border font-bold uppercase text-[10px] tracking-wider px-2.5 py-1 shadow-sm`}
                      >
                        {task.urgency_display}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS]} font-semibold text-[10px] px-2.5 py-1 shadow-sm`}
                      >
                        {task.status_display}
                      </Badge>
                    </div>

                    <h3 className="text-3xl font-black text-gray-900 leading-tight tracking-tight mb-1">
                      {task.title}
                    </h3>

                    <p className="text-sm text-gray-500 line-clamp-2 max-w-3xl leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-5 text-sm mt-4 pt-4 text-gray-600 border-t border-gray-100">
                      <div
                        className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md"
                        title="Department"
                      >
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-gray-700">
                          {task.department_display}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md"
                        title="Assigned To"
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {(() => {
                            // Try all_assignee_names first
                            if (
                              task.all_assignee_names &&
                              task.all_assignee_names.length > 0
                            ) {
                              return task.all_assignee_names.length > 2
                                ? `${task.all_assignee_names.slice(0, 2).join(", ")} +${task.all_assignee_names.length - 2}`
                                : task.all_assignee_names.join(", ");
                            }
                            // Fallback to assignees_details
                            if (
                              task.assignees_details &&
                              task.assignees_details.length > 0
                            ) {
                              const names = task.assignees_details.map(
                                (a) => a.name
                              );
                              return names.length > 2
                                ? `${names.slice(0, 2).join(", ")} +${names.length - 2}`
                                : names.join(", ");
                            }
                            // Fallback to single assignee
                            return (
                              task.assigned_to_details?.name || "Unassigned"
                            );
                          })()}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold ${
                          task.is_overdue
                            ? "bg-red-50 text-red-700"
                            : getDeadlineStyle(
                                  task.deadline,
                                  task.is_overdue
                                ).includes("orange")
                              ? "bg-orange-50 text-orange-700"
                              : "bg-gray-50 text-gray-700"
                        }`}
                        title="Deadline"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                        {task.is_overdue && (
                          <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto mt-2 md:mt-0 items-end no-print">
                    <Button
                      size="lg"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="w-full md:w-40 h-12 bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

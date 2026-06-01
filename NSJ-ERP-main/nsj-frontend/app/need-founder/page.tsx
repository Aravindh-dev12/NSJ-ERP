"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  AlertCircle,
  Users,
  Building,
  ArrowRight,
  CheckCircle,
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
  assigned_to_name: string | null;
  assigned_person_name: string;
  all_assignee_names?: string[];
  created_by_details: { id: string; name: string; email: string } | null;
  is_overdue: boolean;
  created_at: string;
}

const urgencyColors = {
  LOW: "bg-gray-200 text-gray-800",
  MEDIUM: "bg-blue-200 text-blue-800",
  HIGH: "bg-orange-200 text-orange-800",
  URGENT: "bg-red-200 text-red-800",
};

export default function NeedFounderPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  useEffect(() => {
    fetchNeedFounderTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchNeedFounderTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/tasks/?status=NEED_FOUNDER`,
        {
          headers: getHeaders(),
          credentials: "include",
        }
      );

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

  const handleViewTask = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };

  const handleResolve = async (taskId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tasks/${taskId}/update_status/`,
        {
          method: "PATCH",
          headers: {
            ...getHeaders(),
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status: "PENDING" }),
        }
      );

      if (response.ok) {
        fetchNeedFounderTasks();
      } else {
        alert("Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Need Founder Intervention
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Tasks requiring your attention and decision
        </p>
      </div>

      {/* Stats Card */}
      <Card className="mb-6 bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">
                Pending Requests
              </p>
              <p className="text-3xl font-bold text-purple-900 mt-1">
                {tasks.length}
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-purple-200 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-purple-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">
              All caught up!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              No tasks currently need your intervention
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className={`hover:shadow-md transition-shadow ${
                task.is_overdue ? "border-red-300 bg-red-50" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl mb-2">
                      {task.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge
                      className={`text-xs ${
                        urgencyColors[
                          task.urgency as keyof typeof urgencyColors
                        ]
                      }`}
                    >
                      {task.urgency_display}
                    </Badge>
                    {task.is_overdue && (
                      <Badge className="bg-red-500 text-white text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Task Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {task.department_display}
                        {task.sub_department_display &&
                          ` → ${task.sub_department_display}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {task.all_assignee_names &&
                        task.all_assignee_names.length > 0
                          ? task.all_assignee_names.join(", ")
                          : task.assigned_person_name}
                      </span>
                    </div>
                  </div>

                  {/* Created Info */}
                  <div className="text-xs text-muted-foreground border-t pt-3">
                    <p>
                      Requested by: {task.created_by_details?.name || "Unknown"}{" "}
                      • {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleViewTask(task.id)}
                      className="flex items-center gap-2"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(task.id)}
                      className="flex items-center gap-2"
                    >
                      Mark as Resolved
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer Help Text */}
      {tasks.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Click &quot;View Details&quot; to see the full
            task and take action, or &quot;Mark as Resolved&quot; to send it
            back to the assignee.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, ArrowRight, Clock, User } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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

export function NeedFounderWidget() {
  const router = useRouter();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<FounderTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFounderTasks();
  }, []);

  const loadFounderTasks = async () => {
    try {
      const response = await api.get<{ results: FounderTask[]; count: number }>(
        "/tasks/?status=NEED_FOUNDER&page_size=5"
      );
      setTasks(response.results || []);
    } catch (error: any) {
      console.error("Failed to load founder tasks:", error);
      // Don't show error toast for 404 - endpoint might not exist yet
      if (error.status !== 404) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load founder intervention tasks",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "URGENT":
        return "bg-red-500 text-white";
      case "HIGH":
        return "bg-orange-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-white";
      case "LOW":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border-red-200 bg-red-50/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Need Founder Intervention
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="rounded-3xl border-green-200 bg-green-50/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <AlertTriangle className="h-5 w-5" />
            Need Founder Intervention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600">
            ✓ No tasks requiring founder intervention
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-red-200 bg-red-50/30 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          Need Founder Intervention
          <Badge variant="destructive" className="ml-2">
            {tasks.length}
          </Badge>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/tasks/dashboard?status=NEED_FOUNDER")}
          className="gap-2"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-red-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/tasks/${task.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      className={getUrgencyColor(task.urgency)}
                      variant="secondary"
                    >
                      {task.urgency}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.department}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm text-foreground mb-1 truncate">
                    {task.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assigned_to_details?.name || "Unassigned"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.days_pending || 0} days pending
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/tasks/${task.id}`);
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {tasks.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button
              className="w-full"
              onClick={() =>
                router.push("/tasks/dashboard?status=NEED_FOUNDER")
              }
            >
              View All {tasks.length} Tasks Needing Intervention
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

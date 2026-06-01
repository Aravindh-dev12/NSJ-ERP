"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Calendar,
  User,
  Building,
  FileText,
  ArrowLeft,
  Upload,
  CheckCircle,
} from "lucide-react";
import { emitTaskEvent, TASK_EVENTS } from "@/lib/taskEvents";
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
  output_medium: string;
  assigned_to_details: { id: string; name: string; email: string } | null;
  assigned_to_name: string | null;
  assigned_person_name: string;
  // New fields for multi-select
  all_assignee_names?: string[];
  assignees_details?: { id: string; name: string; email: string }[];
  created_by_details: { id: string; name: string; email: string };
  attachment: string | null;
  requires_completion_proof: boolean;
  completion_proof: string | null;
  completion_proof_url: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "STUCK", label: "Stuck" },
  { value: "NEED_FOUNDER", label: "Need Founder Intervention" },
  { value: "TRANSFERRED", label: "Transferred to Another Department" },
];

// Local color maps removed in favor of global constants

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [completionProof, setCompletionProof] = useState<File | null>(null);
  const [completionProofPreview, setCompletionProofPreview] = useState<
    string | null
  >(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Handle file selection and create preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCompletionProof(file);

    // Create preview for images
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCompletionProofPreview(null);
    }
  };

  // Clear file and preview
  const clearFile = () => {
    setCompletionProof(null);
    setCompletionProofPreview(null);
  };

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

  const getHeaders = () => {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
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

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId, isAuthenticated]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/`, {
        headers: getHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data);
      } else {
        if (response.status === 404) {
          toast({
            title: "Task Not Found",
            description: "The task you're looking for was not found. It may have been deleted.",
            variant: "destructive",
          });
        } else if (response.status === 403) {
          toast({
            title: "Access Denied",
            description: "You do not have permission to view this task.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Error loading task: ${response.status}`,
            variant: "destructive",
          });
        }
        router.push("/tasks/dashboard");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      toast({
        title: "Connection Error",
        description: "Network error. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    // Always open completion modal when marking as completed to allow/require proof
    if (newStatus === "COMPLETED") {
      setShowCompletionModal(true);
      return;
    }

    const previousStatus = task?.status;
    setUpdating(true);
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
        fetchTask();
      } else {
        const errorData = await response.json();
        toast({
          title: "Update Failed",
          description: `Failed to update status: ${errorData.detail || errorData.completion_proof?.[0] || "Unknown error"}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteWithProof = async () => {
    if (!completionProof) {
      toast({
        title: "Proof Required",
        description: "Please upload proof of completion to proceed.",
        variant: "destructive",
      });
      return;
    }

    const previousStatus = task?.status;
    setUpdating(true);

    try {
      const formData = new FormData();
      formData.append("status", "COMPLETED");
      formData.append("completion_proof", completionProof);
      if (completionNotes) {
        formData.append("completion_notes", completionNotes);
      }

      const response = await fetch(
        `${API_BASE_URL}/tasks/${taskId}/update_status/`,
        {
          method: "PATCH",
          headers: getHeaders(),
          credentials: "include",
          body: formData,
        }
      );

      if (response.ok) {
        emitTaskEvent(TASK_EVENTS.TASK_STATUS_CHANGED, {
          taskId,
          status: "COMPLETED",
          previousStatus,
          assignedTo: task?.assigned_to_name || task?.assigned_person_name,
          department: task?.department,
        });
        toast({
          title: "Task Completed",
          description: "Proof uploaded and task marked as completed.",
        });
        setShowCompletionModal(false);
        clearFile();
        setCompletionNotes("");
        fetchTask();
      } else {
        const errorData = await response.json();
        toast({
          title: "Submission Failed",
          description: `Failed to complete task: ${errorData.detail || errorData.completion_proof?.[0] || "Unknown error"}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error completing task:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!task) {
    return <div className="container mx-auto p-6">Task not found</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      {/* Completion Proof Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold">Complete Task</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {task.requires_completion_proof
                ? "This task requires proof of completion. Please upload a file/image."
                : "You can optionally upload a file/image as proof of completion."}
            </p>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                Proof of Completion{" "}
                {task.requires_completion_proof ? "*" : "(Optional)"}
              </label>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full rounded border p-2 text-sm"
              />
              {completionProof && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 mb-2">
                    ✓ {completionProof.name}
                  </p>
                  {/* Image Preview */}
                  {completionProofPreview && (
                    <div className="relative">
                      <img
                        src={completionProofPreview}
                        alt="Preview"
                        className="w-full max-h-48 object-contain rounded border"
                      />
                      <button
                        type="button"
                        onClick={clearFile}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                Completion Notes (optional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any notes about the completed work..."
                className="w-full rounded border p-2 text-sm"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCompleteWithProof}
                disabled={
                  updating ||
                  (task.requires_completion_proof && !completionProof)
                }
                className="flex-1"
              >
                {updating ? "Completing..." : "Complete Task"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompletionModal(false);
                  clearFile();
                  setCompletionNotes("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push("/tasks/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tasks
      </Button>

      <Card>
        <CardHeader className="px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="mb-2 text-xl md:text-2xl">
                {task.title}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  className={`text-xs ${TASK_URGENCY_COLORS[task.urgency as keyof typeof TASK_URGENCY_COLORS]}`}
                >
                  {task.urgency_display}
                </Badge>
                <Badge
                  className={`text-xs ${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS]}`}
                >
                  {task.status_display}
                </Badge>
                {task.is_overdue && (
                  <Badge className="bg-red-500 text-white text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
          <div>
            <h3 className="mb-2 font-semibold text-sm md:text-base">
              Description
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              {task.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs md:text-sm font-medium">Deadline</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {new Date(task.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs md:text-sm font-medium">Department</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {task.department_display}
                  {task.sub_department_display &&
                    ` → ${task.sub_department_display}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs md:text-sm font-medium">Assignees</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {(() => {
                    // Try all_assignee_names first
                    if (
                      task.all_assignee_names &&
                      task.all_assignee_names.length > 0
                    ) {
                      return task.all_assignee_names.join(", ");
                    }
                    // Fallback to assignees_details
                    if (
                      task.assignees_details &&
                      task.assignees_details.length > 0
                    ) {
                      return task.assignees_details
                        .map((a) => a.name)
                        .join(", ");
                    }
                    // Fallback to single assignee
                    return (
                      task.assigned_to_details?.name ||
                      task.assigned_person_name ||
                      "Unassigned"
                    );
                  })()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs md:text-sm font-medium">Created By</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {task.created_by_details.name}
                </p>
              </div>
            </div>
          </div>

          {task.output_medium && (
            <div>
              <h3 className="mb-2 font-semibold text-sm md:text-base">
                Output Medium
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                {task.output_medium}
              </p>
            </div>
          )}

          {task.attachment && (
            <div>
              <h3 className="mb-2 font-semibold text-sm md:text-base">
                Attachment
              </h3>
              <a
                href={task.attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm md:text-base text-blue-600 hover:underline"
              >
                <FileText className="h-4 w-4" />
                View Attachment
              </a>
            </div>
          )}

          {/* Completion Proof Section */}
          {(task.requires_completion_proof || task.completion_proof_url) && (
            <div className={`rounded-lg border p-4 ${task.requires_completion_proof ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className="mb-2 font-semibold text-sm md:text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {task.requires_completion_proof ? "Completion Proof Required" : "Completion Proof"}
              </h3>
              {task.completion_proof_url ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Proof uploaded</span>
                  </div>

                  {/* Always try to show as image first */}
                  <div className="mt-2">
                    <img
                      src={task.completion_proof_url}
                      alt="Completion Proof"
                      className="max-w-full max-h-64 object-contain rounded border cursor-pointer hover:opacity-90"
                      onClick={() =>
                        window.open(task.completion_proof_url!, "_blank")
                      }
                      onError={(e) => {
                        // If image fails to load, hide it
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        // Show fallback link
                        const fallback =
                          target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "block";
                      }}
                    />
                    <a
                      href={task.completion_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden items-center gap-2 text-sm text-blue-600 hover:underline"
                      style={{ display: "none" }}
                    >
                      <FileText className="h-4 w-4" />
                      View Completion Proof
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click image to view full size
                    </p>
                  </div>

                  {task.completion_notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Notes:</strong> {task.completion_notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-amber-700">
                    Upload proof of completion to mark this task as complete.
                  </p>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Upload Proof (Image/PDF/Document) *
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="w-full rounded border border-amber-300 bg-white p-2 text-sm"
                    />
                    {completionProof && (
                      <div className="mt-2">
                        <p className="text-xs text-green-600 mb-2">
                          ✓ {completionProof.name}
                        </p>
                        {/* Image Preview */}
                        {completionProofPreview && (
                          <div className="relative inline-block">
                            <img
                              src={completionProofPreview}
                              alt="Preview"
                              className="max-w-full max-h-48 object-contain rounded border"
                            />
                            <button
                              type="button"
                              onClick={clearFile}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Completion Notes (optional)
                    </label>
                    <textarea
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      placeholder="Add any notes about the completed work..."
                      className="w-full rounded border border-amber-300 bg-white p-2 text-sm"
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleCompleteWithProof}
                    disabled={!completionProof || updating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {updating
                      ? "Completing..."
                      : "Upload Proof & Complete Task"}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="mb-2 font-semibold text-sm md:text-base">
              Update Status
            </h3>
            <Select
              value={task.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={updating}
              className="w-full md:w-[300px]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="border-t pt-4 text-xs md:text-sm text-muted-foreground">
            <p>Created: {new Date(task.created_at).toLocaleString()}</p>
            <p>Last Updated: {new Date(task.updated_at).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

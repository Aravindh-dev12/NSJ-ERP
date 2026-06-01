"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  CalendarIcon,
  Loader2,
  User,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react";
import { getCompanyUsers } from "@/lib/backend";

interface AssignNextStepDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nextStepName: string;
  nextStepDepartment?: string;
  onConfirm: (
    deadline: string,
    assigneeId: string,
    assigneeName: string
  ) => Promise<void>;
}

export function AssignNextStepDialog({
  isOpen,
  onClose,
  nextStepName,
  nextStepDepartment,
  onConfirm,
}: AssignNextStepDialogProps) {
  const [deadline, setDeadline] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [users, setUsers] = useState<
    {
      id: string;
      name: string;
      email: string;
      role?: string;
      department?: string;
    }[]
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorLoadingUsers, setErrorLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    deadline?: string;
    assignee?: string;
  }>({});
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Load users when dialog opens
  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        try {
          setLoadingUsers(true);
          setErrorLoadingUsers(false);

          // Always fetch all users — admin should be able to assign any user
          const usersList = await getCompanyUsers();
          setUsers(usersList);
          console.log("[Assign Next Step] Loaded users:", usersList.length);
        } catch (err) {
          console.error("Failed to load company users:", err);
          setErrorLoadingUsers(true);

          // Final fallback: try loading all users
          try {
            const allUsers = await getCompanyUsers();
            setUsers(allUsers);
          } catch (finalErr) {
            console.error("Failed to load all users:", finalErr);
          }
        } finally {
          setLoadingUsers(false);
        }
      };
      loadUsers();
    }
  }, [isOpen, nextStepDepartment]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDeadline("");
      setAssigneeId("");
      setAssigneeName("");
      setErrors({});
      setUserSearch("");
      setShowUserDropdown(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    console.log("[Assign Next Step] handleConfirm called");
    console.log("[Assign Next Step] Current state:", {
      deadline,
      assigneeId,
      assigneeName,
    });

    // Validate
    const newErrors: { deadline?: string; assignee?: string } = {};

    // Deadline validation and formatting
    let formattedDeadline = deadline;
    if (!deadline) {
      newErrors.deadline = "Please select a deadline";
    } else {
      // Ensure date is in YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(deadline)) {
        // Try to convert from other formats
        try {
          const d = new Date(deadline);
          if (!isNaN(d.getTime())) {
            // Convert to YYYY-MM-DD format
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            formattedDeadline = `${yyyy}-${mm}-${dd}`;
            // Update the state with formatted date
            setDeadline(formattedDeadline);
          } else {
            newErrors.deadline = "Invalid date format";
          }
        } catch {
          newErrors.deadline = "Invalid date format";
        }
      }
    }

    if (!assigneeId) {
      newErrors.assignee = "Please select an assignee";
    }

    if (Object.keys(newErrors).length > 0) {
      console.log("[Assign Next Step] Validation errors:", newErrors);
      setErrors(newErrors);
      return; // Stop here, do NOT call the API
    }

    console.log("[Assign Next Step] Validation passed, calling onConfirm...");

    setSubmitting(true);
    try {
      console.log("[Assign Next Step] Sending to API:", {
        deadline: formattedDeadline,
        assigneeId,
        assigneeName,
      });

      await onConfirm(formattedDeadline, assigneeId, assigneeName);

      console.log("[Assign Next Step] onConfirm completed successfully");
    } catch (err: any) {
      // Handle API errors locally - don't re-throw to prevent global error handler
      console.error("Assign next step error:", err);

      // Check if it's a validation error from the API
      const errorData = err?.data || err?.response?.data;
      const errorMessage =
        errorData?.message ||
        errorData?.error ||
        err?.message ||
        "Failed to assign next step";

      console.log("[Assign Next Step] Error response:", errorData);

      // Set inline error if possible, otherwise show in dialog
      setErrors({
        deadline: errorMessage.includes("deadline") ? errorMessage : undefined,
        assignee: errorMessage.includes("assignee") ? errorMessage : undefined,
      });

      // If we can't map it to a specific field, keep the dialog open without closing
      // Don't re-throw - this prevents the global error handler from showing a toast
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryLoadUsers = async () => {
    try {
      setLoadingUsers(true);
      setErrorLoadingUsers(false);
      const usersList = await getCompanyUsers();
      setUsers(usersList);
    } catch (err) {
      console.error("Failed to load company users:", err);
      setErrorLoadingUsers(true);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    console.log("[Assign Next Step] User selected:", userId);
    setAssigneeId(userId);
    const selectedUser = users.find((u) => u.id === userId);
    if (selectedUser) {
      setAssigneeName(selectedUser.name);
      console.log("[Assign Next Step] User name:", selectedUser.name);
    } else {
      console.warn("[Assign Next Step] User not found in list:", userId);
      setAssigneeName("");
    }
    if (errors.assignee) {
      setErrors((prev) => ({ ...prev, assignee: undefined }));
    }
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeadline(e.target.value);
    if (errors.deadline) {
      setErrors((prev) => ({ ...prev, deadline: undefined }));
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <CalendarIcon className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <DialogTitle className="text-xl">Assign Next Step</DialogTitle>
              <DialogDescription className="mt-1">
                Before marking this step as done, assign the next step.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4 px-6">
          {/* Next Step Name - Read-only badge */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Next Step
            </Label>
            <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
                <span className="text-sm font-bold text-white">→</span>
              </div>
              <span className="text-base font-semibold text-blue-900">
                {nextStepName}
              </span>
            </div>
          </div>

          {/* Department - Read-only badge (if available) */}
          {nextStepDepartment && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Department
              </Label>
              <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-600">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-semibold text-purple-900">
                  {nextStepDepartment}
                </span>
              </div>
            </div>
          )}

          {/* Deadline */}
          <div className="space-y-2">
            <Label
              htmlFor="deadline"
              className="text-sm font-medium text-gray-700"
            >
              Deadline <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={handleDeadlineChange}
                min={today}
                className={`h-11 ${errors.deadline ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-blue-500"}`}
              />
              <CalendarIcon className="absolute right-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
            {errors.deadline && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.deadline}
              </p>
            )}
          </div>

          {/* Assign To */}
          <div className="space-y-2">
            <Label
              htmlFor="assignee"
              className="text-sm font-medium text-gray-700"
            >
              Assign To <span className="text-destructive">*</span>
            </Label>
            {errorLoadingUsers ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryLoadUsers}
                  disabled={loadingUsers}
                  className="w-full h-11"
                >
                  {loadingUsers ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Could not load users. Retry ↺"
                  )}
                </Button>
              </div>
            ) : (
              <div className="relative">
                {/* Selected display / search input */}
                <div
                  className={`flex h-11 w-full items-center rounded-md border bg-background px-3 text-sm cursor-pointer ${errors.assignee ? "border-destructive" : "border-input"}`}
                  onClick={() => {
                    if (!loadingUsers) setShowUserDropdown((v) => !v);
                  }}
                >
                  {loadingUsers ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users...
                    </span>
                  ) : assigneeId ? (
                    <span className="font-medium text-gray-800">
                      {assigneeName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Select a user...
                    </span>
                  )}
                </div>

                {/* Dropdown panel */}
                {showUserDropdown && !loadingUsers && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    {/* Search inside dropdown */}
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full rounded border border-gray-200 py-1.5 pl-7 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    {/* User list */}
                    <ul className="max-h-48 overflow-y-auto py-1">
                      {users
                        .filter(
                          (u) =>
                            !userSearch.trim() ||
                            u.name
                              .toLowerCase()
                              .includes(userSearch.toLowerCase()) ||
                            u.email
                              .toLowerCase()
                              .includes(userSearch.toLowerCase())
                        )
                        .map((u) => (
                          <li
                            key={u.id}
                            onClick={() => {
                              handleUserSelect(u.id);
                              setShowUserDropdown(false);
                              setUserSearch("");
                            }}
                            className={`flex flex-col px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${assigneeId === u.id ? "bg-blue-50" : ""}`}
                          >
                            <span className="text-sm font-medium text-gray-800">
                              {u.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {u.email}
                            </span>
                          </li>
                        ))}
                      {users.filter(
                        (u) =>
                          !userSearch.trim() ||
                          u.name
                            .toLowerCase()
                            .includes(userSearch.toLowerCase()) ||
                          u.email
                            .toLowerCase()
                            .includes(userSearch.toLowerCase())
                      ).length === 0 && (
                        <li className="px-3 py-3 text-sm text-center text-muted-foreground">
                          No users found
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {errors.assignee && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.assignee}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t px-6 pb-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="h-11 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm & Mark Done
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  diamondPurchaseIssueCreate,
  diamondPurchaseIssueList,
  ordersDropdown,
  type DiamondPurchaseIssue,
  autoCompleteStep,
  saveProcessStepData,
} from "@/lib/backend";
import { Upload, CheckCircle2, AlertCircle, Save, Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { OrderDetailsDisplay } from "@/components/OrderDetailsDisplay";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function DiamondPurchaseIssuePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<DiamondPurchaseIssue[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  // Check if user is Production department (write access)
  const isProductionDept =
    user?.name === "Sanjana" ||
    user?.name === "Production" ||
    user?.name === "Production Department" ||
    user?.email === "sanjana@nsj.com";

  // Check if user is Raw Material department (read-only access)
  const isRawMaterialDept =
    user?.name === "Jinu" ||
    user?.name === "Jinu Bhai" ||
    user?.email === "jinu@nsj.com";

  // Form state
  const [accountOrderId, setAccountOrderId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderValidated, setOrderValidated] = useState(false);
  const [validatedOrder, setValidatedOrder] = useState<any>(null);
  const [carryForwardImage, setCarryForwardImage] = useState<File | null>(null);

  // Save → Mark as Done state
  const [hasSaved, setHasSaved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);

  // Load orders dropdown
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await ordersDropdown();
        setOrders(response.orders || []);
      } catch (err) {
        console.error("Failed to load orders:", err);
      }
    };
    void loadOrders();
  }, []);

  // Load existing records
  useEffect(() => {
    const loadRecords = async () => {
      try {
        const response = await diamondPurchaseIssueList({
          page: 1,
          page_size: 10,
        });
        setRecords(response.results || response.items || []);
      } catch (err) {
        console.error("Failed to load records:", err);
      } finally {
        setLoadingList(false);
      }
    };
    void loadRecords();
  }, [success]);

  // Validate order ID
  const validateOrderId = () => {
    if (!accountOrderId.trim()) {
      setError("Please enter an Order ID");
      setOrderValidated(false);
      setValidatedOrder(null);
      return;
    }

    // Find matching order
    const matchingOrder = orders.find(
      (order) =>
        order.bill_no === accountOrderId ||
        order.job_no === accountOrderId ||
        order.id === accountOrderId
    );

    if (matchingOrder) {
      setOrderId(matchingOrder.id);
      setOrderValidated(true);
      setValidatedOrder(matchingOrder);
      setError(null);
    } else {
      setError("Order ID not found in database. Please check and try again.");
      setOrderValidated(false);
      setValidatedOrder(null);
      setOrderId("");
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!orderValidated) {
      setError("Please validate the Order ID first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();

      if (accountOrderId) {
        formData.append("account_order_id", accountOrderId);
      }

      if (orderId) {
        formData.append("order_id", orderId);
      }

      if (carryForwardImage) {
        formData.append("carry_forward_image", carryForwardImage);
      }

      const result = await diamondPurchaseIssueCreate(formData);
      setSavedRecordId(result?.id || null);

      if (orderId) {
        try {
          await saveProcessStepData(
            orderId,
            "Diamond Purchase/Issue",
            result?.id,
            `Diamond Purchase/Issue saved: ${result?.id}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setHasSaved(true);
      setSuccess(true);
      setError(null);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to save Diamond Purchase/Issue record");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = () => {
    if (!hasSaved) {
      setError("Please save the step first");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmMarkAsDone = async () => {
    setShowConfirmDialog(false);
    setLoading(true);

    try {
      if (orderId && savedRecordId) {
        await autoCompleteStep(
          orderId,
          "Diamond Purchase/Issue",
          savedRecordId,
          `Diamond Purchase/Issue completed: ${savedRecordId}`
        );
      }

      setIsCompleted(true);
      setSuccess(true);
      setError(null);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to mark as done");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Diamond Purchase/Issue
          </h1>
          <p className="text-muted-foreground">
            {isProductionDept
              ? "Manage diamond purchase/issue process with order validation"
              : "View diamond purchase/issue records (Read-only)"}
          </p>
        </div>
        <PreviousBackButton />
      </div>

      {/* Form Card - Only show for Production Department */}
      {isProductionDept && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Diamond Purchase/Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(e);
              }}
              className="space-y-6"
            >
              {/* Order ID with Validation */}
              <div className="space-y-2">
                <Label htmlFor="account_order_id">
                  Order ID <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="account_order_id"
                    type="text"
                    value={accountOrderId}
                    onChange={(e) => {
                      setAccountOrderId(e.target.value);
                      setOrderValidated(false);
                      setValidatedOrder(null);
                    }}
                    placeholder="Enter Order ID"
                    className={orderValidated ? "border-green-500" : ""}
                    disabled={isCompleted}
                  />
                  <Button
                    type="button"
                    onClick={validateOrderId}
                    variant={orderValidated ? "default" : "outline"}
                  >
                    {orderValidated ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      "Validate"
                    )}
                  </Button>
                </div>
                {orderValidated && validatedOrder && (
                  <OrderDetailsDisplay validatedOrder={validatedOrder} />
                )}
              </div>

              {/* Carry-Forward Image */}
              <div className="space-y-2">
                <Label htmlFor="carry_forward_image">Carry-Forward Image</Label>
                <Input
                  id="carry_forward_image"
                  type="file"
                  accept="image/*"
                  disabled={isCompleted}
                  onChange={(e) =>
                    setCarryForwardImage(e.target.files?.[0] || null)
                  }
                />
              </div>

              {/* Completed Status Banner */}
              {isCompleted && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
                  <Lock className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Step Completed & Locked</p>
                    <p className="text-sm text-emerald-600">
                      This step has been marked as done and cannot be edited.
                    </p>
                  </div>
                </div>
              )}

              {/* Saved Status Banner */}
              {hasSaved && !isCompleted && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Step Saved ✓</p>
                    <p className="text-sm text-amber-600">
                      You can now mark this step as done.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleted
                    ? "Diamond Purchase/Issue step marked as done!"
                    : "Diamond Purchase/Issue record saved successfully!"}
                </div>
              )}

              {/* Action Buttons: Save + Mark as Done */}
              {!isCompleted && (
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={loading || !orderValidated || isCompleted}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading && !showConfirmDialog ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleMarkAsDone}
                    disabled={!hasSaved || loading || isCompleted}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Done
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recent Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Diamond Purchase/Issue Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <p className="text-sm text-muted-foreground">Loading records...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No records available yet.
              {isProductionDept && " Create one above to get started."}
            </p>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {record.account_order_id || "No ID"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created:{" "}
                      {new Date(record.created_at || "").toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {record.carry_forward_image_url && (
                      <a
                        href={record.carry_forward_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Image
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Step as Done?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this step as done? This cannot be
              undone. The step will be locked and fields will become read-only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMarkAsDone}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Yes, Mark as Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

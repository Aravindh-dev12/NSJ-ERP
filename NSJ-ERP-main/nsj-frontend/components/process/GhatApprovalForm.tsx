"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ghatApprovalCreate,
  ghatApprovalUpdate,
  ghatApprovalDetail,
  ordersDropdown,
  saveProcessStepData,
  getStepStatus,
  type GhatApproval,
} from "@/lib/backend";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  FileText,
} from "lucide-react";
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
import { OrderDetailsDisplay } from "@/components/OrderDetailsDisplay";
import {
  ImageLogUploader,
  type LogImageItem,
} from "@/components/ui/ImageLogUploader";
import {
  appendLogImageFields,
  mapApiImagesToLogItems,
} from "@/lib/imageFormUtils";
import Link from "next/link";
import { GhatApprovalHeader } from "@/components/process/GhatApprovalHeader";
import { useToast } from "@/hooks/use-toast";
import { MissingFieldsModal } from "@/components/process/MissingFieldsModal";

interface GhatApprovalFormProps {
  mode?: "create" | "edit";
  initialData?: GhatApproval;
  id?: string;
}

export function GhatApprovalForm({
  mode = "create",
  initialData,
  id,
}: GhatApprovalFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  // Form state
  const [accountOrderId, setAccountOrderId] = useState(
    initialData?.account_order_id || ""
  );
  const [orderId, setOrderId] = useState(initialData?.order_id || "");
  const [orderValidated, setOrderValidated] = useState(false);
  const [validatedOrder, setValidatedOrder] = useState<any>(null);
  const [ghatApproval, setGhatApproval] = useState(
    initialData?.ghat_approval || false
  );
  const [carryForwardImages, setCarryForwardImages] = useState<LogImageItem[]>(
    []
  );
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);

  // Save state
  const [hasSaved, setHasSaved] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);

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

  // Check step status and load existing data if available (for create mode)
  useEffect(() => {
    if (mode !== "create") return;

    const orderIdParam = searchParams.get("order_id");
    const accountOrderIdParam = searchParams.get("account_order_id");

    if (!orderIdParam) {
      // Standalone create mode - prefill account_order_id if available
      if (accountOrderIdParam) {
        setAccountOrderId(accountOrderIdParam);
      }
      return;
    }

    const checkStepStatus = async () => {
      try {
        const status = await getStepStatus(orderIdParam, "Ghat Trial Approval");

        // If reference_id exists, load existing data
        if (status.reference_id) {
          console.log(
            "[Ghat Approval] Loading existing data:",
            status.reference_id
          );
          setSavedRecordId(status.reference_id);
          setHasExistingRecord(true);

          try {
            const approvalData = await ghatApprovalDetail(status.reference_id);
            setAccountOrderId(approvalData.account_order_id || "");
            setOrderId(approvalData.order_id || "");
            setGhatApproval(approvalData.ghat_approval || false);
            setIsDraft(approvalData.is_draft || false);
            setHasSaved(true);

            if (approvalData.images) {
              setCarryForwardImages(
                mapApiImagesToLogItems(approvalData.images, "*")
              );
              setSelectedLogGroup(
                (approvalData as any).selected_log_group ?? null
              );
            }

            console.log(
              "[Ghat Approval] Loaded draft status:",
              approvalData.is_draft
            );

            // Find matching order for display
            if (approvalData.order_id && orders.length > 0) {
              const matchingOrder = orders.find(
                (o: any) => o.id.toString() === approvalData.order_id.toString()
              );
              if (matchingOrder) {
                setOrderValidated(true);
                setValidatedOrder(matchingOrder);
              }
            }
          } catch (err: any) {
            // Handle 404 - record was deleted, backend should have cleared reference_id
            if (err?.response?.status === 404 || err?.status === 404) {
              console.warn(
                "[Ghat Approval] Record not found (stale reference), starting fresh"
              );
              setHasExistingRecord(false);
              if (accountOrderIdParam) {
                setAccountOrderId(accountOrderIdParam);
              }
            } else {
              console.error("Failed to load existing approval data:", err);
            }
          }
        } else {
          // No existing record - prefill from URL params
          console.log(
            "[Ghat Approval] No existing record, prefilling from URL"
          );
          setHasExistingRecord(false);
          if (accountOrderIdParam) {
            setAccountOrderId(accountOrderIdParam);
          }
        }
      } catch (err) {
        console.error("[Ghat Approval] Failed to check step status:", err);
        // Don't block the form if status check fails
        if (accountOrderIdParam) {
          setAccountOrderId(accountOrderIdParam);
        }
      }
    };

    checkStepStatus();
  }, [searchParams, orders, mode]);

  // Load existing data for edit mode
  useEffect(() => {
    if (mode === "edit" && id) {
      const loadRecord = async () => {
        try {
          const record = await ghatApprovalDetail(id);
          setAccountOrderId(record.account_order_id || "");
          setOrderId(record.order_id || "");
          setGhatApproval(record.ghat_approval || false);
          setIsDraft(record.is_draft || false);
          setHasSaved(true);

          if (record.images) {
            setCarryForwardImages(mapApiImagesToLogItems(record.images, "*"));
            setSelectedLogGroup((record as any).selected_log_group ?? null);
          }

          // Set order as validated if we have order data
          if (record.order_id) {
            setOrderValidated(true);
          }
        } catch (err: any) {
          console.error("Failed to load record:", err);

          // Handle 404 - record doesn't exist or was deleted
          if (err?.response?.status === 404 || err?.status === 404) {
            console.warn(
              "[Ghat Approval] Record not found, redirecting to create mode"
            );
            toast({
              variant: "destructive",
              title: "Record Not Found",
              description:
                "The saved record could not be found. Starting a new form.",
            });

            // Redirect to create mode
            router.replace("/process/ghat-approval/add");
            return;
          }

          // Other errors
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load record details",
          });
        }
      };
      void loadRecord();
    }
  }, [mode, id, toast, router]);

  // Validate order ID
  const validateOrderId = () => {
    if (!accountOrderId.trim()) {
      setError("Please enter an Order ID");
      setOrderValidated(false);
      setValidatedOrder(null);
      return;
    }

    // Find matching order
    const searchId = accountOrderId.trim().toUpperCase();
    const matchingOrder = orders.find(
      (order: any) =>
        (order.order_no && order.order_no.toUpperCase() === searchId) ||
        (order.bill_no && order.bill_no.toUpperCase() === searchId) ||
        (order.job_no && order.job_no.toUpperCase() === searchId) ||
        (order.name && order.name.toUpperCase() === searchId) ||
        (order.id && order.id.toString() === accountOrderId.trim())
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

  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      if (accountOrderId) {
        formData.append("account_order_id", accountOrderId);
      }

      if (orderId) {
        formData.append("order_id", orderId);
      }

      formData.append("ghat_approval", ghatApproval.toString());
      formData.append("is_draft", "true");

      appendLogImageFields(
        formData,
        carryForwardImages,
        "carry_forward",
        selectedLogGroup
      );

      let result: any;
      if (mode === "create") {
        result = await ghatApprovalCreate(formData);
        setSavedRecordId(result?.id || null);
      } else {
        result = await ghatApprovalUpdate(id!, formData);
        setSavedRecordId(id!);
      }

      if (result?.images) {
        setCarryForwardImages(mapApiImagesToLogItems(result.images, "*"));
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
      }

      const recId = mode === "create" ? result?.id : id;
      if (orderId && recId) {
        try {
          await saveProcessStepData(
            orderId,
            "Ghat Trial Approval",
            recId,
            `Ghat Trial Approval saved as draft: ${recId}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(true);
      setHasSaved(true);
      toast({
        title: "Draft Saved",
        description: "Ghat Approval has been saved as draft.",
      });

      if (orderId) {
        setTimeout(() => {
          orderId
            ? router.push(`/vouchers/orders/${orderId}/tracking/`)
            : router.back();
        }, 500);
      } else {
        setTimeout(() => router.back(), 1000);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save draft");
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to save draft",
      });
    } finally {
      setLoading(false);
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

      formData.append("ghat_approval", ghatApproval.toString());
      formData.append("is_draft", "false");

      appendLogImageFields(
        formData,
        carryForwardImages,
        "carry_forward",
        selectedLogGroup
      );

      let result: any;
      if (mode === "create") {
        result = await ghatApprovalCreate(formData);
        setSavedRecordId(result?.id || null);
      } else {
        result = await ghatApprovalUpdate(id!, formData);
        setSavedRecordId(id!);
      }

      if (result?.images) {
        setCarryForwardImages(mapApiImagesToLogItems(result.images, "*"));
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
      }

      const recId = mode === "create" ? result?.id : id;
      if (orderId && recId) {
        try {
          await saveProcessStepData(
            orderId,
            "Ghat Trial Approval",
            recId,
            `Ghat Trial Approval ${mode}d: ${recId}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(false);
      setHasSaved(true);
      setSuccess(true);
      toast({
        title: mode === "create" ? "Record Created" : "Record Updated",
        description:
          mode === "create"
            ? "Ghat Approval record created successfully!"
            : "Ghat Approval record updated successfully!",
      });

      setTimeout(() => {
        setSuccess(false);
        if (orderId) {
          router.push(`/vouchers/orders/${orderId}/tracking/`);
        } else {
          router.back();
        }
      }, 500);
    } catch (err: any) {
      // Check if error is a 400 with missing_fields
      if (err?.response?.status === 400 && err?.response?.data?.errors) {
        const errors = err.response.data.errors;
        if (errors.missing_fields && Array.isArray(errors.missing_fields)) {
          setMissingFields(errors.missing_fields);
          setShowMissingFieldsModal(true);
          return;
        }
      }

      setError(err?.message || `Failed to ${mode} Ghat Approval record`);
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || `Failed to ${mode} record`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GhatApprovalHeader
        title={
          mode === "edit"
            ? "Edit Ghat Approval"
            : hasExistingRecord
              ? "Edit Ghat Approval"
              : searchParams.get("order_id")
                ? "New Ghat Approval"
                : "Add New Ghat Approval"
        }
        description={
          mode === "edit"
            ? "Update existing ghat approval record"
            : hasExistingRecord
              ? "Update existing ghat approval record"
              : searchParams.get("order_id")
                ? `Create record for order ${searchParams.get("account_order_id") || ""}`
                : "Create a new ghat approval record"
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {mode === "edit"
                  ? "Edit Record"
                  : hasExistingRecord
                    ? "Edit Record"
                    : searchParams.get("order_id")
                      ? "New Record"
                      : "Create Record"}
              </CardTitle>
            </div>
            {isDraft && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 border border-amber-300 rounded-full">
                <FileText className="h-4 w-4 text-amber-700" />
                <span className="text-sm font-semibold text-amber-800">
                  Draft
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave(e);
            }}
            className="space-y-6"
          >
            {/* Draft Banner */}
            {isDraft && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800">
                <FileText className="h-5 w-5" />
                <div>
                  <p className="font-semibold">This form is saved as a draft</p>
                  <p className="text-sm text-amber-600">
                    Fill all required fields and save to finalize.
                  </p>
                </div>
              </div>
            )}
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
                  disabled={mode === "edit"}
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

            {/* Ghat Approval Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ghat_approval"
                checked={ghatApproval}
                onCheckedChange={(checked) =>
                  setGhatApproval(checked as boolean)
                }
              />
              <Label htmlFor="ghat_approval" className="cursor-pointer">
                Ghat Approval (Yes/No)
              </Label>
            </div>

            {/* Carry-Forward Image */}
            <ImageLogUploader
              label="Carry-Forward Images"
              images={carryForwardImages}
              onChange={setCarryForwardImages}
              selectedLogGroup={selectedLogGroup}
              onSelectLog={setSelectedLogGroup}
            />

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
                Ghat Approval record saved successfully!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/process/ghat-approval/list")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                <FileText className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button type="submit" disabled={loading || !orderValidated}>
                <Save className="mr-2 h-4 w-4" />
                {loading
                  ? "Saving..."
                  : mode === "create"
                    ? "Save"
                    : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Missing Fields Modal */}
      <MissingFieldsModal
        isOpen={showMissingFieldsModal}
        onClose={() => setShowMissingFieldsModal(false)}
        missingFields={missingFields}
        actionType="save"
      />
    </div>
  );
}

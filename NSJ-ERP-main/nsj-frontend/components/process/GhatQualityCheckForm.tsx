"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GhatQualityCheckHeader } from "./GhatQualityCheckHeader";
import {
  ghatQualityCheckDetail,
  ghatQualityCheckCreate,
  ghatQualityCheckUpdate,
  ordersDropdown,
  saveProcessStepData,
  getStepStatus,
  type GhatQualityCheck,
} from "@/lib/backend";
import { OrderDetailsDisplay } from "@/components/OrderDetailsDisplay";
import {
  ImageLogUploader,
  type LogImageItem,
} from "@/components/ui/ImageLogUploader";
import {
  appendLogImageFields,
  mapApiImagesToLogItems,
} from "@/lib/imageFormUtils";
import { useToast } from "@/hooks/use-toast";
import { MissingFieldsModal } from "@/components/process/MissingFieldsModal";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export function GhatQualityCheckForm({ recordId }: { recordId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // Form state
  const [accountOrderId, setAccountOrderId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderValidated, setOrderValidated] = useState(false);
  const [validatedOrder, setValidatedOrder] = useState<any>(null);
  const [carryForwardImages, setCarryForwardImages] = useState<LogImageItem[]>(
    []
  );
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

  // Check step status and load existing data if available
  useEffect(() => {
    if (recordId) return; // Skip if we already have a recordId (edit mode)

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
        const status = await getStepStatus(orderIdParam, "Ghat QC");

        // If reference_id exists, load existing data
        if (status.reference_id) {
          console.log("[Ghat QC] Loading existing data:", status.reference_id);
          setSavedRecordId(status.reference_id);
          setHasExistingRecord(true);

          try {
            const qcData = await ghatQualityCheckDetail(status.reference_id);
            setAccountOrderId(qcData.account_order_id || "");
            setOrderId(qcData.order_id || "");
            setIsDraft(qcData.is_draft || false);

            if (qcData.images) {
              setCarryForwardImages(mapApiImagesToLogItems(qcData.images, "*"));
              setSelectedLogGroup((qcData as any).selected_log_group ?? null);
            }

            console.log("[Ghat QC] Loaded draft status:", qcData.is_draft);

            // Find matching order for display
            if (qcData.order_id && orders.length > 0) {
              const matchingOrder = orders.find(
                (o: any) => o.id.toString() === qcData.order_id.toString()
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
                "[Ghat QC] Record not found (stale reference), starting fresh"
              );
              setHasExistingRecord(false);
              if (accountOrderIdParam) {
                setAccountOrderId(accountOrderIdParam);
              }
            } else {
              console.error("Failed to load existing QC data:", err);
            }
          }
        } else {
          // No existing record - prefill from URL params
          console.log("[Ghat QC] No existing record, prefilling from URL");
          setHasExistingRecord(false);
          if (accountOrderIdParam) {
            setAccountOrderId(accountOrderIdParam);
          }
        }
      } catch (err) {
        console.error("[Ghat QC] Failed to check step status:", err);
        // Don't block the form if status check fails
        if (accountOrderIdParam) {
          setAccountOrderId(accountOrderIdParam);
        }
      }
    };

    checkStepStatus();
  }, [searchParams, orders, recordId]);

  // Load existing record for edit
  useEffect(() => {
    if (recordId) {
      setLoadingRecord(true);
      ghatQualityCheckDetail(recordId)
        .then((data) => {
          setAccountOrderId(data.account_order_id || "");
          setOrderId(data.order_id || "");
          setIsDraft(data.is_draft || false);

          if (data.images) {
            setCarryForwardImages(mapApiImagesToLogItems(data.images, "*"));
            setSelectedLogGroup((data as any).selected_log_group ?? null);
          }

          // Auto-validate if we have order data
          if (data.order_id) {
            const matchingOrder = orders.find(
              (order: any) => order.id === data.order_id
            );
            if (matchingOrder) {
              setOrderValidated(true);
              setValidatedOrder(matchingOrder);
            }
          }
        })
        .catch((err) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load record details",
          });
          router.push("/process/ghat-quality-check/list");
        })
        .finally(() => setLoadingRecord(false));
    }
  }, [recordId, orders, router, toast]);

  // Validate order ID
  const validateOrderId = () => {
    if (!accountOrderId.trim()) {
      setError("Please enter an Order ID");
      setOrderValidated(false);
      setValidatedOrder(null);
      return;
    }

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

      appendLogImageFields(
        formData,
        carryForwardImages,
        "carry_forward",
        selectedLogGroup
      );
      formData.append("is_draft", "true");

      let result: GhatQualityCheck;

      if (recordId) {
        result = await ghatQualityCheckUpdate(recordId, formData);
        setSavedRecordId(recordId);
      } else {
        result = await ghatQualityCheckCreate(formData);
        setSavedRecordId(result?.id || null);
      }

      // Reload images from API response
      if (result?.images) {
        setCarryForwardImages(mapApiImagesToLogItems(result.images, "*"));
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
      }

      const recId = recordId || result?.id;
      if (orderId && recId) {
        try {
          await saveProcessStepData(
            orderId,
            "Ghat QC",
            recId,
            `Ghat QC draft saved: ${recId}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description:
          "Ghat Quality Check saved as draft. You can continue editing.",
      });

      // Redirect to process steps after draft save
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

      formData.append("is_draft", "false");
      appendLogImageFields(
        formData,
        carryForwardImages,
        "carry_forward",
        selectedLogGroup
      );

      let result: GhatQualityCheck;

      if (recordId) {
        // Update existing record
        result = await ghatQualityCheckUpdate(recordId, formData);
        setSavedRecordId(recordId);
        toast({
          title: "Success",
          description: "Record updated successfully",
        });
      } else {
        // Create new record
        result = await ghatQualityCheckCreate(formData);
        setSavedRecordId(result?.id || null);
        toast({
          title: "Success",
          description: "Record created successfully",
        });
      }

      const recId = recordId ? recordId : result?.id;
      if (orderId && recId) {
        try {
          await saveProcessStepData(
            orderId,
            "Ghat QC",
            recId,
            `Ghat QC ${recordId ? "updated" : "created"}: ${recId}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(false);
      setSuccess(true);
      setError(null);

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

      setError(
        err?.message || `Failed to ${recordId ? "update" : "create"} record`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingRecord) {
    return (
      <div className="space-y-6">
        <GhatQualityCheckHeader
          title={recordId ? "Edit Record" : "Add New Record"}
          description="Loading record details..."
        />
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <GhatQualityCheckHeader
          title={
            recordId
              ? "Edit Ghat Quality Check"
              : hasExistingRecord
                ? "Edit Ghat Quality Check"
                : searchParams.get("order_id")
                  ? "New Ghat Quality Check"
                  : "Add New Ghat Quality Check"
          }
          description={
            recordId
              ? "Edit existing record details"
              : hasExistingRecord
                ? "Update existing record details"
                : searchParams.get("order_id")
                  ? `Create record for order ${searchParams.get("account_order_id") || ""}`
                  : "Create a new ghat quality check record"
          }
        />
        <PreviousBackButton />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {recordId
                  ? "Edit Record"
                  : hasExistingRecord
                    ? "Edit Record"
                    : searchParams.get("order_id")
                      ? "New Record"
                      : "Add New Record"}
              </CardTitle>
              <CardDescription>
                {recordId
                  ? "Update the ghat quality check record details below"
                  : hasExistingRecord
                    ? "Update the ghat quality check record details below"
                    : searchParams.get("order_id")
                      ? "Fill in the details for this order"
                      : "Fill in the details to create a new ghat quality check record"}
              </CardDescription>
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
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">This form is saved as a draft</p>
                  <p className="text-sm text-amber-600">
                    Fill all required fields and click <strong>Save</strong> to
                    finalize.
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
                  disabled={!!recordId}
                  placeholder="Enter Order ID"
                  className={orderValidated ? "border-green-500" : ""}
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

            {/* Carry-Forward Images - Multiple Upload */}
            <ImageLogUploader
              label="Carry Forward Images"
              images={carryForwardImages}
              onChange={setCarryForwardImages}
              selectedLogGroup={selectedLogGroup}
              onSelectLog={setSelectedLogGroup}
              disabled={false}
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
                Record {recordId ? "updated" : "created"} successfully!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/process/ghat-quality-check/list">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
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
                {loading ? "Saving..." : recordId ? "Save Changes" : "Save"}
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

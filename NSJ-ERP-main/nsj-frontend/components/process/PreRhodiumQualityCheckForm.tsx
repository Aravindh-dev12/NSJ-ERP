"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  preRhodiumQualityCheckCreate,
  preRhodiumQualityCheckUpdate,
  ordersDropdown,
  saveProcessStepData,
  type PreRhodiumQualityCheck,
} from "@/lib/backend";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  FileText,
} from "lucide-react";
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
import { PreRhodiumQualityCheckHeader } from "@/components/process/PreRhodiumQualityCheckHeader";
import { useToast } from "@/hooks/use-toast";
import { MissingFieldsModal } from "@/components/process/MissingFieldsModal";

interface PreRhodiumQualityCheckFormProps {
  mode?: "create" | "edit";
  initialData?: PreRhodiumQualityCheck;
  id?: string;
}

export function PreRhodiumQualityCheckForm({
  mode = "create",
  initialData,
  id,
}: PreRhodiumQualityCheckFormProps) {
  const router = useRouter();
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
  const [qualityCheck, setQualityCheck] = useState(
    initialData?.quality_check || false
  );
  const [qualityCheckImages, setQualityCheckImages] = useState<LogImageItem[]>(
    []
  );
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Load orders dropdown and handle initial order validation
  useEffect(() => {
    const loadOrdersAndValidate = async () => {
      try {
        const response = await ordersDropdown();
        const ordersList = response.orders || [];
        setOrders(ordersList);

        // Pre-validate if we have initialData
        if (initialData?.account_order_id && ordersList.length > 0) {
          const searchId = initialData.account_order_id.trim().toUpperCase();
          const matchingOrder = ordersList.find(
            (order: any) =>
              (order.order_no && order.order_no.toUpperCase() === searchId) ||
              (order.bill_no && order.bill_no.toUpperCase() === searchId) ||
              (order.job_no && order.job_no.toUpperCase() === searchId) ||
              (order.name && order.name.toUpperCase() === searchId) ||
              (order.id &&
                order.id.toString() === initialData.account_order_id.trim())
          );

          if (matchingOrder) {
            setOrderId(matchingOrder.id);
            setOrderValidated(true);
            setValidatedOrder(matchingOrder);
          } else if (mode === "edit") {
            // Fallback for edit mode if not in dropdown
            setOrderValidated(true);
            setValidatedOrder({
              id: initialData.order_id,
              name: initialData.account_order_id,
              job_no: initialData.account_order_id,
            });
          }

          if (initialData.images) {
            setQualityCheckImages(
              mapApiImagesToLogItems(initialData.images, "*")
            );
            setSelectedLogGroup(
              (initialData as any).selected_log_group ?? null
            );
          }
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      }
    };
    void loadOrdersAndValidate();
  }, [initialData, mode]);

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

      formData.append("quality_check", qualityCheck.toString());

      appendLogImageFields(
        formData,
        qualityCheckImages,
        "quality_check",
        selectedLogGroup
      );
      formData.append("is_draft", "true");

      let result: any;
      if (mode === "create") {
        result = await preRhodiumQualityCheckCreate(formData);
        setSavedRecordId(result?.id || null);

        const recId = result?.id;
        if (orderId && recId) {
          try {
            await saveProcessStepData(
              orderId,
              "Pre Rhodium QC",
              recId,
              `Pre-Rhodium QC draft saved: ${recId}`
            );
          } catch (saveErr) {
            console.warn("[Save Step] Failed:", saveErr);
          }
        }
      } else if (id) {
        result = await preRhodiumQualityCheckUpdate(id, formData);
        setSavedRecordId(id);
      }

      // Reload images from API response
      if (result?.images) {
        setQualityCheckImages(mapApiImagesToLogItems(result.images, "*"));
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
      }

      const recId = (mode === "create" ? result?.id : id) || result?.id;
      if (orderId && recId) {
        try {
          await saveProcessStepData(
            orderId,
            "Pre Rhodium QC",
            recId,
            `Pre-Rhodium QC draft saved: ${recId}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description: "Pre-Rhodium QC saved as draft.",
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

      formData.append("quality_check", qualityCheck.toString());

      formData.append("is_draft", "false");
      appendLogImageFields(
        formData,
        qualityCheckImages,
        "quality_check",
        selectedLogGroup
      );

      let result: any;
      if (mode === "create") {
        result = await preRhodiumQualityCheckCreate(formData);
        setSavedRecordId(result?.id || null);
      } else if (id) {
        result = await preRhodiumQualityCheckUpdate(id, formData);
        setSavedRecordId(id);
      } else {
        throw new Error("Missing ID for update");
      }

      const recId = mode === "create" ? result?.id : id;
      if (orderId && recId) {
        try {
          await saveProcessStepData(
            orderId,
            "Pre Rhodium QC",
            recId,
            `Pre-Rhodium QC ${mode}d: ${recId}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(false);
      setSuccess(true);
      setError(null);

      toast({
        title: "Saved",
        description: "Pre-Rhodium Quality Check record saved successfully.",
      });

      // Redirect back to order tracking
      setTimeout(() => {
        orderId
          ? router.push(`/vouchers/orders/${orderId}/tracking/`)
          : router.back();
      }, 1000);
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
        err?.message || `Failed to ${mode} Pre-Rhodium Quality Check record`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PreRhodiumQualityCheckHeader
        title={
          mode === "create"
            ? "Add New Pre-Rhodium Quality Check"
            : "Edit Pre-Rhodium Quality Check"
        }
        description={
          mode === "create"
            ? "Create a new pre-rhodium quality check record"
            : "Edit existing pre-rhodium quality check record"
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {mode === "create" ? "Create Record" : "Edit Record"}
              </CardTitle>
              <CardDescription>
                Fill in the details below to {mode} a pre-rhodium quality check
                record
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

            {/* Quality Check Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="quality_check"
                checked={qualityCheck}
                onCheckedChange={(checked) =>
                  setQualityCheck(checked as boolean)
                }
              />
              <Label htmlFor="quality_check" className="cursor-pointer">
                Quality Check (Pass/Fail)
              </Label>
            </div>

            {/* Quality Check Image */}
            <ImageLogUploader
              label="Quality Check Images"
              images={qualityCheckImages}
              onChange={setQualityCheckImages}
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
                Pre-Rhodium Quality Check record saved successfully!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  orderId
                    ? router.push(`/vouchers/orders/${orderId}/tracking/`)
                    : router.back()
                }
                disabled={loading}
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

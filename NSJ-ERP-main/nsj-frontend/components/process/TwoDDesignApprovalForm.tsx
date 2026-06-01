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
import {
  twoDDesignCreate,
  twoDDesignUpdate,
  twoDDesignDetail,
  ordersDropdown,
  saveProcessStepData,
  getStepStatus,
  type TwoDDesign,
} from "@/lib/backend";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
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

interface TwoDDesignApprovalFormProps {
  mode?: "create" | "edit";
  initialData?: TwoDDesign;
  id?: string;
}

export function TwoDDesignApprovalForm({
  mode = "create",
  initialData,
  id,
}: TwoDDesignApprovalFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  // Form state
  const [accountOrderId, setAccountOrderId] = useState(
    initialData?.account_order_id || ""
  );
  const [orderId, setOrderId] = useState(initialData?.order_id || "");
  const [orderValidated, setOrderValidated] = useState(false);
  const [validatedOrder, setValidatedOrder] = useState<any>(null);
  const [designImages, setDesignImages] = useState<LogImageItem[]>([]);
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
        const status = await getStepStatus(orderIdParam, "2D Design Approval");

        // If reference_id exists, load existing data
        if (status.reference_id) {
          console.log(
            "[2D Design Approval] Loading existing data:",
            status.reference_id
          );
          setSavedRecordId(status.reference_id);
          setHasExistingRecord(true);

          try {
            const designData = await twoDDesignDetail(status.reference_id);
            setAccountOrderId(designData.account_order_id || "");
            setOrderId(designData.order_id || "");
            setIsDraft(designData.is_draft || false);
            setHasSaved(true);

            if (designData.images) {
              setDesignImages(
                mapApiImagesToLogItems(designData.images, "design")
              );
              setSelectedLogGroup(
                (designData as any).selected_log_group ?? null
              );
            }

            console.log(
              "[2D Design Approval] Loaded draft status:",
              designData.is_draft
            );

            // Find matching order for display
            if (designData.order_id && orders.length > 0) {
              const matchingOrder = orders.find(
                (o: any) => o.id.toString() === designData.order_id.toString()
              );
              if (matchingOrder) {
                setOrderValidated(true);
                setValidatedOrder(matchingOrder);
              }
            }
          } catch (err: any) {
            // Handle 404 - record was deleted
            if (err?.response?.status === 404 || err?.status === 404) {
              console.warn(
                "[2D Design Approval] Record not found (stale reference), starting fresh"
              );
              setHasExistingRecord(false);
              if (accountOrderIdParam) {
                setAccountOrderId(accountOrderIdParam);
              }
            } else {
              console.error("Failed to load existing design data:", err);
            }
          }
        } else {
          // No existing record - prefill from URL params
          console.log(
            "[2D Design Approval] No existing record, prefilling from URL"
          );
          setHasExistingRecord(false);
          if (accountOrderIdParam) {
            setAccountOrderId(accountOrderIdParam);
          }
        }
      } catch (err) {
        console.error("[2D Design Approval] Failed to check step status:", err);
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
          const record = await twoDDesignDetail(id);
          setAccountOrderId(record.account_order_id || "");
          setOrderId(record.order_id || "");
          setIsDraft(record.is_draft || false);
          setHasSaved(true);

          if (record.images) {
            setDesignImages(mapApiImagesToLogItems(record.images, "design"));
            setSelectedLogGroup((record as any).selected_log_group ?? null);
          }

          if (record.order_id) {
            setOrderValidated(true);
          }
        } catch (err: any) {
          console.error("Failed to load record:", err);

          // Handle 404 - record doesn't exist
          if (err?.response?.status === 404 || err?.status === 404) {
            console.warn(
              "[2D Design Approval] Record not found, redirecting to create mode"
            );
            toast({
              variant: "destructive",
              title: "Record Not Found",
              description:
                "The saved record could not be found. Starting a new form.",
            });

            // Redirect to create mode
            router.replace("/process/2d-design/add");
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

      formData.append("account_order_id", accountOrderId);
      if (orderId) {
        formData.append("order_id", orderId);
      }

      appendLogImageFields(formData, designImages, "design", selectedLogGroup);

      // Mark as draft
      formData.append("is_draft", "true");

      let result: any;
      if (hasSaved && savedRecordId) {
        result = await twoDDesignUpdate(savedRecordId, formData);
      } else {
        result = await twoDDesignCreate(formData);
        setSavedRecordId(result.id);
        setHasSaved(true);
      }

      if (result?.images) {
        setDesignImages(mapApiImagesToLogItems(result.images, "design"));
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
      }

      // Save process step link
      const recId = savedRecordId || result?.id;
      const orderIdParam = searchParams.get("order_id") || orderId;
      if (orderIdParam && recId) {
        try {
          await saveProcessStepData(
            orderIdParam,
            "2D Design Approval",
            recId,
            `2D Design Approval draft saved: ${recId}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description:
          "2D Design Approval has been saved as draft. You can continue editing.",
      });

      // Redirect to process steps page
      if (orderIdParam) {
        setTimeout(() => {
          router.push(`/vouchers/orders/${orderIdParam}/tracking/`);
        }, 500);
      } else {
        setTimeout(() => router.back(), 1000);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.detail || err?.message || "Failed to save draft";
      console.error("Error saving draft:", err);
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
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

    if (designImages.length === 0) {
      setError("Please upload at least one design image");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      formData.append("account_order_id", accountOrderId);
      if (orderId) {
        formData.append("order_id", orderId);
      }
      // Explicitly clear the draft flag on final save
      formData.append("is_draft", "false");

      appendLogImageFields(formData, designImages, "design", selectedLogGroup);

      let result: any;
      if (hasSaved && savedRecordId) {
        result = await twoDDesignUpdate(savedRecordId, formData);
      } else {
        result = await twoDDesignCreate(formData);
        setSavedRecordId(result.id);
      }

      if (result?.images) {
        setDesignImages(mapApiImagesToLogItems(result.images, "design"));
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
      }

      setIsDraft(false);
      setHasSaved(true);

      // Save process step data
      const orderIdParam = searchParams.get("order_id") || orderId;
      if (orderIdParam && result?.id) {
        try {
          await saveProcessStepData(
            orderIdParam,
            "2D Design Approval",
            result.id,
            `2D Design Approval saved: ${result.id}`
          );
        } catch (err) {
          console.warn("Failed to save process step data:", err);
        }
      }

      toast({
        title: "Success",
        description: "2D Design Approval saved successfully!",
      });

      // Redirect to tracking page
      if (orderIdParam) {
        setTimeout(() => {
          router.push(`/vouchers/orders/${orderIdParam}/tracking/`);
        }, 1000);
      }
    } catch (err: any) {
      let errorMsg = "Failed to save record";

      if (err?.response?.status === 400) {
        const errors = err?.response?.data?.errors || [];
        if (Array.isArray(errors)) {
          setMissingFields(
            errors.map((e: any) => e.field || e.message || "Unknown field")
          );
          setShowMissingFieldsModal(true);
          errorMsg = "Please fill in all required fields";
        } else {
          errorMsg = err?.response?.data?.detail || "Validation error";
          setError(errorMsg);
        }
      } else {
        errorMsg =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to save record";
        console.error("Error saving record:", err);
        setError(errorMsg);
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const isLockedParam = searchParams.get("locked") === "true";

  const isLocked = isLockedParam;

  return (
    <>
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <PreviousBackButton />
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {validatedOrder && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderDetailsDisplay validatedOrder={validatedOrder} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>2D Design Approval</CardTitle>
                <CardDescription>
                  Approve the 2D design with images
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
            <form onSubmit={handleSave} className="space-y-6">
              {/* Draft Banner */}
              {isDraft && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">
                      This form is saved as a draft
                    </p>
                    <p className="text-sm text-amber-600">
                      Fill all required fields and save to finalize.
                    </p>
                  </div>
                </div>
              )}

              {/* Account Order ID */}
              <div className="space-y-2">
                <Label htmlFor="account-order-id">Order ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="account-order-id"
                    placeholder="Enter Order ID (e.g., A0001)"
                    value={accountOrderId}
                    onChange={(e) => setAccountOrderId(e.target.value)}
                    disabled={isLocked}
                  />
                  {!isLocked && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateOrderId}
                    >
                      Validate
                    </Button>
                  )}
                </div>
                {orderValidated && (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Order ID validated
                  </div>
                )}
              </div>

              {/* Design Images */}
              <div className="space-y-2">
                <ImageLogUploader
                  label="2D Design Images"
                  images={designImages}
                  onChange={setDesignImages}
                  selectedLogGroup={selectedLogGroup}
                  onSelectLog={setSelectedLogGroup}
                  disabled={isLocked}
                  fieldType="design"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                {!isLocked && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save as Draft"}
                    </Button>
                    <Button type="submit" disabled={loading || !orderValidated}>
                      {loading ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <MissingFieldsModal
        isOpen={showMissingFieldsModal}
        missingFields={missingFields}
        onClose={() => setShowMissingFieldsModal(false)}
        actionType="save"
      />
    </>
  );
}

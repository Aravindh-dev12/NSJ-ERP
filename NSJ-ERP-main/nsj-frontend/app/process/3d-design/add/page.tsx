"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThreeDDesignHeader } from "@/components/process/ThreeDDesignHeader";
import {
  Upload,
  CheckCircle2,
  Save,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  threeDDesignCreate,
  threeDDesignUpdate,
  threeDDesignDetail,
  ordersDropdown,
  saveProcessStepData,
  getStepStatus,
  type ThreeDDesign,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { OrderDetailsDisplay } from "@/components/OrderDetailsDisplay";
import {
  ImageLogUploader,
  type LogImageItem,
} from "@/components/ui/ImageLogUploader";
import {
  appendLogImageFields,
  mapApiImagesToLogItems,
} from "@/lib/imageFormUtils";
import { MissingFieldsModal } from "@/components/process/MissingFieldsModal";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function ThreeDDesignAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const orderIdParam = searchParams.get("order_id") || "";
  const accountOrderIdParam = searchParams.get("account_order_id") || "";

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step status & lock state
  const [isLocked, setIsLocked] = useState(false);
  const [stepStatus, setStepStatus] = useState<string>("PENDING");
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [loadingStepStatus, setLoadingStepStatus] = useState(true);

  // Form state for saved record ID
  const [savedDesignId, setSavedDesignId] = useState<string | null>(editId);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [isDraft, setIsDraft] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Form state
  const [accountOrderId, setAccountOrderId] = useState(accountOrderIdParam);
  const [designImages, setDesignImages] = useState<LogImageItem[]>([]);
  const [approvedImages, setApprovedImages] = useState<LogImageItem[]>([]);
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);
  const [selectedApprovedLogGroup, setSelectedApprovedLogGroup] = useState<
    string | null
  >(null);
  const [orders, setOrders] = useState<{ id: string; name: string }[]>([]);
  const [orderId, setOrderId] = useState(orderIdParam);
  const [orderValidated, setOrderValidated] = useState(
    !!orderIdParam && !!accountOrderIdParam
  );
  const [validatedOrder, setValidatedOrder] = useState<any>(null);

  // Load orders and check step status
  useEffect(() => {
    const loadData = async () => {
      try {
        const ordersRes = await ordersDropdown();
        const ordersList = ordersRes.orders || [];
        setOrders(ordersList);

        // If we have pre-filled params, validate immediately after loading orders
        if (
          orderIdParam &&
          accountOrderIdParam &&
          ordersList.length > 0 &&
          !orderValidated
        ) {
          console.log("Validating order immediately after loading orders");
          validateOrderFromParams(ordersList, accountOrderIdParam);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      }
    };
    void loadData();
  }, []);

  // Check step status and load existing data if available
  useEffect(() => {
    const checkStepStatus = async () => {
      if (!orderIdParam) {
        setLoadingStepStatus(false);
        return;
      }

      try {
        setLoadingStepStatus(true);
        const status = await getStepStatus(orderIdParam, "3D Design");

        setIsLocked(status.is_locked);
        setStepStatus(status.status);
        setReferenceId(status.reference_id);
        setCurrentOrderId(orderIdParam);

        // If step is locked, show message and disable form
        if (status.is_locked) {
          console.log("[3D Design] Step is locked, showing read-only view");
          setLoadingStepStatus(false);
          return;
        }

        // If reference_id exists, load existing design data
        if (status.reference_id) {
          console.log(
            "[3D Design] Loading existing design:",
            status.reference_id
          );
          setSavedDesignId(status.reference_id);

          try {
            const designData = await threeDDesignDetail(status.reference_id);
            setAccountOrderId(designData.account_order_id || "");
            setOrderId(designData.order_id || "");
            setIsDraft(designData.is_draft || false);

            if (designData.images) {
              setDesignImages(
                mapApiImagesToLogItems(designData.images, "design")
              );
              setApprovedImages(
                mapApiImagesToLogItems(designData.images, "approved")
              );
              setSelectedLogGroup(
                (designData as any).selected_log_group ?? null
              );
              setSelectedApprovedLogGroup(
                (designData as any).selected_secondary_log_group ?? null
              );
            }

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
          } catch (err) {
            console.error("Failed to load existing design:", err);
          }
        }
      } catch (err) {
        console.error("[3D Design] Failed to check step status:", err);
        // Don't block the form if status check fails
      } finally {
        setLoadingStepStatus(false);
      }
    };

    checkStepStatus();
  }, [orderIdParam, orders]);

  // Separate function for validation logic
  const validateOrderFromParams = (
    ordersList: any[],
    orderIdToCheck: string
  ) => {
    const searchId = orderIdToCheck.trim().toUpperCase();
    const matchingOrder = ordersList.find(
      (order: any) =>
        (order.order_no && order.order_no.toUpperCase() === searchId) ||
        (order.bill_no && order.bill_no.toUpperCase() === searchId) ||
        (order.job_no && order.job_no.toUpperCase() === searchId) ||
        (order.name && order.name.toUpperCase() === searchId) ||
        (order.id && order.id.toString() === orderIdToCheck.trim())
    );

    if (matchingOrder) {
      console.log("Order found in immediate validation:", matchingOrder);
      setOrderId(matchingOrder.id);
      setOrderValidated(true);
      setValidatedOrder(matchingOrder);
      setError(null);
    } else {
      console.log(
        "Order not found in immediate validation for ID:",
        orderIdToCheck
      );
      setError("Order ID not found in database. Please check and try again.");
      setOrderValidated(false);
      setValidatedOrder(null);
      setOrderId("");
    }
  };

  // Load existing design data if editing
  useEffect(() => {
    const loadDesignData = async () => {
      if (editId && orders.length > 0) {
        try {
          const designData = await threeDDesignDetail(editId);
          setAccountOrderId(designData.account_order_id || "");
          setOrderId(designData.order_id || "");

          if (designData.images) {
            setDesignImages(mapApiImagesToLogItems(designData.images, "*"));
            setApprovedImages(mapApiImagesToLogItems(designData.images, "*"));
            setSelectedLogGroup((designData as any).selected_log_group ?? null);
          }

          if (designData.order_id) {
            // Find full order details from the orders list
            const matchingOrder = orders.find(
              (o: any) => o.id.toString() === designData.order_id.toString()
            );

            if (matchingOrder) {
              setOrderValidated(true);
              setValidatedOrder(matchingOrder);
            } else if (designData.account_order_id) {
              // Fallback if not found in dropdown
              setOrderValidated(true);
              setValidatedOrder({
                id: designData.order_id,
                job_no: designData.account_order_id,
                name: designData.account_order_id,
              });
            }
          }
        } catch (err) {
          console.error("Failed to load design data:", err);
        }
      }
    };
    void loadDesignData();
  }, [editId, orders]);

  // Validate pre-filled order ID - runs when orders are loaded AND we have params
  useEffect(() => {
    console.log("Validation useEffect triggered", {
      orderIdParam,
      accountOrderIdParam,
      ordersLength: orders.length,
      orderValidated,
    });

    if (
      orderIdParam &&
      accountOrderIdParam &&
      orders.length > 0 &&
      !orderValidated
    ) {
      console.log("Running validation for pre-filled order");
      const searchId = accountOrderIdParam.trim().toUpperCase();
      const matchingOrder = orders.find(
        (order: any) =>
          (order.order_no && order.order_no.toUpperCase() === searchId) ||
          (order.bill_no && order.bill_no.toUpperCase() === searchId) ||
          (order.job_no && order.job_no.toUpperCase() === searchId) ||
          (order.name && order.name.toUpperCase() === searchId) ||
          (order.id && order.id.toString() === accountOrderIdParam.trim())
      );

      if (matchingOrder) {
        console.log("Order found:", matchingOrder);
        setOrderId(matchingOrder.id);
        setOrderValidated(true);
        setValidatedOrder(matchingOrder);
        setError(null);
      } else {
        console.log("Order not found for ID:", accountOrderIdParam);
        setError("Order ID not found in database. Please check and try again.");
        setOrderValidated(false);
        setValidatedOrder(null);
        setOrderId("");
      }
    }
  }, [orderIdParam, accountOrderIdParam, orders, orderValidated]);

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
      setCurrentOrderId(matchingOrder.id);
      setOrderValidated(true);
      setValidatedOrder(matchingOrder);
      setError(null);
    } else {
      setError("Order ID not found in database. Please check and try again.");
      setOrderValidated(false);
      setValidatedOrder(null);
      setOrderId("");
      setCurrentOrderId("");
    }
  };

  // Save as Draft handler
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      if (orderId) {
        formData.append("order_id", orderId);
      }

      if (accountOrderId) {
        formData.append("account_order_id", accountOrderId);
      }

      appendLogImageFields(
        formData,
        designImages,
        "design",
        selectedLogGroup,
        "select_log_group"
      );
      appendLogImageFields(
        formData,
        approvedImages,
        "approved_design",
        selectedApprovedLogGroup,
        "select_secondary_log_group"
      );

      // Mark as draft
      formData.append("is_draft", "true");

      let result: ThreeDDesign;

      if (savedDesignId) {
        result = await threeDDesignUpdate(savedDesignId, formData);
      } else {
        result = await threeDDesignCreate(formData);
        setSavedDesignId(result.id);
      }

      // Always link step (idempotent — safe to call on every save)
      if (currentOrderId && result.id) {
        try {
          await saveProcessStepData(
            currentOrderId,
            "3D Design",
            result.id,
            "3D Design draft saved"
          );
        } catch (e) {
          console.warn("[3D Design] saveProcessStepData failed:", e);
        }
      }

      // Refresh images from server (log_group is now set)
      if (result.images) {
        setDesignImages(mapApiImagesToLogItems(result.images, "design"));
        setApprovedImages(mapApiImagesToLogItems(result.images, "approved"));
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
        setSelectedApprovedLogGroup(
          (result as any).selected_secondary_log_group ??
            selectedApprovedLogGroup
        );
      }

      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description: "3D design saved as draft. You can continue editing.",
      });

      // Redirect back to process steps
      setTimeout(() => {
        router.push(`/vouchers/orders/${currentOrderId}/tracking/`);
      }, 1000);
    } catch (err: any) {
      console.error("Draft save error:", err);
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

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderValidated) {
      setError("Please validate the Order ID first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();

      if (orderId) {
        formData.append("order_id", orderId);
      }

      if (accountOrderId) {
        formData.append("account_order_id", accountOrderId);
      }

      appendLogImageFields(
        formData,
        designImages,
        "design",
        selectedLogGroup,
        "select_log_group"
      );
      appendLogImageFields(
        formData,
        approvedImages,
        "approved_design",
        selectedApprovedLogGroup,
        "select_secondary_log_group"
      );

      // Mark as not draft
      formData.append("is_draft", "false");

      let result: ThreeDDesign;

      if (savedDesignId) {
        // Update existing design
        result = await threeDDesignUpdate(savedDesignId, formData);
        toast({
          title: "Saved",
          description: "3D design updated successfully.",
        });
      } else {
        // Create new design
        result = await threeDDesignCreate(formData);
        setSavedDesignId(result.id);
        toast({
          title: "Saved",
          description: "3D design created successfully.",
        });
      }

      // Save step data
      await saveProcessStepData(
        currentOrderId,
        "3D Design",
        result.id,
        "3D Design data saved"
      );

      // Refresh images from server (log_group assigned by backend)
      if (result.images) {
        setDesignImages(mapApiImagesToLogItems(result.images, "design"));
        setApprovedImages(mapApiImagesToLogItems(result.images, "approved"));
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
        setSelectedApprovedLogGroup(
          (result as any).selected_secondary_log_group ??
            selectedApprovedLogGroup
        );
      }

      setIsDraft(false);
      setSuccess(true);
      setError(null);

      // Redirect to process steps after successful save
      setTimeout(() => {
        router.push(`/vouchers/orders/${currentOrderId}/tracking/`);
      }, 1000);
    } catch (err: any) {
      console.error("Save error:", err);

      // Check if error is a 400 with missing_fields
      if (err?.response?.status === 400 && err?.response?.data?.errors) {
        const errors = err.response.data.errors;
        if (errors.missing_fields && Array.isArray(errors.missing_fields)) {
          setMissingFields(errors.missing_fields);
          setShowMissingFieldsModal(true);
          return;
        }
      }

      setError(err?.message || "Failed to save 3D design");
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to save 3D design",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Redirect to handleSave for now
    e.preventDefault();
    await handleSave(e);
  };

  return (
    <div className="space-y-6">
      <PreviousBackButton />
      <ThreeDDesignHeader
        title={editId ? "Edit 3D Design" : "Add New 3D Design"}
        description={
          editId
            ? "Update existing 3D design record"
            : "Create a new 3D design record with images"
        }
      />

      {loadingStepStatus ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-pulse text-muted-foreground">
              Loading step status...
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editId ? "Edit 3D Design" : "Add New 3D Design"}
              </CardTitle>
              {isDraft && !isLocked && (
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Draft Banner */}
              {isDraft && !isLocked && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">
                      This form is saved as a draft
                    </p>
                    <p className="text-sm text-amber-600">
                      Fill all required fields and click <strong>Save</strong>{" "}
                      to finalize.
                    </p>
                  </div>
                </div>
              )}
              {/* Order ID */}
              <div className="space-y-2">
                <Label htmlFor="account_order_id">Order ID / Job No</Label>
                <div className="flex gap-2">
                  <Input
                    id="account_order_id"
                    type="text"
                    value={accountOrderId}
                    onChange={(e) => {
                      setAccountOrderId(e.target.value);
                      setOrderValidated(false);
                    }}
                    placeholder="Enter Order ID"
                    disabled={isLocked}
                    className={
                      orderValidated ? "border-green-500 bg-green-50" : ""
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={validateOrderId}
                    disabled={!accountOrderId || isLocked}
                  >
                    Validate
                  </Button>
                </div>
                {orderValidated && validatedOrder && (
                  <OrderDetailsDisplay validatedOrder={validatedOrder} />
                )}
              </div>

              {/* 3D Design Image */}
              <ImageLogUploader
                label="3D Design Images"
                images={designImages}
                onChange={setDesignImages}
                selectedLogGroup={selectedLogGroup}
                onSelectLog={setSelectedLogGroup}
                disabled={isLocked}
              />

              {/* Approved 3D Design Image */}
              <ImageLogUploader
                label="Approved 3D Design Images"
                images={approvedImages}
                onChange={setApprovedImages}
                selectedLogGroup={selectedApprovedLogGroup}
                onSelectLog={setSelectedApprovedLogGroup}
                disabled={isLocked}
                fieldType="approved"
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
                  3D Design saved successfully!
                </div>
              )}

              {/* Locked Message */}
              {isLocked && (
                <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  This step has been marked as done and is locked. No further
                  edits allowed.
                </div>
              )}

              {/* Action Buttons */}
              {!isLocked && (
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/vouchers/orders/${currentOrderId || orderId}/tracking/`
                      )
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
                    Save
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

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

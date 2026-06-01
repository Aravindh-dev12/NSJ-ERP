"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ThreeDPrintingCAMHeader } from "@/components/process/ThreeDPrintingCAMHeader";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  FileText,
} from "lucide-react";
import {
  threeDPrintingCAMCreate,
  threeDPrintingCAMUpdate,
  threeDPrintingCAMDetail,
  ordersDropdown,
  saveProcessStepData,
  type ThreeDPrintingCAM,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { OrderDetailsDisplay } from "@/components/OrderDetailsDisplay";
import { MissingFieldsModal } from "@/components/process/MissingFieldsModal";
import {
  ImageLogUploader,
  type LogImageItem,
} from "@/components/ui/ImageLogUploader";
import {
  appendLogImageFields,
  mapApiImagesToLogItems,
} from "@/lib/imageFormUtils";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function ThreeDPrintingCAMAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const orderIdParam = searchParams.get("order_id") || "";
  const accountOrderIdParam = searchParams.get("account_order_id") || "";

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(editId);
  const [isDraft, setIsDraft] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isStepLocked, setIsStepLocked] = useState(false);

  // Form state
  const [accountOrderId, setAccountOrderId] = useState(accountOrderIdParam);
  const [orderId, setOrderId] = useState(orderIdParam);
  const [orderValidated, setOrderValidated] = useState(
    !!orderIdParam && !!accountOrderIdParam
  );
  const [validatedOrder, setValidatedOrder] = useState<any>(null);
  const [camPieceImages, setCamPieceImages] = useState<LogImageItem[]>([]);
  const [approvedCamImages, setApprovedCamImages] = useState<LogImageItem[]>(
    []
  );
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);
  const [selectedApprovedCamLogGroup, setSelectedApprovedCamLogGroup] =
    useState<string | null>(null);
  const [qualityCheckYes, setQualityCheckYes] = useState(false);
  const [qualityCheckNo, setQualityCheckNo] = useState(false);
  const [qcFailureReasons, setQcFailureReasons] = useState("");
  const [orders, setOrders] = useState<{ id: string; name: string }[]>([]);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    accountOrderId?: string;
    camPieceImage?: string;
    qcFailureReasons?: string;
  }>({});

  // Load orders and existing record data if editing
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

        // If editing, load existing record data
        if (editId && ordersList.length > 0) {
          const recordData = await threeDPrintingCAMDetail(editId);
          setAccountOrderId(recordData.account_order_id || "");

          let currentOrderId = orderIdParam;
          if (recordData.account_order_id) {
            // Find full order details from the orders list
            const matchingOrder = ordersList.find(
              (o: any) =>
                (o.job_no && o.job_no === recordData.account_order_id) ||
                (o.order_no && o.order_no === recordData.account_order_id)
            );

            if (matchingOrder) {
              setOrderValidated(true);
              setValidatedOrder(matchingOrder);
              setOrderId(matchingOrder.id);
              currentOrderId = matchingOrder.id;
            } else {
              setOrderValidated(true);
              setValidatedOrder({
                id: recordData.id,
                job_no: recordData.account_order_id,
                name: recordData.account_order_id,
              });
              currentOrderId = recordData.id;
            }
          }

          // Check if step is locked
          if (currentOrderId) {
            try {
              const stepStatusRes = await fetch(
                `/api/orders/${currentOrderId}/process-steps/3D%20Printing%2FCAM%20Piece/step-status/`
              );
              if (stepStatusRes.ok) {
                const stepStatus = await stepStatusRes.json();
                setIsStepLocked(stepStatus.is_locked === true);
              }
            } catch (err) {
              console.error("Failed to load step status:", err);
            }
          }

          // Load existing form data
          setQualityCheckYes(recordData.cam_piece_quality_check === true);
          setQualityCheckNo(recordData.cam_piece_quality_check === false);
          if (recordData.qc_failure_reasons) {
            setQcFailureReasons(recordData.qc_failure_reasons);
          }

          if (recordData.images) {
            setCamPieceImages(
              mapApiImagesToLogItems(recordData.images, "cam_piece")
            );
            setApprovedCamImages(
              mapApiImagesToLogItems(recordData.images, "approved_cam")
            );
            setSelectedLogGroup((recordData as any).selected_log_group ?? null);
            setSelectedApprovedCamLogGroup(
              (recordData as any).selected_secondary_log_group ?? null
            );
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    void loadData();
  }, [editId, orderIdParam, accountOrderIdParam, orderValidated]);

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
      // Clear field error when validation succeeds
      setFieldErrors((prev) => ({ ...prev, accountOrderId: undefined }));
    } else {
      setError("Order ID not found in database. Please check and try again.");
      setOrderValidated(false);
      setValidatedOrder(null);
      setOrderId("");
    }
  };

  // Validation function for final save
  const validateFinalSave = () => {
    const errors: {
      accountOrderId?: string;
      camPieceImages?: string;
      qcFailureReasons?: string;
    } = {};

    if (!accountOrderId?.trim()) {
      errors.accountOrderId = "Account / Order ID is required";
    }

    if (camPieceImages.length === 0 && !editId) {
      errors.camPieceImages = "Please upload at least one CAM Piece Image";
    }

    // Conditional: only required when QC failed (qualityCheckNo is true)
    if (qualityCheckNo && (!qcFailureReasons || !qcFailureReasons.trim())) {
      errors.qcFailureReasons = "Please describe the QC failure reasons";
    }

    return errors;
  };

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
        camPieceImages,
        "cam_piece",
        selectedLogGroup,
        "select_log_group"
      );

      formData.append("cam_piece_quality_check", qualityCheckYes.toString());

      if (qualityCheckNo && qcFailureReasons) {
        formData.append("qc_failure_reasons", qcFailureReasons);
      }

      if (qualityCheckYes) {
        appendLogImageFields(
          formData,
          approvedCamImages,
          "approved_cam",
          selectedApprovedCamLogGroup,
          "select_secondary_log_group"
        );
      }

      formData.append("is_draft", "true");

      let result: ThreeDPrintingCAM;

      if (savedRecordId) {
        result = await threeDPrintingCAMUpdate(savedRecordId, formData);
      } else {
        result = await threeDPrintingCAMCreate(formData);
        setSavedRecordId(result.id);

        if (orderId) {
          try {
            await saveProcessStepData(
              orderId,
              "3D Printing/CAM Piece",
              result.id,
              "3D Printing/CAM Piece draft saved"
            );
          } catch (saveErr) {
            console.warn("[Save Step] Failed:", saveErr);
          }
        }
      }

      if (result?.images) {
        setCamPieceImages(mapApiImagesToLogItems(result.images, "cam_piece"));
        setApprovedCamImages(
          mapApiImagesToLogItems(result.images, "approved_cam")
        );
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
        setSelectedApprovedCamLogGroup(
          (result as any).selected_secondary_log_group ??
            selectedApprovedCamLogGroup
        );
      }

      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description: "CAM Piece record saved as draft.",
      });

      // Redirect to process steps after draft save
      if (orderId) {
        setTimeout(() => {
          orderId
            ? router.push(`/vouchers/orders/${orderId}/tracking/`)
            : router.back();
        }, 500);
      }
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

  // TASK 4: Save handler (saves without completing)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderValidated) {
      setError("Please validate the Order ID first");
      return;
    }

    if (!orderId) {
      setError("Order ID is missing. Please refresh the page and try again.");
      console.error("[3D Printing/CAM] orderId is empty when trying to save");
      return;
    }

    // Run validation
    const errors = validateFinalSave();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Show first error in the general error message
      setError(Object.values(errors)[0]);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setFieldErrors({});

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
        camPieceImages,
        "cam_piece",
        selectedLogGroup,
        "select_log_group"
      );

      formData.append("cam_piece_quality_check", qualityCheckYes.toString());

      if (qualityCheckNo && qcFailureReasons) {
        formData.append("qc_failure_reasons", qcFailureReasons);
      }

      if (qualityCheckYes) {
        appendLogImageFields(
          formData,
          approvedCamImages,
          "approved_cam",
          selectedApprovedCamLogGroup,
          "select_secondary_log_group"
        );
      }

      formData.append("is_draft", "false");

      let result: ThreeDPrintingCAM;

      if (savedRecordId) {
        result = await threeDPrintingCAMUpdate(savedRecordId, formData);
        toast({
          title: "Saved",
          description: "CAM piece record saved successfully.",
        });
      } else {
        result = await threeDPrintingCAMCreate(formData);
        setSavedRecordId(result.id);
        toast({
          title: "Saved",
          description: "CAM piece record saved successfully.",
        });
      }

      if (result?.images) {
        setCamPieceImages(mapApiImagesToLogItems(result.images, "cam_piece"));
        setApprovedCamImages(
          mapApiImagesToLogItems(result.images, "approved_cam")
        );
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
        setSelectedApprovedCamLogGroup(
          (result as any).selected_secondary_log_group ??
            selectedApprovedCamLogGroup
        );
      }

      // Save step data - ONLY if orderId exists
      if (orderId) {
        await saveProcessStepData(
          orderId,
          "3D Printing/CAM Piece",
          result.id,
          "3D Printing/CAM Piece data saved"
        );
      } else {
        console.warn(
          "[3D Printing/CAM] orderId is empty - skipping process step save"
        );
        toast({
          variant: "destructive",
          title: "Warning",
          description:
            "Record saved but not linked to order (missing order_id). Please open form from order tracking page.",
        });
      }

      setIsDraft(false);
      setSuccess(true);
      setError(null);

      // Redirect back to order tracking
      setTimeout(() => {
        if (orderId) {
          orderId
            ? router.push(`/vouchers/orders/${orderId}/tracking/`)
            : router.back();
        } else {
          router.push(`/process/3d-printing-cam/list`);
        }
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

      setError(err?.message || "Failed to save CAM piece record");
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to save CAM piece record",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Redirect to handleSave
    e.preventDefault();
    await handleSave(e);
  };

  return (
    <div className="space-y-6">
      <PreviousBackButton />
      <ThreeDPrintingCAMHeader
        title={editId ? "Edit CAM Piece Record" : "Add New CAM Piece"}
        description={
          editId
            ? "Update existing CAM piece record"
            : "Create a new 3D printing/CAM piece record with quality check"
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {editId ? "Edit CAM Piece Record" : "Add New CAM Piece Record"}
            </CardTitle>
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
            {/* Order ID Section */}
            <div className="space-y-2">
              <Label htmlFor="account_order_id">
                Account / Order ID <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="account_order_id"
                  value={accountOrderId}
                  onChange={(e) => {
                    setAccountOrderId(e.target.value);
                    setOrderValidated(false);
                    setValidatedOrder(null);
                    if (fieldErrors.accountOrderId) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        accountOrderId: undefined,
                      }));
                    }
                  }}
                  placeholder="Enter Order ID or Job No"
                  className={
                    fieldErrors.accountOrderId ||
                    (!orderValidated && accountOrderId)
                      ? "border-destructive"
                      : ""
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateOrderId}
                  disabled={!accountOrderId.trim()}
                >
                  Validate
                </Button>
              </div>
              {fieldErrors.accountOrderId && (
                <p className="text-sm text-destructive">
                  {fieldErrors.accountOrderId}
                </p>
              )}
              {orderValidated && validatedOrder && (
                <OrderDetailsDisplay validatedOrder={validatedOrder} />
              )}
            </div>

            {/* CAM Piece Image */}
            <ImageLogUploader
              label="CAM Piece Images"
              images={camPieceImages}
              onChange={setCamPieceImages}
              selectedLogGroup={selectedLogGroup}
              onSelectLog={setSelectedLogGroup}
              disabled={isStepLocked}
              fieldType="cam_piece"
            />

            {/* CAM Piece Quality Check */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                CAM Piece Quality Check{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 p-4 hover:border-green-500 transition-colors">
                  <Checkbox
                    id="quality_check_yes"
                    checked={qualityCheckYes}
                    onCheckedChange={(checked) => {
                      setQualityCheckYes(checked as boolean);
                      if (checked) {
                        setQualityCheckNo(false);
                        setQcFailureReasons("");
                        // Clear QC failure reasons error when switching to Yes
                        setFieldErrors((prev) => ({
                          ...prev,
                          qcFailureReasons: undefined,
                        }));
                      }
                    }}
                    className="h-5 w-5"
                  />
                  <Label
                    htmlFor="quality_check_yes"
                    className="cursor-pointer text-base font-medium"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 p-4 hover:border-red-500 transition-colors">
                  <Checkbox
                    id="quality_check_no"
                    checked={qualityCheckNo}
                    onCheckedChange={(checked) => {
                      setQualityCheckNo(checked as boolean);
                      if (checked) {
                        setQualityCheckYes(false);
                        setApprovedCamImages([]);
                      }
                    }}
                    className="h-5 w-5"
                  />
                  <Label
                    htmlFor="quality_check_no"
                    className="cursor-pointer text-base font-medium"
                  >
                    No
                  </Label>
                </div>
              </div>
            </div>

            {/* Approved CAM Piece - Show only if Yes is selected */}
            {qualityCheckYes && (
              <ImageLogUploader
                label="Approved CAM Piece Images"
                images={approvedCamImages}
                onChange={setApprovedCamImages}
                selectedLogGroup={selectedApprovedCamLogGroup}
                onSelectLog={setSelectedApprovedCamLogGroup}
                disabled={isStepLocked}
                fieldType="approved_cam"
              />
            )}

            {/* List of Reasons - Show only if No is selected */}
            {qualityCheckNo && (
              <div className="space-y-2">
                <Label htmlFor="qc_failure_reasons">
                  QC Failure Reasons <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="qc_failure_reasons"
                  value={qcFailureReasons}
                  onChange={(e) => {
                    setQcFailureReasons(e.target.value);
                    if (fieldErrors.qcFailureReasons) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        qcFailureReasons: undefined,
                      }));
                    }
                  }}
                  placeholder="Describe what failed..."
                  rows={4}
                  className={
                    fieldErrors.qcFailureReasons ? "border-destructive" : ""
                  }
                />
                {fieldErrors.qcFailureReasons && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.qcFailureReasons}
                  </p>
                )}
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
                CAM piece record saved successfully!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <PreviousBackButton />
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading || isStepLocked}
                title={
                  isStepLocked ? "This step is locked and cannot be edited" : ""
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button
                type="submit"
                disabled={loading || !orderValidated || isStepLocked}
                title={
                  isStepLocked ? "This step is locked and cannot be edited" : ""
                }
              >
                <Save className="mr-2 h-4 w-4" />
                Save
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

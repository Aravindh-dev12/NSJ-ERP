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
import { Select } from "@/components/ui/select";
import {
  stoneDemandToBaggingCreate,
  stoneDemandToBaggingUpdate,
  stoneDemandToBaggingList,
  stoneDemandToBaggingDelete,
  ordersDropdown,
  saveProcessStepData,
  vouchersMasters,
  type StoneDemandToBagging,
} from "@/lib/backend";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
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
import { StoneDemandToBaggingHeader } from "@/components/process/StoneDemandToBaggingHeader";
import { useToast } from "@/hooks/use-toast";
import { MissingFieldsModal } from "@/components/process/MissingFieldsModal";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

// Type for each item row
type StoneItem = {
  diamondColorStone: string;
  batchId: string;
  masterSize: string;
  shape: string;
  mmSize: string;
  noOfPieces: string;
  estimatedTotalCaratWeight: string;
};

interface StoneDemandToBaggingFormProps {
  mode?: "create" | "edit";
  initialData?: StoneDemandToBagging;
  id?: string;
  orderIdFromUrl?: string;
  accountOrderIdFromUrl?: string;
}

export function StoneDemandToBaggingForm({
  mode = "create",
  initialData,
  id,
  orderIdFromUrl,
  accountOrderIdFromUrl,
}: StoneDemandToBaggingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [masterSizes, setMasterSizes] = useState<any[]>([]);
  const [shapes, setShapes] = useState<any[]>([]);

  // Form state
  const [accountOrderId, setAccountOrderId] = useState(
    initialData?.account_order_id || accountOrderIdFromUrl || ""
  );
  const [orderId, setOrderId] = useState(
    initialData?.order_id || orderIdFromUrl || ""
  );
  const [orderValidated, setOrderValidated] = useState(
    !!(initialData?.order_id || orderIdFromUrl) && !!accountOrderId
  );
  const [validatedOrder, setValidatedOrder] = useState<any>(null);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);

  // Multi-item table state
  const [stoneItems, setStoneItems] = useState<StoneItem[]>(
    initialData?.stone_items && initialData.stone_items.length > 0
      ? initialData.stone_items.map((item) => ({
          diamondColorStone: item.diamond_color_stone || "",
          batchId: item.batch_id || "",
          masterSize: item.master_size || "",
          shape: item.shape || "",
          mmSize: item.mm_size || "",
          noOfPieces: item.no_of_pieces?.toString() || "",
          estimatedTotalCaratWeight:
            item.estimated_total_carat_weight?.toString() || "",
        }))
      : [
          {
            diamondColorStone: initialData?.diamond_color_stone || "",
            batchId: initialData?.batch_id || "",
            masterSize: initialData?.master_size || "",
            shape: initialData?.shape || "",
            mmSize: initialData?.mm_size || "",
            noOfPieces: initialData?.no_of_pieces?.toString() || "",
            estimatedTotalCaratWeight:
              initialData?.estimated_total_carat_weight?.toString() || "",
          },
        ]
  );

  // Image
  const [approvedBaggingImages, setApprovedBaggingImages] = useState<
    LogImageItem[]
  >([]);
  const [carryForwardImages, setCarryForwardImages] = useState<LogImageItem[]>(
    []
  );
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);
  const [selectedCarryLogGroup, setSelectedCarryLogGroup] = useState<
    string | null
  >(null);
  const [extraRecordIds, setExtraRecordIds] = useState<string[]>([]);
  const [isDraft, setIsDraft] = useState(initialData?.is_draft || false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Sync with initialData when it changes
  useEffect(() => {
    console.log("[Stone Demand] initialData changed:", {
      hasImages: !!initialData?.images,
      imageCount: initialData?.images?.length || 0,
      isDraft: initialData?.is_draft,
    });

    if (initialData?.images) {
      setApprovedBaggingImages(
        mapApiImagesToLogItems(initialData.images, "approved_bagging")
      );
      setCarryForwardImages(
        mapApiImagesToLogItems(initialData.images, "carry_forward")
      );
      setSelectedLogGroup((initialData as any).selected_log_group ?? null);
      setSelectedCarryLogGroup(
        (initialData as any).selected_secondary_log_group ?? null
      );
    }

    if (initialData?.is_draft !== undefined) {
      setIsDraft(initialData.is_draft);
    }
  }, [initialData]);

  // Consolidate separate stone records into one form for editing if they aren't already grouped
  useEffect(() => {
    const consolidateItems = async () => {
      if (
        mode === "edit" &&
        initialData?.account_order_id &&
        (!initialData.stone_items || initialData.stone_items.length === 0)
      ) {
        try {
          // Fetch all records for this order to see if there are other separate items
          const response = await stoneDemandToBaggingList({
            search: initialData.account_order_id,
            page_size: 100,
          });

          const relatedRecords = response.results || response.items || [];

          if (relatedRecords.length > 1) {
            // We found multiple separate records for this order.
            // Map them all into the current form's table so they can be managed together.
            setStoneItems(
              relatedRecords.map((r: any) => ({
                diamondColorStone: r.diamond_color_stone || "",
                batchId: r.batch_id || "",
                masterSize: r.master_size || "",
                shape: r.shape || "",
                mmSize: r.mm_size || "",
                noOfPieces: r.no_of_pieces?.toString() || "",
                estimatedTotalCaratWeight:
                  r.estimated_total_carat_weight?.toString() || "",
              }))
            );

            // Track any OTHER records for this order so they can be merged/deleted upon save
            const others = relatedRecords
              .map((r: any) => r.id)
              .filter((rid: string) => rid !== id);
            setExtraRecordIds(others);

            // Also check for images in related records
            if (!existingApprovedBaggingListUrl) {
              const found = relatedRecords.find(
                (r: any) => r.approved_bagging_list_url
              );
              if (found)
                setExistingApprovedBaggingListUrl(
                  found.approved_bagging_list_url
                );
            }
            if (!existingCarryForwardImageUrl) {
              const found = relatedRecords.find(
                (r: any) => r.carry_forward_image_url
              );
              if (found)
                setExistingCarryForwardImageUrl(found.carry_forward_image_url);
            }
          }
        } catch (err) {
          console.error("Failed to consolidate records for edit:", err);
        }
      }
    };

    void consolidateItems();
  }, [mode, initialData, id]);

  // Load orders dropdown
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await ordersDropdown();
        setOrders(response.orders || []);

        // If we have order ID from URL, try to validate it immediately
        if (
          orderIdFromUrl &&
          accountOrderIdFromUrl &&
          response.orders?.length > 0
        ) {
          console.log("[Stone Demand] Validating order from URL params:", {
            orderIdFromUrl,
            accountOrderIdFromUrl,
          });

          const searchId = accountOrderIdFromUrl.trim().toUpperCase();
          const matchingOrder = response.orders.find(
            (order: any) =>
              (order.order_no && order.order_no.toUpperCase() === searchId) ||
              (order.bill_no && order.bill_no.toUpperCase() === searchId) ||
              (order.job_no && order.job_no.toUpperCase() === searchId) ||
              (order.name && order.name.toUpperCase() === searchId) ||
              (order.id && order.id.toString() === orderIdFromUrl)
          );

          if (matchingOrder) {
            console.log(
              "[Stone Demand] Order validated from URL:",
              matchingOrder
            );
            setOrderId(orderIdFromUrl);
            setAccountOrderId(accountOrderIdFromUrl);
            setOrderValidated(true);
            setValidatedOrder(matchingOrder);
          } else {
            console.warn(
              "[Stone Demand] Order from URL not found in dropdown:",
              accountOrderIdFromUrl
            );
            // Still set the orderId so we can save the draft
            setOrderId(orderIdFromUrl);
            setAccountOrderId(accountOrderIdFromUrl);
            setOrderValidated(true); // Assume valid since it came from URL
          }
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      }
    };
    void loadOrders();
  }, [orderIdFromUrl, accountOrderIdFromUrl]);

  // Load masters for dropdowns
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const response = await vouchersMasters();
        console.log("[Stone Demand] Masters loaded:", response);
        console.log("[Stone Demand] Shapes:", response.shapes);
        // Master Size should come from sizes master data (ring sizes, etc.)
        setMasterSizes(response.sizes || []);
        // Shape should come from shapes master data
        setShapes(response.shapes || []);
      } catch (err) {
        console.error("Failed to load masters:", err);
      }
    };
    void loadMasters();
  }, []);

  // Handle pre-filled order ID for edit mode
  useEffect(() => {
    if (
      accountOrderId &&
      orders.length > 0 &&
      !orderValidated &&
      mode === "edit"
    ) {
      validateOrderId();
    }
  }, [orders, accountOrderId, mode]);

  // Validate order ID
  const validateOrderId = () => {
    if (!accountOrderId.trim()) {
      setError("Please enter an Order ID");
      setOrderValidated(false);
      setValidatedOrder(null);
      return;
    }

    // Find matching order (robust check for various field names)
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

  // Add new item row
  const addItemRow = () => {
    setStoneItems([
      ...stoneItems,
      {
        diamondColorStone: "",
        batchId: "",
        masterSize: "",
        shape: "",
        mmSize: "",
        noOfPieces: "",
        estimatedTotalCaratWeight: "",
      },
    ]);
  };

  // Remove item row
  const removeItemRow = (index: number) => {
    if (stoneItems.length > 1) {
      setStoneItems(stoneItems.filter((_, i) => i !== index));
    }
  };

  // Update item field
  const updateItemField = (
    index: number,
    field: keyof StoneItem,
    value: string
  ) => {
    const updatedItems = [...stoneItems];
    updatedItems[index][field] = value;
    setStoneItems(updatedItems);
  };

  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    console.log("[Stone Demand Draft] Starting save...");
    console.log("[Stone Demand Draft] Form data:", {
      accountOrderId,
      orderId,
      mode,
      stoneItemsCount: stoneItems.length,
    });

    if (!orderId) {
      console.error(
        "[Stone Demand Draft] Missing orderId! Cannot save process step."
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an Order ID before saving.",
      });
      return;
    }

    setLoading(true);
    setError(null);

    // Show loading toast for long operations
    const loadingToast = toast({
      title: "Saving Draft...",
      description: "This may take a moment. Please wait.",
    });

    try {
      const formData = new FormData();

      if (accountOrderId) {
        formData.append("account_order_id", accountOrderId);
      }

      if (orderId) {
        formData.append("order_id", orderId);
      }

      // Add stone items (simplified for draft - allow empty)
      if (stoneItems.length > 0) {
        const stoneItemsPayload = stoneItems.map((item) => ({
          diamond_color_stone: item.diamondColorStone,
          batch_id: item.batchId,
          master_size: item.masterSize,
          shape: item.shape,
          mm_size: item.mmSize,
          no_of_pieces: item.noOfPieces ? parseInt(item.noOfPieces) : undefined,
          estimated_total_carat_weight: item.estimatedTotalCaratWeight,
        }));

        console.log(
          "[Stone Demand Draft] Stone items payload:",
          stoneItemsPayload
        );

        formData.append("stone_items", JSON.stringify(stoneItemsPayload));
      }

      // Helper: append images + keep list + final selection
      appendLogImageFields(
        formData,
        approvedBaggingImages,
        "approved_bagging",
        selectedLogGroup,
        "select_log_group"
      );
      appendLogImageFields(
        formData,
        carryForwardImages,
        "carry_forward",
        selectedCarryLogGroup,
        "select_secondary_log_group"
      );

      // Mark as draft
      formData.append("is_draft", "true");

      console.log("[Stone Demand Draft] Creating/updating record...");
      let result: any;

      try {
        if (mode === "create") {
          console.time("[Stone Demand Draft] API call");
          result = await stoneDemandToBaggingCreate(formData);
          console.timeEnd("[Stone Demand Draft] API call");
          console.log("[Stone Demand Draft] Created:", result);

          // Handle different response structures
          // Backend might return: { id: "..." } OR { records: [{ id: "..." }] }
          if (result?.id) {
            setSavedRecordId(result.id);
          } else if (result?.records?.[0]?.id) {
            setSavedRecordId(result.records[0].id);
            console.log(
              "[Stone Demand Draft] Extracted ID from records array:",
              result.records[0].id
            );
          }
        } else {
          console.time("[Stone Demand Draft] API call");
          result = await stoneDemandToBaggingUpdate(id!, formData);
          console.timeEnd("[Stone Demand Draft] API call");
          console.log("[Stone Demand Draft] Updated:", result);
        }
      } catch (apiError: any) {
        console.error("[Stone Demand Draft] API call failed:", apiError);
        console.error("[Stone Demand Draft] Error details:", {
          message: apiError?.message,
          response: apiError?.response?.data,
          status: apiError?.response?.status,
        });
        throw apiError; // Re-throw to be caught by outer catch
      }

      const recId =
        mode === "create" ? result?.id || result?.records?.[0]?.id : id;

      // Reload images from API response
      const responseData = result?.records?.[0] || result;
      if (responseData?.images) {
        setApprovedBaggingImages(
          mapApiImagesToLogItems(responseData.images, "approved_bagging")
        );
        setCarryForwardImages(
          mapApiImagesToLogItems(responseData.images, "carry_forward")
        );
        setSelectedLogGroup(
          (responseData as any).selected_log_group ?? selectedLogGroup
        );
        setSelectedCarryLogGroup(
          (responseData as any).selected_secondary_log_group ??
            selectedCarryLogGroup
        );
      }

      console.log(
        "[Stone Demand Draft] Record ID to save to process step:",
        recId
      );

      if (orderId && recId) {
        console.log("[Stone Demand Draft] Calling saveProcessStepData:", {
          orderId,
          stepName: "Stone Demand to Bagging",
          referenceId: recId,
          notes: `Stone Demand to Bagging saved as draft: ${recId}`,
        });

        try {
          await saveProcessStepData(
            orderId,
            "Stone Demand to Bagging",
            recId,
            `Stone Demand to Bagging saved as draft: ${recId}`
          );
          console.log("[Stone Demand Draft] Process step saved successfully");
        } catch (saveErr) {
          console.error(
            "[Stone Demand Draft] Failed to save process step:",
            saveErr
          );
        }
      } else {
        console.warn(
          "[Stone Demand Draft] Missing orderId or recId, skipping process step save"
        );
      }

      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description:
          "Stone Demand to Bagging has been saved as draft. You can continue editing.",
      });

      // Redirect to process steps page after draft save
      if (orderId) {
        setTimeout(() => {
          orderId
            ? router.push(`/vouchers/orders/${orderId}/tracking/`)
            : router.back();
        }, 500);
      }
    } catch (err: any) {
      console.error("[Stone Demand Draft] Save failed:", err);
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

    // Form submission logging for debugging
    console.log("[Form Submit] Form submission initiated");

    if (!orderValidated) {
      setError("Please validate the Order ID first");
      return;
    }

    // Validate that at least one item has data
    const hasValidItems = stoneItems.some(
      (item) =>
        item.diamondColorStone ||
        item.masterSize ||
        item.shape ||
        item.mmSize ||
        item.noOfPieces ||
        item.estimatedTotalCaratWeight
    );

    if (!hasValidItems) {
      setError("Please add at least one stone item with data");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    console.log("[Form Submit] Starting form submission process");

    try {
      const formData = new FormData();

      if (accountOrderId) {
        formData.append("account_order_id", accountOrderId);
      }

      if (orderId) {
        formData.append("order_id", orderId);
      }

      // Payload logic: Differentiate between single and multiple items
      // If we are in edit mode and consolidation happened, we should always send stone_items
      // to ensure the backend manages the list correctly and clears any removed items.
      const isMultiMode =
        stoneItems.length > 1 ||
        (mode === "edit" && (initialData?.stone_items?.length || 0) > 0);

      if (!isMultiMode) {
        const item = stoneItems[0];
        console.log(
          "[Stone Demand] Single item mode, shape value:",
          item.shape
        );
        if (item.diamondColorStone)
          formData.append("diamond_color_stone", item.diamondColorStone);
        if (item.batchId) formData.append("batch_id", item.batchId);
        if (item.masterSize) formData.append("master_size", item.masterSize);
        if (item.shape) formData.append("shape", item.shape);
        if (item.mmSize) formData.append("mm_size", item.mmSize);
        if (item.noOfPieces) formData.append("no_of_pieces", item.noOfPieces);
        if (item.estimatedTotalCaratWeight)
          formData.append(
            "estimated_total_carat_weight",
            item.estimatedTotalCaratWeight
          );
      } else {
        // Add stone items as JSON for multiple items
        const itemsPayload = stoneItems.map((item) => ({
          diamond_color_stone: item.diamondColorStone,
          batch_id: item.batchId,
          master_size: item.masterSize,
          shape: item.shape,
          mm_size: item.mmSize,
          no_of_pieces: item.noOfPieces ? parseInt(item.noOfPieces) : undefined,
          estimated_total_carat_weight: item.estimatedTotalCaratWeight,
        }));
        console.log(
          "[Stone Demand] Multi item mode, shapes:",
          itemsPayload.map((i) => i.shape)
        );
        formData.append("stone_items", JSON.stringify(itemsPayload));
      }

      // Mark as not draft (final save)
      formData.append("is_draft", "false");

      // Helper: append images + keep list + final selection
      appendLogImageFields(
        formData,
        approvedBaggingImages,
        "approved_bagging",
        selectedLogGroup,
        "select_log_group"
      );
      appendLogImageFields(
        formData,
        carryForwardImages,
        "carry_forward",
        selectedCarryLogGroup,
        "select_secondary_log_group"
      );

      let result: any;
      if (mode === "create") {
        console.log("[Form Submit] Calling stoneDemandToBaggingCreate");
        result = await stoneDemandToBaggingCreate(formData);

        // Extract the actual record ID from the API response
        if (result?.records?.[0]?.id) {
          result.id = result.records[0].id;
        }
        setSavedRecordId(result?.id || null);
      } else {
        console.log(
          "[Form Submit] Calling stoneDemandToBaggingUpdate for ID:",
          id
        );
        result = await stoneDemandToBaggingUpdate(id!, formData);

        // Extract the new record ID if the backend shifted it
        if (result?.records?.[0]?.id) {
          result.id = result.records[0].id;
        }
        setSavedRecordId(result?.id || id);

        // Cleanup: Finalizing the merge by removing all other separate records for this Order
        if (extraRecordIds.length > 0) {
          console.log(
            "[Cleanup] Removing extra records to prevent duplication:",
            extraRecordIds
          );
          // We await the deletions to ensure they are finished before the success redirect
          for (const rid of extraRecordIds) {
            try {
              await stoneDemandToBaggingDelete(rid);
              console.log(`[Cleanup] Successfully removed: ${rid}`);
            } catch (err) {
              // Silently catch 404s if already deleted by backend
              console.warn(`[Cleanup] record cleanup skip for ${rid}`);
            }
          }
        }
      }

      // Reload images from API response
      const responseData = result?.records?.[0] || result;
      if (responseData?.images) {
        setApprovedBaggingImages(
          mapApiImagesToLogItems(responseData.images, "approved_bagging")
        );
        setCarryForwardImages(
          mapApiImagesToLogItems(responseData.images, "carry_forward")
        );
        setSelectedLogGroup(
          (responseData as any).selected_log_group ?? selectedLogGroup
        );
        setSelectedCarryLogGroup(
          (responseData as any).selected_secondary_log_group ??
            selectedCarryLogGroup
        );
      }

      const recId = mode === "create" ? result?.id : result?.id || id;
      if (orderId && recId) {
        try {
          await saveProcessStepData(
            orderId,
            "Stone Demand to Bagging",
            recId,
            `Stone Demand to Bagging ${mode}d: ${recId}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(false);
      setSuccess(true);
      setError(null);

      console.log("[Form Submit] Form submission successful");

      toast({
        title: "Saved",
        description: "Stone Demand to Bagging record saved successfully.",
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
        err?.message ||
          `Failed to ${mode === "create" ? "create" : "update"} Stone Demand to Bagging record`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PreviousBackButton />
      <StoneDemandToBaggingHeader
        title={
          mode === "create"
            ? "Add New Stone Demand to Bagging"
            : "Edit Stone Demand to Bagging"
        }
        description={
          mode === "create"
            ? "Create a new stone demand to bagging record with multiple stone items"
            : "Update the stone demand to bagging record"
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {mode === "create" ? "Add New Record" : "Edit Record"}
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
          <CardDescription>
            {mode === "create"
              ? "Fill in the details below to create a new stone demand to bagging record"
              : "Update the details below for this stone demand to bagging record"}
          </CardDescription>
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

            {/* Multi-Item Stone Details Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-medium">
                  Stone Items Details
                </Label>
                <Button
                  type="button"
                  onClick={addItemRow}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2 p-3 bg-muted">
                  <div className="text-sm font-medium">Diamond/Color/Stone</div>
                  <div className="text-sm font-medium">Batch ID</div>
                  <div className="text-sm font-medium">Master Size</div>
                  <div className="text-sm font-medium">Shape</div>
                  <div className="text-sm font-medium">MM Size</div>
                  <div className="text-sm font-medium">No. of Pieces</div>
                  <div className="text-sm font-medium">Est. Carat Weight</div>
                </div>

                {stoneItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-7 gap-2 p-3 border-t"
                  >
                    <div>
                      <Input
                        value={item.diamondColorStone}
                        onChange={(e) =>
                          updateItemField(
                            index,
                            "diamondColorStone",
                            e.target.value
                          )
                        }
                        placeholder="Diamond/Color/Stone"
                      />
                    </div>
                    <div>
                      <Input
                        value={item.batchId}
                        onChange={(e) =>
                          updateItemField(index, "batchId", e.target.value)
                        }
                        placeholder="Batch ID"
                      />
                    </div>
                    <div>
                      <select
                        value={item.masterSize}
                        onChange={(e) =>
                          updateItemField(index, "masterSize", e.target.value)
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select Master Size</option>
                        {masterSizes.map((size) => (
                          <option key={size.id} value={size.name}>
                            {size.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={item.shape}
                        onChange={(e) =>
                          updateItemField(index, "shape", e.target.value)
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select Shape</option>
                        {shapes.map((shape) => (
                          <option key={shape.id} value={shape.id}>
                            {shape.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.mmSize}
                        onChange={(e) =>
                          updateItemField(index, "mmSize", e.target.value)
                        }
                        placeholder="Enter MM Size"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={item.noOfPieces}
                        onChange={(e) =>
                          updateItemField(index, "noOfPieces", e.target.value)
                        }
                        placeholder="Pieces"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.001"
                        value={item.estimatedTotalCaratWeight}
                        onChange={(e) =>
                          updateItemField(
                            index,
                            "estimatedTotalCaratWeight",
                            e.target.value
                          )
                        }
                        placeholder="Carat Weight"
                      />
                      {stoneItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeItemRow(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Approved Bagging List Image */}
            <ImageLogUploader
              label="Approved Bagging List Images"
              images={approvedBaggingImages}
              onChange={setApprovedBaggingImages}
              selectedLogGroup={selectedLogGroup}
              onSelectLog={setSelectedLogGroup}
            />

            {/* Carry-Forward Image */}
            <ImageLogUploader
              label="Carry-Forward Images"
              images={carryForwardImages}
              onChange={setCarryForwardImages}
              selectedLogGroup={selectedCarryLogGroup}
              onSelectLog={setSelectedCarryLogGroup}
              fieldType="carry_forward"
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
                Stone Demand to Bagging record saved successfully!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <PreviousBackButton />
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
                    ? "Save Record"
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

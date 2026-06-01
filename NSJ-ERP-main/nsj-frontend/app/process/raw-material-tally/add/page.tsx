"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RawMaterialTallyHeader } from "@/components/process/RawMaterialTallyHeader";
import {
  rawMaterialTallyCreate,
  rawMaterialTallyList,
  rawMaterialTallyDetail,
  ordersDropdown,
  saveProcessStepData,
  getStepStatus,
  type RawMaterialTally,
} from "@/lib/backend";
import { ApiError } from "@/lib/api";
import {
  ChevronLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
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

type MaterialMovementRow = {
  material: string;
  quantity: string;
  unit: string;
};

export default function RawMaterialTallyAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<RawMaterialTally[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  // Form state
  const [accountOrderId, setAccountOrderId] = useState(
    searchParams.get("account_order_id") || ""
  );
  const [orderId, setOrderId] = useState(searchParams.get("order_id") || "");
  const [orderValidated, setOrderValidated] = useState(false);
  const [validatedOrder, setValidatedOrder] = useState<any>(null);
  const [carryForwardImages, setCarryForwardImages] = useState<LogImageItem[]>(
    []
  );
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);

  // Dynamic table for raw material movement
  const [materialMovementRows, setMaterialMovementRows] = useState<
    MaterialMovementRow[]
  >([{ material: "", quantity: "", unit: "" }]);

  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [loadingStepStatus, setLoadingStepStatus] = useState(true);

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

  // Handle pre-filled order ID
  useEffect(() => {
    if (accountOrderId && orders.length > 0 && !orderValidated) {
      validateOrderId();
    }
  }, [orders, accountOrderId]);

  // Check step status and load existing data if available (only on initial mount)
  useEffect(() => {
    let isMounted = true;

    const checkStepStatus = async () => {
      const orderIdParam = searchParams.get("order_id");
      if (!orderIdParam) {
        setLoadingStepStatus(false);
        return;
      }

      try {
        setLoadingStepStatus(true);
        const status = await getStepStatus(orderIdParam, "Raw Material Tally");

        console.log("[Raw Material Tally] Step status check:", status);

        // If reference_id exists, load existing tally data
        if (status.reference_id) {
          console.log(
            "[Raw Material Tally] Loading existing data:",
            status.reference_id
          );

          try {
            const tallyData = await rawMaterialTallyDetail(status.reference_id);

            if (!isMounted) return;

            setSavedRecordId(tallyData.id || status.reference_id);
            setAccountOrderId(tallyData.account_order_id || "");
            setOrderId(tallyData.order_id || "");
            setIsDraft(tallyData.is_draft || false);

            if (tallyData.images) {
              setCarryForwardImages(
                mapApiImagesToLogItems(tallyData.images, "*")
              );
              setSelectedLogGroup(
                (tallyData as any).selected_log_group ?? null
              );
            }

            console.log(
              "[Raw Material Tally] Initial load - setting isDraft to:",
              tallyData.is_draft
            );

            // Find matching order for display
            if (tallyData.order_id && orders.length > 0) {
              const matchingOrder = orders.find(
                (o: any) => o.id.toString() === tallyData.order_id.toString()
              );
              if (matchingOrder) {
                setOrderValidated(true);
                setValidatedOrder(matchingOrder);
              }
            }

            // Load existing material movement data
            if (
              tallyData.raw_material_movement &&
              tallyData.raw_material_movement.length > 0
            ) {
              setMaterialMovementRows(
                tallyData.raw_material_movement.map((m: any) => ({
                  material: m.material || "",
                  quantity: m.quantity?.toString() || "",
                  unit: m.unit || "",
                }))
              );
            }
          } catch (err) {
            console.error("Failed to load existing tally data:", err);
          }
        }
      } catch (err) {
        console.error("[Raw Material Tally] Failed to check step status:", err);
        // Don't block the form if status check fails
      } finally {
        if (isMounted) {
          setLoadingStepStatus(false);
        }
      }
    };

    checkStepStatus();

    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  // Load existing records for recent list
  useEffect(() => {
    const loadRecords = async () => {
      try {
        const response = await rawMaterialTallyList({ page: 1, page_size: 10 });
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

  // Material movement table handlers
  const addMaterialRow = () => {
    setMaterialMovementRows([
      ...materialMovementRows,
      { material: "", quantity: "", unit: "" },
    ]);
  };

  const removeMaterialRow = (index: number) => {
    if (materialMovementRows.length > 1) {
      setMaterialMovementRows(
        materialMovementRows.filter((_, i) => i !== index)
      );
    }
  };

  const updateMaterialRow = (
    index: number,
    field: keyof MaterialMovementRow,
    value: string
  ) => {
    const updated = [...materialMovementRows];
    updated[index][field] = value;
    setMaterialMovementRows(updated);
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
        formData.append("order", orderId);
      }

      // Add raw material movement as JSON, filtering out empty rows
      const movementData = materialMovementRows
        .filter(
          (row) => row.material.trim() !== "" || row.quantity.trim() !== ""
        )
        .map((row) => {
          const qty = parseFloat(row.quantity);
          return {
            material: row.material.trim(),
            quantity: isNaN(qty) ? 0 : qty,
            unit: row.unit.trim(),
          };
        });

      formData.append("raw_material_movement", JSON.stringify(movementData));

      // Append carry forward images
      appendLogImageFields(
        formData,
        carryForwardImages,
        "carry_forward",
        selectedLogGroup
      );
      formData.append("is_draft", "true");

      const result = (await rawMaterialTallyCreate(
        formData
      )) as RawMaterialTally;

      console.log("[Raw Material Tally] Draft saved result:", result);
      console.log(
        "[Raw Material Tally] is_draft from backend:",
        result?.is_draft
      );

      setSavedRecordId(result?.id || null);

      if (result?.images) {
        setCarryForwardImages(mapApiImagesToLogItems(result.images, "*"));
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
      }

      if (orderId && result?.id) {
        try {
          await saveProcessStepData(
            orderId,
            "Raw Material Tally",
            result.id,
            `Raw Material Tally draft saved: ${result.id}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description: "Raw Material Tally saved as draft.",
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to save draft",
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
        formData.append("order", orderId);
      }

      // Add raw material movement as JSON, filtering out empty rows
      const movementData = materialMovementRows
        .filter(
          (row) => row.material.trim() !== "" || row.quantity.trim() !== ""
        )
        .map((row) => {
          const qty = parseFloat(row.quantity);
          return {
            material: row.material.trim(),
            quantity: isNaN(qty) ? 0 : qty,
            unit: row.unit.trim(),
          };
        });

      if (movementData.length > 0) {
        const jsonString = JSON.stringify(movementData);
        formData.append("raw_material_movement", jsonString);
      } else {
        formData.append("raw_material_movement", JSON.stringify([]));
      }

      appendLogImageFields(
        formData,
        carryForwardImages,
        "carry_forward",
        selectedLogGroup
      );

      formData.append("is_draft", "false");

      const result = (await rawMaterialTallyCreate(
        formData
      )) as RawMaterialTally;

      setSavedRecordId(result?.id || null);

      if (orderId && result?.id) {
        try {
          await saveProcessStepData(
            orderId,
            "Raw Material Tally",
            result.id,
            `Raw Material Tally created: ${result.id}`
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
        description: "Raw Material Tally record saved successfully.",
      });

      // Redirect back to order tracking
      setTimeout(() => {
        orderId
          ? router.push(`/vouchers/orders/${orderId}/tracking/`)
          : router.back();
      }, 1000);
    } catch (err: unknown) {
      // Check if error is a 400 with missing_fields
      if (err instanceof ApiError && err.data?.errors) {
        const errors = err.data.errors;
        if (errors.missing_fields && Array.isArray(errors.missing_fields)) {
          setMissingFields(errors.missing_fields);
          setShowMissingFieldsModal(true);
          return;
        }

        const errorDetails = Object.entries(err.data.errors)
          .map(([field, msgs]) => {
            const message = Array.isArray(msgs) ? msgs.join(", ") : msgs;
            return `${field}: ${message}`;
          })
          .join("; ");
        setError(`Validation Error: ${errorDetails}`);
      } else if (err instanceof ApiError && err.data?.detail) {
        setError(`API Error: ${err.data.detail}`);
      } else if (err instanceof Error) {
        setError(err.message || "Failed to create Raw Material Tally record");
      } else {
        setError("Failed to create Raw Material Tally record");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PreviousBackButton />
      <RawMaterialTallyHeader
        title="Add New Raw Material Tally"
        description="Track raw material movement with order validation"
      />

      {/* Form Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Add New Raw Material Tally</CardTitle>
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
            <ImageLogUploader
              label="Carry-Forward Images"
              images={carryForwardImages}
              onChange={setCarryForwardImages}
              selectedLogGroup={selectedLogGroup}
              onSelectLog={setSelectedLogGroup}
            />

            {/* Raw Material Movement Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Raw Material Movement</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMaterialRow}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Row
                </Button>
              </div>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left text-sm font-medium">
                        Material
                      </th>
                      <th className="p-2 text-left text-sm font-medium">
                        Quantity
                      </th>
                      <th className="p-2 text-left text-sm font-medium">
                        Unit
                      </th>
                      <th className="p-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialMovementRows.map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          <Input
                            value={row.material}
                            onChange={(e) =>
                              updateMaterialRow(
                                index,
                                "material",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Gold, Silver"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.001"
                            value={row.quantity}
                            onChange={(e) =>
                              updateMaterialRow(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            placeholder="Quantity"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={row.unit}
                            onChange={(e) =>
                              updateMaterialRow(index, "unit", e.target.value)
                            }
                            placeholder="e.g., grams, kg"
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterialRow(index)}
                            disabled={materialMovementRows.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
                Raw Material Tally record saved successfully!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  orderId
                    ? router.push(`/vouchers/orders/${orderId}/tracking/`)
                    : router.back()
                }
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
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Raw Material Tallies</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <p className="text-sm text-muted-foreground">Loading records...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No records available yet. Create one above to get started.
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
                    {record.raw_material_movement &&
                      record.raw_material_movement.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Materials:{" "}
                          {record.raw_material_movement
                            .map((m) => m.material)
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </p>
                      )}
                    <p className="text-sm text-muted-foreground">
                      Created:{" "}
                      {record.created_at
                        ? new Date(record.created_at).toLocaleDateString()
                        : "N/A"}
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

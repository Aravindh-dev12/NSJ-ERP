"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RawMaterialTallyHeader } from "@/components/process/RawMaterialTallyHeader";
import {
  rawMaterialTallyDetail,
  rawMaterialTallyUpdate,
  ordersDropdown,
  autoCompleteStep,
  saveProcessStepData,
  type RawMaterialTally,
} from "@/lib/backend";
import { ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Lock,
  FileText,
} from "lucide-react";
import {
  ImageLogUploader,
  type LogImageItem,
} from "@/components/ui/ImageLogUploader";
import {
  appendLogImageFields,
  mapApiImagesToLogItems,
} from "@/lib/imageFormUtils";
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

type MaterialMovementRow = {
  material: string;
  quantity: string;
  unit: string;
};

export default function RawMaterialTallyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [record, setRecord] = useState<RawMaterialTally | null>(null);
  const [accountOrderId, setAccountOrderId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderValidated, setOrderValidated] = useState(true); // Pre-validated for edit
  const [validatedOrder, setValidatedOrder] = useState<any>(null);
  const [carryForwardImages, setCarryForwardImages] = useState<LogImageItem[]>(
    []
  );
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);
  const [orders, setOrders] = useState<{ id: string; name: string }[]>([]);

  // Dynamic table for raw material movement
  const [materialMovementRows, setMaterialMovementRows] = useState<
    MaterialMovementRow[]
  >([{ material: "", quantity: "", unit: "" }]);

  // Draft state
  const [isDraft, setIsDraft] = useState(false);
  const [hasSaved, setHasSaved] = useState(true); // Pre-saved in edit mode
  const [isCompleted, setIsCompleted] = useState(false);

  // Load record data and orders
  useEffect(() => {
    const loadData = async () => {
      try {
        const { id } = await params;
        const [recordData, ordersRes] = await Promise.all([
          rawMaterialTallyDetail(id),
          ordersDropdown(),
        ]);

        setRecord(recordData);
        setOrders(ordersRes.orders || []);

        // Pre-fill form with existing data
        setAccountOrderId(recordData.account_order_id || "");
        if (recordData.account_order_id) {
          setValidatedOrder({
            id: recordData.id,
            name: recordData.account_order_id,
          });
        }

        if (recordData.order_id) {
          setOrderId(recordData.order_id);
        }

        // Load existing carry-forward images
        if (recordData.images && recordData.images.length > 0) {
          setCarryForwardImages(mapApiImagesToLogItems(recordData.images, "*"));
          setSelectedLogGroup((recordData as any).selected_log_group ?? null);
        }

        // Load existing material movement data
        if (
          recordData.raw_material_movement &&
          recordData.raw_material_movement.length > 0
        ) {
          setMaterialMovementRows(
            recordData.raw_material_movement.map((m) => ({
              material: m.material || "",
              quantity: m.quantity?.toString() || "",
              unit: m.unit || "",
            }))
          );
        }

        // Check if this is a draft
        if (recordData.is_draft) {
          setIsDraft(true);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load record data";
        setError(errorMessage);
        console.error("Error loading record:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

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

    setSubmitting(true);
    setError(null);

    try {
      const { id } = await params;
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

      appendLogImageFields(
        formData,
        carryForwardImages,
        "carry_forward",
        selectedLogGroup
      );

      formData.append("is_draft", "true");

      const result = await rawMaterialTallyUpdate(id, formData);

      // Refresh images from server response so log_group UUIDs are populated
      if ((result as any)?.images) {
        setCarryForwardImages(
          mapApiImagesToLogItems((result as any).images, "*")
        );
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
      }

      if (orderId) {
        try {
          await saveProcessStepData(
            orderId,
            "Raw Material Tally",
            id,
            `Raw Material Tally draft updated: ${id}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description: "Raw Material Tally draft saved.",
      });

      setTimeout(() => {
        if (orderId) {
          router.push(`/vouchers/orders/${orderId}/tracking/`);
        } else {
          router.back();
        }
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to save draft",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!orderValidated) {
      setError("Please validate the Order ID first");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const { id } = await params;
      const formData = new FormData();

      if (accountOrderId) {
        formData.append("account_order_id", accountOrderId);
      }

      if (orderId) {
        formData.append("order_id", orderId);
        formData.append("order", orderId);
      }

      // Add raw material movement as JSON
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
        formData.append("raw_material_movement", JSON.stringify(movementData));
      } else {
        formData.append("raw_material_movement", JSON.stringify([]));
      }

      appendLogImageFields(
        formData,
        carryForwardImages,
        "carry_forward",
        selectedLogGroup
      );

      const result = await rawMaterialTallyUpdate(id, formData);

      if ((result as any)?.images) {
        setCarryForwardImages(
          mapApiImagesToLogItems((result as any).images, "*")
        );
        setSelectedLogGroup(
          (result as any).selected_log_group ?? selectedLogGroup
        );
      }

      if (orderId) {
        try {
          await saveProcessStepData(
            orderId,
            "Raw Material Tally",
            id,
            `Raw Material Tally updated: ${id}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setHasSaved(true);
      setSuccess(true);
      setError(null);

      // Redirect back to process steps after successful save
      setTimeout(() => {
        if (orderId) {
          router.push(`/vouchers/orders/${orderId}/tracking/`);
        } else {
          router.back();
        }
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.data?.errors) {
        const errorDetails = Object.entries(err.data.errors)
          .map(([field, msgs]) => {
            const message = Array.isArray(msgs) ? msgs.join(", ") : msgs;
            return `${field}: ${message}`;
          })
          .join("; ");
        setError(`Validation Error: ${errorDetails}`);
      } else if (err instanceof ApiError && err.data?.detail) {
        setError(`API Error: ${err.data.detail}`);
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update record";
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">
          Loading record...
        </div>
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-medium">
            {error || "Record not found"}
          </div>
          <Button
            onClick={() => router.push("/process/raw-material-tally/list")}
          >
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to List button - Top Left */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/process/raw-material-tally/list")}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to List
      </Button>

      <RawMaterialTallyHeader
        title="Edit Raw Material Tally"
        description="Update existing raw material tally record"
      />

      <Card>
        <CardHeader>
          <CardTitle>Edit Raw Material Tally Record</CardTitle>
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
                  disabled={true} // Order ID is locked in edit mode
                  placeholder="Enter Order ID"
                  className={orderValidated ? "border-green-500" : ""}
                />
              </div>
              {orderValidated && validatedOrder && (
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Order validated: {validatedOrder.name}
                </div>
              )}
            </div>

            {/* Carry-Forward Image */}
            <ImageLogUploader
              label="Carry-Forward Image"
              images={carryForwardImages}
              onChange={setCarryForwardImages}
              selectedLogGroup={selectedLogGroup}
              onSelectLog={setSelectedLogGroup}
              disabled={isCompleted}
            />

            {/* Raw Material Movement Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Raw Material Movement</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCompleted}
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
                            disabled={isCompleted}
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
                            disabled={isCompleted}
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
                            disabled={isCompleted}
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
                  ? "Raw Material Tally step marked as done!"
                  : "Raw Material Tally record updated successfully!"}
              </div>
            )}

            {/* Action Buttons */}
            {!isCompleted && (
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/process/raw-material-tally/detail/${record?.id}`
                    )
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={submitting || !orderValidated || isCompleted}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={submitting || isCompleted}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

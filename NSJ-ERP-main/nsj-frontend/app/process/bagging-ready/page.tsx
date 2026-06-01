"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  baggingReadyCreate,
  baggingReadyList,
  ordersDropdown,
  type BaggingReady,
  autoCompleteStep,
  saveProcessStepData,
} from "@/lib/backend";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { OrderDetailsDisplay } from "@/components/OrderDetailsDisplay";
import { useToast } from "@/hooks/use-toast";
import { MissingFieldsModal } from "@/components/process/MissingFieldsModal";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function BaggingReadyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<BaggingReady[]>([]);
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
  const [carryForwardImageUrl, setCarryForwardImageUrl] = useState<string>("");
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

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
        const response = await baggingReadyList({
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

      if (carryForwardImage) {
        formData.append("carry_forward_image", carryForwardImage);
      }

      formData.append("is_draft", "true");

      const result = await baggingReadyCreate(formData);
      setSavedRecordId(result?.id || null);

      if (orderId) {
        try {
          await saveProcessStepData(
            orderId,
            "Bagging Ready",
            result?.id,
            `Bagging Ready draft saved: ${result?.id}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description: "Bagging Ready saved as draft. You can continue editing.",
      });
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

      if (carryForwardImage) {
        formData.append("carry_forward_image", carryForwardImage);
      }

      formData.append("is_draft", "false");

      const result = await baggingReadyCreate(formData);
      setSavedRecordId(result?.id || null);

      if (orderId) {
        try {
          await saveProcessStepData(
            orderId,
            "Bagging Ready",
            result?.id,
            `Bagging Ready saved: ${result?.id}`
          );
        } catch (saveErr) {
          console.warn("[Save Step] Failed:", saveErr);
        }
      }

      setIsDraft(false);
      setSuccess(true);
      setError(null);

      setTimeout(() => setSuccess(false), 3000);
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

      setError(err?.message || "Failed to save Bagging Ready record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bagging Ready</h1>
          <p className="text-muted-foreground">
            {isProductionDept
              ? "Manage bagging ready process with order validation"
              : "View bagging ready records (Read-only)"}
          </p>
        </div>
        <PreviousBackButton />
      </div>

      {/* Form Card - Only show for Production Department */}
      {isProductionDept && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Bagging Ready</CardTitle>
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
                <Label htmlFor="carry_forward_image">
                  {carryForwardImageUrl
                    ? "Update Carry-Forward Image"
                    : "Carry-Forward Image"}
                </Label>
                <Input
                  id="carry_forward_image"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCarryForwardImage(e.target.files?.[0] || null)
                  }
                />
                {carryForwardImage && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Selected: {carryForwardImage.name}
                  </div>
                )}
                {!carryForwardImage && carryForwardImageUrl && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Current: {carryForwardImageUrl.split("/").pop() || "Image"}{" "}
                    <a
                      href={carryForwardImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline ml-1"
                    >
                      (View)
                    </a>
                  </div>
                )}
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
                  Bagging Ready record saved successfully!
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
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
      )}

      {/* Recent Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bagging Ready Records</CardTitle>
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

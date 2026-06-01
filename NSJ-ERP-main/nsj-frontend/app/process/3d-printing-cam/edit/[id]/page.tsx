"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import {
  threeDPrintingCAMDetail,
  threeDPrintingCAMUpdate,
  ordersDropdown,
  type ThreeDPrintingCAM,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { OrderDetailsDisplay } from "@/components/OrderDetailsDisplay";

export default function ThreeDPrintingCAMEditPage({
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
  const [record, setRecord] = useState<ThreeDPrintingCAM | null>(null);
  const [accountOrderId, setAccountOrderId] = useState("");
  const [camPieceImage, setCamPieceImage] = useState<File | null>(null);
  const [camPieceImagePreview, setCamPieceImagePreview] = useState<string>("");
  const [qualityCheckYes, setQualityCheckYes] = useState(false);
  const [qualityCheckNo, setQualityCheckNo] = useState(false);
  const [qcFailureReasons, setQcFailureReasons] = useState("");
  const [approvedCamPiece, setApprovedCamPiece] = useState<File | null>(null);
  const [approvedCamPiecePreview, setApprovedCamPiecePreview] =
    useState<string>("");
  const [orders, setOrders] = useState<{ id: string; name: string }[]>([]);
  const [orderId, setOrderId] = useState("");
  const [orderValidated, setOrderValidated] = useState(false);
  const [validatedOrder, setValidatedOrder] = useState<any>(null);

  // Load record data and orders
  useEffect(() => {
    const loadData = async () => {
      try {
        const { id } = await params;

        // Load record data
        const recordData = await threeDPrintingCAMDetail(id);
        setRecord(recordData);
        setAccountOrderId(recordData.account_order_id || "");

        // Initialize quality check state
        if (recordData.cam_piece_quality_check !== undefined) {
          setQualityCheckYes(recordData.cam_piece_quality_check === true);
          setQualityCheckNo(recordData.cam_piece_quality_check === false);
        }
        if (recordData.qc_failure_reasons) {
          setQcFailureReasons(recordData.qc_failure_reasons);
        }

        // Load orders
        const ordersRes = await ordersDropdown();
        setOrders(ordersRes.orders || []);

        // Validate the existing order
        if (recordData.account_order_id) {
          const searchId = recordData.account_order_id.trim().toUpperCase();
          const matchingOrder = (ordersRes.orders || []).find(
            (order: any) =>
              (order.order_no && order.order_no.toUpperCase() === searchId) ||
              (order.bill_no && order.bill_no.toUpperCase() === searchId) ||
              (order.job_no && order.job_no.toUpperCase() === searchId) ||
              (order.name && order.name.toUpperCase() === searchId) ||
              (order.id &&
                order.id.toString() === recordData.account_order_id.trim())
          );

          if (matchingOrder) {
            setOrderValidated(true);
            setValidatedOrder(matchingOrder);
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load record data");
        console.error("Error loading record:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderValidated) {
      setError("Please validate the Order ID first");
      return;
    }

    if (!qualityCheckYes && !qualityCheckNo) {
      setError("Please select a quality check option");
      return;
    }

    if (qualityCheckNo && !qcFailureReasons.trim()) {
      setError("Please provide reasons for quality check failure");
      return;
    }

    if (
      qualityCheckYes &&
      !approvedCamPiece &&
      !record?.approved_cam_piece_url
    ) {
      setError("Please upload approved CAM piece");
      return;
    }

    setSubmitting(true);
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

      if (camPieceImage) {
        formData.append("cam_piece_image", camPieceImage);
      }

      formData.append("cam_piece_quality_check", qualityCheckYes.toString());

      if (qualityCheckNo && qcFailureReasons) {
        formData.append("qc_failure_reasons", qcFailureReasons);
      }

      if (qualityCheckYes && approvedCamPiece) {
        formData.append("approved_cam_piece", approvedCamPiece);
      }

      const { id } = await params;
      const result = await threeDPrintingCAMUpdate(id, formData);

      toast({
        title: "Success",
        description: "CAM piece record updated successfully.",
      });

      // Reset form
      setCamPieceImage(null);
      setApprovedCamPiece(null);
      setApprovedCamPiecePreview("");

      const inputs = document.querySelectorAll(
        'input[type="file"]'
      ) as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => (input.value = ""));

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push(`/process/3d-printing-cam/detail/${id}`);
      }, 1500);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err?.message || "Failed to update CAM piece record");
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to update CAM piece record",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">
          Loading record data...
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-medium">
            {error || "Record not found"}
          </div>
          <Button onClick={() => router.push("/process/3d-printing-cam/list")}>
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
        onClick={() => router.push("/process/3d-printing-cam/list")}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to List
      </Button>

      <ThreeDPrintingCAMHeader
        title="Edit CAM Piece Record"
        description="Update existing 3D printing/CAM piece record"
      />

      <Card>
        <CardHeader>
          <CardTitle>Edit CAM Piece Record</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order ID Section */}
            <div className="space-y-2">
              <Label htmlFor="account_order_id">
                Order ID / Job No <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="account_order_id"
                  value={accountOrderId}
                  onChange={(e) => {
                    setAccountOrderId(e.target.value);
                    setOrderValidated(false);
                    setValidatedOrder(null);
                  }}
                  placeholder="Enter Order ID or Job No"
                  className={
                    !orderValidated && accountOrderId
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
              {orderValidated && validatedOrder && (
                <OrderDetailsDisplay validatedOrder={validatedOrder} />
              )}
            </div>

            {/* Current Image Preview */}
            {record.cam_piece_image_url && (
              <div className="space-y-2">
                <Label>Current CAM Piece Image</Label>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <a
                        href={record.cam_piece_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Current Image
                      </a>
                      <p className="text-sm text-muted-foreground">
                        Click to view the currently uploaded image
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* New CAM Piece Image */}
            <div className="space-y-2">
              <Label htmlFor="cam_piece_image">
                {record.cam_piece_image_url
                  ? "Replace CAM Piece Image"
                  : "CAM Piece Image"}{" "}
                (Optional)
              </Label>
              <div className="space-y-2">
                <Input
                  id="cam_piece_image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setCamPieceImage(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCamPieceImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setCamPieceImagePreview("");
                    }
                  }}
                />
                {camPieceImagePreview && (
                  <div className="mt-3 rounded-lg border border-gray-200 p-3">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      New CAM Piece Image Preview:
                    </p>
                    <img
                      src={camPieceImagePreview}
                      alt="CAM Piece preview"
                      className="max-h-48 rounded-md object-contain"
                    />
                  </div>
                )}
                {camPieceImage && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {camPieceImage.name} (Ready to upload)
                  </div>
                )}
              </div>
            </div>

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
                        setApprovedCamPiece(null);
                        setApprovedCamPiecePreview("");
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
              <div className="space-y-2">
                <Label htmlFor="approved_cam_piece">
                  {record.approved_cam_piece_url
                    ? "Replace Approved CAM Piece"
                    : "Approved CAM Piece"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                {record.approved_cam_piece_url && !approvedCamPiece && (
                  <div className="border rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <a
                          href={record.approved_cam_piece_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Current Approved Image
                        </a>
                        <p className="text-sm text-muted-foreground">
                          An approved image is already uploaded
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <Input
                  id="approved_cam_piece"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setApprovedCamPiece(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setApprovedCamPiecePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setApprovedCamPiecePreview("");
                    }
                  }}
                />
                {approvedCamPiecePreview && (
                  <div className="mt-3 rounded-lg border border-gray-200 p-3">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      New Approved CAM Piece Preview:
                    </p>
                    <img
                      src={approvedCamPiecePreview}
                      alt="Approved CAM Piece preview"
                      className="max-h-48 rounded-md object-contain"
                    />
                  </div>
                )}
                {approvedCamPiece && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {approvedCamPiece.name} (Ready to upload)
                  </div>
                )}
              </div>
            )}

            {/* List of Reasons - Show only if No is selected */}
            {qualityCheckNo && (
              <div className="space-y-2">
                <Label htmlFor="qc_failure_reasons">
                  List of Reasons <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="qc_failure_reasons"
                  value={qcFailureReasons}
                  onChange={(e) => setQcFailureReasons(e.target.value)}
                  placeholder="Enter reasons for quality check failure..."
                  rows={4}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                CAM piece record updated successfully!
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(`/process/3d-printing-cam/detail/${record.id}`)
                }
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Update Record
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  orderIssueCreate,
  accountsDropdown,
  vouchersItemNames,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { generateOrderIssuePDF } from "@/lib/orderIssuePDF";

// Removed dropdown options - all fields are now text inputs

type OrderIssueModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onOrderIssueCreated?: () => void;
};

export default function OrderIssueModal({
  isOpen,
  onClose,
  order,
  onOrderIssueCreated,
}: OrderIssueModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedOrderIssueData, setSavedOrderIssueData] = useState<any>(null);

  // Form fields
  const [accountName, setAccountName] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [goldKarat, setGoldKarat] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [baseMetalColor, setBaseMetalColor] = useState<string>("");
  const [rhodiumInstructions, setRhodiumInstructions] = useState<string>("");
  const [prongStyle, setProngStyle] = useState<string>("");
  const [lockingSystem, setLockingSystem] = useState<string>("");
  const [finalFinish, setFinalFinish] = useState<string>("");
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [referenceImagePreview, setReferenceImagePreview] = useState<
    string | null
  >(null);

  // Load order data and pre-fill form
  useEffect(() => {
    if (!isOpen || !order) return;

    let mounted = true;

    void (async () => {
      try {
        // Load account name
        if (order.account) {
          if (typeof order.account === "object") {
            if (mounted)
              setAccountName(
                (order.account as any).account_name ||
                  (order.account as any).name ||
                  "—"
              );
          } else {
            const accounts = await accountsDropdown();
            const found = accounts?.find((a: any) => a.id === order.account);
            if (mounted && found)
              setAccountName(
                (found as any).account_name ||
                  found.name ||
                  String(order.account)
              );
          }
        }

        // Load item name
        if (order.item_name) {
          if (typeof order.item_name === "object") {
            // If item_name is an object with name property
            if (mounted) setItemName((order.item_name as any).name || "—");
          } else if (typeof order.item_name === "string") {
            // If item_name is already a string (most common case)
            if (mounted) setItemName(order.item_name);
          } else {
            // If item_name is an ID, fetch the name
            const itemsResp = await vouchersItemNames();
            const items = (itemsResp as any)?.item_names || [];
            const found = items.find((it: any) => it.id === order.item_name);
            if (mounted && found)
              setItemName((found as any).name || String(order.item_name));
          }
        }

        // Pre-fill other fields from order if available
        if (mounted) {
          // Gold karat can be in stamp, gold_karat, or goldCarat field
          setGoldKarat(
            order.stamp || order.gold_karat || order.goldCarat || ""
          );
          setSize(order.size || "");
          // Base metal color can be in base_metal, base_metal_color, or baseMetalColor field
          setBaseMetalColor(
            order.base_metal ||
              order.base_metal_color ||
              order.baseMetalColor ||
              ""
          );
        }
      } catch (err) {
        if (mounted) {
          if (typeof order.account === "string") setAccountName(order.account);
          if (typeof order.item_name === "string") setItemName(order.item_name);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOpen, order]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setReferenceImages(fileArray);

      // Create preview for first image
      const firstFile = fileArray[0];
      if (firstFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReferenceImagePreview(reader.result as string);
        };
        reader.readAsDataURL(firstFile);
      }
    }
  };

  const handleExportPDF = async () => {
    if (savedOrderIssueData) {
      try {
        await generateOrderIssuePDF(savedOrderIssueData);
        toast({
          title: "PDF Downloaded",
          description: "Order issue PDF has been downloaded successfully.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "PDF Generation Failed",
          description: "Could not generate PDF. Please try again.",
        });
      }
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    onClose();

    // Reset form
    setGoldKarat("");
    setSize("");
    setBaseMetalColor("");
    setRhodiumInstructions("");
    setProngStyle("");
    setLockingSystem("");
    setFinalFinish("");
    setReferenceImages([]);
    setAdditionalNotes("");
    setReferenceImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order || !order.id) {
      toast({ variant: "destructive", title: "Order not found" });
      return;
    }

    // Validation
    if (!goldKarat || !size || !baseMetalColor || !finalFinish) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description:
          "Please fill in all required fields: Gold Karat, Size, Base Metal Color, and Final Finish",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract IDs from account and item_name if they are objects
      const accountId =
        typeof order.account === "object" ? order.account?.id : order.account;
      const itemNameId =
        typeof order.item_name === "object"
          ? order.item_name?.id
          : order.item_name;
      const orderId = order.id;

      const payload: any = {
        order_id: orderId, // Backend expects order_id, not order
        account: accountId,
        item_name: itemNameId,
        metal: goldKarat || null,
        total_size: size || null,
        base_metal_colour: baseMetalColor || null,
        rhodium_instructions: rhodiumInstructions || null,
        prong_style: prongStyle || null,
        locking_system: lockingSystem || null,
        final_finish: finalFinish || null,
        additional_notes: additionalNotes || null,
      };

      // Remove null values to avoid sending them
      Object.keys(payload).forEach((key) => {
        if (
          payload[key] === null ||
          payload[key] === undefined ||
          payload[key] === ""
        ) {
          delete payload[key];
        }
      });

      // For now, we'll send as JSON (file upload can be added later if needed)
      await orderIssueCreate(payload);

      // Prepare data for PDF export
      const pdfData = {
        orderId: order?.bill_no || order?.voucher_number || order?.id || "—",
        accountName,
        itemName,
        goldKarat,
        size,
        baseMetalColor,
        rhodiumInstructions,
        prongStyle,
        lockingSystem,
        finalFinish,
        additionalNotes,
        referenceImage: referenceImagePreview,
        referenceImageType: referenceImages[0]?.type,
      };

      setSavedOrderIssueData(pdfData);
      setShowSuccessModal(true);

      toast({
        title: "Order issue created successfully",
        description: "The order issue has been submitted for processing.",
      });

      onOrderIssueCreated?.();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to create order issue",
        description:
          err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4">
      <Card className="w-full max-w-3xl my-8">
        <CardHeader>
          <CardTitle>Create Order Issue</CardTitle>
          <CardDescription>
            Fill in the manufacturing details for this order
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Reference Info */}
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <h4 className="font-medium text-sm mb-3">Order Reference</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-foreground">Order ID:</span>
                  <span className="ml-2 text-muted-foreground">
                    {order?.bill_no || order?.voucher_number || "—"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-foreground">Account:</span>
                  <span className="ml-2 text-muted-foreground">
                    {accountName || "—"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-foreground">Item:</span>
                  <span className="ml-2 text-muted-foreground">
                    {itemName || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Manufacturing Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Manufacturing Details</h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Gold Karat */}
                <div className="space-y-2">
                  <Label htmlFor="goldKarat">Gold Karat *</Label>
                  <Input
                    id="goldKarat"
                    placeholder="e.g., 22K, 18K, 14K"
                    value={goldKarat}
                    onChange={(e) => setGoldKarat(e.target.value)}
                    required
                  />
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label htmlFor="size">Size/Dimensions *</Label>
                  <Input
                    id="size"
                    placeholder="e.g., 7.5, 18 inches"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    required
                  />
                </div>

                {/* Base Metal Color */}
                <div className="space-y-2">
                  <Label htmlFor="baseMetalColor">Base Metal Color *</Label>
                  <Input
                    id="baseMetalColor"
                    placeholder="e.g., Yellow Gold, White Gold"
                    value={baseMetalColor}
                    onChange={(e) => setBaseMetalColor(e.target.value)}
                    required
                  />
                </div>

                {/* Final Finish */}
                <div className="space-y-2">
                  <Label htmlFor="finalFinish">Final Finish *</Label>
                  <Input
                    id="finalFinish"
                    placeholder="e.g., High Polish, Matte, Brushed"
                    value={finalFinish}
                    onChange={(e) => setFinalFinish(e.target.value)}
                    required
                  />
                </div>

                {/* Prong Style */}
                <div className="space-y-2">
                  <Label htmlFor="prongStyle">Prong Style</Label>
                  <Input
                    id="prongStyle"
                    placeholder="e.g., 4-Prong, 6-Prong, Bezel"
                    value={prongStyle}
                    onChange={(e) => setProngStyle(e.target.value)}
                    required
                  />
                </div>

                {/* Locking System */}
                <div className="space-y-2">
                  <Label htmlFor="lockingSystem">Locking System </Label>
                  <Input
                    id="lockingSystem"
                    placeholder="e.g., Box clasp, Lobster clasp"
                    value={lockingSystem}
                    onChange={(e) => setLockingSystem(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Rhodium Instructions */}
              <div className="space-y-2">
                <Label htmlFor="rhodiumInstructions">
                  Rhodium Instructions
                </Label>
                <Textarea
                  id="rhodiumInstructions"
                  placeholder="Enter rhodium plating instructions..."
                  value={rhodiumInstructions}
                  onChange={(e) => setRhodiumInstructions(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Reference Images */}
              <div className="space-y-2">
                <Label htmlFor="referenceImages">Reference Images</Label>
                <Input
                  id="referenceImages"
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {referenceImages.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {referenceImages.length} file(s) selected
                  </p>
                )}
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any additional manufacturing instructions or notes..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isSubmitting ? "Creating..." : "Create Order Issue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal with PDF Export Option */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-green-700">
                ✓ Order Issue Created Successfully
              </CardTitle>
              <CardDescription>
                The order issue has been submitted. Would you like to export it
                as PDF?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <h4 className="font-medium text-sm mb-3">
                  Order Issue Details
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">
                      Order ID:
                    </span>
                    <span>{savedOrderIssueData?.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Item:</span>
                    <span>{savedOrderIssueData?.itemName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">
                      Gold Karat:
                    </span>
                    <span>{savedOrderIssueData?.goldKarat}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleExportPDF}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  🖨️ Export as PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseSuccess}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

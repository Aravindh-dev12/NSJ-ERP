"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface CreateInvoiceButtonProps {
  estimateId?: string;
  salesQueryId?: string;
  saleId?: string;
  itemName?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}

export function CreateInvoiceButton({
  estimateId,
  salesQueryId,
  saleId,
  itemName,
  variant = "default",
  size = "default",
}: CreateInvoiceButtonProps) {
  console.log("CreateInvoiceButton rendered with:", {
    estimateId,
    salesQueryId,
    saleId,
    itemName,
  });
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    notes: "",
    terms_and_conditions:
      "Payment due within 30 days. Late payments may incur additional charges.",
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload: any = {
        invoice_date: formData.invoice_date,
      };

      if (formData.due_date) {
        payload.due_date = formData.due_date;
      }
      if (formData.notes) {
        payload.notes = formData.notes;
      }
      if (formData.terms_and_conditions) {
        payload.terms_and_conditions = formData.terms_and_conditions;
      }

      // Determine which endpoint to use
      let endpoint = "";
      if (saleId) {
        // Create from sale (old flow)
        endpoint = "/vouchers/invoices/from-sale/";
        payload.sale_id = saleId;
      } else if (estimateId) {
        // Create from estimate (new simplified flow)
        endpoint = "/vouchers/invoices/from-estimate/";
        payload.estimate_id = estimateId;
        if (salesQueryId) {
          payload.sales_query_id = salesQueryId;
        }
      } else {
        alert("Either estimate ID or sale ID is required");
        return;
      }

      const response = await api.post<{ id: string; invoice_number?: string }>(
        endpoint,
        payload
      );

      setOpen(false);

      // Show success message
      alert(
        `Invoice created successfully! Invoice Number: ${response.invoice_number || "N/A"}`
      );

      // Refresh the page to show updated data
      router.refresh();
    } catch (error: any) {
      console.error("Failed to create invoice:", error);

      // Show user-friendly error message
      let errorMessage = "Failed to create invoice. ";
      if (error?.data?.errors) {
        const errors = error.data.errors;
        if (errors.estimate_id) {
          errorMessage += errors.estimate_id[0];
        } else if (errors.sale_id) {
          errorMessage += errors.sale_id[0];
        } else {
          errorMessage += JSON.stringify(errors);
        }
      } else if (error?.message) {
        errorMessage += error.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <FileText className="h-4 w-4 mr-2" />
        Create Invoice
      </Button>

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
              {itemName && (
                <p className="text-sm text-gray-600 mt-2">
                  Creating invoice for: {itemName}
                </p>
              )}
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Due Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    min={formData.invoice_date}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes (Optional)
                </label>
                <Textarea
                  placeholder="Additional notes for this invoice..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Terms and Conditions
                </label>
                <Textarea
                  placeholder="Payment terms and conditions..."
                  value={formData.terms_and_conditions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      terms_and_conditions: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The invoice will automatically pull all
                  data from the estimate including line items, customer details,
                  and totals.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

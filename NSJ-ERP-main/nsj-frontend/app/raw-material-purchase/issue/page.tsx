"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RawMaterialNav } from "@/components/raw-material/RawMaterialNav";
import {
  rawMaterialInventoryList,
  rawMaterialIssuanceCreate,
  ordersDropdown,
} from "@/lib/backend";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

export default function RawMaterialIssuePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Form state
  const [form, setForm] = useState({
    inventoryId: "",
    jobId: "",
    jobNo: "",
    issuedCarat: "",
    date: new Date().toISOString().split("T")[0],
    purpose: "",
    remarks: "",
  });

  // Selected inventory item details
  const [selectedInventory, setSelectedInventory] = useState<any>(null);

  // Load data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [inventoryResp, ordersResp] = await Promise.all([
          rawMaterialInventoryList({ show_all: "false" }),
          ordersDropdown(),
        ]);
        if (!mounted) return;
        setInventory(inventoryResp.results ?? []);
        setOrders(ordersResp?.orders ?? []);
      } catch (err) {
        toast({ variant: "destructive", title: "Could not load data" });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [toast]);

  // Update selected inventory when selection changes
  useEffect(() => {
    if (form.inventoryId) {
      const inv = inventory.find((i) => i.id === form.inventoryId);
      setSelectedInventory(inv || null);
    } else {
      setSelectedInventory(null);
    }
  }, [form.inventoryId, inventory]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validation
    if (!form.inventoryId) {
      toast({ variant: "destructive", title: "Please select inventory item" });
      setSubmitting(false);
      return;
    }
    if (!form.issuedCarat || parseFloat(form.issuedCarat) <= 0) {
      toast({
        variant: "destructive",
        title: "Please enter valid carat to issue",
      });
      setSubmitting(false);
      return;
    }
    if (!form.jobNo && !form.jobId) {
      toast({
        variant: "destructive",
        title: "Please enter Job ID or select an order",
      });
      setSubmitting(false);
      return;
    }

    // Check stock availability
    const issueCarat = parseFloat(form.issuedCarat);
    if (
      selectedInventory &&
      issueCarat > parseFloat(selectedInventory.available_carat)
    ) {
      toast({
        variant: "destructive",
        title: "Insufficient Stock",
        description: `Only ${selectedInventory.available_carat} ct available. Cannot issue ${issueCarat} ct.`,
      });
      setSubmitting(false);
      return;
    }

    const payload = {
      inventory_id: form.inventoryId,
      job_id: form.jobId || null,
      job_no: form.jobNo || null,
      issued_carat: parseFloat(form.issuedCarat),
      date: form.date,
      purpose: form.purpose || null,
      remarks: form.remarks || null,
    };

    try {
      await rawMaterialIssuanceCreate(payload);
      toast({
        title: "Issued",
        description: "Raw material issued successfully.",
      });
      router.push("/raw-material-purchase/inventory");
      router.refresh();
    } catch (err: unknown) {
      let message = "Could not issue material";
      if (err instanceof ApiError) {
        message = err.message || message;
      } else if (err && typeof err === "object" && (err as any).message) {
        message = (err as any).message;
      }
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Issue Raw Material
          </h1>
          <p className="text-muted-foreground">
            Issue material from inventory to a job.
          </p>
        </div>
        <RawMaterialNav />
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-800">Important Rules</p>
          <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
            <li>
              You can only issue materials that have been purchased
              (Purchase-First Rule)
            </li>
            <li>
              System prevents issuing more than available stock (No Negative
              Stock)
            </li>
            <li>All issuances must be linked to a Job ID for traceability</li>
          </ul>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Issue Material Form</CardTitle>
          <CardDescription>
            Select inventory item and specify quantity to issue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Select Inventory Item */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Select Material
              </h2>
              <div className="space-y-2">
                <Label htmlFor="inventory">Available Inventory *</Label>
                <select
                  id="inventory"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.inventoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, inventoryId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select material from inventory</option>
                  {inventory.map((inv: any) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.purchase_details?.dia_id || inv.id} -{" "}
                      {inv.available_carat} ct available
                      {inv.purchase_details?.shape &&
                        ` (${inv.purchase_details.shape})`}
                      {inv.purchase_details?.colour &&
                        ` ${inv.purchase_details.colour}`}
                      {inv.purchase_details?.clarity &&
                        ` ${inv.purchase_details.clarity}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Item Details */}
              {selectedInventory && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="font-medium">Selected Material Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">DIA. ID:</span>
                      <p className="font-mono">
                        {selectedInventory.purchase_details?.dia_id}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Original:</span>
                      <p>{selectedInventory.original_carat} ct</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Available:</span>
                      <p className="text-green-600 font-medium">
                        {selectedInventory.available_carat} ct
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Already Issued:
                      </span>
                      <p>{selectedInventory.issued_carat} ct</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Issue Details */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Issue Details
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issuedCarat">Carat to Issue *</Label>
                  <Input
                    id="issuedCarat"
                    type="number"
                    step="0.001"
                    min="0"
                    max={selectedInventory?.available_carat || undefined}
                    placeholder="0.000"
                    value={form.issuedCarat}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, issuedCarat: e.target.value }))
                    }
                    required
                  />
                  {selectedInventory && (
                    <p className="text-xs text-muted-foreground">
                      Max: {selectedInventory.available_carat} ct
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Issue Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
            </section>

            {/* Job Linking */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Job Linking (Required)
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jobId">Select Order</Label>
                  <select
                    id="jobId"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={form.jobId}
                    onChange={(e) => {
                      const order = orders.find(
                        (o: any) => o.id === e.target.value
                      );
                      setForm((f) => ({
                        ...f,
                        jobId: e.target.value,
                        jobNo: order?.job_no || order?.bill_no || "",
                      }));
                    }}
                  >
                    <option value="">Select order (optional)</option>
                    {orders.map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.job_no || o.bill_no || o.id} - {o.item_name || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobNo">Job No. *</Label>
                  <Input
                    id="jobNo"
                    placeholder="Enter job number"
                    value={form.jobNo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, jobNo: e.target.value }))
                    }
                    required={!form.jobId}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-filled from order or enter manually
                  </p>
                </div>
              </div>
            </section>

            {/* Additional Info */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Additional Information
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    placeholder="e.g., Ring setting, Pendant"
                    value={form.purpose}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, purpose: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input
                    id="remarks"
                    placeholder="Any additional notes"
                    value={form.remarks}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, remarks: e.target.value }))
                    }
                  />
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || loading || !selectedInventory}
              >
                {submitting ? "Issuing..." : "Issue Material"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

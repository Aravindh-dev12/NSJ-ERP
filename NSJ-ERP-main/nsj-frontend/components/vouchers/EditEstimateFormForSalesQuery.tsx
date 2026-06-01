"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  estimateDetail,
  estimateUpdate,
  accountsDropdown,
} from "@/lib/backend";
import { Trash2, Plus, ArrowLeft, Save } from "lucide-react";

interface LineItem {
  id: string;
  particulars: string;
  shape: string;
  colour: string;
  clarity: string;
  pc: number | null;
  weight: number | null;
  unit: string;
  rate: number | null;
  amount: number;
  order: number;
  is_compulsory?: boolean;
  raw_material?: string;
}

interface EditEstimateFormProps {
  estimateId: string;
  salesQueryId?: string;
}

export function EditEstimateFormForSalesQuery({
  estimateId,
  salesQueryId,
}: EditEstimateFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [itemName, setItemName] = useState("");
  const [date, setDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Accounts dropdown
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);

  // Load accounts
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data = await accountsDropdown();
        setAccounts(data);
      } catch (err) {
        console.error("Failed to load accounts:", err);
      }
    };
    loadAccounts();
  }, []);

  // Load estimate data
  useEffect(() => {
    const loadEstimate = async () => {
      setLoading(true);
      try {
        const data = await estimateDetail(estimateId);

        setAccountId(data.account?.id || "");
        setItemName(data.item_name || "");
        setDate(data.date || "");

        // Map line items
        if (data.line_items && data.line_items.length > 0) {
          const mappedItems = data.line_items.map((item: any) => ({
            id: item.id || `item-${Date.now()}-${Math.random()}`,
            particulars: item.particulars || "",
            shape: item.shape || "",
            colour: item.colour || "",
            clarity: item.clarity || "",
            pc: item.pc,
            weight: item.weight,
            unit: item.unit || "",
            rate: item.rate,
            amount: item.amount || 0,
            order: item.order || 0,
            is_compulsory: item.is_compulsory || false,
            raw_material: item.raw_material || "",
          }));
          setLineItems(mappedItems);
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load estimate data.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (estimateId) {
      loadEstimate();
    }
  }, [estimateId, toast]);

  // Calculate totals
  const totalTaxableValue = lineItems.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const gstAmount = Number((totalTaxableValue * 0.03).toFixed(2));
  const grandTotal = Number((totalTaxableValue + gstAmount).toFixed(2));

  // Update line item
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Auto-calculate amount when weight or rate changes
        if (field === "weight" || field === "rate") {
          const weight = field === "weight" ? value : item.weight;
          const rate = field === "rate" ? value : item.rate;

          if (weight && rate && Number(weight) > 0 && Number(rate) > 0) {
            updated.amount = Number((Number(weight) * Number(rate)).toFixed(2));
          }
        }

        return updated;
      })
    );
  };

  // Add line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      particulars: "",
      shape: "",
      colour: "",
      clarity: "",
      pc: null,
      weight: null,
      unit: "",
      rate: null,
      amount: 0,
      order: lineItems.length,
      is_compulsory: false,
      raw_material: "",
    };
    setLineItems([...lineItems, newItem]);
  };

  // Remove line item
  const removeLineItem = (id: string) => {
    const item = lineItems.find((i) => i.id === id);
    if (item?.is_compulsory) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description: "Compulsory line items cannot be removed.",
      });
      return;
    }
    setLineItems((items) => items.filter((i) => i.id !== id));
  };

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!itemName || !date) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields (Item Name and Date).",
      });
      return;
    }

    if (lineItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No line items",
        description: "Please add at least one line item.",
      });
      return;
    }

    // Line item validation
    for (const item of lineItems) {
      if (!item.particulars.trim()) {
        toast({
          variant: "destructive",
          title: "Invalid line item",
          description: "Particulars are required for all line items.",
        });
        return;
      }
      if (item.amount <= 0 && !item.is_compulsory) {
        // Allow 0 for compulsory if not yet filled
        toast({
          variant: "destructive",
          title: "Invalid amount",
          description: `Amount must be greater than zero for ${item.particulars}.`,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        account_id: accountId || null,
        item_name: itemName,
        date: date,
        line_items: lineItems.map((item, index) => {
          let inferredRawMaterial = item.raw_material;
          if (!inferredRawMaterial) {
            const p = item.particulars.toLowerCase();
            if (p.includes("gold")) inferredRawMaterial = "Gold";
            else if (p.includes("diamond")) inferredRawMaterial = "Diamond";
            else if (p.includes("gemstone") || p.includes("stone"))
              inferredRawMaterial = "Gemstone";
            else if (p.includes("craftsmanship") || p.includes("making"))
              inferredRawMaterial = "Craftsmanship";
            else inferredRawMaterial = item.particulars;
          }

          return {
            particulars: item.particulars,
            shape: item.shape || "",
            colour: item.colour || "",
            clarity: item.clarity || "",
            pc: item.pc,
            weight: item.weight,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
            order: index,
            is_compulsory: item.is_compulsory || false,
            raw_material: inferredRawMaterial,
          };
        }),
        total_taxable_value: totalTaxableValue,
        gst_amount: gstAmount,
        grand_total: grandTotal,
      };

      await estimateUpdate(estimateId, payload);

      toast({
        title: "Estimate updated",
        description: "Changes have been saved successfully.",
      });

      if (salesQueryId) {
        router.push(`/vouchers/sales-leads/${salesQueryId}`);
      } else {
        router.back();
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description:
          err instanceof Error ? err.message : "Failed to save estimate.",
      });
    } finally {
      setIsSubmitting(false); // Using setIsSubmitting instead of setSaving for consistency? Wait, current state uses saving.
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E68A00] border-t-transparent" />
        <p className="text-muted-foreground font-medium">
          Loading estimate details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="rounded-full h-10 w-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Estimate</h1>
            <p className="text-sm text-muted-foreground">
              Manage and revise your sales lead estimate
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
            className="hidden md:flex border-amber-200 text-amber-900 hover:bg-amber-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#E68A00] hover:bg-[#B36B00] text-white shadow-md transition-all active:scale-95 min-w-[140px] font-bold"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Estimate
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Estimate Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="account" className="text-sm font-semibold">
                  Customer Account (Optional)
                </Label>
                <select
                  id="account"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemName" className="text-sm font-semibold">
                  Item Name *
                </Label>
                <Input
                  id="itemName"
                  className="h-11 focus:ring-amber-500/20 focus:border-amber-500"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold">
                  Estimate Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  className="h-11 focus:ring-amber-500/20 focus:border-amber-500"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-lg">Line Items</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Edit breakdown and pricing details
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addLineItem}
              className="border-[#E68A00] text-[#E68A00] hover:bg-amber-50 h-9 font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                    <th className="px-3 py-3 text-left w-[20%]">Particulars</th>
                    <th className="px-2 py-3 text-left">Shape</th>
                    <th className="px-2 py-3 text-left">Colour</th>
                    <th className="px-2 py-3 text-left">Clarity</th>
                    <th className="px-2 py-3 text-right">PC</th>
                    <th className="px-2 py-3 text-right">Weight</th>
                    <th className="px-2 py-3 text-center w-16">Unit</th>
                    <th className="px-2 py-3 text-right w-24">Rate</th>
                    <th className="px-2 py-3 text-right w-28">Amount</th>
                    <th className="px-2 py-3 text-center w-14">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-muted/10 transition-colors ${item.is_compulsory ? "bg-amber-50/10" : ""}`}
                    >
                      <td className="px-3 py-3">
                        {item.is_compulsory ? (
                          <div className="h-9 flex items-center px-3 font-semibold text-foreground/80 bg-muted/30 rounded border border-dashed border-muted-foreground/20">
                            {item.particulars}
                          </div>
                        ) : (
                          <Input
                            value={item.particulars}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                "particulars",
                                e.target.value
                              )
                            }
                            placeholder="Particulars"
                            className="h-9 border-muted-foreground/20 focus:ring-amber-500/10"
                          />
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          value={item.shape}
                          onChange={(e) =>
                            updateLineItem(item.id, "shape", e.target.value)
                          }
                          placeholder="Shape"
                          className="h-9 border-muted-foreground/20"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          value={item.colour}
                          onChange={(e) =>
                            updateLineItem(item.id, "colour", e.target.value)
                          }
                          placeholder="Color"
                          className="h-9 border-muted-foreground/20"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          value={item.clarity}
                          onChange={(e) =>
                            updateLineItem(item.id, "clarity", e.target.value)
                          }
                          placeholder="Clarity"
                          className="h-9 border-muted-foreground/20"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          type="number"
                          step="1"
                          value={item.pc || ""}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "pc",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          placeholder="PC"
                          className="h-9 text-right border-muted-foreground/20"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.weight || ""}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "weight",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          placeholder="Weight"
                          className="h-9 text-right border-muted-foreground/20"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          value={item.unit}
                          onChange={(e) =>
                            updateLineItem(item.id, "unit", e.target.value)
                          }
                          placeholder="Unit"
                          className="h-9 text-center border-muted-foreground/20"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          type="number"
                          step="1"
                          value={item.rate || ""}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "rate",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          placeholder="Rate"
                          className="h-9 text-right border-muted-foreground/20 font-medium"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="h-9 flex items-center justify-end px-3 font-bold text-[#E68A00] bg-amber-50/30 rounded border border-amber-100/50">
                          {item.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        {item.is_compulsory ? (
                          <span className="text-[11px] text-amber-600 font-bold italic">
                            Required
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {lineItems.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                <p className="text-sm font-medium">No items added</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={addLineItem}
                  className="mt-1 text-[#E68A00] font-bold"
                >
                  Click to add line item
                </Button>
              </div>
            )}

            <div className="p-6 bg-muted/20 border-t flex flex-col md:flex-row md:justify-end gap-4">
              <div className="grid gap-3 min-w-[300px]">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    Taxable Value:
                  </span>
                  <span className="font-bold tracking-tight">
                    ₹{totalTaxableValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pb-2">
                  <span className="text-muted-foreground font-medium">
                    GST (3%):
                  </span>
                  <span className="font-bold tracking-tight">
                    ₹{gstAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-muted-foreground/40 pt-3">
                  <span className="text-base font-black uppercase tracking-tight">
                    Grand Total:
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#E68A00]">
                      ₹{grandTotal.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-muted-foreground uppercase font-black mt-0.5 tracking-wider">
                      Estimated Total
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2 mb-10">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#E68A00] hover:bg-[#B36B00] text-white shadow-xl h-14 px-10 font-black text-lg transition-all active:scale-95 uppercase tracking-wide border-2 border-white/20"
          >
            {saving ? "Updating..." : "Save Estimate Details"}
          </Button>
        </div>
      </div>
    </div>
  );
}

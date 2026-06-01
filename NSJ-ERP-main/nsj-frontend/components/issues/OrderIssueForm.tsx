"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  accountsDropdown,
  vouchersItemNames,
  vouchersMasters,
  orderIssueCreate,
  orderIssueDetail,
  orderIssueUpdate,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";

export default function OrderIssueForm({ id }: { id?: string }) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<{ id: string; name?: string }[]>([]);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);

  const [accountId, setAccountId] = useState<string>("");
  const [itemId, setItemId] = useState<string>("");
  const [metal, setMetal] = useState<string>("");
  const [baseMetalColour, setBaseMetalColour] = useState<string>("");
  const [totalSize, setTotalSize] = useState<string>("");
  const [rhodiumInstructions, setRhodiumInstructions] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [acc, itemsResp] = await Promise.all([
          accountsDropdown(),
          vouchersItemNames(),
        ]);
        if (!mounted) return;
        setAccounts(acc ?? []);
        setItems((itemsResp && (itemsResp as any).item_names) || []);
      } catch (err) {
        if (!mounted) return;
        toast({ variant: "destructive", title: "Failed to load masters" });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    void (async () => {
      try {
        const data = await orderIssueDetail(id);
        if (!mounted) return;
        setAccountId(
          (data.account && (data.account as any).id) ||
            (typeof data.account === "string" ? (data.account as string) : "")
        );
        setItemId((data.item_name && (data.item_name as any).id) || "");
        setMetal(data.metal ?? "");
        setBaseMetalColour(data.base_metal_colour ?? "");
        setTotalSize(data.total_size ?? "");
        setRhodiumInstructions(data.rhodium_instructions ?? "");
        setDeliveryDate(data.delivery_date ?? "");
      } catch (err) {
        toast({ variant: "destructive", title: "Failed to load record" });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, toast]);

  const handleSave = async () => {
    if (accountId === "")
      return toast({
        variant: "destructive",
        title: "Please select an account",
      });
    if (itemId === "")
      return toast({ variant: "destructive", title: "Please select an item" });

    const payload: any = {
      account: accountId,
      item_name: itemId,
      metal: metal || null,
      base_metal_colour: baseMetalColour || null,
      total_size: totalSize || null,
      rhodium_instructions: rhodiumInstructions || null,
      delivery_date: deliveryDate || null,
    };

    try {
      if (id) {
        await orderIssueUpdate(id, payload);
        toast({ title: "Updated", description: "Order issue updated" });
      } else {
        await orderIssueCreate(payload);
        toast({ title: "Saved", description: "Order issue created" });
        setItemId("");
        setMetal("");
        setBaseMetalColour("");
        setTotalSize("");
        setRhodiumInstructions("");
        setDeliveryDate("");
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Save failed" });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Account</Label>
          <select
            className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {(a as any).account_name || (a as any).name || a.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Item Name</Label>
          <select
            className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            <option value="">Select item</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Metal</Label>
          <Input
            value={metal}
            onChange={(e) => setMetal(e.target.value)}
            placeholder="e.g., 18K Gold"
          />
        </div>

        <div>
          <Label>Base Metal Colour</Label>
          <Input
            value={baseMetalColour}
            onChange={(e) => setBaseMetalColour(e.target.value)}
            placeholder="e.g., Yellow"
          />
        </div>

        <div>
          <Label>Total Size</Label>
          <Input
            value={totalSize}
            onChange={(e) => setTotalSize(e.target.value)}
            placeholder="e.g., 3 inch with loop"
          />
        </div>

        <div>
          <Label>Rhodium Instructions</Label>
          <Input
            value={rhodiumInstructions}
            onChange={(e) => setRhodiumInstructions(e.target.value)}
            placeholder="e.g., Yellow"
          />
        </div>

        <div>
          <Label htmlFor="delivery-date">Delivery Date</Label>
          <Input
            id="delivery-date"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="reference_image">Reference Image</Label>
          <input
            id="reference_image"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => {
              const f = e.target.files && e.target.files[0];
              if (!f) return;
              const allowed = [
                "image/jpeg",
                "image/png",
                "application/pdf",
                "image/jpg",
              ];
              if (!allowed.includes(f.type)) {
                toast({
                  variant: "destructive",
                  title: "Invalid file type",
                  description: "Please select JPG/PNG/PDF",
                });
                return;
              }
              setFile(f);
            }}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Upload a reference image for the order issue (optional)
          </p>
          {previewUrl && (
            <div className="mt-2">
              <img
                src={previewUrl}
                alt="preview"
                className="max-w-xs rounded-lg border"
              />
            </div>
          )}
          {isPdf && file && (
            <div className="mt-2">
              <a
                href={URL.createObjectURL(file)}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                📄 PDF uploaded — click to view
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <Button onClick={handleSave}>{id ? "Update" : "Save"}</Button>
      </div>
    </div>
  );
}

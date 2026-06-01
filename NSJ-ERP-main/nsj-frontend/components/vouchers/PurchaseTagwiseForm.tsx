"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  accountsDropdown,
  vouchersItemNames,
  vouchersMasters,
  vouchersUnits,
  purchaseTagwiseCreate,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/export";

export default function PurchaseTagwiseForm() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<{ id: string; name?: string }[]>([]);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [stamps, setStamps] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);

  const [accountId, setAccountId] = useState<string>("");
  const [itemId, setItemId] = useState<string>("");
  const [orderNo, setOrderNo] = useState("");
  const [stampId, setStampId] = useState<string>("");
  const [remark, setRemark] = useState("");
  const [design, setDesign] = useState("");
  const [unitId, setUnitId] = useState<string>("");
  const [piece, setPiece] = useState<string>("");
  const [grossWt, setGrossWt] = useState<string>("");
  const [netWt, setNetWt] = useState<string>("");
  const [tunch, setTunch] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [supplier, setSupplier] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [acc, itemsResp, mastersResp, unitsResp] = await Promise.all([
          accountsDropdown(),
          vouchersItemNames(),
          vouchersMasters(),
          vouchersUnits(),
        ]);
        if (!mounted) return;
        setAccounts(acc ?? []);
        setItems((itemsResp && (itemsResp as any).item_names) || []);
        setStamps(mastersResp?.stamps ?? []);
        setUnits(unitsResp?.units ?? mastersResp?.units ?? []);
      } catch (err) {
        if (!mounted) return;
        toast({ variant: "destructive", title: "Failed to load masters" });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const validateNumber = (v: string) => {
    if (v === "") return true;
    return /^\d+(\.\d+)?$/.test(v);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProofImage(file);

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProofImagePreview(null);
    }
  };

  const clearFile = () => {
    setProofImage(null);
    setProofImagePreview(null);
  };

  const handleSave = async () => {
    if (!accountId)
      return toast({
        variant: "destructive",
        title: "Please select an account",
      });
    if (!itemId)
      return toast({ variant: "destructive", title: "Please select an item" });
    if (piece && !/^\d+$/.test(piece))
      return toast({ variant: "destructive", title: "Piece must be numeric" });
    if (!validateNumber(grossWt))
      return toast({ variant: "destructive", title: "Gr. Wt must be numeric" });
    if (!validateNumber(netWt))
      return toast({ variant: "destructive", title: "Net Wt must be numeric" });
    if (!validateNumber(tunch))
      return toast({ variant: "destructive", title: "Tunch must be numeric" });
    if (!validateNumber(rate))
      return toast({ variant: "destructive", title: "Rate must be numeric" });

    const formData = new FormData();
    formData.append("account", accountId);
    formData.append("item_name", itemId);
    if (orderNo) formData.append("order_no", orderNo);
    if (stampId) formData.append("stamp", stampId);
    if (remark) formData.append("remark", remark);
    if (design) formData.append("design", design);
    if (unitId) formData.append("unit", unitId);
    if (piece) formData.append("piece", piece);
    if (grossWt) formData.append("gr_wt", grossWt);
    if (netWt) formData.append("net_wt", netWt);
    if (tunch) formData.append("tunch", tunch);
    if (rate) formData.append("rate", rate);
    if (supplier) formData.append("supplier_name", supplier);
    if (proofImage) formData.append("proof_image", proofImage);

    try {
      await purchaseTagwiseCreate(formData);
      toast({ title: "Saved", description: "Purchase Tagwise M saved" });
      setOrderNo("");
      setRemark("");
      setDesign("");
      setPiece("");
      setGrossWt("");
      setNetWt("");
      setTunch("");
      setRate("");
      setSupplier("");
      clearFile();
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
          <Label>Order No</Label>
          <Input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
        </div>

        <div>
          <Label>Stamp</Label>
          <select
            className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
            value={stampId}
            onChange={(e) => setStampId(e.target.value)}
          >
            <option value="">Select stamp</option>
            {stamps.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Remark</Label>
          <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
        </div>

        <div>
          <Label>Design</Label>
          <Input value={design} onChange={(e) => setDesign(e.target.value)} />
        </div>

        <div>
          <Label>Unit</Label>
          <select
            className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
          >
            <option value="">Select unit</option>
            {units.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Piece</Label>
          <Input value={piece} onChange={(e) => setPiece(e.target.value)} />
        </div>

        <div>
          <Label>Gr. Wt</Label>
          <Input value={grossWt} onChange={(e) => setGrossWt(e.target.value)} />
        </div>

        <div>
          <Label>Net Wt</Label>
          <Input value={netWt} onChange={(e) => setNetWt(e.target.value)} />
        </div>

        <div>
          <Label>Tunch</Label>
          <Input value={tunch} onChange={(e) => setTunch(e.target.value)} />
        </div>

        <div>
          <Label>Rate</Label>
          <Input value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>

        <div>
          <Label>Supplier</Label>
          <Input
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <Label>Proof of Purchase (Image)</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1"
          />
          {proofImagePreview && (
            <div className="mt-2 relative">
              <img
                src={proofImagePreview}
                alt="Proof preview"
                className="max-w-xs rounded border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={clearFile}
                className="mt-2"
              >
                Remove Image
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <Button onClick={handleSave}>Save</Button>

        <Button
          onClick={() => {
            const headers = [
              "Account",
              "Item Name",
              "Order No",
              "Stamp",
              "Remark",
              "Design",
              "Unit",
              "Piece",
              "Gr. Wt",
              "Net Wt",
              "Tunch",
              "Rate",
              "Supplier",
            ];
            const account =
              accounts.find((a) => a.id === accountId)?.name ?? "";
            const item = items.find((it) => it.id === itemId)?.name ?? "";
            const stamp = stamps.find((s) => s.id === stampId)?.name ?? "";
            const dataRow = [
              account,
              item || null,
              orderNo || null,
              stamp || null,
              remark || null,
              design || null,
              unitId || null,
              piece || null,
              grossWt || null,
              netWt || null,
              tunch || null,
              rate || null,
              supplier || null,
            ];
            const res = exportToExcel({
              formName: "Purchase Tagwise M",
              headers,
              dataRow,
              includeFooterTimestamp: true,
            });
            if (res.ok) {
              toast({ title: "Form data successfully exported to Excel." });
            } else {
              toast({ variant: "destructive", title: "Export failed" });
            }
          }}
        >
          Export Data
        </Button>
      </div>
    </div>
  );
}

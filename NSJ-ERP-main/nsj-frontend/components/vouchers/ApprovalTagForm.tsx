"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  vouchersItemNames,
  vouchersMasters,
  vouchersUnits,
  approvalTagCreate,
  accountsDropdown,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/export";

export default function ApprovalTagForm() {
  const { toast } = useToast();
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [stamps, setStamps] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);

  const [itemId, setItemId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState("");
  const [stampId, setStampId] = useState<string>("");
  const [remark, setRemark] = useState("");
  const [design, setDesign] = useState("");
  const [unitId, setUnitId] = useState<string>("");
  const [piece, setPiece] = useState<string>("");
  const [grossWt, setGrossWt] = useState<string>("");
  const [netWt, setNetWt] = useState<string>("");
  const [tunch, setTunch] = useState<string>("");
  const [rate, setRate] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [accs, itemsResp, mastersResp, unitsResp] = await Promise.all([
          accountsDropdown(),
          vouchersItemNames(),
          vouchersMasters(),
          vouchersUnits(),
        ]);
        if (!mounted) return;
        setAccounts(accs ?? []);
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

  const handleSave = async () => {
    if (!itemId)
      return toast({ variant: "destructive", title: "Please select an item" });
    if (piece && !/^\d+$/.test(piece))
      return toast({ variant: "destructive", title: "Piece must be numeric" });
    if (!validateNumber(grossWt))
      return toast({
        variant: "destructive",
        title: "Gross Wt must be numeric",
      });
    if (!validateNumber(netWt))
      return toast({ variant: "destructive", title: "Net Wt must be numeric" });
    if (tunch && !validateNumber(tunch))
      return toast({ variant: "destructive", title: "Tunch must be numeric" });
    if (rate && !validateNumber(rate))
      return toast({ variant: "destructive", title: "Rate must be numeric" });

    const payload: any = {
      account: accountId || null,
      item_name: itemId,
      order_number: orderNumber || null,
      stamp: stampId || null,
      remark: remark || null,
      design: design || null,
      unit: unitId || null,
      piece: piece ? parseInt(piece, 10) : null,
      gross_wt: grossWt ? parseFloat(grossWt) : null,
      net_wt: netWt ? parseFloat(netWt) : null,
      tunch: tunch ? parseFloat(tunch) : null,
      rate: rate ? parseFloat(rate) : null,
    };

    try {
      await approvalTagCreate(payload);
      toast({ title: "Saved", description: "Approval Tag M saved" });
      setOrderNumber("");
      setRemark("");
      setDesign("");
      setPiece("");
      setGrossWt("");
      setNetWt("");
      setTunch("");
      setRate("");
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
                {a.name}
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
          <Label>Order Number</Label>
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
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
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <Button onClick={handleSave}>Save</Button>

        <Button
          onClick={() => {
            const headers = [
              "Account",
              "Item Name",
              "Order Number",
              "Stamp",
              "Remark",
              "Design",
              "Unit",
              "Piece",
              "Gross Wt",
              "Net Wt",
              "Tunch",
              "Rate",
            ];
            const account =
              accounts.find((a) => a.id === accountId)?.name ?? "";
            const item = items.find((it) => it.id === itemId)?.name ?? "";
            const unit = units.find((u) => u.id === unitId)?.name ?? "";
            const dataRow = [
              account,
              item,
              orderNumber || null,
              stampId || null,
              remark || null,
              design || null,
              unit || null,
              piece || null,
              grossWt || null,
              netWt || null,
              tunch || null,
              rate || null,
            ];
            const res = exportToExcel({
              formName: "Approval Tag",
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

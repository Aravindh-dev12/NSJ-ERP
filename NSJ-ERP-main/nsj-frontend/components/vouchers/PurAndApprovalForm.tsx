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
  vouchersShapes,
  purAndApprovalCreate,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/export";

export default function PurAndApprovalForm() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<{ id: string; name?: string }[]>([]);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [stamps, setStamps] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [shapes, setShapes] = useState<{ id: string; name: string }[]>([]);

  const [accountId, setAccountId] = useState<string>("");
  const [tagNo, setTagNo] = useState("");
  const [itemId, setItemId] = useState<string>("");
  const [orderNo, setOrderNo] = useState("");
  const [remark, setRemark] = useState("");
  const [unitId, setUnitId] = useState<string>("");
  const [piece, setPiece] = useState<string>("");
  const [shapeId, setShapeId] = useState<string>("");
  const [grossWt, setGrossWt] = useState<string>("");
  const [netWt, setNetWt] = useState<string>("");
  const [divide, setDivide] = useState<string>("");
  const [tunch, setTunch] = useState<string>("");
  const [wstg, setWstg] = useState<string>("");
  const [rate, setRate] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [acc, itemsResp, mastersResp, unitsResp, shapesResp] =
          await Promise.all([
            accountsDropdown(),
            vouchersItemNames(),
            vouchersMasters(),
            vouchersUnits(),
            vouchersShapes(),
          ]);
        if (!mounted) return;
        setAccounts(acc ?? []);
        setItems((itemsResp && (itemsResp as any).item_names) || []);
        setStamps(mastersResp?.stamps ?? []);
        setUnits(unitsResp?.units ?? mastersResp?.units ?? []);
        setShapes(shapesResp?.shapes ?? []);
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
    if (divide && !validateNumber(divide))
      return toast({ variant: "destructive", title: "Divide must be numeric" });
    if (tunch && !validateNumber(tunch))
      return toast({ variant: "destructive", title: "Tunch must be numeric" });
    if (wstg && !validateNumber(wstg))
      return toast({ variant: "destructive", title: "Wstg must be numeric" });
    if (rate && !validateNumber(rate))
      return toast({ variant: "destructive", title: "Rate must be numeric" });

    const payload: any = {
      account: accountId,
      tag_no: tagNo || null,
      item_name: itemId,
      order_no: orderNo || null,
      remark: remark || null,
      unit: unitId || null,
      piece: piece ? parseInt(piece, 10) : null,
      shape: shapeId || null,
      gross_wt: grossWt ? parseFloat(grossWt) : null,
      net_wt: netWt ? parseFloat(netWt) : null,
      divide: divide ? parseFloat(divide) : null,
      tunch: tunch ? parseFloat(tunch) : null,
      wstg: wstg ? parseFloat(wstg) : null,
      rate: rate ? parseFloat(rate) : null,
    };

    try {
      await purAndApprovalCreate(payload);
      toast({ title: "Saved", description: "Pur and Approval M saved" });
      setTagNo("");
      setOrderNo("");
      setRemark("");
      setPiece("");
      setGrossWt("");
      setNetWt("");
      setDivide("");
      setTunch("");
      setWstg("");
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
                {(a as any).account_name || (a as any).name || a.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Tag No</Label>
          <Input value={tagNo} onChange={(e) => setTagNo(e.target.value)} />
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
          <Label>Remark</Label>
          <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
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
          <Label>Shape</Label>
          <select
            className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
            value={shapeId}
            onChange={(e) => setShapeId(e.target.value)}
          >
            <option value="">Select shape</option>
            {shapes.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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
          <Label>Divide</Label>
          <Input value={divide} onChange={(e) => setDivide(e.target.value)} />
        </div>

        <div>
          <Label>Tunch</Label>
          <Input value={tunch} onChange={(e) => setTunch(e.target.value)} />
        </div>

        <div>
          <Label>Wstg</Label>
          <Input value={wstg} onChange={(e) => setWstg(e.target.value)} />
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
              "Tag No",
              "Item Name",
              "Order No",
              "Remark",
              "Unit",
              "Piece",
              "Shape",
              "Gr. Wt",
              "Net Wt",
              "Divide",
              "Tunch",
              "Wstg",
              "Rate",
            ];
            const account =
              accounts.find((a) => a.id === accountId)?.name ?? "";
            const item = items.find((it) => it.id === itemId)?.name ?? "";
            const shape = shapes.find((s) => s.id === shapeId)?.name ?? "";
            const dataRow = [
              account,
              tagNo || null,
              item || null,
              orderNo || null,
              remark || null,
              unitId || null,
              piece || null,
              shape || null,
              grossWt || null,
              netWt || null,
              divide || null,
              tunch || null,
              wstg || null,
              rate || null,
            ];
            const res = exportToExcel({
              formName: "Pur and Approval",
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

"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  accountsDropdown,
  vouchersItemNames,
  vouchersMasters,
  repairCreate,
  repairDetail,
  repairUpdate,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/export";

export default function RepairForm({ id }: { id?: string }) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<{ id: string; name?: string }[]>([]);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [stamps, setStamps] = useState<{ id: string; name: string }[]>([]);

  const [accountId, setAccountId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [typeVal, setTypeVal] = useState<string>("");
  const [tagNo, setTagNo] = useState("");
  const [itemId, setItemId] = useState<string>("");
  const [remark, setRemark] = useState("");
  const [stampId, setStampId] = useState<string>("");
  const [grWt, setGrWt] = useState<string>("");
  const [netWt, setNetWt] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [piece, setPiece] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [supplier, setSupplier] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [acc, itemsResp, mastersResp] = await Promise.all([
          accountsDropdown(),
          vouchersItemNames(),
          vouchersMasters(),
        ]);
        if (!mounted) return;
        setAccounts(acc ?? []);
        setItems((itemsResp && (itemsResp as any).item_names) || []);
        setStamps(mastersResp?.stamps ?? []);
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
        const data = await repairDetail(id);
        if (!mounted) return;
        setAccountId(
          (data.account && (data.account as any).id) ||
            (typeof data.account === "string" ? (data.account as string) : "")
        );
        setDate(data.date ?? "");
        setTypeVal(data.type ?? "");
        setTagNo(data.tag_no ?? "");
        setItemId((data.item_name && (data.item_name as any).id) || "");
        setRemark(data.remark ?? "");
        setStampId((data.stamp && (data.stamp as any).id) || "");
        setGrWt(data.gr_wt ? String(data.gr_wt) : "");
        setNetWt(data.net_wt ? String(data.net_wt) : "");
        setRate(data.rate ? String(data.rate) : "");
        setPiece(data.piece ? String(data.piece) : "");
        setTotal(data.total ? String(data.total) : "");
        setSupplier(data.supplier ?? "");
      } catch (err) {
        toast({ variant: "destructive", title: "Failed to load record" });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, toast]);

  const validateNumber = (v: string) => {
    if (v === "") return true;
    return /^\d+(\.\d+)?$/.test(v);
  };

  const computedTotal = () => {
    const p = piece ? Number(piece) : 0;
    const r = rate ? Number(rate) : 0;
    if (Number.isNaN(p) || Number.isNaN(r)) return "";
    return String(p * r);
  };

  const handleSave = async () => {
    if (accountId === "")
      return toast({
        variant: "destructive",
        title: "Please select an account",
      });
    if (itemId === "")
      return toast({ variant: "destructive", title: "Please select an item" });
    if (
      !validateNumber(grWt) ||
      !validateNumber(netWt) ||
      !validateNumber(rate)
    )
      return toast({
        variant: "destructive",
        title: "Numeric fields must be valid",
      });
    if (piece && !/^\d+$/.test(piece))
      return toast({ variant: "destructive", title: "Piece must be integer" });

    const payload: any = {
      account: accountId,
      date: date || null,
      type: typeVal || null,
      tag_no: tagNo || null,
      item_name: itemId,
      remark: remark || null,
      stamp: stampId || null,
      gr_wt: grWt ? parseFloat(grWt) : null,
      net_wt: netWt ? parseFloat(netWt) : null,
      rate: rate ? parseFloat(rate) : null,
      piece: piece ? parseInt(piece, 10) : null,
      total: total
        ? parseFloat(total)
        : computedTotal()
          ? parseFloat(computedTotal())
          : null,
      supplier: supplier || null,
    };

    try {
      if (id) {
        await repairUpdate(id, payload);
        toast({ title: "Updated", description: "Repair updated" });
      } else {
        await repairCreate(payload);
        toast({ title: "Saved", description: "Repair created" });
        setDate("");
        setTypeVal("");
        setTagNo("");
        setItemId("");
        setRemark("");
        setStampId("");
        setGrWt("");
        setNetWt("");
        setRate("");
        setPiece("");
        setTotal("");
        setSupplier("");
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
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <Label>Type</Label>
          <Input value={typeVal} onChange={(e) => setTypeVal(e.target.value)} />
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
          <Label>Supplier</Label>
          <Input
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
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
          <Label>Piece</Label>
          <Input
            value={piece}
            onChange={(e) => {
              setPiece(e.target.value);
              // auto-update total if user hasn't entered a total manually
              const p = Number(e.target.value);
              const r = Number(rate);
              if (
                !Number.isNaN(p) &&
                !Number.isNaN(r) &&
                (!total || total === "")
              ) {
                setTotal(String(p * r));
              }
            }}
          />
        </div>

        <div>
          <Label>Gr. Wt</Label>
          <Input value={grWt} onChange={(e) => setGrWt(e.target.value)} />
        </div>

        <div>
          <Label>Net Wt</Label>
          <Input value={netWt} onChange={(e) => setNetWt(e.target.value)} />
        </div>

        <div>
          <Label>Rate</Label>
          <Input
            value={rate}
            onChange={(e) => {
              setRate(e.target.value);
              const p = Number(piece);
              const r = Number(e.target.value);
              if (
                !Number.isNaN(p) &&
                !Number.isNaN(r) &&
                (!total || total === "")
              ) {
                setTotal(String(p * r));
              }
            }}
          />
        </div>

        <div>
          <Label>Total</Label>
          <Input value={total} onChange={(e) => setTotal(e.target.value)} />
        </div>

        <div>
          <Label>Remark</Label>
          <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {id ? "Update" : "Save"}
        </Button>

        <Button
          onClick={async () => {
            const headers = [
              "Account",
              "Tag No",
              "Date",
              "Item Name",
              "Piece",
              "Rate",
              "Total",
              "Supplier",
              "Remark",
            ];
            const account =
              accounts.find((a) => a.id === accountId)?.name ?? "";
            const item = items.find((it) => it.id === itemId)?.name ?? "";
            const stamp = stamps.find((s) => s.id === stampId)?.name ?? "";
            const dataRow = [
              account,
              tagNo || null,
              date || null,
              item || null,
              piece || null,
              rate || null,
              computedTotal() || null,
              supplier || null,
              remark || null,
            ];
            const res = exportToExcel({
              formName: "Repair",
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

      {/* Upload removed: attachments are intentionally disabled for Repair */}
    </div>
  );
}

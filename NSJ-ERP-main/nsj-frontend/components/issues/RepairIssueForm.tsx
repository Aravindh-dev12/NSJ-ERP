"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  accountsDropdown,
  vouchersItemNames,
  vouchersMasters,
  repairIssueCreate,
  repairIssueDetail,
  repairIssueUpdate,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";

export default function RepairIssueForm({ id }: { id?: string }) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<{ id: string; name?: string }[]>([]);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [stamps, setStamps] = useState<{ id: string; name: string }[]>([]);

  const [accountId, setAccountId] = useState<string>("");
  const [tagNo, setTagNo] = useState("");
  const [itemId, setItemId] = useState<string>("");
  const [piece, setPiece] = useState<string>("");
  const [remark, setRemark] = useState("");
  const [stampId, setStampId] = useState<string>("");
  const [grWt, setGrWt] = useState<string>("");
  const [netWt, setNetWt] = useState<string>("");
  const [tunch, setTunch] = useState<string>("");
  const [wstg, setWstg] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [total, setTotal] = useState<string>("");

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
        const data = await repairIssueDetail(id);
        if (!mounted) return;
        setAccountId(
          (data.account && (data.account as any).id) ||
            (typeof data.account === "string" ? (data.account as string) : "")
        );
        setTagNo(data.tag_no ?? "");
        setItemId((data.item_name && (data.item_name as any).id) || "");
        setRemark(data.remark ?? "");
        setStampId((data.stamp && (data.stamp as any).id) || "");
        setGrWt(data.gr_wt ? String(data.gr_wt) : "");
        setNetWt(data.net_wt ? String(data.net_wt) : "");
        setTunch(data.tunch ? String(data.tunch) : "");
        setWstg(data.wstg ? String(data.wstg) : "");
        setRate(data.rate ? String(data.rate) : "");
        setPiece(data.piece ? String(data.piece) : "");
        setTotal(data.total ? String(data.total) : "");
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
      !validateNumber(rate) ||
      !validateNumber(tunch) ||
      !validateNumber(wstg)
    )
      return toast({
        variant: "destructive",
        title: "Numeric fields must be valid",
      });
    if (piece && !/^\d+$/.test(piece))
      return toast({ variant: "destructive", title: "Piece must be integer" });

    const payload: any = {
      account: accountId,
      tag_no: tagNo || null,
      item_name: itemId,
      piece: piece ? parseInt(piece, 10) : null,
      remark: remark || null,
      stamp: stampId || null,
      gr_wt: grWt ? parseFloat(grWt) : null,
      net_wt: netWt ? parseFloat(netWt) : null,
      tunch: tunch ? parseFloat(tunch) : null,
      wstg: wstg ? parseFloat(wstg) : null,
      rate: rate ? parseFloat(rate) : null,
      total: total
        ? parseFloat(total)
        : computedTotal()
          ? parseFloat(computedTotal())
          : null,
    };

    try {
      if (id) {
        await repairIssueUpdate(id, payload);
        toast({ title: "Updated", description: "Repair issue updated" });
      } else {
        await repairIssueCreate(payload);
        toast({ title: "Saved", description: "Repair issue created" });
        setTagNo("");
        setItemId("");
        setRemark("");
        setStampId("");
        setGrWt("");
        setNetWt("");
        setTunch("");
        setWstg("");
        setRate("");
        setPiece("");
        setTotal("");
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
          <Label>Piece</Label>
          <Input value={piece} onChange={(e) => setPiece(e.target.value)} />
        </div>

        <div>
          <Label>Remark</Label>
          <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
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
          <Label>Gr.wt</Label>
          <Input value={grWt} onChange={(e) => setGrWt(e.target.value)} />
        </div>

        <div>
          <Label>Net.wt</Label>
          <Input value={netWt} onChange={(e) => setNetWt(e.target.value)} />
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

        <div>
          <Label>Total</Label>
          <Input value={total} onChange={(e) => setTotal(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <Button onClick={handleSave}>{id ? "Update" : "Save"}</Button>
      </div>
    </div>
  );
}

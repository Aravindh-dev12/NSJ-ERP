"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  accountsDropdown,
  vouchersItemNames,
  vouchersMasters,
  vouchersShapes,
  purchaseDiamondCreate,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/export";

export default function PurchaseDiamondForm() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [shapes, setShapes] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [colours, setColours] = useState<any[]>([]);
  const [clarities, setClarities] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);

  const [accountId, setAccountId] = useState("");
  const [itemId, setItemId] = useState("");
  const [batch, setBatch] = useState("");
  const [shapeId, setShapeId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [colourId, setColourId] = useState("");
  const [clarityId, setClarityId] = useState("");
  const [piece, setPiece] = useState("");
  const [wt, setWt] = useState("");
  const [lessPercent, setLessPercent] = useState("");
  const [exRate, setExRate] = useState("");
  const [remark, setRemark] = useState("");
  const [inrCt, setInrCt] = useState("");
  const [labId, setLabId] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [acc, itemsResp, mastersResp, shapesResp] = await Promise.all([
          accountsDropdown(),
          vouchersItemNames(),
          vouchersMasters(),
          vouchersShapes(),
        ]);
        if (!mounted) return;
        setAccounts(acc ?? []);
        setItems((itemsResp as any)?.item_names ?? []);
        setShapes(shapesResp?.shapes ?? mastersResp?.shapes ?? []);
        setSizes(mastersResp?.sizes ?? []);
        setColours(mastersResp?.colours ?? []);
        setClarities(mastersResp?.clarities ?? []);
        setLabs(mastersResp?.labs ?? []);
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
    if (!validateNumber(wt))
      return toast({ variant: "destructive", title: "Wt must be numeric" });
    if (lessPercent && !validateNumber(lessPercent))
      return toast({ variant: "destructive", title: "Less % must be numeric" });
    if (exRate && !validateNumber(exRate))
      return toast({
        variant: "destructive",
        title: "Ex. Rate must be numeric",
      });
    if (inrCt && !validateNumber(inrCt))
      return toast({ variant: "destructive", title: "INR/Ct must be numeric" });

    const formData = new FormData();
    formData.append("account", accountId);
    formData.append("item_name", itemId);
    if (batch) formData.append("batch", batch);
    if (shapeId) formData.append("shape", shapeId);
    if (sizeId) formData.append("size", sizeId);
    if (colourId) formData.append("colour", colourId);
    if (clarityId) formData.append("clarity", clarityId);
    if (piece) formData.append("piece", piece);
    if (wt) formData.append("wt", wt);
    if (lessPercent) formData.append("less_percent", lessPercent);
    if (exRate) formData.append("ex_rate", exRate);
    if (remark) formData.append("remark", remark);
    if (inrCt) formData.append("inr_ct", inrCt);
    if (labId) formData.append("lab", labId);
    if (proofImage) formData.append("proof_image", proofImage);

    try {
      await purchaseDiamondCreate(formData);
      toast({ title: "Saved", description: "Purchase Diamond saved" });
      setBatch("");
      setPiece("");
      setWt("");
      setLessPercent("");
      setExRate("");
      setRemark("");
      setInrCt("");
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
          <Label>Batch</Label>
          <Input value={batch} onChange={(e) => setBatch(e.target.value)} />
        </div>

        <div>
          <Label>Shape</Label>
          <select
            className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
            value={shapeId}
            onChange={(e) => setShapeId(e.target.value)}
          >
            <option value="">Select shape</option>
            {shapes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Size</Label>
          <select
            className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
            value={sizeId}
            onChange={(e) => setSizeId(e.target.value)}
          >
            <option value="">Select size</option>
            {sizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Colour</Label>
          <select
            className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
            value={colourId}
            onChange={(e) => setColourId(e.target.value)}
          >
            <option value="">Select colour</option>
            {colours.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Clarity</Label>
          <select
            className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
            value={clarityId}
            onChange={(e) => setClarityId(e.target.value)}
          >
            <option value="">Select clarity</option>
            {clarities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Piece</Label>
          <Input value={piece} onChange={(e) => setPiece(e.target.value)} />
        </div>

        <div>
          <Label>Wt</Label>
          <Input value={wt} onChange={(e) => setWt(e.target.value)} />
        </div>

        <div>
          <Label>Less %</Label>
          <Input
            value={lessPercent}
            onChange={(e) => setLessPercent(e.target.value)}
          />
        </div>

        <div>
          <Label>Ex. Rate</Label>
          <Input value={exRate} onChange={(e) => setExRate(e.target.value)} />
        </div>

        <div>
          <Label>Remark</Label>
          <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
        </div>

        <div>
          <Label>INR/Ct</Label>
          <Input value={inrCt} onChange={(e) => setInrCt(e.target.value)} />
        </div>

        <div>
          <Label>Lab</Label>
          <select
            className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
            value={labId}
            onChange={(e) => setLabId(e.target.value)}
          >
            <option value="">Select lab</option>
            {labs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
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
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Save
        </Button>

        <Button
          onClick={() => {
            const headers = [
              "Account",
              "Item Name",
              "Batch",
              "Shape",
              "Size",
              "Colour",
              "Clarity",
              "Piece",
              "Wt",
              "Less %",
              "Ex. Rate",
              "Remark",
              "INR/Ct",
              "Lab",
            ];
            const account =
              accounts.find((a) => a.id === accountId)?.name ?? "";
            const item = items.find((it) => it.id === itemId)?.name ?? "";
            const shape = shapes.find((s) => s.id === shapeId)?.name ?? "";
            const size = sizes.find((s) => s.id === sizeId)?.name ?? "";
            const colour = colours.find((c) => c.id === colourId)?.name ?? "";
            const clarity =
              clarities.find((c) => c.id === clarityId)?.name ?? "";
            const lab = labs.find((l) => l.id === labId)?.name ?? "";
            const dataRow = [
              account,
              item,
              batch || null,
              shape || null,
              size || null,
              colour || null,
              clarity || null,
              piece || null,
              wt || null,
              lessPercent || null,
              exRate || null,
              remark || null,
              inrCt || null,
              lab || null,
            ];
            const res = exportToExcel({
              formName: "Purchase Diamond",
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

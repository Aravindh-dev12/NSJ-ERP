"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  purReturnCreate,
  accountsList,
  vouchersItemNames,
  vouchersClarities,
  vouchersShapes,
  vouchersUnits,
  vouchersMasters,
  type Voucher,
} from "@/lib/backend";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SalesHeader } from "./SalesHeader";

const purReturnSchema = z.object({
  account: z.string().optional(),
  tagNo: z.string().optional(),
  date: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  orderNo: z.string().optional(),
  stamp: z.string().optional(),
  remark: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  piece: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().optional()
  ),
  grWt: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().optional()
  ),
  netWt: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().optional()
  ),
  divide: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().optional()
  ),
  tunch: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().optional()
  ),
  wstg: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().optional()
  ),
  rate: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().optional()
  ),
  mrp: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().optional()
  ),
  shape: z.string().optional(),
  clarity: z.string().optional(),
  category: z.string().optional(),
});

type PurReturnValues = z.infer<typeof purReturnSchema>;

export function PurReturnForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [itemOptions, setItemOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [stampOptions, setStampOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [unitOptions, setUnitOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [shapeOptions, setShapeOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [clarityOptions, setClarityOptions] = useState<
    { id: string; name: string }[]
  >([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PurReturnValues>({
    resolver: zodResolver(purReturnSchema) as any,
    defaultValues: {},
  });

  useEffect(() => {
    let mounted = true;
    const loadAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const data = await accountsList({ page: 1, page_size: 500 });
        if (!mounted) return;
        setAccounts(
          (data.results ?? []).map(
            (a) => `${a.id}::${a.account_name || a.account_no}`
          )
        );
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Unable to load accounts",
          description: err instanceof Error ? err.message : "",
        });
      } finally {
        if (mounted) setLoadingAccounts(false);
      }
    };
    void loadAccounts();

    const loadMasters = async () => {
      try {
        const itemsResp = await vouchersItemNames();
        if (mounted && itemsResp && Array.isArray(itemsResp.item_names)) {
          setItemOptions(
            itemsResp.item_names.map((i) => ({ id: i.id, name: i.name }))
          );
        }

        const clarResp = await vouchersClarities();
        if (mounted && clarResp && Array.isArray(clarResp.clarities)) {
          setClarityOptions(
            clarResp.clarities.map((c) => ({ id: c.id, name: c.name }))
          );
        }

        const shapeResp = await vouchersShapes();
        if (mounted && shapeResp && Array.isArray(shapeResp.shapes)) {
          setShapeOptions(
            shapeResp.shapes.map((s) => ({ id: s.id, name: s.name }))
          );
        }

        const unitResp = await vouchersUnits();
        if (mounted && unitResp && Array.isArray(unitResp.units)) {
          setUnitOptions(
            unitResp.units.map((u) => ({ id: u.id, name: u.name }))
          );
        }

        const mastersResp = await vouchersMasters();
        if (mounted && mastersResp && Array.isArray(mastersResp.stamps)) {
          setStampOptions(
            mastersResp.stamps.map((s) => ({ id: s.id, name: s.name }))
          );
        }
      } catch (err) {
        // ignore — fall back to empty lists
      }
    };
    void loadMasters();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const onSubmit = async (values: PurReturnValues) => {
    const payload: Record<string, unknown> = {};
    if (values.account) payload.account_id = values.account;
    if (values.tagNo) payload.tag_no = values.tagNo;
    if (values.date) payload.date = values.date;
    if (values.itemName) payload.item_name_id = values.itemName;
    if (values.orderNo) payload.order_no = values.orderNo;
    if (values.stamp) payload.stamp_id = values.stamp;
    if (values.remark) payload.remark = values.remark;
    if (values.unit) payload.unit_id = values.unit;
    if (typeof values.piece === "number") payload.piece = values.piece;
    if (typeof values.grWt === "number") payload.gr_wt = values.grWt;
    if (typeof values.netWt === "number") payload.net_wt = values.netWt;
    if (typeof values.divide === "number") payload.divide = values.divide;
    if (typeof values.tunch === "number") payload.tunch = values.tunch;
    if (typeof values.wstg === "number") payload.wstg = values.wstg;
    if (typeof values.rate === "number") payload.rate = values.rate;
    if (typeof values.mrp === "number") payload.mrp = values.mrp;
    if (values.shape) payload.shape_id = values.shape;
    if (values.clarity) payload.clarity_id = values.clarity;
    if (values.category) payload.category = values.category;

    try {
      await purReturnCreate(payload);
      toast({
        title: "Purchase return created",
        description: "Saved successfully.",
      });
      router.push("/vouchers/pur-return/list");
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not create Pur. Return",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const accountOptions = useMemo(() => {
    return accounts.map((s) => {
      const [id, name] = s.split("::");
      return { id, name };
    });
  }, [accounts]);

  // helpers to render select options using id values
  const renderItemOptions = () =>
    itemOptions.map((it) => (
      <option key={it.id} value={it.id}>
        {it.name}
      </option>
    ));

  const renderStampOptions = () =>
    stampOptions.map((s) => (
      <option key={s.id} value={s.id}>
        {s.name}
      </option>
    ));

  const renderUnitOptions = () =>
    unitOptions.map((u) => (
      <option key={u.id} value={u.id}>
        {u.name}
      </option>
    ));

  const renderShapeOptions = () =>
    shapeOptions.map((s) => (
      <option key={s.id} value={s.id}>
        {s.name}
      </option>
    ));

  const renderClarityOptions = () =>
    clarityOptions.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name}
      </option>
    ));

  return (
    <div className="space-y-8">
      <SalesHeader
        title="Add Pur. Return"
        description="Create a new purchase return."
        links={[
          { label: "Overview", href: "/vouchers/pur-return" },
          { label: "List", href: "/vouchers/pur-return/list" },
          { label: "Add New", href: "/vouchers/pur-return/add-new" },
        ]}
      />

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Create Pur. Return</CardTitle>
          <CardDescription>
            Fill in purchase return details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            className="space-y-6"
          >
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Basic</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account">Account</Label>
                  <select
                    id="account"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("account")}
                  >
                    <option value="">Select account</option>
                    {accountOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagNo">Tag No</Label>
                  <Input id="tagNo" {...register("tagNo")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...register("date")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemName">
                    Item Name <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="itemName"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("itemName")}
                  >
                    <option value="">Select item</option>
                    {renderItemOptions()}
                  </select>
                  {errors.itemName ? (
                    <p className="text-xs text-destructive">
                      {errors.itemName.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderNo">Order No</Label>
                  <Input id="orderNo" {...register("orderNo")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stamp">Stamp</Label>
                  <select
                    id="stamp"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("stamp")}
                  >
                    <option value="">Select stamp</option>
                    {renderStampOptions()}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="remark">Remark</Label>
                  <Input id="remark" {...register("remark")} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Measurement & Pricing
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit">
                    Unit <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="unit"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("unit")}
                  >
                    <option value="">Select unit</option>
                    {renderUnitOptions()}
                  </select>
                  {errors.unit ? (
                    <p className="text-xs text-destructive">
                      {errors.unit.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="piece">Piece</Label>
                  <Input
                    id="piece"
                    type="number"
                    {...register("piece", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grWt">Gr.Wt</Label>
                  <Input
                    id="grWt"
                    type="number"
                    step="0.001"
                    {...register("grWt", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netWt">Net.Wt</Label>
                  <Input
                    id="netWt"
                    type="number"
                    step="0.001"
                    {...register("netWt", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="divide">Divide</Label>
                  <Input
                    id="divide"
                    type="number"
                    step="0.001"
                    {...register("divide", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tunch">Tunch</Label>
                  <Input
                    id="tunch"
                    type="number"
                    step="0.001"
                    {...register("tunch", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wstg">Wstg</Label>
                  <Input
                    id="wstg"
                    type="number"
                    step="0.001"
                    {...register("wstg", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Rate</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    {...register("rate", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mrp">MRP</Label>
                  <Input
                    id="mrp"
                    type="number"
                    step="0.01"
                    {...register("mrp", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shape">Shape</Label>
                  <select
                    id="shape"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("shape")}
                  >
                    <option value="">Select shape</option>
                    {renderShapeOptions()}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clarity">Clarity</Label>
                  <select
                    id="clarity"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("clarity")}
                  >
                    <option value="">Select clarity</option>
                    {renderClarityOptions()}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" {...register("category")} />
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save Pur. Return"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

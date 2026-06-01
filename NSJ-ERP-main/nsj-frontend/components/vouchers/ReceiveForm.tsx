"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  receiveCreate,
  accountsList,
  vouchersItemNames,
  vouchersMasters,
  vouchersUnits,
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

const receiveFormSchema = z.object({
  account: z.string().min(1, "Account is required"),
  date: z.string().optional(),
  tagNo: z.string().optional(),
  itemName: z.string().min(1, "Item is required"),
  remark: z.string().optional(),
  stamp: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  pc: z.preprocess(
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
  total: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().optional()
  ),
});

type ReceiveFormValues = z.infer<typeof receiveFormSchema>;

export function ReceiveForm() {
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveFormSchema) as any,
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
            (a) => `${a.id}::${a.account_name || a.account_no || ""}`
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
        if (mounted && itemsResp && Array.isArray(itemsResp.item_names))
          setItemOptions(
            itemsResp.item_names.map((i) => ({ id: i.id, name: i.name }))
          );

        const masters = await vouchersMasters();
        if (mounted) {
          if (Array.isArray(masters.stamps))
            setStampOptions(
              masters.stamps.map((s) => ({ id: s.id, name: s.name }))
            );
        }

        const unitsResp = await vouchersUnits();
        if (mounted && unitsResp && Array.isArray(unitsResp.units))
          setUnitOptions(
            unitsResp.units.map((u) => ({ id: u.id, name: u.name }))
          );
      } catch (err) {
        // ignore
      }
    };
    void loadMasters();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const watchedNet = watch("netWt");
  const watchedRate = watch("rate");

  useEffect(() => {
    // auto-calc total when netWt or rate changes
    const n =
      typeof watchedNet === "number" ? watchedNet : Number(watchedNet || 0);
    const r =
      typeof watchedRate === "number" ? watchedRate : Number(watchedRate || 0);
    const total = n && r ? n * r : undefined;
    // update form value via react-hook-form if available to keep internal state
    // update react-hook-form value so submit has correct number
    if (typeof total === "number") {
      setValue("total", total);
    } else {
      setValue("total", undefined as any);
    }
  }, [watchedNet, watchedRate]);

  const onSubmit = async (values: ReceiveFormValues) => {
    const payload: Record<string, unknown> = {};
    if (values.account) payload.account = values.account;
    if (values.date) payload.date = values.date;
    if (values.tagNo) payload.tag_no = values.tagNo;
    // itemName is the selected item id (UUID)
    if (values.itemName) payload.item_name = values.itemName;
    if (values.remark) payload.remark = values.remark;
    // stamps/units are selected by id (UUID)
    if (values.stamp) payload.stamp = values.stamp;
    if (values.unit) payload.unit = values.unit;
    if (typeof values.pc === "number") payload.pc = values.pc;
    if (typeof values.grWt === "number") payload.gr_wt = values.grWt;
    if (typeof values.netWt === "number") payload.net_wt = values.netWt;
    if (typeof values.tunch === "number") payload.tunch = values.tunch;
    if (typeof values.wstg === "number") payload.wstg = values.wstg;
    if (typeof values.rate === "number") payload.rate = values.rate;
    if (typeof values.total === "number") payload.total = values.total;

    try {
      await receiveCreate(payload);
      toast({ title: "Receive created", description: "Saved successfully." });
      router.push("/vouchers/receive/list");
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not create receive",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const accountOptions = useMemo(
    () =>
      accounts.map((s) => {
        const [id, name] = s.split("::");
        return { id, name };
      }),
    [accounts]
  );

  return (
    <div className="space-y-8">
      <SalesHeader
        title="Add receive"
        description="Create a new receive entry."
        links={[
          { label: "Overview", href: "/vouchers/receive" },
          { label: "List", href: "/vouchers/receive/list" },
          { label: "Add New", href: "/vouchers/receive/new" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Create receive</CardTitle>
          <CardDescription>Fill in receive details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold">Basic</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account">
                    Account <span className="text-destructive">*</span>
                  </Label>
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
                  {errors.account ? (
                    <p className="text-xs text-destructive">
                      {errors.account.message as string}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...register("date")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagNo">Tag No</Label>
                  <Input id="tagNo" {...register("tagNo")} />
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
                    {itemOptions.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                  {errors.itemName ? (
                    <p className="text-xs text-destructive">
                      {errors.itemName.message as string}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="remark">Remark</Label>
                  <Input id="remark" {...register("remark")} />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Measurements</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stamp">Stamp</Label>
                  <select
                    id="stamp"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("stamp")}
                  >
                    <option value="">Select stamp</option>
                    {stampOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                    {unitOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  {errors.unit ? (
                    <p className="text-xs text-destructive">
                      {errors.unit.message as string}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pc">Pc</Label>
                  <Input
                    id="pc"
                    type="number"
                    {...register("pc", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grWt">Gr. Wt</Label>
                  <Input
                    id="grWt"
                    type="number"
                    step="0.001"
                    {...register("grWt", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netWt">Net Wt</Label>
                  <Input
                    id="netWt"
                    type="number"
                    step="0.001"
                    {...register("netWt", { valueAsNumber: true })}
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
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    type="number"
                    step="0.01"
                    {...register("total", { valueAsNumber: true })}
                  />
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
                {isSubmitting ? "Saving…" : "Save receive"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

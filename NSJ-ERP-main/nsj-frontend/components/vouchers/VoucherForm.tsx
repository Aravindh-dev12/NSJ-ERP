"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import {
  voucherCreate,
  accountsList,
  vouchersMasters,
  vouchersItemNames,
  subaccountsList,
  type Voucher,
} from "@/lib/backend";
import { ORDER_TYPE_OPTIONS, JEWELRY_TYPE_MAPPING } from "@/lib/constants";
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
import { exportToExcel } from "@/lib/export";
import { VouchersHeader } from "./VouchersHeader";

// options will be fetched from backend masters endpoint
// series: { id, name }
// stamps: { id, name, code }
// base_metals: { id, name, code }

const voucherFormSchema = z.object({
  accountId: z.string().optional(),
  series: z.string().optional(),
  orderType: z
    .enum(["STOCK_JEWELRY", "BESPOKE_NATURAL", "BESPOKE_CVD", "LOOSE_DIAMONDS"])
    .default("STOCK_JEWELRY"),
  date: z.string().optional(),
  // prefer sending FK ids where possible
  itemNameId: z.string().optional(),
  itemName: z.string().optional(),
  design: z.string().optional(),
  stampId: z.string().optional(),
  stamp: z.string().optional(),
  goldRate: z.number().min(0).optional(),
  baseMetal: z.string().optional(),
  size: z.string().optional(),
  sizeId: z.string().optional(),
  numberOfPieces: z.number().int().min(1).optional(),
  // new line-level fields
  wt: z.number().min(0).optional(),
  unit: z.number().min(0).optional(),
  rateItem: z.number().min(0).optional(),
  discountPct: z.number().min(0).max(100).optional(),
  valueItem: z.number().min(0).optional(),
  estimatedGrossWeight: z.number().min(0).optional(),
  estimatedGoldWeight: z.number().min(0).optional(),
  estimatedDiamondWeight: z.number().min(0).optional(),
  tunchPercent: z.number().min(0).max(100).optional(),
  averageDiamondRate: z.number().min(0).optional(),
  gemstoneStoneWeight: z.number().min(0).optional(),
  craftsmanshipFee: z.number().min(0).optional(),
  // advancePaymentReceived: dropdown with YES / NO to match backend
  advancePaymentReceived: z.enum(["YES", "NO"] as const, {
    message: "Advance payment selection is required",
  }),
});

// Export a small pure helper so tests can validate calculation logic without
// mounting the whole component (avoids render loops and async loads in tests).
export function computeLineValue(
  wt?: number | string | null,
  rate?: number | string | null,
  discount?: number | string | null
) {
  try {
    const w = Number(wt ?? 0) || 0;
    const r = Number(rate ?? 0) || 0;
    const d = Number(discount ?? 0) || 0;
    const raw = w * r;
    const after = raw * (1 - d / 100);
    const safe = Number.isFinite(after) ? Number(after.toFixed(2)) : 0;
    return safe;
  } catch (err) {
    return 0;
  }
}

type VoucherFormValues = z.infer<typeof voucherFormSchema>;

export function VoucherForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [seriesOptions, setSeriesOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [stampOptions, setStampOptions] = useState<
    { id: string; name: string; code?: string | null }[]
  >([]);
  const [baseMetalOptions, setBaseMetalOptions] = useState<
    { id: string; name: string; code?: string | null }[]
  >([]);
  const [itemNameOptions, setItemNameOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingMasters, setLoadingMasters] = useState(true);
  // file upload state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VoucherFormValues>({
    // zodResolver's inferred input type can be incompatible with react-hook-form's strict generic inference
    // Cast the resolver to the correct Resolver<VoucherFormValues> type to satisfy TypeScript.
    resolver: zodResolver(
      voucherFormSchema
    ) as unknown as Resolver<VoucherFormValues>,
    defaultValues: {
      series: "DEFAULT",
      orderType: "STOCK_JEWELRY",
      numberOfPieces: 1,
      goldRate: 0,
      estimatedGrossWeight: 0,
      estimatedGoldWeight: 0,
      estimatedDiamondWeight: 0,
      tunchPercent: 0,
      averageDiamondRate: 0,
      gemstoneStoneWeight: 0,
      craftsmanshipFee: 0,
      advancePaymentReceived: undefined,
      wt: 0,
      unit: 0,
      rateItem: 0,
      discountPct: 0,
      valueItem: 0,
    },
  });

  // Modal state for print-after-save flow
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);

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
    // load voucher masters (series, stamps, base metals)
    const loadMasters = async () => {
      setLoadingMasters(true);
      try {
        const data = await vouchersMasters();
        if (!mounted) return;
        setSeriesOptions(data.series ?? []);
        setStampOptions(data.stamps ?? []);
        setBaseMetalOptions(data.base_metals ?? []);
        // load item name masters (tenant + global)
        try {
          const itemsResp = await vouchersItemNames();
          if (mounted && itemsResp && Array.isArray(itemsResp.item_names)) {
            // preserve ids so we can submit FK ids to the backend
            setItemNameOptions(
              itemsResp.item_names.map((i: any) => ({
                id: String(i.id),
                name: i.name,
              }))
            );
          }
        } catch (err) {
          // ignore — fallback to empty list
        }
      } catch (err) {
        // silence — forms will fallback to empty lists
      } finally {
        if (mounted) setLoadingMasters(false);
      }
    };
    void loadMasters();
    return () => {
      mounted = false;
    };
  }, [toast]);

  // Auto-fill item name from sub-account when account is selected
  const selectedAccountId = watch("accountId");
  useEffect(() => {
    // IMMEDIATELY clear item name when account changes
    setValue("itemName", "");
    setValue("itemNameId", "");

    if (!selectedAccountId) {
      return;
    }

    let mounted = true;
    const fetchItemName = async () => {
      try {
        const subAccounts = await subaccountsList({
          account: selectedAccountId,
        });
        if (!mounted) return;

        // Filter sub-accounts that belong to this specific account
        const matchingSubAccounts = subAccounts.results?.filter((sub: any) => {
          const subAccountId =
            typeof sub.account === "string" ? sub.account : sub.account?.id;
          return subAccountId === selectedAccountId;
        });

        if (matchingSubAccounts && matchingSubAccounts.length > 0) {
          const firstSubAccount = matchingSubAccounts[0];
          if (firstSubAccount.item_name) {
            // Try to find matching item in the dropdown options
            const matchingItem = itemNameOptions.find(
              (item) =>
                item.name.toLowerCase() ===
                firstSubAccount.item_name?.toLowerCase()
            );

            if (matchingItem) {
              setValue("itemNameId", matchingItem.id);
              setValue("itemName", firstSubAccount.item_name);
            } else {
              // Use as free text
              setValue("itemName", firstSubAccount.item_name);
              setValue("itemNameId", "");
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch sub-account item name:", err);
      }
    };

    void fetchItemName();

    return () => {
      mounted = false;
    };
  }, [selectedAccountId, itemNameOptions, setValue]);

  const onSubmit = async (values: VoucherFormValues) => {
    // Build payload as backend expects
    const payload: Record<string, unknown> = {};
    if (values.accountId) payload.account = { id: values.accountId };
    if (values.series) payload.series = values.series;
    if (values.orderType) payload.order_type = values.orderType;
    if (values.date) payload.date = values.date;
    // prefer FK ids if user selected from master list, otherwise send free text
    if (values.itemNameId) payload.item_name_fk_id = values.itemNameId;
    else if (values.itemName) payload.item_name = values.itemName;
    if (values.design) payload.design = values.design;
    if (values.stampId) payload.stamp_fk_id = values.stampId;
    else if (values.stamp) payload.stamp = values.stamp;
    if (typeof values.goldRate === "number")
      payload.gold_rate = values.goldRate;
    if (values.baseMetal) payload.base_metal = values.baseMetal;
    // rhodium_instruction removed from backend; do not send
    if (values.sizeId) payload.size_fk_id = values.sizeId;
    else if (values.size) payload.size = values.size;
    if (typeof values.numberOfPieces === "number")
      payload.number_of_pieces = values.numberOfPieces;
    if (typeof values.estimatedGrossWeight === "number")
      payload.estimated_gross_weight = values.estimatedGrossWeight;
    if (typeof values.estimatedGoldWeight === "number")
      payload.estimated_gold_weight = values.estimatedGoldWeight;
    if (typeof values.estimatedDiamondWeight === "number")
      payload.estimated_diamond_weight = values.estimatedDiamondWeight;
    if (typeof values.tunchPercent === "number")
      payload.tunch_percent = values.tunchPercent;
    if (typeof values.averageDiamondRate === "number")
      payload.average_diamond_rate = values.averageDiamondRate;
    if (typeof values.gemstoneStoneWeight === "number")
      payload.gemstone_stone_weight = values.gemstoneStoneWeight;
    if (typeof values.craftsmanshipFee === "number")
      payload.craftsmanship_fee = values.craftsmanshipFee;
    if (values.advancePaymentReceived)
      payload.advance_payment_received = values.advancePaymentReceived;
    // line-level fields
    if (typeof values.wt === "number") payload.wt = values.wt;
    if (typeof values.unit === "number") payload.unit = values.unit;
    if (typeof values.rateItem === "number")
      payload.rate_item = values.rateItem;
    if (typeof values.discountPct === "number")
      payload.discount = values.discountPct;
    if (typeof values.valueItem === "number")
      payload.value_item = values.valueItem;

    try {
      let res;
      if (file) {
        // send as multipart/form-data
        const fd = new FormData();
        // append all payload keys
        Object.entries(payload).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          // stringify objects (e.g. account -> {id:...}) so backend parses JSON-like strings
          if (typeof v === "object") fd.append(k, JSON.stringify(v));
          else fd.append(k, String(v));
        });
        fd.append("upload_file", file);
        // voucherCreate accepts Partial<Voucher> but api.post supports FormData; cast to bypass TS
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        res = await voucherCreate(fd as unknown as Partial<Voucher>);
      } else {
        res = await voucherCreate(payload as Partial<Voucher>);
      }
      const message = (res as any)?.message ?? null;
      if (message === "Record archived for review") {
        toast({
          title: "Record archived for review",
          description: "The record was archived for review.",
        });
      } else {
        toast({
          title: "Order created",
          description: "Order saved successfully.",
        });
      }

      // Try to read returned order id so we can optionally show a print/receipt flow
      const orderId =
        (res as any)?.result?.id ?? (res as any)?.result?.pk ?? null;

      // Show themed modal to ask if user wants to print the receipt.
      // Use component-level state to trigger a centered modal.
      setSavedOrderId(orderId);
      setShowPrintModal(true);
      // keep router.refresh() for data consistency after subsequent navigation
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not create order",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf", "image/jpg"];
    if (!allowed.includes(f.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select JPG/PNG/PDF",
      });
      return;
    }
    setFile(f);
  }

  // create preview URL for images
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setIsPdf(false);
      return;
    }
    if (file.type === "application/pdf") {
      setIsPdf(true);
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsPdf(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // auto-calc valueItem = wt * rateItem, apply discountPct
  const wtVal = watch("wt");
  const rateVal = watch("rateItem");
  const discountVal = watch("discountPct");

  useEffect(() => {
    const w = Number(wtVal ?? 0) || 0;
    const r = Number(rateVal ?? 0) || 0;
    const d = Number(discountVal ?? 0) || 0;
    const raw = w * r;
    const after = raw * (1 - d / 100);
    const safe = Number.isFinite(after) ? Number(after.toFixed(2)) : 0;
    // unnecessary re-renders / update loops in test environments.
    setValue("valueItem", safe, { shouldValidate: false, shouldDirty: false });
  }, [wtVal, rateVal, discountVal, setValue]);

  // Auto-detect Order Category based on Item Name
  const itemNameValue = watch("itemName");
  useEffect(() => {
    if (!itemNameValue) return;
    const name = itemNameValue.toLowerCase();

    // Check keywords and switch category if needed
    // NOTE: This will override manual selection if the user types a keyword
    if (name.includes("cvd")) {
      setValue("orderType", "BESPOKE_CVD");
    } else if (name.includes("natural")) {
      setValue("orderType", "BESPOKE_NATURAL");
    } else if (
      name.includes("loose") ||
      name.includes("diamond") ||
      name.includes("stone")
    ) {
      setValue("orderType", "LOOSE_DIAMONDS");
    }
  }, [itemNameValue, setValue]);

  const accountOptions = useMemo(() => {
    return accounts.map((s) => {
      const [id, name] = s.split("::");
      return { id, name };
    });
  }, [accounts]);

  const selectedOrderType = watch("orderType");
  const filteredItemNameOptions = useMemo(() => {
    if (!selectedOrderType || !JEWELRY_TYPE_MAPPING[selectedOrderType]) {
      return itemNameOptions;
    }
    const keywords = JEWELRY_TYPE_MAPPING[selectedOrderType];
    return itemNameOptions.filter((opt) =>
      keywords.some((k) => opt.name.toLowerCase().includes(k.toLowerCase()))
    );
  }, [itemNameOptions, selectedOrderType]);

  return (
    <div className="space-y-8">
      <VouchersHeader title="Add order" description="Create a new order." />

      {/* Print-after-save modal */}
      {showPrintModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowPrintModal(false);
              router.push("/vouchers/list");
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Order created</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Do you want to print the receipt?
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded border"
                onClick={() => {
                  setShowPrintModal(false);
                  router.push("/vouchers/list");
                }}
              >
                No
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={() => {
                  setShowPrintModal(false);
                  if (savedOrderId) {
                    router.push(`/voucher/order/receipt?id=${savedOrderId}`);
                  } else {
                    router.push("/vouchers/list");
                  }
                }}
              >
                Yes, Print
              </button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Create order</CardTitle>
          <CardDescription>Fill in order details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Basic</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account</Label>
                  {loadingAccounts ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <select
                      id="accountId"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      {...register("accountId")}
                    >
                      <option value="">Select account</option>
                      {accountOptions.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderType">Order Category (Prefix)</Label>
                  <select
                    id="orderType"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("orderType")}
                  >
                    {ORDER_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="series">Series</Label>
                  <select
                    id="series"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("series")}
                  >
                    <option value="">Select series</option>
                    {seriesOptions.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...register("date")} />
                </div>

                <div className="space-y-2">
                  <Label>Bill No. (auto)</Label>
                  <Input disabled value="(auto-generated)" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="itemName">
                    Item name
                    {watch("accountId") && watch("itemName") && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Auto-filled from account)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="itemName"
                    list="itemNamesList"
                    {...register("itemName")}
                    placeholder={
                      watch("accountId")
                        ? "Select or enter item name"
                        : "Select an account first"
                    }
                  />
                  <datalist id="itemNamesList">
                    {filteredItemNameOptions.map((opt) => (
                      <option key={opt.id} value={opt.name} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="design">Design</Label>
                  <Input id="design" {...register("design")} />
                </div>
                <div className="space-y-2">
                  <Label>Job No. (auto)</Label>
                  <Input disabled value="(auto-generated)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stamp">Stamp</Label>
                  <select
                    id="stamp"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...(register("stampId") as any)}
                  >
                    <option value="">Select stamp</option>
                    {stampOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Or enter stamp"
                    id="stampFree"
                    {...register("stamp")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goldRate">Gold rate</Label>
                  <Input
                    id="goldRate"
                    type="number"
                    step="0.01"
                    {...register("goldRate", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseMetal">Base metal</Label>
                  <select
                    id="baseMetal"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("baseMetal")}
                  >
                    <option value="">Select metal</option>
                    {baseMetalOptions.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Weights & Rates
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estimatedGrossWeight">
                    Estimated gross weight
                  </Label>
                  <Input
                    id="estimatedGrossWeight"
                    type="number"
                    step="0.001"
                    {...register("estimatedGrossWeight", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedGoldWeight">
                    Estimated gold weight
                  </Label>
                  <Input
                    id="estimatedGoldWeight"
                    type="number"
                    step="0.001"
                    {...register("estimatedGoldWeight", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedDiamondWeight">
                    Estimated diamond weight
                  </Label>
                  <Input
                    id="estimatedDiamondWeight"
                    type="number"
                    step="0.001"
                    {...register("estimatedDiamondWeight", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tunchPercent">Tunch percent (purity)</Label>
                  <Input
                    id="tunchPercent"
                    type="number"
                    step="0.01"
                    {...register("tunchPercent", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="averageDiamondRate">
                    Average diamond rate
                  </Label>
                  <Input
                    id="averageDiamondRate"
                    type="number"
                    step="0.01"
                    {...register("averageDiamondRate", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gemstoneStoneWeight">
                    Gemstone / stone weight
                  </Label>
                  <Input
                    id="gemstoneStoneWeight"
                    type="number"
                    step="0.001"
                    {...register("gemstoneStoneWeight", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wt">Wt (line)</Label>
                  <Input
                    id="wt"
                    type="number"
                    step="0.001"
                    {...register("wt", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    type="number"
                    step="0.001"
                    {...register("unit", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateItem">Rate (per unit)</Label>
                  <Input
                    id="rateItem"
                    type="number"
                    step="0.01"
                    {...register("rateItem", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPct">Discount %</Label>
                  <Input
                    id="discountPct"
                    type="number"
                    step="0.01"
                    {...register("discountPct", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valueItem">Value (auto)</Label>
                  <Input
                    id="valueItem"
                    type="number"
                    step="0.01"
                    disabled
                    {...register("valueItem", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Charges & Payments
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="craftsmanshipFee">Craftsmanship fee</Label>
                  <Input
                    id="craftsmanshipFee"
                    type="number"
                    step="0.01"
                    {...register("craftsmanshipFee", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advancePaymentReceived">
                    Advance payment received *
                  </Label>
                  <select
                    id="advancePaymentReceived"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("advancePaymentReceived")}
                  >
                    <option value="">Select</option>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                  {errors.advancePaymentReceived ? (
                    <p className="text-xs text-destructive">
                      {errors.advancePaymentReceived.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfPieces">Number of pieces</Label>
                  <Input
                    id="numberOfPieces"
                    type="number"
                    step="1"
                    {...register("numberOfPieces", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input id="size" {...register("size")} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Attachment
              </h2>
              <div className="space-y-2">
                <Label htmlFor="upload_file">
                  Upload File (JPG / PNG / PDF)
                </Label>
                <input
                  id="upload_file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={onFileChange}
                />
                {previewUrl && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={previewUrl}
                      alt="preview"
                      style={{ maxWidth: 320, maxHeight: 320 }}
                    />
                  </div>
                )}
                {isPdf && file && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={URL.createObjectURL(file)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      PDF uploaded — open
                    </a>
                  </div>
                )}
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Saving…" : "Save order"}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  // Build headers and current values from the form inputs
                  const headers = [
                    "Account",
                    "Series",
                    "Date",
                    "Item name",
                    "Design",
                    "Stamp",
                    "Gold rate",
                    "Base metal",
                    "Size",
                    "Number of pieces",
                    "Estimated gross weight",
                    "Estimated gold weight",
                    "Estimated diamond weight",
                    "Tunch percent",
                    "Average diamond rate",
                    "Gemstone / stone weight",
                    "Craftsmanship fee",
                    "Advance payment received",
                  ];
                  // read form values from DOM since this component uses react-hook-form
                  const accountVal =
                    (
                      document.getElementById(
                        "accountId"
                      ) as HTMLSelectElement | null
                    )?.value ?? "";
                  const seriesVal =
                    (
                      document.getElementById(
                        "series"
                      ) as HTMLSelectElement | null
                    )?.value ?? "";
                  const dateVal =
                    (document.getElementById("date") as HTMLInputElement | null)
                      ?.value ?? "";
                  const itemNameVal =
                    (
                      document.getElementById(
                        "itemName"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const designVal =
                    (
                      document.getElementById(
                        "design"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const stampVal =
                    (
                      document.getElementById(
                        "stamp"
                      ) as HTMLSelectElement | null
                    )?.value ?? "";
                  const goldRateVal =
                    (
                      document.getElementById(
                        "goldRate"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const baseMetalVal =
                    (
                      document.getElementById(
                        "baseMetal"
                      ) as HTMLSelectElement | null
                    )?.value ?? "";
                  const sizeVal =
                    (document.getElementById("size") as HTMLInputElement | null)
                      ?.value ?? "";
                  const numPiecesVal =
                    (
                      document.getElementById(
                        "numberOfPieces"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const egwVal =
                    (
                      document.getElementById(
                        "estimatedGrossWeight"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const egw2Val =
                    (
                      document.getElementById(
                        "estimatedGoldWeight"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const edwVal =
                    (
                      document.getElementById(
                        "estimatedDiamondWeight"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const tunchVal =
                    (
                      document.getElementById(
                        "tunchPercent"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const adrVal =
                    (
                      document.getElementById(
                        "averageDiamondRate"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const gswVal =
                    (
                      document.getElementById(
                        "gemstoneStoneWeight"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const cfVal =
                    (
                      document.getElementById(
                        "craftsmanshipFee"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const advVal =
                    (
                      document.getElementById(
                        "advancePaymentReceived"
                      ) as HTMLSelectElement | null
                    )?.value ?? "";

                  const dataRow = [
                    accountVal,
                    seriesVal,
                    dateVal,
                    itemNameVal,
                    designVal,
                    stampVal,
                    goldRateVal,
                    baseMetalVal,
                    sizeVal,
                    numPiecesVal,
                    egwVal,
                    egw2Val,
                    edwVal,
                    tunchVal,
                    adrVal,
                    gswVal,
                    cfVal,
                    advVal,
                  ];
                  const res = exportToExcel({
                    formName: "Order Form",
                    headers,
                    dataRow,
                    includeFooterTimestamp: true,
                  });
                  if (res.ok) {
                    toast({
                      title: "Form data successfully exported to Excel.",
                    });
                  } else {
                    toast({ variant: "destructive", title: "Export failed" });
                  }
                }}
              >
                Export Data
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

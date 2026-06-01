"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import {
  queryCreate,
  accountsList,
  vouchersItemNames,
  type QueryResponse,
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
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import { exportToExcel } from "@/lib/export";
import { VouchersHeader } from "./VouchersHeader";

// Helper function to generate PDF
function generateQueryPDF(data: any) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Customer Query - ${data.accountName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #333; }
        .header p { margin: 5px 0; color: #666; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; }
        .field { margin-bottom: 12px; display: flex; }
        .field-label { font-weight: bold; width: 180px; color: #555; }
        .field-value { color: #333; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
        @media print {
          body { padding: 20px; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Customer Query Form</h1>
        <p>Query Date: ${data.queryInDate}</p>
        ${data.expiryDate ? `<p>Expiry Date: ${data.expiryDate}</p>` : ""}
      </div>
      
      <div class="section">
        <div class="section-title">Account Information</div>
        <div class="field"><span class="field-label">Account:</span><span class="field-value">${data.accountName}</span></div>
        ${data.subaccount ? `<div class="field"><span class="field-label">Subaccount:</span><span class="field-value">${data.subaccount}</span></div>` : ""}
        ${data.location ? `<div class="field"><span class="field-label">Location:</span><span class="field-value">${data.location}</span></div>` : ""}
      </div>
      
      <div class="section">
        <div class="section-title">Item Details</div>
        <div class="field"><span class="field-label">Item Name:</span><span class="field-value">${data.itemName}</span></div>
        <div class="field"><span class="field-label">Gold Carat:</span><span class="field-value">${data.goldCarat}</span></div>
        <div class="field"><span class="field-label">Size:</span><span class="field-value">${data.size}</span></div>
        ${data.gender ? `<div class="field"><span class="field-label">Gender:</span><span class="field-value">${data.gender}</span></div>` : ""}
      </div>
      
      ${
        data.deliveryType
          ? `
      <div class="section">
        <div class="section-title">Delivery Information</div>
        <div class="field"><span class="field-label">Delivery Type:</span><span class="field-value">${data.deliveryType}</span></div>
      </div>
      `
          : ""
      }
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>This is a customer query form. Order will be created after advance payment is received.</p>
      </div>
      
      <div style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Print</button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// Gold Carat options
const GOLD_CARAT_OPTIONS = ["22K", "24K", "18K", "14K", "9K"];

// Gender options
const GENDER_OPTIONS = ["Male", "Female", "Unisex"];

// Delivery Type options
const DELIVERY_TYPE_OPTIONS = [
  { label: "Home Delivery", value: "HOME" },
  { label: "Pickup", value: "PICKUP" },
  { label: "In-Store", value: "INSTORE" },
  { label: "Local Parcel", value: "LOCAL_PARCEL" },
  { label: "Jay Ambe Express Logistics", value: "JAY_AMBE" },
  { label: "Maa Bhawani Logistics", value: "MAA_BHAWANI" },
  { label: "BVC Logistics", value: "BVC" },
  { label: "Sequel Logistics", value: "SEQUEL" },
];

// Dummy item options (will be used if no masters are loaded)
const DUMMY_ITEM_OPTIONS = [
  { id: "ring", name: "Ring" },
  { id: "pendant", name: "Pendant" },
  { id: "necklace", name: "Necklace" },
];

const queryFormSchema = z.object({
  itemNameId: z.string().min(1, "Item name is required"),
  itemNameOther: z.string().optional(),
  goldCarat: z.string().min(1, "Gold carat is required"),
  size: z.string().min(1, "Size is required"),
  accountId: z.string().min(1, "Account is required"),
  subaccount: z.string().optional(),
  location: z.string().optional(),
  deliveryType: z.string().optional(),
  queryInDate: z.string().min(1, "Query in date is required"),
  gender: z.string().optional(),
  referenceImage: z.any().optional(),
  expiryDate: z.string().optional(),
});

type QueryFormValues = z.infer<typeof queryFormSchema>;

export function QueryForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [subAccounts, setSubAccounts] = useState<string[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [itemNameOptions, setItemNameOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [showOtherItemField, setShowOtherItemField] = useState(false);

  // Progressive disclosure states
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Expiry date calculation
  const [expiryDays, setExpiryDays] = useState<string>("");
  const [queryInDate, setQueryInDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QueryFormValues>({
    resolver: zodResolver(
      queryFormSchema
    ) as unknown as Resolver<QueryFormValues>,
    defaultValues: {
      itemNameId: "",
      itemNameOther: "",
      goldCarat: "",
      size: "",
      accountId: "",
      subaccount: "",
      location: "",
      deliveryType: "",
      queryInDate: new Date().toISOString().split("T")[0],
      gender: "",
      referenceImage: null,
      expiryDate: "",
    },
  });

  // Modal state for save confirmation
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedQueryId, setSavedQueryId] = useState<string | null>(null);

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

    const loadMasters = async () => {
      setLoadingMasters(true);
      try {
        const itemsResp = await vouchersItemNames();
        if (mounted && itemsResp && Array.isArray(itemsResp.item_names)) {
          setItemNameOptions(
            itemsResp.item_names.map((i: any) => ({
              id: String(i.id),
              name: i.name,
            }))
          );
        } else if (mounted) {
          // Fallback to dummy data if no masters are loaded
          setItemNameOptions(DUMMY_ITEM_OPTIONS);
        }
      } catch (err) {
        // ignore fallback to empty list
      } finally {
        if (mounted) setLoadingMasters(false);
      }
    };

    void loadAccounts();
    void loadMasters();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const onSubmit = async (values: QueryFormValues) => {
    const payload: Partial<QueryResponse> = {
      // Query-specific fields
      item_name:
        values.itemNameId !== "other"
          ? { id: values.itemNameId, name: "" }
          : undefined,
      item_name_custom:
        values.itemNameId === "other" ? values.itemNameOther : undefined,
      gold_carat: values.goldCarat,
      gender: values.gender || undefined,
      size: values.size,
      location: values.location || undefined,
      delivery_type: values.deliveryType || undefined,
      query_in_date: values.queryInDate,
      expiry_date: values.expiryDate || undefined,
      account: { id: values.accountId, account_name: "", name: "" },
      subaccount: values.subaccount || undefined,
    };

    try {
      let res: QueryResponse;
      if (file) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          if (typeof v === "object") fd.append(k, JSON.stringify(v));
          else fd.append(k, String(v));
        });
        fd.append("reference_image", file);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        res = await queryCreate(fd as unknown as Partial<QueryResponse>);
      } else {
        res = await queryCreate(payload);
      }

      toast({
        title: "Query created",
        description: "Your query has been saved successfully.",
      });

      const queryId = res?.id ?? null;
      setSavedQueryId(queryId);
      setShowSuccessModal(true);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not create query",
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

  const accountOptions = useMemo(() => {
    return accounts.map((s) => {
      const [id, name] = s.split("::");
      return { id, name };
    });
  }, [accounts]);

  const selectedAccountId = watch("accountId");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <VouchersHeader
          title="Create query"
          description="Create a new customer query for jewelry items."
        />
        <PreviousBackButton />
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowSuccessModal(false);
              router.push("/vouchers/pending-queries");
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">
              Query created successfully
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your query has been saved and is now in the pending queries list
              waiting for advance payment.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded border"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/vouchers/pending-queries");
                }}
              >
                View Pending Queries
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push(`/vouchers/new`);
                }}
              >
                Create Another Query
              </button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Customer Query Form</CardTitle>
          <CardDescription>
            Collect initial customer query information. Detailed order
            specifications will be added after advance payment is received.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Account & Location Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Account Information
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account *</Label>
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
                  {errors.accountId && (
                    <p className="text-xs text-destructive">
                      {errors.accountId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subaccount">Subaccount</Label>
                  <Input
                    id="subaccount"
                    placeholder="Optional subaccount name"
                    {...register("subaccount")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Specify a subaccount if applicable
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Delivery location"
                    {...register("location")}
                  />
                </div>
              </div>
            </section>

            {/* Item Details Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Item Details
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="itemNameId">Item Name *</Label>
                  {loadingMasters ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <select
                      id="itemNameId"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      {...register("itemNameId")}
                      onChange={(e) => {
                        setShowOtherItemField(e.target.value === "other");
                      }}
                    >
                      <option value="">Select item</option>
                      {itemNameOptions.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name}
                        </option>
                      ))}
                      <option value="other">Other (please specify)</option>
                    </select>
                  )}
                  {errors.itemNameId && (
                    <p className="text-xs text-destructive">
                      {errors.itemNameId.message}
                    </p>
                  )}
                </div>

                {showOtherItemField && (
                  <div className="space-y-2">
                    <Label htmlFor="itemNameOther">Specify Item Name *</Label>
                    <Input
                      id="itemNameOther"
                      placeholder="e.g., Brooch, Anklet, Ring custom design"
                      {...register("itemNameOther")}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("gender")}
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goldCarat">Gold Carat (KT) *</Label>
                  <select
                    id="goldCarat"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("goldCarat")}
                  >
                    <option value="">Select carat</option>
                    {GOLD_CARAT_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.goldCarat && (
                    <p className="text-xs text-destructive">
                      {errors.goldCarat.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size *</Label>
                  <Input
                    id="size"
                    placeholder="e.g., inches for bracelets/earrings"
                    {...register("size")}
                  />
                  {errors.size && (
                    <p className="text-xs text-destructive">
                      {errors.size.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Delivery Information Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Delivery Information
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deliveryType">Delivery Type</Label>
                  <select
                    id="deliveryType"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    {...register("deliveryType")}
                  >
                    <option value="">Select delivery type</option>
                    {DELIVERY_TYPE_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="queryInDate">Query In Date *</Label>
                  <Input
                    id="queryInDate"
                    type="date"
                    {...register("queryInDate")}
                  />
                  {errors.queryInDate && (
                    <p className="text-xs text-destructive">
                      {errors.queryInDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Query Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    placeholder="Query will be archived after this date if not acted upon"
                    {...register("expiryDate")}
                  />
                </div>
              </div>
            </section>

            {/* Reference Image Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Reference Image
              </h2>
              <div className="space-y-2">
                <Label htmlFor="reference_image">
                  Upload Reference Image (JPG / PNG / PDF)
                </Label>
                <input
                  id="reference_image"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  {...register("referenceImage")}
                  onChange={onFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Upload a reference image for the desired item design
                </p>
                {previewUrl && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={previewUrl}
                      alt="preview"
                      style={{ maxWidth: 320, maxHeight: 320, borderRadius: 8 }}
                    />
                  </div>
                )}
                {isPdf && file && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={URL.createObjectURL(file)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      PDF uploaded — open
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Form Actions */}
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
                {isSubmitting ? "Saving…" : "Save query"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const headers = [
                    "Account",
                    "Location",
                    "Item Name",
                    "Gender",
                    "Gold Carat",
                    "Size",
                    "Delivery Type",
                    "Query In Date",
                    "Expiry Date",
                  ];
                  const accountVal =
                    (
                      document.getElementById(
                        "accountId"
                      ) as HTMLSelectElement | null
                    )?.value ?? "";
                  const locationVal =
                    (
                      document.getElementById(
                        "location"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const itemNameVal =
                    (
                      document.getElementById(
                        "itemNameId"
                      ) as HTMLSelectElement | null
                    )?.value ?? "";
                  const genderVal =
                    (
                      document.getElementById(
                        "gender"
                      ) as HTMLSelectElement | null
                    )?.value ?? "";
                  const caratVal =
                    (
                      document.getElementById(
                        "goldCarat"
                      ) as HTMLSelectElement | null
                    )?.value ?? "";
                  const sizeVal =
                    (document.getElementById("size") as HTMLInputElement | null)
                      ?.value ?? "";
                  const deliveryVal =
                    (
                      document.getElementById(
                        "deliveryType"
                      ) as HTMLSelectElement | null
                    )?.value ?? "";
                  const queryDateVal =
                    (
                      document.getElementById(
                        "queryInDate"
                      ) as HTMLInputElement | null
                    )?.value ?? "";
                  const expiryVal =
                    (
                      document.getElementById(
                        "expiryDate"
                      ) as HTMLInputElement | null
                    )?.value ?? "";

                  const dataRow = [
                    accountVal,
                    locationVal,
                    itemNameVal,
                    genderVal,
                    caratVal,
                    sizeVal,
                    deliveryVal,
                    queryDateVal,
                    expiryVal,
                  ];

                  const res = exportToExcel({
                    formName: "Query Form",
                    headers,
                    dataRow,
                    includeFooterTimestamp: true,
                  });
                  if (res.ok) {
                    toast({
                      title: "Query form data successfully exported to Excel.",
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

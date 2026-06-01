"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  accountDetail,
  accountUpdate,
  acGroupMastersList,
  type AccountPayload,
  type ACGroupMaster,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const accountFormSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  ledgerRole: z.string().min(1, "Ledger role is required"),
  sparkAccountGroupId: z.string().min(1, "Spark Account Group is required"),
  tallyParentGroup: z.string().optional(),
  financialStatement: z.string().optional(),
  normalBalance: z.string().optional(),
  gstRegistrationType: z.string().min(1, "GST Registration Type is required"),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  openingAmount: z.string().optional(),
  openingDrCr: z.enum(["Dr", "Cr"]).optional(),
  billWiseRequired: z.enum(["YES", "NO"]).optional(),
  costCentreRequired: z.enum(["YES", "NO"]).optional(),
  exportToTally: z.enum(["YES", "NO"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  tallyLedgerNameOverride: z.string().optional(),
  teamNotice: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

const LEDGER_ROLE_OPTIONS = [
  { label: "Party", value: "Party" },
  { label: "Customer", value: "Customer" },
  { label: "Supplier", value: "Supplier" },
  { label: "Karigar", value: "Karigar" },
  { label: "Bank", value: "Bank" },
  { label: "Cash", value: "Cash" },
  { label: "Asset", value: "Asset" },
  { label: "Liability", value: "Liability" },
  { label: "Expense", value: "Expense" },
  { label: "Income", value: "Income" },
  { label: "Purchase", value: "Purchase" },
  { label: "Sale", value: "Sale" },
  { label: "Tax", value: "Tax" },
  { label: "Capital", value: "Capital" },
];

const GST_REGISTRATION_TYPE_OPTIONS = [
  { label: "Registered", value: "Registered" },
  { label: "Unregistered", value: "Unregistered" },
  { label: "Composition", value: "Composition" },
  { label: "Consumer", value: "Consumer" },
  { label: "Overseas", value: "Overseas" },
  { label: "SEZ", value: "SEZ" },
  { label: "Government", value: "Government" },
];

function compactObject<T extends Record<string, unknown>>(
  obj: T
): T | undefined {
  const entries = Object.entries(obj).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value as Record<string, unknown>).length > 0;
    }
    return true;
  });

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as T;
}

export default function AccountEditPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [sparkGroups, setSparkGroups] = useState<ACGroupMaster[]>([]);
  const [loadingSparkGroups, setLoadingSparkGroups] = useState(true);
  const [loadingAccount, setLoadingAccount] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      accountName: "",
      ledgerRole: "",
      sparkAccountGroupId: "",
      tallyParentGroup: "",
      financialStatement: "",
      normalBalance: "",
      gstRegistrationType: "",
      gstin: "",
      pan: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
      openingAmount: "",
      openingDrCr: undefined,
      billWiseRequired: undefined,
      costCentreRequired: undefined,
      exportToTally: undefined,
      status: "ACTIVE",
      tallyLedgerNameOverride: "",
      teamNotice: "",
    },
  });

  const accountId = params.id as string;

  useEffect(() => {
    let isMounted = true;

    // Load Spark Account Groups
    const loadSparkGroups = async () => {
      setLoadingSparkGroups(true);
      try {
        const data = await acGroupMastersList();
        if (isMounted) {
          setSparkGroups(
            data.filter(
              (g) => g.use_in_spark === "YES" && g.status === "Active"
            )
          );
        }
      } catch (error) {
        console.error("Failed to load spark groups:", error);
      } finally {
        if (isMounted) {
          setLoadingSparkGroups(false);
        }
      }
    };

    // Load Account Data
    const loadAccount = async () => {
      setLoadingAccount(true);
      try {
        const data = await accountDetail(accountId);
        if (isMounted) {
          setValue("accountName", data.account_name || "");
          setValue("ledgerRole", data.ledger_role || "");
          setValue("sparkAccountGroupId", data.spark_account_group?.id || "");
          setValue("tallyParentGroup", data.tally_parent_group || "");
          setValue("financialStatement", data.financial_statement || "");
          setValue("normalBalance", data.normal_balance || "");
          setValue("gstRegistrationType", data.gst_registration_type || "");
          setValue("gstin", data.tax?.gstin || "");
          setValue("pan", data.tax?.pan || "");
          setValue(
            "addressLine1",
            data.contact?.address_line?.split(",")[0] || ""
          );
          setValue(
            "addressLine2",
            data.contact?.address_line?.split(",")[1] || ""
          );
          setValue("city", data.contact?.city || "");
          setValue("state", data.contact?.state || "");
          setValue("pincode", data.contact?.pin_code || "");
          setValue("openingAmount", data.opening_balance?.amount || "");
          setValue(
            "openingDrCr",
            data.opening_balance?.amount_drcr as "Dr" | "Cr" | undefined
          );
          setValue(
            "billWiseRequired",
            data.bill_wise_required as "YES" | "NO" | undefined
          );
          setValue(
            "costCentreRequired",
            data.cost_centre_required as "YES" | "NO" | undefined
          );
          setValue(
            "exportToTally",
            data.export_to_tally as "YES" | "NO" | undefined
          );
          setValue("status", data.status as "ACTIVE" | "INACTIVE");
          setValue(
            "tallyLedgerNameOverride",
            data.tally_ledger_name_override || ""
          );
          setValue("teamNotice", data.team_notice || "");
        }
      } catch (error) {
        console.error("Failed to load account:", error);
        toast({
          variant: "destructive",
          title: "Failed to load account",
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        if (isMounted) {
          setLoadingAccount(false);
        }
      }
    };

    void loadSparkGroups();
    void loadAccount();

    return () => {
      isMounted = false;
    };
  }, [accountId, setValue, toast]);

  const selectedSparkGroupId = watch("sparkAccountGroupId");

  // Auto-fill derived fields when Spark Account Group changes
  useEffect(() => {
    if (!selectedSparkGroupId) {
      setValue("tallyParentGroup", "");
      setValue("financialStatement", "");
      setValue("normalBalance", "");
      return;
    }
    const selected = sparkGroups.find((g) => g.id === selectedSparkGroupId);
    if (selected) {
      setValue("tallyParentGroup", selected.tally_parent_group || "");
      setValue("financialStatement", selected.financial_statement || "");
      setValue("normalBalance", selected.normal_balance || "");
    }
  }, [selectedSparkGroupId, sparkGroups, setValue]);

  const onSubmit = async (values: AccountFormValues) => {
    const payload: AccountPayload = {
      account_name: values.accountName.trim(),
      ledger_role: values.ledgerRole || undefined,
      spark_account_group_id: values.sparkAccountGroupId || undefined,
      tally_parent_group: values.tallyParentGroup?.trim() || undefined,
      financial_statement: (values.financialStatement || undefined) as any,
      normal_balance: (values.normalBalance || undefined) as any,
      gst_registration_type: values.gstRegistrationType || undefined,
      bill_wise_required: values.billWiseRequired || "NO",
      cost_centre_required: values.costCentreRequired || "NO",
      export_to_tally: values.exportToTally || "YES",
      status: values.status || "ACTIVE",
      tally_ledger_name_override:
        values.tallyLedgerNameOverride?.trim() || undefined,
      team_notice: values.teamNotice?.trim() || undefined,
      tax: compactObject({
        gstin: values.gstin || undefined,
        pan: values.pan || undefined,
      }),
      contact: compactObject({
        address_line:
          [values.addressLine1?.trim(), values.addressLine2?.trim()]
            .filter(Boolean)
            .join(", ") || undefined,
        city: values.city?.trim() || undefined,
        state: values.state?.trim() || undefined,
        pin_code: values.pincode?.trim() || undefined,
      }),
      opening_balance: compactObject({
        amount: values.openingAmount || undefined,
        amount_drcr: values.openingDrCr || undefined,
      }),
    };

    try {
      await accountUpdate(accountId, payload);
      toast({
        title: "Account updated",
        description: "The account has been updated successfully.",
      });
      router.back();
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could not update account",
        description: error instanceof Error ? error.message : "Unknown error.",
      });
    }
  };

  if (loadingAccount) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/accounts/list">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back to List button - Top Left */}
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link href="/accounts/list">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Link>
      </Button>

      {/* Save button - Top Right */}
      <div className="flex items-center justify-end gap-2">
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Edit account</CardTitle>
          <CardDescription>Update the account details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountName">
                  1. Ledger / Account Name{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountName"
                  autoComplete="off"
                  placeholder="Enter account name"
                  {...register("accountName")}
                />
                {errors.accountName && (
                  <p className="text-xs text-destructive">
                    {errors.accountName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ledgerRole">
                  2. Ledger Role <span className="text-red-500">*</span>
                </Label>
                <select
                  id="ledgerRole"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register("ledgerRole")}
                >
                  <option value="">-- Select Ledger Role --</option>
                  {LEDGER_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.ledgerRole && (
                  <p className="text-xs text-destructive">
                    {errors.ledgerRole.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstRegistrationType">
                  3. GST Registration Type{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <select
                  id="gstRegistrationType"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register("gstRegistrationType")}
                >
                  <option value="">-- Select GST Registration Type --</option>
                  {GST_REGISTRATION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.gstRegistrationType && (
                  <p className="text-xs text-destructive">
                    {errors.gstRegistrationType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">4. GSTIN</Label>
                <Input
                  id="gstin"
                  placeholder="Enter GSTIN"
                  {...register("gstin")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sparkAccountGroupId">
                  5. Spark Account Group <span className="text-red-500">*</span>
                </Label>
                <select
                  id="sparkAccountGroupId"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register("sparkAccountGroupId")}
                >
                  <option value="">-- Select Spark Account Group --</option>
                  {loadingSparkGroups ? (
                    <option disabled>Loading groups...</option>
                  ) : (
                    sparkGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.sparkAccountGroupId && (
                  <p className="text-xs text-destructive">
                    {errors.sparkAccountGroupId.message}
                  </p>
                )}

                <div className="col-span-2 mt-4 grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="tallyParentGroup">
                      6. Tally Parent Group
                    </Label>
                    <Input
                      id="tallyParentGroup"
                      {...register("tallyParentGroup")}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="financialStatement">
                      7. Financial Statement
                    </Label>
                    <Input
                      id="financialStatement"
                      {...register("financialStatement")}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="normalBalance">8. Normal Balance</Label>
                    <Input
                      id="normalBalance"
                      {...register("normalBalance")}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan">9. PAN</Label>
                <Input id="pan" placeholder="Enter PAN" {...register("pan")} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine1">10. Address Line 1</Label>
                <Input
                  id="addressLine1"
                  placeholder="Street address"
                  {...register("addressLine1")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine2">11. Address Line 2</Label>
                <Input
                  id="addressLine2"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  {...register("addressLine2")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">12. City</Label>
                <Input id="city" placeholder="City" {...register("city")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">13. State</Label>
                <Input id="state" placeholder="State" {...register("state")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">14. Pincode</Label>
                <Input
                  id="pincode"
                  placeholder="Pincode"
                  {...register("pincode")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">15. Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  {...register("country")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openingAmount">16. Opening Balance</Label>
                <Input
                  id="openingAmount"
                  type="number"
                  placeholder="Enter opening balance"
                  {...register("openingAmount")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openingDrCr">17. Dr / Cr</Label>
                <select
                  id="openingDrCr"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register("openingDrCr")}
                >
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billWiseRequired">
                  18. Bill-wise Required?
                </Label>
                <select
                  id="billWiseRequired"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register("billWiseRequired")}
                >
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costCentreRequired">
                  19. Cost Centre Required?
                </Label>
                <select
                  id="costCentreRequired"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register("costCentreRequired")}
                >
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exportToTally">20. Export to Tally?</Label>
                <select
                  id="exportToTally"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register("exportToTally")}
                >
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">21. Active?</Label>
                <select
                  id="status"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register("status")}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tallyLedgerNameOverride">
                  22. Tally Ledger Name Override
                </Label>
                <Input
                  id="tallyLedgerNameOverride"
                  placeholder="Override Tally ledger name"
                  {...register("tallyLedgerNameOverride")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="teamNotice">23. Team Notes</Label>
                <Textarea
                  id="teamNotice"
                  placeholder="Add team notes here..."
                  {...register("teamNotice")}
                />
              </div>
            </div>

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
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

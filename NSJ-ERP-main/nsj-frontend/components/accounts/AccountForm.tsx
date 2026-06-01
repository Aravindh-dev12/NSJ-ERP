"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { z } from "zod";
import {
  accountCreate,
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
import { AccountsHeader } from "./AccountsHeader";

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
  phone: z.string().optional(),
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

export function AccountForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [sparkGroups, setSparkGroups] = useState<ACGroupMaster[]>([]);
  const [loadingSparkGroups, setLoadingSparkGroups] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setError,
    setValue,
    control,
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
      phone: "",
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

  useEffect(() => {
    let isMounted = true;

    // Load Spark Account Groups
    const loadSparkGroups = async () => {
      setLoadingSparkGroups(true);
      try {
        const data = await acGroupMastersList();
        if (isMounted) {
          // Only show Active groups that can be used in Spark
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

    void loadSparkGroups();

    return () => {
      isMounted = false;
    };
  }, []);

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
        phone: values.phone?.trim() || undefined,
        address_line:
          [values.addressLine1?.trim(), values.addressLine2?.trim()]
            .filter(Boolean)
            .join(", ") || undefined,
        city: values.city?.trim() || undefined,
        state: values.state?.trim() || undefined,
        pin_code: values.pincode?.trim() || undefined,
        country: values.country?.trim() || undefined,
      }),
      opening_balance: compactObject({
        amount: values.openingAmount || undefined,
        amount_drcr: values.openingDrCr || undefined,
      }),
    };

    try {
      await accountCreate(payload);
      toast({
        title: "Account created",
        description: "The account has been saved successfully.",
      });
      const basePath = window.location.pathname.startsWith(
        "/masters-hub/account-master"
      )
        ? "/masters-hub/account-master"
        : "/accounts";
      router.push(`${basePath}/list`);
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could not create account",
        description: error instanceof Error ? error.message : "Unknown error.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <AccountsHeader
        title="Add new account"
        description="Capture account master data, banking details, and opening balances."
      />

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Fill in the details below to register a new account in NSJ.
          </CardDescription>
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

              <div className="space-y-2">
                <Label htmlFor="phone">10. Phone No</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <div className="w-full">
                      <PhoneInput
                        country="in"
                        value={field.value}
                        onChange={field.onChange}
                        inputClass="!w-[calc(100%-50px)] rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        containerClass="!w-full"
                        buttonClass="border border-input bg-background rounded-l-lg"
                        dropdownClass="bg-background border border-input shadow-lg"
                        searchClass="bg-background"
                        inputProps={{ id: "phone", name: "phone" }}
                      />
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine1">11. Address Line 1</Label>
                <Input
                  id="addressLine1"
                  placeholder="Street address"
                  {...register("addressLine1")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine2">12. Address Line 2</Label>
                <Input
                  id="addressLine2"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  {...register("addressLine2")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">13. City</Label>
                <Input id="city" placeholder="City" {...register("city")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">14. State</Label>
                <Input id="state" placeholder="State" {...register("state")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">15. Pincode</Label>
                <Input
                  id="pincode"
                  placeholder="Pincode"
                  {...register("pincode")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">16. Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  {...register("country")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openingAmount">17. Opening Balance</Label>
                <Input
                  id="openingAmount"
                  type="number"
                  placeholder="Enter opening balance"
                  {...register("openingAmount")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openingDrCr">18. Dr / Cr</Label>
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
                  19. Bill-wise Required?
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
                  20. Cost Centre Required?
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
                <Label htmlFor="exportToTally">21. Export to Tally?</Label>
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
                <Label htmlFor="status">22. Active?</Label>
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
                  23. Tally Ledger Name Override
                </Label>
                <Input
                  id="tallyLedgerNameOverride"
                  placeholder="Override Tally ledger name"
                  {...register("tallyLedgerNameOverride")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="teamNotice">24. Team Notes</Label>
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
                {isSubmitting ? "Saving…" : "Save account"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

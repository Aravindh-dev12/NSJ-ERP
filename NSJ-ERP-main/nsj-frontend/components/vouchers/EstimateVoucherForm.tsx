"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  accountsDropdown,
  estimateCreate,
  estimateUpdate,
  estimateDetail,
  estimateGeneratePDF,
  estimateGenerateLandscapePDF,
  subaccountsList,
  getSalesQuery,
  getVouchersMaster,
  goldCaratsList,
  autoCompleteStep,
  activeUsersList,
} from "@/lib/backend";
import { getActiveRate } from "@/lib/goldRateApi";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import {
  GoldQualityInput,
  type GoldQualityOption,
} from "@/components/ui/gold-quality-input";

// TypeScript interfaces
export interface LineItem {
  id: string;
  particulars: string;
  shape: string;
  colour: string;
  clarity: string;
  pc: number | null;
  weight: number | null;
  unit: "CT" | "GM" | "";
  rate: number | null;
  amount: number;
  isCompulsory?: boolean; // Flag for permanent line items
  rawMaterial?:
    | "Diamond"
    | "Gemstone"
    | "Gold"
    | "Craftsmanship"
    | "Other"
    | ""; // Raw material type
}

export interface EstimateVoucher {
  id?: string;
  account: { id: string; account_name: string };
  sub_account_record?: {
    id: string;
    sub_account_name: string;
    name: string;
    phone_number?: string;
    email?: string;
  };
  sub_account_record_id?: string;
  item_name: string;
  gold_quality?: string;
  size_details?: string;
  date: string;
  expiry_date?: string;
  nsj_representative?: string;
  line_items: LineItem[];
  total_taxable_value: number;
  gst_amount: number;
  discount_amount: number;
  grand_total: number;
  created_at?: string;
  updated_at?: string;
}

interface EstimateVoucherFormProps {
  initialData?: EstimateVoucher;
  onSuccess?: () => void;
  estimateId?: string;
  salesQueryId?: string;
  saleId?: string;
  prefilledJewelryType?: string;
  prefilledSizeDetails?: string;
  prefilledAccountId?: string;
  prefilledAccountName?: string;
  prefilledSubAccount?: string;
  prefilledSubAccountName?: string;
  prefilledPhoneNumber?: string;
  prefilledSalesPersonName?: string;
  prefilledOrderId?: string;
  prefilledGoldQuality?: string;
  disableAccountAndItem?: boolean;
}

export function EstimateVoucherForm({
  initialData,
  onSuccess,
  estimateId,
  salesQueryId,
  saleId,
  prefilledJewelryType,
  prefilledSizeDetails,
  prefilledAccountId,
  prefilledAccountName,
  prefilledSubAccount,
  prefilledSubAccountName,
  prefilledPhoneNumber,
  prefilledSalesPersonName,
  prefilledOrderId,
  prefilledGoldQuality,
  disableAccountAndItem = false,
}: EstimateVoucherFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Form state
  const [accountId, setAccountId] = useState(
    initialData?.account?.id || prefilledAccountId || ""
  );
  const [subAccountRecordId, setSubAccountRecordId] = useState(
    initialData?.sub_account_record?.id ||
      initialData?.sub_account_record_id ||
      prefilledSubAccount ||
      ""
  );
  const [manualSubAccount, setManualSubAccount] = useState(
    initialData?.sub_account_record?.sub_account_name ||
      prefilledSubAccountName ||
      ""
  );
  const [subAccountName, setSubAccountName] = useState(
    initialData?.sub_account_record?.sub_account_name ||
      prefilledSubAccountName ||
      ""
  );
  const [salesPersonName, setSalesPersonName] = useState(
    (initialData as any)?.sales_person_name || prefilledSalesPersonName || ""
  );

  console.log("Initial state:", {
    initialDataSubAccount: initialData?.sub_account_record,
    prefilledSubAccount,
    prefilledSubAccountName,
    subAccountRecordIdInitialState: subAccountRecordId,
    subAccountNameInitialState: subAccountName,
    salesPersonNameInitialState: salesPersonName,
  });

  const [itemName, setItemName] = useState(
    initialData?.item_name || prefilledJewelryType || ""
  );
  const [goldQuality, setGoldQuality] = useState(
    initialData?.gold_quality || prefilledGoldQuality || ""
  );
  const [goldQualityOptions, setGoldQualityOptions] = useState<
    GoldQualityOption[]
  >([]);
  const [sizeDetails, setSizeDetails] = useState(
    initialData?.size_details || prefilledSizeDetails || ""
  );
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState(
    (initialData as any)?.expiry_date || ""
  );
  const [nsjRepresentative, setNsjRepresentative] = useState(
    (initialData as any)?.nsj_representative || ""
  );
  // Initialize with compulsory line items if creating new estimate
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (initialData?.line_items && initialData.line_items.length > 0) {
      return initialData.line_items;
    }
    // Add compulsory line items for new estimates
    return [
      {
        id: `gold-${Date.now()}`,
        particulars: "Gold",
        shape: "",
        colour: "",
        clarity: "",
        pc: null,
        weight: null,
        unit: "GM",
        rate: null,
        amount: 0,
        isCompulsory: true,
        rawMaterial: "Gold",
      },
      {
        id: `craftsmanship-${Date.now() + 1}`,
        particulars: "Craftsmanship Fee",
        shape: "",
        colour: "",
        clarity: "",
        pc: null,
        weight: null,
        unit: "",
        rate: null,
        amount: 0,
        isCompulsory: true,
        rawMaterial: "Craftsmanship",
      },
    ];
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Options for item name dropdown
  const [itemOptions, setItemOptions] = useState<
    { value: string; label: string }[]
  >([
    { value: "Ring", label: "Ring" },
    { value: "Earring", label: "Earring" },
    { value: "Necklace", label: "Necklace" },
    { value: "Bracelet", label: "Bracelet" },
    { value: "Bangle", label: "Bangle" },
    { value: "Pendant", label: "Pendant" },
    { value: "Anklet", label: "Anklet" },
    { value: "Chain", label: "Chain" },
  ]);

  // Data loading states
  const [accounts, setAccounts] = useState<
    {
      id: string;
      name: string;
      contact?: {
        phone?: string | null;
      } | null;
    }[]
  >([]);
  const [subAccounts, setSubAccounts] = useState<
    {
      id: string;
      sub_account_name: string;
      phone_number?: string | null;
    }[]
  >([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [teamMembers, setTeamMembers] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Discount state (percentage)
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Track loaded sales lead ID (for redirect after editing)
  const [loadedSalesQueryId, setLoadedSalesQueryId] = useState<string | null>(
    null
  );

  // Live rates state - fetched from Daily Rate Update dashboard
  const [liveRates, setLiveRates] = useState<{
    gold_24k_999?: string;
    gold_24k_995?: string;
    gold_22k?: string;
    gold_18k?: string;
    gold_14k?: string;
  }>({});

  // Unit conversion helper functions
  const convertGramsToCarats = (grams: number): number => {
    return Number((grams * 5).toFixed(3));
  };

  const convertCaratsToGrams = (carats: number): number => {
    return Number((carats * 0.2).toFixed(3));
  };

  // Load item name options from vouchers master
  useEffect(() => {
    let mounted = true;
    const fetchOptions = async () => {
      try {
        const res = await getVouchersMaster();
        if (mounted && res && res.item_names) {
          setItemOptions(
            res.item_names.map((item) => ({
              value: item.name,
              label: item.name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load item name options", err);
        // Fallback to defaults if fetch fails - already set in initial state
      }
    };
    fetchOptions();
    return () => {
      mounted = false;
    };
  }, []);

  // Load gold carat options from master
  useEffect(() => {
    const fetchGoldCarats = async () => {
      try {
        const carats = await goldCaratsList();
        if (carats.length > 0) {
          setGoldQualityOptions(
            carats.map((c) => ({ value: c.name, label: c.name }))
          );
        }
      } catch {
        // keep whatever defaults were set
      }
    };
    void fetchGoldCarats();
  }, []);

  // Fetch gold rates from Daily Rate Update dashboard
  useEffect(() => {
    let mounted = true;
    const fetchRates = async () => {
      try {
        const rates = await getActiveRate();
        if (mounted) {
          setLiveRates(rates);
          console.log(
            "Gold rates loaded from Daily Rate Update dashboard:",
            rates
          );
        }
      } catch (err) {
        console.error("Failed to fetch gold rates from dashboard:", err);
      }
    };
    void fetchRates();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-populate gold rate when gold quality changes (from Daily Rate Update dashboard)
  useEffect(() => {
    if (!goldQuality) return;

    // Extract carat value from gold quality (e.g., "24K" -> 24)
    const caratMatch = goldQuality.match(/(\d+)/);
    if (!caratMatch) return;

    const carat = parseInt(caratMatch[1], 10);
    let ratePerGram = 0;

    // Fetch rate from Daily Rate Update dashboard based on carat
    if (carat === 24) {
      ratePerGram = parseFloat(
        liveRates.gold_24k_999 || liveRates.gold_24k_995 || "0"
      );
    } else if (carat === 22) {
      ratePerGram = parseFloat(liveRates.gold_22k || "0");
    } else if (carat === 18) {
      ratePerGram = parseFloat(liveRates.gold_18k || "0");
    } else if (carat === 14) {
      ratePerGram = parseFloat(liveRates.gold_14k || "0");
    }

    if (ratePerGram > 0) {
      setLineItems((prevItems) =>
        prevItems.map((item) => {
          if (item.rawMaterial === "Gold") {
            return {
              ...item,
              rate: ratePerGram,
              amount: item.weight
                ? Number((item.weight * ratePerGram).toFixed(2))
                : 0,
            };
          }
          return item;
        })
      );
    }
  }, [goldQuality, liveRates]);

  // Load accounts dropdown
  useEffect(() => {
    let mounted = true;
    const loadAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const data = await accountsDropdown();
        if (!mounted) return;

        // Ensure pre-filled account is in the list
        if (prefilledAccountId && prefilledAccountName) {
          const exists = data.some(
            (acc) => String(acc.id) === String(prefilledAccountId)
          );
          if (!exists) {
            console.log(
              "Prefilled account not in list, adding manually:",
              prefilledAccountId,
              prefilledAccountName
            );
            data.push({ id: prefilledAccountId, name: prefilledAccountName });
          }
        }

        setAccounts(data);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Unable to load accounts",
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        if (mounted) setLoadingAccounts(false);
      }
    };

    void loadAccounts();

    return () => {
      mounted = false;
    };
  }, [toast]);

  // Load team members for NSJ Representative dropdown
  useEffect(() => {
    let mounted = true;
    const loadTeamMembers = async () => {
      setLoadingTeamMembers(true);
      try {
        const data = await activeUsersList();
        if (!mounted) return;
        // Filter out users with empty names to prevent white space in dropdown
        const filteredData = data.filter(
          (user) => user.name && user.name.trim() !== ""
        );
        setTeamMembers(filteredData);
      } catch (err) {
        console.error("Failed to load team members:", err);
        // Don't show toast for this, just log error
      } finally {
        if (mounted) setLoadingTeamMembers(false);
      }
    };

    void loadTeamMembers();

    return () => {
      mounted = false;
    };
  }, []);

  // Load Sales Lead details if creating a new estimate from a query
  useEffect(() => {
    if (!salesQueryId || estimateId) return;

    let mounted = true;
    const loadQuery = async () => {
      try {
        const query = (await getSalesQuery(salesQueryId)) as any;
        if (!mounted) return;

        console.log("Loaded Sales Lead for prefill:", query);

        // Prefill image if available
        if (query.reference_image || query.image || query.image_url) {
          const imgUrl =
            query.reference_image || query.image || query.image_url;
          setImagePreview(
            imgUrl.startsWith("http")
              ? imgUrl
              : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${imgUrl}`
          );
        }

        // Prefill Account from Sales Lead (if not already prefilled via props)
        if (!prefilledAccountId && query.account?.id) {
          setAccountId(String(query.account.id));
        }

        // Prefill Sub Account from Sales Lead
        if (query.sub_account_record?.id) {
          setSubAccountRecordId(String(query.sub_account_record.id));
        } else if (query.sub_account && !prefilledSubAccount) {
          setSubAccountName(query.sub_account);
        }

        // Prefill Gold Quality from Sales Lead
        if (query.gold_quality_master?.id) {
          setGoldQuality(query.gold_quality_master.name || "");
        } else if (query.gold_quality && !goldQuality) {
          setGoldQuality(query.gold_quality);
        }

        // Prefill item name if not already set
        if (
          !itemName &&
          (query.item_name?.name ||
            query.jewellery_type ||
            query.item_name_custom)
        ) {
          const rawName =
            query.item_name?.name ||
            query.jewellery_type ||
            query.item_name_custom;
          if (rawName) {
            const formatted =
              rawName.trim().charAt(0).toUpperCase() +
              rawName.trim().slice(1).toLowerCase();
            setItemName(formatted);
          }
        }

        // Prefill Size Details from Sales Lead
        if (query.size_details && !sizeDetails) {
          setSizeDetails(query.size_details);
        }

        // Prefill Sales Person Name from Sales Lead
        if (query.sales_person && !salesPersonName) {
          setSalesPersonName(query.sales_person);
          console.log(
            "Prefilled sales_person_name from sales lead:",
            query.sales_person
          );
        }

        // Prefill other fields if needed, e.g. account handled by props but good to verify
      } catch (err) {
        console.error("Failed to load sales lead details:", err);
      }
    };

    void loadQuery();

    return () => {
      mounted = false;
    };
  }, [salesQueryId, estimateId, itemName]);

  // Auto-fill item name when account is selected (only if not prefilled)
  useEffect(() => {
    // Don't auto-fill if we have a prefilled jewelry type from sales lead or if we are editing an existing estimate
    if (prefilledJewelryType || estimateId) {
      return;
    }

    // IMMEDIATELY clear item name when account changes (before async fetch)
    setItemName("");

    if (!accountId) {
      return;
    }

    let mounted = true;
    const loadItemName = async () => {
      try {
        // Fetch sub-accounts for the selected account
        const subAccounts = await subaccountsList({ account: accountId });
        if (!mounted) return;

        console.log("Account ID:", accountId);
        console.log("Sub-accounts response:", subAccounts);

        // Filter sub-accounts that belong to this specific account
        const matchingSubAccounts = subAccounts.results?.filter((sub: any) => {
          // Check if the sub-account's account field matches our accountId
          const subAccountId =
            typeof sub.account === "string" ? sub.account : sub.account?.id;
          console.log("Comparing:", subAccountId, "with", accountId);
          return subAccountId === accountId;
        });

        console.log("Matching sub-accounts:", matchingSubAccounts);

        // Get the first matching sub-account's item name (if exists)
        if (matchingSubAccounts && matchingSubAccounts.length > 0) {
          const firstSubAccount = matchingSubAccounts[0];
          if (firstSubAccount.item_name) {
            console.log("Setting item name:", firstSubAccount.item_name);
            setItemName(firstSubAccount.item_name);
          }
          // If no item name, it stays blank (already cleared above)
        }
        // If no sub-account, it stays blank (already cleared above)
      } catch (err) {
        console.error("Failed to load item name:", err);
        // On error, it stays blank (already cleared above)
      }
    };

    void loadItemName();

    return () => {
      mounted = false;
    };
  }, [accountId]);

  // Fetch sub-accounts when account changes (for dropdown)
  useEffect(() => {
    if (!accountId) {
      setSubAccounts([]);
      // Don't clear subAccountRecordId or manualSubAccount when editing an estimate
      if (!estimateId) {
        setSubAccountRecordId("");
        setManualSubAccount("");
      }
      return;
    }

    let mounted = true;
    const fetchSubAccounts = async () => {
      try {
        const subAccountsData = await subaccountsList({ account: accountId });
        if (!mounted) return;

        // Filter sub-accounts that belong to this specific account and map to required format
        const matchingSubAccounts = (
          subAccountsData.results?.filter((sub: any) => {
            const subAccountId =
              typeof sub.account === "string" ? sub.account : sub.account?.id;
            return subAccountId === accountId;
          }) || []
        ).map((sub) => ({
          id: sub.id,
          sub_account_name: sub.sub_account_name || "Unknown",
          phone_number: sub.phone_number,
        }));

        console.log("Loaded sub-accounts for account:", {
          accountId,
          count: matchingSubAccounts.length,
          subAccounts: matchingSubAccounts,
          hasSubAccounts: matchingSubAccounts.length > 0,
          subAccountRecordIdBeforeCheck: subAccountRecordId,
        });

        setSubAccounts(matchingSubAccounts);

        // If we're editing an estimate and have a subAccountRecordId, ensure it's preserved
        // The subAccountName is already set from the estimate data, so we just need to
        // make sure the ID isn't lost
        if (estimateId && subAccountRecordId) {
          console.log(
            "Edit mode: Preserving subAccountRecordId",
            subAccountRecordId
          );
        }

        // CRITICAL FIX: After loading sub-accounts, verify the subAccountRecordId is still valid
        // If it exists in the newly loaded list, keep it selected and update the name
        // If it doesn't exist, we still keep the ID set (for display purposes or manual entry)
        if (subAccountRecordId) {
          const isInList = matchingSubAccounts.find(
            (sub) => String(sub.id) === String(subAccountRecordId)
          );
          if (isInList) {
            console.log(
              "✓ Sub-account ID found in dropdown, keeping it selected:",
              subAccountRecordId
            );
            // Also ensure the name is set correctly
            if (
              isInList.sub_account_name &&
              subAccountName !== isInList.sub_account_name
            ) {
              setSubAccountName(isInList.sub_account_name);
              console.log(
                "Updated subAccountName from loaded data:",
                isInList.sub_account_name
              );
            }
            // CRITICAL: Re-set the subAccountRecordId to ensure dropdown shows it as selected
            // This handles the race condition where estimate data loads before sub-accounts
            setSubAccountRecordId(subAccountRecordId);
            console.log(
              "Re-affirmed subAccountRecordId selection for dropdown"
            );
          } else {
            console.log(
              "⚠ Sub-account ID not found in dropdown, but keeping it set:",
              subAccountRecordId
            );
            // Keep the ID set - user can see it was previously selected
          }
        } else {
          console.log("No subAccountRecordId set yet");
        }
      } catch (err) {
        console.error("Failed to load sub-accounts:", err);
        setSubAccounts([]);
      }
    };

    void fetchSubAccounts();

    return () => {
      mounted = false;
    };
  }, [accountId, estimateId]);

  // Load estimate data when estimateId is provided (for editing)
  useEffect(() => {
    if (!estimateId) return;

    let mounted = true;
    const loadEstimate = async () => {
      try {
        const data = await estimateDetail(estimateId);
        if (!mounted) return;

        console.log("Loaded estimate data:", data);

        // Populate form fields from loaded data
        setAccountId(data.account?.id || data.account_id || "");

        // Populate form fields from loaded data
        setAccountId(data.account?.id || data.account_id || "");

        // Handle item name (handle various possible field locations and casing)
        const rawItemName =
          data.item_name ||
          data.jewellery_type ||
          data.jewellery_details?.jewellery_type ||
          data.sales_query?.jewellery_type ||
          // Also check nested sales lead details which might be in different formats
          data.sales_query_details?.jewellery_type ||
          "";

        let formattedItemName = "";
        if (rawItemName) {
          // Normalize to Title Case (e.g., "bangle" -> "Bangle") to match dropdown values
          formattedItemName = rawItemName.trim();
          if (formattedItemName.length > 0) {
            formattedItemName =
              formattedItemName.charAt(0).toUpperCase() +
              formattedItemName.slice(1).toLowerCase();
          }
        }

        setItemName(formattedItemName);
        console.log("Setting item name:", {
          raw: rawItemName,
          formatted: formattedItemName,
        });

        // Set image preview if available
        // Set image preview if available
        if (data.product_image || data.image || data.image_url) {
          const rawUrl = data.product_image || data.image || data.image_url;
          // Handle relative URLs (starting with /media or just /)
          if (
            rawUrl &&
            (rawUrl.startsWith("/media") || rawUrl.startsWith("/"))
          ) {
            // Use environment variable or fallback to production URL if needed,
            // but usually API_BASE_URL logic handles similar things.
            // Here we just want to prepend the origin if it's missing.
            // We can use the process.env.NEXT_PUBLIC_API_BASE_URL which usually includes /api
            // But images are usually served from root or media root.

            // Simplest fix: Prepend the base URL origin if it's a relative path
            const baseUrl =
              process.env.NEXT_PUBLIC_API_BASE_URL ||
              "https://nsj-backend-production.up.railway.app";
            // Remove /api suffix if present to get the root
            const rootUrl = baseUrl.replace(/\/api\/?$/, "");
            setImagePreview(`${rootUrl}${rawUrl}`);
          } else {
            setImagePreview(rawUrl);
          }
        }

        setDate(data.date || new Date().toISOString().split("T")[0]);
        setDiscountPercent(data.discount_percent || 0);

        // Set expiry date from estimate data
        if ((data as any).expiry_date) {
          setExpiryDate((data as any).expiry_date);
        }

        // Set NSJ representative from estimate data
        if ((data as any).nsj_representative) {
          setNsjRepresentative((data as any).nsj_representative);
        }

        // Set gold quality from estimate data
        if (data.gold_quality) {
          setGoldQuality(data.gold_quality);
        }

        // Set size details from estimate data
        if (data.size_details) {
          setSizeDetails(data.size_details);
        }

        // Set subaccount from estimate data
        if (data.sub_account_record?.id) {
          // Case 1: Sub-account is linked via record ID (dropdown selection)
          setSubAccountRecordId(String(data.sub_account_record.id));
          setSubAccountName(data.sub_account_record.sub_account_name || "");
          console.log(
            "Loaded sub-account from record:",
            data.sub_account_record
          );
        } else if (data.sub_account) {
          // Case 2: Sub-account was entered manually as text
          setManualSubAccount(data.sub_account);
          setSubAccountName(data.sub_account);
          console.log("Loaded sub-account from text field:", data.sub_account);
        }

        const loadedSubAccountName =
          data.sub_account_record?.sub_account_name || data.sub_account || "";
        if (loadedSubAccountName) {
          setSubAccountName(loadedSubAccountName);
        }

        // Load sales person name from estimate or sales lead
        const loadedSalesPersonName =
          (data as any).sales_person_name ||
          data.sales_query?.sales_person ||
          data.sales_query_details?.sales_person ||
          "";
        if (loadedSalesPersonName && !salesPersonName) {
          setSalesPersonName(loadedSalesPersonName);
          console.log(
            "Loaded sales_person_name from estimate:",
            loadedSalesPersonName
          );
        }

        console.log("Sub-account loaded from estimate:", {
          subAccountRecordId: data.sub_account_record?.id,
          manualSubAccount: data.sub_account,
          subAccountName: loadedSubAccountName,
          subAccountRecordExists: !!data.sub_account_record,
          hasSubAccounts: subAccounts.length > 0,
        });

        // Populate line items
        if (data.line_items && data.line_items.length > 0) {
          const mappedLineItems = data.line_items.map((item: any) => {
            const particulars = item.particulars || "";
            const rawMaterial = item.raw_material || particulars;

            // Infer compulsory status from particulars or raw_material
            const isCompulsory =
              item.is_compulsory ||
              rawMaterial === "Gold" ||
              rawMaterial === "Craftsmanship" ||
              particulars === "Gold" ||
              particulars === "Craftsmanship Fee";

            let normalizedRawMaterial = rawMaterial;
            if (
              rawMaterial === "Craftsmanship Fee" ||
              particulars === "Craftsmanship Fee" ||
              rawMaterial === "Craftsmanship"
            ) {
              normalizedRawMaterial = "Craftsmanship";
            } else if (rawMaterial === "Gold" || particulars === "Gold") {
              normalizedRawMaterial = "Gold";
            }

            // Map old unit values to new backend choices
            let normalizedUnit = item.unit || "";
            if (normalizedUnit === "per gram") normalizedUnit = "GM";
            if (normalizedUnit === "per piece") normalizedUnit = "PC";

            return {
              id: item.id || `item-${Date.now()}-${Math.random()}`,
              particulars: particulars,
              shape: item.shape || "",
              colour: item.colour || "",
              clarity: item.clarity || "",
              pc: item.pc,
              weight: item.weight,
              unit: normalizedUnit,
              rate: item.rate,
              amount: Number(item.amount || 0),
              isCompulsory: isCompulsory,
              rawMaterial: normalizedRawMaterial || "",
            };
          });
          setLineItems(mappedLineItems);
        }

        // Capture sales_query_id for redirect after editing
        // Check multiple possible locations for the ID (handling various backend responses)
        const sqId =
          data.sales_query_id ||
          data.sales_query?.id ||
          data.sales_query_details?.id ||
          data.query_id ||
          data.linked_query_id;

        if (sqId) {
          setLoadedSalesQueryId(sqId);
          console.log("Captured Sales Lead ID for redirect:", sqId);
        } else {
          console.warn(
            "No Sales Lead ID found in estimate data for redirect:",
            data
          );
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to load estimate",
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    };

    void loadEstimate();

    return () => {
      mounted = false;
    };
  }, [estimateId, toast]);

  // Add new line item (variable raw material)
  const handleAddLineItem = () => {
    const newLineItem: LineItem = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      particulars: "",
      shape: "",
      colour: "",
      clarity: "",
      pc: null,
      weight: null,
      unit: "",
      rate: null,
      amount: 0,
      isCompulsory: false,
      rawMaterial: "",
    };
    // Insert new item before first compulsory item (Gold)
    const firstCompulsoryIndex = lineItems.findIndex(
      (item) => item.isCompulsory
    );
    if (firstCompulsoryIndex !== -1) {
      const updatedItems = [...lineItems];
      updatedItems.splice(firstCompulsoryIndex, 0, newLineItem);
      setLineItems(updatedItems);
    } else {
      setLineItems([...lineItems, newLineItem]);
    }
  };

  // Delete line item (prevent deletion of compulsory items)
  const handleDeleteLineItem = (id: string) => {
    const item = lineItems.find((item) => item.id === id);
    if (item?.isCompulsory) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description:
          "Gold and Craftsmanship Fee are compulsory line items and cannot be removed.",
      });
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  // Update line item field with automatic amount calculation and unit conversion
  const handleLineItemChange = useCallback(
    (id: string, field: keyof LineItem, value: string | number | null) => {
      setLineItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id !== id) return item;

          const updatedItem = { ...item, [field]: value };

          // Handle raw material selection - auto-set unit and particulars
          if (field === "rawMaterial") {
            const rawMaterial = value as string;
            updatedItem.rawMaterial = rawMaterial as any;

            if (rawMaterial === "Diamond") {
              updatedItem.unit = "CT";
              updatedItem.particulars = "Diamond";
            } else if (rawMaterial === "Gemstone") {
              updatedItem.unit = "CT";
              updatedItem.particulars = "Gemstone";
            } else if (rawMaterial === "Gold") {
              updatedItem.unit = "GM";
              updatedItem.particulars = "Gold";
            } else if (rawMaterial === "Other") {
              // For "Other", don't auto-set - let user enter custom text
              updatedItem.unit = "";
              updatedItem.particulars = ""; // Clear to allow custom input
            }
          }

          // Automatically calculate amount if weight or rate changes
          if (field === "weight" || field === "rate") {
            const weight = field === "weight" ? (value as number) : item.weight;
            const rate = field === "rate" ? (value as number) : item.rate;

            if (weight !== null && rate !== null && weight > 0 && rate > 0) {
              updatedItem.amount = Number((weight * rate).toFixed(2));
            }
          }

          return updatedItem;
        })
      );
    },
    []
  );

  // Calculate total taxable value (sum of all line item amounts)
  const totalTaxableValue = useMemo(() => {
    const value = lineItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    return Number.isFinite(value) ? value : 0;
  }, [lineItems]);

  // Calculate GST at 3%
  const gstAmount = useMemo(() => {
    const value = totalTaxableValue * 0.03;
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  }, [totalTaxableValue]);

  // Calculate subtotal (taxable + GST)
  const subtotal = useMemo(() => {
    const value = totalTaxableValue + gstAmount;
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  }, [totalTaxableValue, gstAmount]);

  // Calculate discount amount from percentage
  const discountAmount = useMemo(() => {
    const value = (subtotal * (discountPercent || 0)) / 100;
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  }, [subtotal, discountPercent]);

  // Calculate grand total (subtotal - discount)
  const grandTotal = useMemo(() => {
    const value = subtotal - discountAmount;
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  }, [subtotal, discountAmount]);

  // Validation function for line items
  const validateLineItems = useCallback(() => {
    const errors: Record<string, string> = {};

    // Validate minimum one line item exists
    if (lineItems.length === 0) {
      errors.lineItems = "At least one line item is required";
      return errors;
    }

    // Check that compulsory items (Gold and Craftsmanship Fee) exist
    const hasGold = lineItems.some(
      (item) => item.isCompulsory && item.rawMaterial === "Gold"
    );
    const hasCraftsmanship = lineItems.some(
      (item) => item.isCompulsory && item.rawMaterial === "Craftsmanship"
    );

    if (!hasGold) {
      errors.compulsoryGold =
        "Gold is a compulsory line item and must be included";
    }
    if (!hasCraftsmanship) {
      errors.compulsoryCraftsmanship =
        "Craftsmanship Fee is a compulsory line item and must be included";
    }

    lineItems.forEach((item, index) => {
      const hasWeightAndRate =
        item.weight !== null &&
        item.weight > 0 &&
        item.rate !== null &&
        item.rate > 0;
      const hasAmount = item.amount > 0;

      // Validate compulsory items cannot be left blank
      if (item.isCompulsory) {
        if (!item.particulars.trim()) {
          errors[`lineItem_${item.id}_particulars`] =
            "This compulsory field cannot be left blank";
        }
        if (item.weight === null || item.weight <= 0) {
          errors[`lineItem_${item.id}_weight`] =
            "Weight is required for compulsory items";
        }
        if (item.rate === null || item.rate <= 0) {
          errors[`lineItem_${item.id}_rate`] =
            "Rate is required for compulsory items";
        }
      }

      // Validate Particulars required if Weight and Rate provided
      if (hasWeightAndRate && !item.particulars.trim()) {
        errors[`lineItem_${item.id}_particulars`] =
          "Particulars field is required for line items with weight and rate";
      }

      // Validate numeric fields contain valid numbers
      if (item.weight !== null && (isNaN(item.weight) || item.weight < 0)) {
        errors[`lineItem_${item.id}_weight`] =
          "Weight must be a valid positive number";
      }

      if (item.rate !== null && (isNaN(item.rate) || item.rate < 0)) {
        errors[`lineItem_${item.id}_rate`] =
          "Rate must be a valid positive number";
      }

      if (item.pc !== null && (isNaN(item.pc) || item.pc < 0)) {
        errors[`lineItem_${item.id}_pc`] = "PC must be a valid positive number";
      }

      if (isNaN(item.amount) || item.amount < 0) {
        errors[`lineItem_${item.id}_amount`] =
          "Amount must be a valid positive number";
      }

      // Validate correct unit is displayed based on raw material
      if (item.rawMaterial === "Diamond" || item.rawMaterial === "Gemstone") {
        if (item.unit !== "CT") {
          errors[`lineItem_${item.id}_unit`] =
            "Unit must be Carats (CT) for diamonds and gemstones";
        }
      } else if (item.rawMaterial === "Gold") {
        if (item.unit !== "GM") {
          errors[`lineItem_${item.id}_unit`] =
            "Unit must be Grams (GM) for gold";
        }
      }
    });

    return errors;
  }, [lineItems]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    // Check basic required fields
    if (!accountId || !itemName || !date) {
      return false;
    }

    // Check line items validation
    const errors = validateLineItems();
    return Object.keys(errors).length === 0;
  }, [accountId, itemName, date, validateLineItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    // Run validation
    const errors = validateLineItems();
    setValidationErrors(errors);

    // Basic validation
    if (!accountId || !itemName || !date) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill in account, item name, and date",
      });
      return;
    }

    if (lineItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No line items",
        description: "Please add at least one line item",
      });
      return;
    }

    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      toast({
        variant: "destructive",
        title: "Validation errors",
        description: "Please fix the errors in the line items before saving",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload for API
      const payload: any = {
        account_id: accountId,
        // Send sub_account_record_id if dropdown selected, OR sub_account if manual text entered
        ...(subAccountRecordId
          ? { sub_account_record_id: subAccountRecordId }
          : {}),
        ...(manualSubAccount && !subAccountRecordId
          ? { sub_account: manualSubAccount }
          : {}),
        gold_quality: goldQuality || undefined, // NEW FIELD
        item_name: itemName,
        date: date,
        expiry_date: expiryDate || undefined,
        nsj_representative: nsjRepresentative || undefined,
        order_id: prefilledOrderId || undefined, // Link to order if provided
        line_items: lineItems.map((item, index) => {
          // Map unit values to backend choices
          let normalizedUnit = item.unit || "";
          if (normalizedUnit === "per gram") normalizedUnit = "GM";
          if (normalizedUnit === "per piece") normalizedUnit = "PC";

          return {
            particulars: item.particulars,
            shape: item.shape || "",
            colour: item.colour || "",
            clarity: item.clarity || "",
            pc: item.pc,
            weight: item.weight,
            unit: normalizedUnit,
            rate: item.rate,
            amount: item.amount,
            order: index,
            is_compulsory: item.isCompulsory || false,
            raw_material: item.rawMaterial || "",
          };
        }),
        total_taxable_value: totalTaxableValue,
        gst_amount: gstAmount,
        grand_total: grandTotal,
        status: "draft", // Default status
      };

      // Add phone_number if available from sub account or prefilled data
      // Priority: selected sub account phone > prefilled phone
      const selectedSubAccountForPayload = subAccounts.find(
        (sub) => String(sub.id) === String(subAccountRecordId)
      );
      if (selectedSubAccountForPayload?.phone_number) {
        payload.phone_number = selectedSubAccountForPayload.phone_number;
      } else if (prefilledPhoneNumber) {
        payload.phone_number = prefilledPhoneNumber;
      }

      // Add size_details if available
      if (sizeDetails) {
        payload.size_details = sizeDetails;
      }

      // Add sales_query_id if creating from a sales lead
      if (salesQueryId) {
        payload.sales_query_id = salesQueryId;
        // Add sales_person_name from sales lead state
        console.log(
          "Sales person name being sent in payload:",
          salesPersonName
        );
        console.log("Sales person name state details:", {
          salesPersonName,
          prefilledSalesPersonName,
          salesQueryId,
          stateType: typeof salesPersonName,
          isEmpty: !salesPersonName,
        });
        if (salesPersonName) {
          payload.sales_person_name = salesPersonName;
          console.log("✓ Added sales_person_name to payload:", salesPersonName);
        } else {
          console.log(
            "⚠ WARNING: salesPersonName is empty, not adding to payload"
          );
        }
      }

      // Add sale_id if creating from a sale
      if (saleId) {
        payload.sales_query_id = saleId;
        if (!payload.phone_number && prefilledPhoneNumber) {
          payload.phone_number = prefilledPhoneNumber;
        }
        if (prefilledSalesPersonName)
          payload.sales_person_name = prefilledSalesPersonName;
        if (prefilledJewelryType) payload.jewellery_type = prefilledJewelryType;
        // size_details already added above from form state
      }

      // If image is selected, use FormData
      let finalPayload: any = payload;
      if (imageFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (key === "line_items") {
            formData.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        formData.append("product_image", imageFile);
        finalPayload = formData;
      }

      // Save estimate via API
      let savedEstimate;
      if (estimateId) {
        savedEstimate = await estimateUpdate(estimateId, finalPayload);
      } else {
        savedEstimate = await estimateCreate(finalPayload);
      }

      toast({
        title: estimateId ? "Estimate updated" : "Estimate saved",
        description: salesQueryId
          ? "Estimate created and linked to sales lead."
          : estimateId
            ? "Your estimate has been updated successfully."
            : "Your estimate has been saved successfully.",
      });

      // Update loadedSalesQueryId if the response has it
      const responseSqId =
        savedEstimate?.sales_query_id ||
        savedEstimate?.sales_query?.id ||
        savedEstimate?.sales_query_details?.id ||
        savedEstimate?.query_id ||
        savedEstimate?.linked_query_id;

      // Get account details for PDF (including phone number)
      const selectedAccount = accounts.find((acc) => acc.id === accountId);
      const accountName = selectedAccount?.name || "Customer";

      // Determine phone number for PDF - ALWAYS from Account, NEVER from Sub Account
      let phoneNumberForPdf = "";

      if (prefilledPhoneNumber) {
        phoneNumberForPdf = prefilledPhoneNumber;
      }
      // Second priority: Account's phone number (from contact.phone)
      else if (
        selectedAccount &&
        "contact" in selectedAccount &&
        selectedAccount.contact?.phone
      ) {
        phoneNumberForPdf = selectedAccount.contact.phone;
      }

      let subAccountNameForPdf = "";

      console.log("Sub-account state for PDF:", {
        subAccountRecordId,
        manualSubAccount,
        subAccountName,
        prefilledSubAccountName,
        prefilledSubAccount,
        subAccountsCount: subAccounts.length,
      });

      // If we have subAccounts list, find the selected one
      const selectedSubAccount = subAccounts.find(
        (sub) => String(sub.id) === String(subAccountRecordId)
      );

      console.log("Selected sub-account from list:", selectedSubAccount);

      if (selectedSubAccount?.sub_account_name) {
        subAccountNameForPdf = selectedSubAccount.sub_account_name;
        console.log("Using sub-account from dropdown:", subAccountNameForPdf);
      } else if (manualSubAccount) {
        subAccountNameForPdf = manualSubAccount;
        console.log("Using manual sub-account:", subAccountNameForPdf);
      } else if (subAccountName) {
        subAccountNameForPdf = subAccountName;
        console.log("Using subAccountName state:", subAccountNameForPdf);
      } else if (prefilledSubAccountName) {
        subAccountNameForPdf = prefilledSubAccountName;
        console.log("Using prefilledSubAccountName:", subAccountNameForPdf);
      } else if (prefilledSubAccount) {
        subAccountNameForPdf = prefilledSubAccount;
        console.log("Using prefilledSubAccount:", subAccountNameForPdf);
      }

      console.log("Final sub-account name for PDF:", subAccountNameForPdf);

      // Generate and download PDF using backend template overlay
      try {
        const validLineItems = lineItems.filter((item) => {
          const hasParticulars =
            item.particulars && item.particulars.trim() !== "";
          const hasAmount = item.amount && item.amount !== 0;
          return hasParticulars || hasAmount;
        });

        // Convert image to base64 if it's a file
        let imageBase64 = undefined;
        if (imageFile) {
          try {
            const fileToBase64 = (file: File): Promise<string> => {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
              });
            };
            imageBase64 = await fileToBase64(imageFile);
          } catch (e) {
            console.error("Failed to convert image to base64", e);
          }
        } else if (
          typeof imagePreview === "string" &&
          imagePreview.startsWith("data:")
        ) {
          imageBase64 = imagePreview;
        }
        // If it's a URL (existing image from backend), fetch and convert to base64
        else if (
          typeof imagePreview === "string" &&
          imagePreview.startsWith("http")
        ) {
          try {
            const response = await fetch(imagePreview);
            const blob = await response.blob();
            const urlToBase64 = (blob: Blob): Promise<string> => {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
              });
            };
            imageBase64 = await urlToBase64(blob);
          } catch (e) {
            console.error("Failed to fetch and convert image URL to base64", e);
          }
        }

        // Clean base64 string (remove data:image/xyz;base64, prefix) if present
        if (imageBase64 && imageBase64.includes(";base64,")) {
          imageBase64 = imageBase64.split(";base64,")[1];
        }

        const pdfEstimateId = savedEstimate?.id || estimateId;

        const pdfPayload = {
          estimate_id: pdfEstimateId,
          item_name: itemName,
          size_details: sizeDetails || prefilledSizeDetails || "", // NEW FIELD - Include size_details
          line_items: validLineItems.map((item) => {
            // Map unit values to backend choices
            let normalizedUnit = item.unit || "";
            if (normalizedUnit === "per gram") normalizedUnit = "GM";
            if (normalizedUnit === "per piece") normalizedUnit = "PC";

            return {
              particulars: item.particulars,
              shape: item.shape || "",
              colour: item.colour || "",
              clarity: item.clarity || "",
              pc: item.pc,
              weight: item.weight,
              unit: normalizedUnit,
              rate: item.rate,
              amount: item.amount,
            };
          }),
          totals: {
            taxable_value: totalTaxableValue,
            gst: gstAmount,
            discount: discountAmount || 0,
            discount_percent: discountPercent || 0,
            grand_total: grandTotal,
          },
          customer_details: {
            main_account: accountName,
            sub_account: subAccountNameForPdf || "",
            phone: phoneNumberForPdf || "",
            sales_person_name:
              salesPersonName || prefilledSalesPersonName || "",
            nsj_representative: nsjRepresentative || "",
          },
          estimate_details: {
            date: date,
            expiry_date: expiryDate || "",
          },
          jewellery_details: {
            // NEW FIELD - Include jewellery details
            jewellery_type: prefilledJewelryType || itemName,
            gold_quality: goldQuality || "",
            size_details: sizeDetails || prefilledSizeDetails || "",
          },
          image_base64: imageBase64,
        };

        console.log("PDF Payload:", {
          ...pdfPayload,
          image_base64: imageBase64 ? "[base64 image]" : "no image",
        });

        const { blob, fileName } =
          await estimateGenerateLandscapePDF(pdfPayload);

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "PDF Downloaded",
          description: "Estimate PDF has been downloaded successfully.",
        });
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        toast({
          variant: "destructive",
          title: "PDF Generation Failed",
          description:
            "Could not generate or download the PDF. Please try again.",
        });
      }

      // If created from an order, auto-complete the "Estimate Approval" step
      if (prefilledOrderId && savedEstimate?.id) {
        try {
          await autoCompleteStep(
            prefilledOrderId,
            "Estimate Approval",
            savedEstimate.id as string,
            `Estimate created: ${savedEstimate.id}`
          );
          console.log("[Auto-Complete] Estimate Approval step completed");
        } catch (autoCompleteError) {
          console.warn(
            "[Auto-Complete] Failed to complete step:",
            autoCompleteError
          );
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        const returnTo = searchParams.get("return_to");
        if (returnTo) {
          router.push(`${returnTo}?estimate_id=${savedEstimate?.id}`);
        } else {
          const finalQueryId =
            salesQueryId || saleId || loadedSalesQueryId || responseSqId;
          if (finalQueryId) {
            router.push(`/vouchers/sales-leads/${finalQueryId}/estimates`);
          } else {
            // Redirect to dashboard for standalone estimates
            router.push("/dashboard");
          }
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save estimate",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {estimateId
                  ? "Edit Estimate Voucher"
                  : salesQueryId
                    ? "Create Estimate for Sales Lead"
                    : saleId
                      ? "Create Estimate for Sale"
                      : "New Estimate Voucher"}
              </CardTitle>
              <CardDescription>
                {salesQueryId ? (
                  <>
                    Creating estimate for{" "}
                    <span className="font-semibold">
                      {prefilledJewelryType || "jewelry item"}
                    </span>
                    . This estimate will be linked to the sales lead.
                  </>
                ) : saleId ? (
                  <>
                    Creating estimate for{" "}
                    <span className="font-semibold">
                      {prefilledJewelryType || "jewelry item"}
                    </span>
                    . This estimate will be linked to the sale.
                  </>
                ) : (
                  "Create a detailed jewelry cost estimate with multiple line items"
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sales Lead Context Banner */}
            {salesQueryId && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-4">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">📋 Sales Lead Mode:</span>{" "}
                  This estimate will be automatically linked to the sales lead.
                  You can create multiple estimates with different
                  specifications.
                </p>
              </div>
            )}

            {/* Sale Context Banner */}
            {saleId && !salesQueryId && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">📋 Sale Mode:</span> This
                  estimate will be automatically linked to the sale. You can
                  create multiple estimates with different specifications.
                </p>
              </div>
            )}

            {/* Account Selection */}
            <div className="space-y-2">
              <Label htmlFor="accountId">Customer Account *</Label>
              {loadingAccounts ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <SearchableSelect
                  id="accountId"
                  options={accounts.map((acc) => ({
                    value: String(acc.id),
                    label: acc.name,
                  }))}
                  value={accountId}
                  onChange={setAccountId}
                  placeholder="Select account"
                  required
                  disabled={disableAccountAndItem}
                />
              )}
            </div>

            {/* Sub Account Selection */}
            {accountId && (
              <div className="space-y-2">
                <Label htmlFor="subAccount">Sub Account (Optional)</Label>
                {subAccounts.length > 0 ? (
                  // Show dropdown when sub-accounts exist
                  <>
                    <SearchableSelect
                      id="subAccountRecordId"
                      options={subAccounts.map((sub) => ({
                        value: sub.id,
                        label:
                          sub.sub_account_name +
                          (sub.phone_number ? ` (${sub.phone_number})` : ""),
                      }))}
                      value={subAccountRecordId}
                      onChange={(value) => {
                        setSubAccountRecordId(value);
                        setManualSubAccount(""); // Clear manual input when dropdown selected
                        // Find and set the name for display
                        const selected = subAccounts.find(
                          (s) => String(s.id) === String(value)
                        );
                        if (selected) {
                          setSubAccountName(selected.sub_account_name);
                        }
                      }}
                      placeholder="Select sub account"
                      disabled={disableAccountAndItem}
                    />
                    <p className="text-xs text-muted-foreground">
                      Select from existing sub-accounts
                    </p>
                  </>
                ) : (
                  // Show text input when no sub-accounts exist
                  <>
                    <Input
                      id="manualSubAccount"
                      value={manualSubAccount}
                      onChange={(e) => {
                        setManualSubAccount(e.target.value);
                        setSubAccountName(e.target.value); // Also set for display
                        setSubAccountRecordId(""); // Clear dropdown selection
                      }}
                      placeholder="Enter sub account name"
                      disabled={disableAccountAndItem}
                    />
                    <p className="text-xs text-muted-foreground">
                      No sub-accounts found for this account. Enter manually.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Customer Details Display */}
            {(subAccountName ||
              prefilledSubAccountName ||
              prefilledSubAccount ||
              prefilledPhoneNumber ||
              prefilledSalesPersonName ||
              prefilledJewelryType ||
              sizeDetails ||
              goldQuality ||
              accountId) && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Customer Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {/* Customer Account Name */}
                  {accountId && (
                    <div>
                      <span className="text-slate-600 font-medium">
                        Customer Name:
                      </span>
                      <p className="text-slate-900">
                        {accounts.find((acc) => acc.id === accountId)?.name ||
                          "—"}
                      </p>
                    </div>
                  )}
                  {/* Sub Account - Show if we have it from any source */}
                  {(subAccountName ||
                    manualSubAccount ||
                    prefilledSubAccountName ||
                    prefilledSubAccount) && (
                    <div>
                      <span className="text-slate-600 font-medium">
                        Sub Account:
                      </span>
                      <p className="text-slate-900">
                        {(() => {
                          // Try to find in dropdown first
                          const selectedInDropdown = subAccounts.find(
                            (sub) =>
                              String(sub.id) === String(subAccountRecordId)
                          );
                          // Priority: dropdown name > manual input > state > prefilled
                          return (
                            selectedInDropdown?.sub_account_name ||
                            manualSubAccount ||
                            subAccountName ||
                            prefilledSubAccountName ||
                            prefilledSubAccount
                          );
                        })()}
                      </p>
                    </div>
                  )}
                  {/* Phone Number */}
                  {prefilledPhoneNumber && (
                    <div>
                      <span className="text-slate-600 font-medium">Phone:</span>
                      <p className="text-slate-900">{prefilledPhoneNumber}</p>
                    </div>
                  )}
                  {/* Sales Person */}
                  {prefilledSalesPersonName && (
                    <div>
                      <span className="text-slate-600 font-medium">
                        Sales Rep:
                      </span>
                      <p className="text-slate-900">
                        {prefilledSalesPersonName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Jewellery Details */}
                {(itemName ||
                  prefilledJewelryType ||
                  sizeDetails ||
                  goldQuality) && (
                  <>
                    <h3 className="text-sm font-semibold text-slate-700 mt-4">
                      Jewellery Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {/* Jewellery Type / Item Name */}
                      {(itemName || prefilledJewelryType) && (
                        <div>
                          <span className="text-slate-600 font-medium">
                            Jewellery Type:
                          </span>
                          <p className="text-slate-900">
                            {itemName || prefilledJewelryType}
                          </p>
                        </div>
                      )}
                      {/* Gold Quality */}
                      {goldQuality && (
                        <div>
                          <span className="text-slate-600 font-medium">
                            Gold Quality:
                          </span>
                          <p className="text-slate-900">{goldQuality}</p>
                        </div>
                      )}
                      {/* Size Details */}
                      {sizeDetails && (
                        <div>
                          <span className="text-slate-600 font-medium">
                            Size Details:
                          </span>
                          <p className="text-slate-900">{sizeDetails}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Item Name - Hidden when jewellery type is prefilled from sale */}
            {!prefilledJewelryType && (
              <div className="space-y-2">
                <Label htmlFor="itemName">
                  Item Name / Description *
                  {accountId && itemName && !estimateId && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Auto-filled from account)
                    </span>
                  )}
                </Label>
                <SearchableSelect
                  id="itemName"
                  options={itemOptions}
                  value={itemName}
                  onChange={setItemName}
                  placeholder="Select jewelry item"
                  required
                  disabled={disableAccountAndItem}
                />
                <p className="text-xs text-muted-foreground">
                  Select the type of jewelry item for this estimate
                </p>
              </div>
            )}

            {/* Gold Quality (KT) Field */}
            <div className="space-y-2">
              <GoldQualityInput
                value={goldQuality}
                onChange={setGoldQuality}
                options={goldQualityOptions}
                placeholder="Enter custom value (e.g., 20KT, 23KT)"
              />
            </div>

            {/* Size Details Field */}
            <div className="space-y-2">
              <Label htmlFor="size-details">Size Details</Label>
              <Input
                id="size-details"
                type="text"
                value={sizeDetails}
                onChange={(e) => setSizeDetails(e.target.value)}
                placeholder="e.g. Size 16, Small, 6 inches"
              />
              <p className="text-xs text-muted-foreground">
                Enter size details for the jewelry item
              </p>
            </div>

            {/* Date and Expiry Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="font-semibold">
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            {/* NSJ Representative */}
            <div className="space-y-2">
              <Label htmlFor="nsjRepresentative" className="font-semibold">
                NSJ Representative
              </Label>
              <select
                id="nsjRepresentative"
                value={nsjRepresentative}
                onChange={(e) => setNsjRepresentative(e.target.value)}
                disabled={loadingTeamMembers}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Representative</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image" className="font-semibold">
                Product Image (Optional)
              </Label>
              <div className="flex flex-col gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                {imagePreview && (
                  <div className="relative w-fit">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="max-h-48 rounded-md border object-contain shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onClick={handleClearImage}
                    >
                      <span className="text-xs">×</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Line Items</Label>
                  {/* <p className="text-xs text-muted-foreground mt-1">
                    Gold and Craftsmanship Fee are compulsory. Units auto-set: Diamond/Gemstone → Carats, Gold → Grams
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Conversion: 1 gram = 5 carats | 1 carat = 0.20 grams
                  </p> */}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  className="text-amber-600 hover:text-amber-700"
                >
                  + Add Line Item
                </Button>
              </div>

              {(validationErrors.lineItems ||
                validationErrors.compulsoryGold ||
                validationErrors.compulsoryCraftsmanship) && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3 space-y-1">
                  {validationErrors.lineItems && (
                    <p className="text-sm text-red-600">
                      {validationErrors.lineItems}
                    </p>
                  )}
                  {validationErrors.compulsoryGold && (
                    <p className="text-sm text-red-600">
                      {validationErrors.compulsoryGold}
                    </p>
                  )}
                  {validationErrors.compulsoryCraftsmanship && (
                    <p className="text-sm text-red-600">
                      {validationErrors.compulsoryCraftsmanship}
                    </p>
                  )}
                </div>
              )}

              {lineItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No line items added yet. Click &quot;Add Line Item&quot; to
                    start.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Particulars
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Shape
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Colour
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Clarity
                        </th>
                        <th className="px-3 py-2 text-left font-medium">PC</th>
                        <th className="px-3 py-2 text-left font-medium">
                          Weight
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Unit
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Rate
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-center font-medium">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr
                          key={item.id}
                          className={`border-t ${item.isCompulsory ? "bg-amber-50" : ""}`}
                        >
                          <td className="px-2 py-2">
                            {item.isCompulsory ? (
                              <div className="min-w-[150px] px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded border">
                                {item.rawMaterial === "Gold"
                                  ? "Gold"
                                  : "Craftsmanship Fee"}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <select
                                  className={`w-full min-w-[150px] rounded-md border border-input bg-background px-2 py-1.5 text-sm ${
                                    validationErrors[
                                      `lineItem_${item.id}_particulars`
                                    ]
                                      ? "border-red-500"
                                      : ""
                                  }`}
                                  value={item.rawMaterial || ""}
                                  onChange={(e) =>
                                    handleLineItemChange(
                                      item.id,
                                      "rawMaterial",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">Select...</option>
                                  <option value="Diamond">Diamond</option>
                                  <option value="Gemstone">Gemstone</option>
                                  <option value="Other">Other (Custom)</option>
                                </select>
                                {item.rawMaterial === "Other" && (
                                  <Input
                                    placeholder="Enter custom particulars"
                                    value={item.particulars}
                                    onChange={(e) =>
                                      handleLineItemChange(
                                        item.id,
                                        "particulars",
                                        e.target.value
                                      )
                                    }
                                    className="min-w-[150px]"
                                  />
                                )}
                                {validationErrors[
                                  `lineItem_${item.id}_particulars`
                                ] && (
                                  <p className="mt-1 text-xs text-red-600">
                                    {
                                      validationErrors[
                                        `lineItem_${item.id}_particulars`
                                      ]
                                    }
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              placeholder="Shape"
                              value={item.shape}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "shape",
                                  e.target.value
                                )
                              }
                              className="min-w-[80px]"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              placeholder="Colour"
                              value={item.colour}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "colour",
                                  e.target.value
                                )
                              }
                              className="min-w-[80px]"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              placeholder="Clarity"
                              value={item.clarity}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "clarity",
                                  e.target.value
                                )
                              }
                              className="min-w-[80px]"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              placeholder="PC"
                              value={item.pc ?? ""}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "pc",
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : null
                                )
                              }
                              className={`min-w-[70px] ${
                                validationErrors[`lineItem_${item.id}_pc`]
                                  ? "border-red-500"
                                  : ""
                              }`}
                            />
                            {validationErrors[`lineItem_${item.id}_pc`] && (
                              <p className="mt-1 text-xs text-red-600">
                                {validationErrors[`lineItem_${item.id}_pc`]}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="Weight"
                              value={item.weight ?? ""}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "weight",
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : null
                                )
                              }
                              className={`min-w-[90px] ${
                                validationErrors[`lineItem_${item.id}_weight`]
                                  ? "border-red-500"
                                  : ""
                              }`}
                            />
                            {validationErrors[`lineItem_${item.id}_weight`] && (
                              <p className="mt-1 text-xs text-red-600">
                                {validationErrors[`lineItem_${item.id}_weight`]}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {item.rawMaterial === "Craftsmanship" ? (
                              <select
                                value={item.unit || ""}
                                onChange={(e) =>
                                  handleLineItemChange(
                                    item.id,
                                    "unit",
                                    e.target.value
                                  )
                                }
                                className="flex h-9 min-w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm"
                              >
                                <option value="">Select Unit</option>
                                <option value="GM">Per Gram</option>
                                <option value="PC">Per Piece</option>
                              </select>
                            ) : (
                              <div className="min-w-[70px] px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded border">
                                {item.unit || "-"}
                              </div>
                            )}
                            {validationErrors[`lineItem_${item.id}_unit`] && (
                              <p className="mt-1 text-xs text-red-600">
                                {validationErrors[`lineItem_${item.id}_unit`]}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Rate"
                              value={item.rate ?? ""}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "rate",
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : null
                                )
                              }
                              className={`min-w-[100px] ${
                                validationErrors[`lineItem_${item.id}_rate`]
                                  ? "border-red-500"
                                  : ""
                              }`}
                            />
                            {validationErrors[`lineItem_${item.id}_rate`] && (
                              <p className="mt-1 text-xs text-red-600">
                                {validationErrors[`lineItem_${item.id}_rate`]}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Amount"
                              value={item.amount}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "amount",
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : 0
                                )
                              }
                              className={`min-w-[100px] ${
                                validationErrors[`lineItem_${item.id}_amount`]
                                  ? "border-red-500"
                                  : ""
                              }`}
                              readOnly
                            />
                            {validationErrors[`lineItem_${item.id}_amount`] && (
                              <p className="mt-1 text-xs text-red-600">
                                {validationErrors[`lineItem_${item.id}_amount`]}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {item.isCompulsory ? (
                              <span className="text-xs text-gray-500 italic">
                                Required
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLineItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Totals Display Section */}
            {lineItems.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-6">
                <h3 className="mb-4 text-lg font-semibold">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total Taxable Value:</span>
                    <span className="font-semibold">
                      ₹ {totalTaxableValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">GST @ 3%:</span>
                    <span className="font-semibold">
                      ₹ {gstAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-semibold">
                      ₹ {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-3">
                    <span className="font-medium">Discount (%):</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={discountPercent || ""}
                        onChange={(e) =>
                          setDiscountPercent(parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-right"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      {discountAmount > 0 && (
                        <span className="text-sm text-red-600">
                          (-₹ {discountAmount.toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-base">
                    <span className="font-bold">Grand Total:</span>
                    <span className="text-lg font-bold text-amber-600">
                      ₹ {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Saving...
                  </span>
                ) : (
                  "Save Estimate"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import {
//   accountsDropdown,
//   estimateCreate,
//   estimateUpdate,
//   estimateDetail,
//   subaccountsList,
// } from "@/lib/backend";
// import { generateEstimatePDF } from "@/lib/estimatePDF";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast";

// // TypeScript interfaces
// export interface LineItem {
//   id: string;
//   particulars: string;
//   shape: string;
//   colour: string;
//   clarity: string;
//   pc: number | null;
//   weight: number | null;
//   unit: "CT" | "GM" | "";
//   rate: number | null;
//   amount: number;
//   isCompulsory?: boolean; // Flag for permanent line items
//   rawMaterial?: "Diamond" | "Gemstone" | "Gold" | "Craftsmanship" | ""; // Raw material type
// }

// export interface EstimateVoucher {
//   id?: string;
//   account: { id: string; account_name: string };
//   item_name: string;
//   date: string;
//   line_items: LineItem[];
//   total_taxable_value: number;
//   gst_amount: number;
//   grand_total: number;
//   created_at?: string;
//   updated_at?: string;
// }

// interface EstimateVoucherFormProps {
//   initialData?: EstimateVoucher;
//   onSuccess?: () => void;
//   estimateId?: string;
// }

// export function EstimateVoucherForm({
//   initialData,
//   onSuccess,
//   estimateId,
// }: EstimateVoucherFormProps) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { toast } = useToast();

//   // Get pre-fill data from query parameters
//   const sqId = searchParams.get("sales_query_id");
//   const preFillJewelryType = searchParams.get("jewelry_type");
//   const preFillAccountId = searchParams.get("account_id");

//   // Form state
//   const [accountId, setAccountId] = useState(preFillAccountId || initialData?.account?.id || "");
//   const [itemName, setItemName] = useState(preFillJewelryType || initialData?.item_name || "");
//   const [date, setDate] = useState(
//     initialData?.date || new Date().toISOString().split("T")[0]
//   );
//   // Initialize with compulsory line items if creating new estimate
//   const [lineItems, setLineItems] = useState<LineItem[]>(() => {
//     if (initialData?.line_items && initialData.line_items.length > 0) {
//       return initialData.line_items;
//     }
//     // Add compulsory line items for new estimates
//     return [
//       {
//         id: `gold-${Date.now()}`,
//         particulars: "Gold",
//         shape: "",
//         colour: "",
//         clarity: "",
//         pc: null,
//         weight: null,
//         unit: "GM",
//         rate: null,
//         amount: 0,
//         isCompulsory: true,
//         rawMaterial: "Gold",
//       },
//       {
//         id: `craftsmanship-${Date.now() + 1}`,
//         particulars: "Craftsmanship Fee",
//         shape: "",
//         colour: "",
//         clarity: "",
//         pc: null,
//         weight: null,
//         unit: "",
//         rate: null,
//         amount: 0,
//         isCompulsory: true,
//         rawMaterial: "Craftsmanship",
//       },
//     ];
//   });
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string>("");

//   // Data loading states
//   const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
//   const [loadingAccounts, setLoadingAccounts] = useState(true);
//   const [loadingEstimate, setLoadingEstimate] = useState(false);

//   // Submission state
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Validation state
//   const [validationErrors, setValidationErrors] = useState<
//     Record<string, string>
//   >({});

//   // Unit conversion helper functions
//   const convertGramsToCarats = (grams: number): number => {
//     return Number((grams * 5).toFixed(3));
//   };

//   const convertCaratsToGrams = (carats: number): number => {
//     return Number((carats * 0.2).toFixed(3));
//   };

//   // Load estimate data when estimateId is provided
//   useEffect(() => {
//     if (!estimateId) return;

//     let mounted = true;
//     const loadEstimate = async () => {
//       setLoadingEstimate(true);
//       try {
//         const data = await estimateDetail(estimateId);
//         if (!mounted) return;

//         // Populate form with loaded data
//         setAccountId(data.account?.id || "");
//         setItemName(data.item_name || "");
//         setDate(data.date || new Date().toISOString().split("T")[0]);

//         // Map line items to ensure they have the correct structure
//         if (data.line_items && data.line_items.length > 0) {
//           const mappedLineItems = data.line_items.map((item: any) => ({
//             id: item.id || `item-${Date.now()}-${Math.random()}`,
//             particulars: item.particulars || "",
//             shape: item.shape || "",
//             colour: item.colour || "",
//             clarity: item.clarity || "",
//             pc: item.pc,
//             weight: item.weight,
//             unit: item.unit || "",
//             rate: item.rate,
//             amount: item.amount || 0,
//             isCompulsory: item.is_compulsory || false,
//             rawMaterial: item.raw_material || "",
//           }));
//           setLineItems(mappedLineItems);
//         }
//       } catch (err) {
//         toast({
//           variant: "destructive",
//           title: "Unable to load estimate",
//           description: err instanceof Error ? err.message : "Unknown error",
//         });
//       } finally {
//         if (mounted) setLoadingEstimate(false);
//       }
//     };

//     void loadEstimate();

//     return () => {
//       mounted = false;
//     };
//   }, [estimateId, toast]);

//   // Load accounts dropdown
//   useEffect(() => {
//     let mounted = true;
//     const loadAccounts = async () => {
//       setLoadingAccounts(true);
//       try {
//         const data = await accountsDropdown();
//         if (!mounted) return;
//         setAccounts(data);
//       } catch (err) {
//         toast({
//           variant: "destructive",
//           title: "Unable to load accounts",
//           description: err instanceof Error ? err.message : "Unknown error",
//         });
//       } finally {
//         if (mounted) setLoadingAccounts(false);
//       }
//     };

//     void loadAccounts();

//     return () => {
//       mounted = false;
//     };
//   }, [toast]);

//   // Auto-fill item name when account is selected
//   useEffect(() => {
//     // IMMEDIATELY clear item name when account changes (before async fetch)
//     setItemName("");

//     if (!accountId) {
//       return;
//     }

//     let mounted = true;
//     const loadItemName = async () => {
//       try {
//         // Fetch sub-accounts for the selected account
//         const subAccounts = await subaccountsList({ account: accountId });
//         if (!mounted) return;

//         console.log("Account ID:", accountId);
//         console.log("Sub-accounts response:", subAccounts);

//         // Filter sub-accounts that belong to this specific account
//         const matchingSubAccounts = subAccounts.results?.filter((sub: any) => {
//           // Check if the sub-account's account field matches our accountId
//           const subAccountId =
//             typeof sub.account === "string" ? sub.account : sub.account?.id;
//           console.log("Comparing:", subAccountId, "with", accountId);
//           return subAccountId === accountId;
//         });

//         console.log("Matching sub-accounts:", matchingSubAccounts);

//         // Get the first matching sub-account's item name (if exists)
//         if (matchingSubAccounts && matchingSubAccounts.length > 0) {
//           const firstSubAccount = matchingSubAccounts[0];
//           if (firstSubAccount.item_name) {
//             console.log("Setting item name:", firstSubAccount.item_name);
//             setItemName(firstSubAccount.item_name);
//           }
//           // If no item name, it stays blank (already cleared above)
//         }
//         // If no sub-account, it stays blank (already cleared above)
//       } catch (err) {
//         console.error("Failed to load item name:", err);
//         // On error, it stays blank (already cleared above)
//       }
//     };

//     void loadItemName();

//     return () => {
//       mounted = false;
//     };
//   }, [accountId]);

//   // Add new line item (variable raw material)
//   const handleAddLineItem = () => {
//     const newLineItem: LineItem = {
//       id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       particulars: "",
//       shape: "",
//       colour: "",
//       clarity: "",
//       pc: null,
//       weight: null,
//       unit: "",
//       rate: null,
//       amount: 0,
//       isCompulsory: false,
//       rawMaterial: "",
//     };
//     setLineItems([...lineItems, newLineItem]);
//   };

//   // Delete line item (prevent deletion of compulsory items)
//   const handleDeleteLineItem = (id: string) => {
//     const item = lineItems.find((item) => item.id === id);
//     if (item?.isCompulsory) {
//       toast({
//         variant: "destructive",
//         title: "Cannot delete",
//         description:
//           "Gold and Craftsmanship Fee are compulsory line items and cannot be removed.",
//       });
//       return;
//     }
//     setLineItems(lineItems.filter((item) => item.id !== id));
//   };

//   // Update line item field with automatic amount calculation and unit conversion
//   const handleLineItemChange = useCallback(
//     (id: string, field: keyof LineItem, value: string | number | null) => {
//       setLineItems((prevItems) =>
//         prevItems.map((item) => {
//           if (item.id !== id) return item;

//           const updatedItem = { ...item, [field]: value };

//           // Handle raw material selection - auto-set unit and particulars
//           if (field === "rawMaterial") {
//             const rawMaterial = value as string;
//             updatedItem.rawMaterial = rawMaterial as any;

//             if (rawMaterial === "Diamond") {
//               updatedItem.unit = "CT";
//               updatedItem.particulars = "Diamond";
//             } else if (rawMaterial === "Gemstone") {
//               updatedItem.unit = "CT";
//               updatedItem.particulars = "Gemstone";
//             } else if (rawMaterial === "Gold") {
//               updatedItem.unit = "GM";
//               updatedItem.particulars = "Gold";
//             }
//           }

//           // Automatically calculate amount if weight or rate changes
//           if (field === "weight" || field === "rate") {
//             const weight = field === "weight" ? (value as number) : item.weight;
//             const rate = field === "rate" ? (value as number) : item.rate;

//             if (weight !== null && rate !== null && weight > 0 && rate > 0) {
//               updatedItem.amount = Number((weight * rate).toFixed(2));
//             }
//           }

//           return updatedItem;
//         })
//       );
//     },
//     []
//   );

//   // Calculate total taxable value (sum of all line item amounts)
//   const totalTaxableValue = useMemo(() => {
//     const total = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
//     return Number(total.toFixed(2));
//   }, [lineItems]);

//   // Calculate GST at 3%
//   const gstAmount = useMemo(() => {
//     const gst = totalTaxableValue * 0.03;
//     return Number(gst.toFixed(2));
//   }, [totalTaxableValue]);

//   // Calculate grand total
//   const grandTotal = useMemo(() => {
//     const total = totalTaxableValue + gstAmount;
//     return Number(total.toFixed(2));
//   }, [totalTaxableValue, gstAmount]);

//   // Validation function for line items
//   const validateLineItems = useCallback(() => {
//     const errors: Record<string, string> = {};

//     // Validate minimum one line item exists
//     if (lineItems.length === 0) {
//       errors.lineItems = "At least one line item is required";
//       return errors;
//     }

//     // Check that compulsory items (Gold and Craftsmanship Fee) exist
//     const hasGold = lineItems.some(
//       (item) => item.isCompulsory && item.rawMaterial === "Gold"
//     );
//     const hasCraftsmanship = lineItems.some(
//       (item) => item.isCompulsory && item.rawMaterial === "Craftsmanship"
//     );

//     if (!hasGold) {
//       errors.compulsoryGold =
//         "Gold is a compulsory line item and must be included";
//     }
//     if (!hasCraftsmanship) {
//       errors.compulsoryCraftsmanship =
//         "Craftsmanship Fee is a compulsory line item and must be included";
//     }

//     lineItems.forEach((item, index) => {
//       const hasWeightAndRate =
//         item.weight !== null &&
//         item.weight > 0 &&
//         item.rate !== null &&
//         item.rate > 0;
//       const hasAmount = item.amount > 0;

//       // Validate compulsory items cannot be left blank
//       if (item.isCompulsory) {
//         if (!item.particulars.trim()) {
//           errors[`lineItem_${item.id}_particulars`] =
//             "This compulsory field cannot be left blank";
//         }
//         if (item.weight === null || item.weight <= 0) {
//           errors[`lineItem_${item.id}_weight`] =
//             "Weight is required for compulsory items";
//         }
//         if (item.rate === null || item.rate <= 0) {
//           errors[`lineItem_${item.id}_rate`] =
//             "Rate is required for compulsory items";
//         }
//       }

//       // Validate Particulars required if Weight and Rate provided
//       if (hasWeightAndRate && !item.particulars.trim()) {
//         errors[`lineItem_${item.id}_particulars`] =
//           "Particulars field is required for line items with weight and rate";
//       }

//       // Validate numeric fields contain valid numbers
//       if (item.weight !== null && (isNaN(item.weight) || item.weight < 0)) {
//         errors[`lineItem_${item.id}_weight`] =
//           "Weight must be a valid positive number";
//       }

//       if (item.rate !== null && (isNaN(item.rate) || item.rate < 0)) {
//         errors[`lineItem_${item.id}_rate`] =
//           "Rate must be a valid positive number";
//       }

//       if (item.pc !== null && (isNaN(item.pc) || item.pc < 0)) {
//         errors[`lineItem_${item.id}_pc`] = "PC must be a valid positive number";
//       }

//       if (isNaN(item.amount) || item.amount < 0) {
//         errors[`lineItem_${item.id}_amount`] =
//           "Amount must be a valid positive number";
//       }

//       // Validate correct unit is displayed based on raw material
//       if (item.rawMaterial === "Diamond" || item.rawMaterial === "Gemstone") {
//         if (item.unit !== "CT") {
//           errors[`lineItem_${item.id}_unit`] =
//             "Unit must be Carats (CT) for diamonds and gemstones";
//         }
//       } else if (item.rawMaterial === "Gold") {
//         if (item.unit !== "GM") {
//           errors[`lineItem_${item.id}_unit`] =
//             "Unit must be Grams (GM) for gold";
//         }
//       }
//     });

//     return errors;
//   }, [lineItems]);

//   // Handle image upload
//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setImageFile(file);
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImagePreview(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   // Check if form is valid
//   const isFormValid = useMemo(() => {
//     // Check basic required fields
//     if (!accountId || !itemName || !date) {
//       return false;
//     }

//     // Check line items validation
//     const errors = validateLineItems();
//     return Object.keys(errors).length === 0;
//   }, [accountId, itemName, date, validateLineItems]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Run validation
//     const errors = validateLineItems();
//     setValidationErrors(errors);

//     // Basic validation
//     if (!accountId || !itemName || !date) {
//       toast({
//         variant: "destructive",
//         title: "Missing required fields",
//         description: "Please fill in account, item name, and date",
//       });
//       return;
//     }

//     if (lineItems.length === 0) {
//       toast({
//         variant: "destructive",
//         title: "No line items",
//         description: "Please add at least one line item",
//       });
//       return;
//     }

//     // Check for validation errors
//     if (Object.keys(errors).length > 0) {
//       toast({
//         variant: "destructive",
//         title: "Validation errors",
//         description: "Please fix the errors in the line items before saving",
//       });
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       // Prepare payload for API
//       const payload = {
//         account_id: accountId,
//         item_name: itemName,
//         date: date,
//         line_items: lineItems.map((item, index) => ({
//           particulars: item.particulars,
//           shape: item.shape || "",
//           colour: item.colour || "",
//           clarity: item.clarity || "",
//           pc: item.pc,
//           weight: item.weight,
//           unit: item.unit || "",
//           rate: item.rate,
//           amount: item.amount,
//           order: index,
//           is_compulsory: item.isCompulsory || false,
//           raw_material: item.rawMaterial || "",
//         })),
//         total_taxable_value: totalTaxableValue,
//         gst_amount: gstAmount,
//         grand_total: grandTotal,
//         sales_query_id: sqId || undefined,
//       };

//       // Save estimate via API
//       let savedEstimate;
//       if (estimateId || initialData?.id) {
//         savedEstimate = await estimateUpdate(estimateId || initialData!.id, payload);
//       } else {
//         savedEstimate = await estimateCreate(payload);
//       }

//       toast({
//         title: "Estimate saved",
//         description: "Your estimate has been saved successfully.",
//       });

//       // Get account name for PDF
//       const selectedAccount = accounts.find((acc) => acc.id === accountId);
//       const accountName = selectedAccount?.name || "Customer";

//       // Generate and download PDF
//       try {
//         await generateEstimatePDF({
//           itemName: itemName,
//           accountName: accountName,
//           date: date,
//           lineItems: lineItems,
//           totalTaxableValue: totalTaxableValue,
//           gstAmount: gstAmount,
//           grandTotal: grandTotal,
//           imageUrl: imagePreview || undefined,
//         });

//         toast({
//           title: "PDF Downloaded",
//           description: "Estimate PDF has been downloaded successfully.",
//         });
//       } catch (pdfError) {
//         console.error("PDF generation error:", pdfError);
//         toast({
//           variant: "destructive",
//           title: "PDF generation failed",
//           description:
//             "Estimate was saved but PDF download failed. You can try downloading it again from the estimates list.",
//         });
//       }

//       if (onSuccess) {
//         onSuccess();
//       } else if (sqId) {
//         router.push(`/vouchers/sales-queries/${sqId}`);
//       } else {
//         router.push("/vouchers/estimate");
//       }
//     } catch (err) {
//       toast({
//         variant: "destructive",
//         title: "Could not save estimate",
//         description: err instanceof Error ? err.message : "Unknown error",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>
//             {initialData ? "Edit Estimate Voucher" : "New Estimate Voucher"}
//           </CardTitle>
//           <CardDescription>
//             Create a detailed jewelry cost estimate with multiple line items
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Account Selection */}
//             <div className="space-y-2">
//               <Label htmlFor="accountId">Customer Account *</Label>
//               {loadingAccounts ? (
//                 <Skeleton className="h-10 w-full" />
//               ) : (
//                 <select
//                   id="accountId"
//                   className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
//                   value={accountId}
//                   onChange={(e) => setAccountId(e.target.value)}
//                   required
//                 >
//                   <option value="">Select account</option>
//                   {accounts.map((account) => (
//                     <option key={account.id} value={account.id}>
//                       {account.name}
//                     </option>
//                   ))}
//                 </select>
//               )}
//             </div>

//             {/* Item Name */}
//             <div className="space-y-2">
//               <Label htmlFor="itemName">
//                 Item Name / Description *
//                 {accountId && itemName && (
//                   <span className="ml-2 text-xs text-muted-foreground">
//                     (Auto-filled from account)
//                   </span>
//                 )}
//               </Label>
//               <select
//                 id="itemName"
//                 className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
//                 value={itemName}
//                 onChange={(e) => setItemName(e.target.value)}
//                 required
//               >
//                 <option value="">Select jewelry item</option>
//                 <option value="Ring">Ring</option>
//                 <option value="Earring">Earring</option>
//                 <option value="Necklace">Necklace</option>
//                 <option value="Bracelet">Bracelet</option>
//                 <option value="Bangle">Bangle</option>
//                 <option value="Pendant">Pendant</option>
//                 <option value="Anklet">Anklet</option>
//               </select>
//               <p className="text-xs text-muted-foreground">
//                 Select the type of jewelry item for this estimate
//               </p>
//             </div>

//             {/* Date */}
//             <div className="space-y-2">
//               <Label htmlFor="date">Date *</Label>
//               <Input
//                 id="date"
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 required
//               />
//             </div>

//             {/* Image Upload */}
//             <div className="space-y-2">
//               <Label htmlFor="image">Product Image (Optional)</Label>
//               <Input
//                 id="image"
//                 type="file"
//                 accept="image/*"
//                 onChange={handleImageUpload}
//                 className="cursor-pointer"
//               />
//               {imagePreview && (
//                 <div className="mt-3 rounded-lg border border-gray-200 p-3">
//                   <p className="mb-2 text-sm font-medium text-gray-700">
//                     Image Preview:
//                   </p>
//                   <img
//                     src={imagePreview}
//                     alt="Product preview"
//                     className="max-h-48 rounded-md object-contain"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Line Items Table */}
//             <div className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <Label className="text-base font-semibold">Line Items</Label>
//                   {/* <p className="text-xs text-muted-foreground mt-1">
//                     Gold and Craftsmanship Fee are compulsory. Units auto-set: Diamond/Gemstone → Carats, Gold → Grams
//                   </p>
//                   <p className="text-xs text-muted-foreground">
//                     Conversion: 1 gram = 5 carats | 1 carat = 0.20 grams
//                   </p> */}
//                 </div>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={handleAddLineItem}
//                   className="text-amber-600 hover:text-amber-700"
//                 >
//                   + Add Line Item
//                 </Button>
//               </div>

//               {(validationErrors.lineItems ||
//                 validationErrors.compulsoryGold ||
//                 validationErrors.compulsoryCraftsmanship) && (
//                   <div className="rounded-lg border border-red-300 bg-red-50 p-3 space-y-1">
//                     {validationErrors.lineItems && (
//                       <p className="text-sm text-red-600">
//                         {validationErrors.lineItems}
//                       </p>
//                     )}
//                     {validationErrors.compulsoryGold && (
//                       <p className="text-sm text-red-600">
//                         {validationErrors.compulsoryGold}
//                       </p>
//                     )}
//                     {validationErrors.compulsoryCraftsmanship && (
//                       <p className="text-sm text-red-600">
//                         {validationErrors.compulsoryCraftsmanship}
//                       </p>
//                     )}
//                   </div>
//                 )}

//               {lineItems.length === 0 ? (
//                 <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
//                   <p className="text-sm text-muted-foreground">
//                     No line items added yet. Click &quot;Add Line Item&quot; to
//                     start.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto rounded-lg border">
//                   <table className="w-full text-sm">
//                     <thead className="bg-muted">
//                       <tr>
//                         <th className="px-3 py-2 text-left font-medium">
//                           Particulars
//                         </th>
//                         <th className="px-3 py-2 text-left font-medium">
//                           Shape
//                         </th>
//                         <th className="px-3 py-2 text-left font-medium">
//                           Colour
//                         </th>
//                         <th className="px-3 py-2 text-left font-medium">
//                           Clarity
//                         </th>
//                         <th className="px-3 py-2 text-left font-medium">PC</th>
//                         <th className="px-3 py-2 text-left font-medium">
//                           Weight
//                         </th>
//                         <th className="px-3 py-2 text-left font-medium">
//                           Unit
//                         </th>
//                         <th className="px-3 py-2 text-left font-medium">
//                           Rate
//                         </th>
//                         <th className="px-3 py-2 text-left font-medium">
//                           Amount
//                         </th>
//                         <th className="px-3 py-2 text-center font-medium">
//                           Action
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {lineItems.map((item) => (
//                         <tr
//                           key={item.id}
//                           className={`border-t ${item.isCompulsory ? "bg-amber-50" : ""}`}
//                         >
//                           <td className="px-2 py-2">
//                             {item.isCompulsory ? (
//                               <div className="min-w-[150px] px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded border">
//                                 {item.rawMaterial === "Gold"
//                                   ? "Gold "
//                                   : "Craftsmanship Fee "}
//                               </div>
//                             ) : (
//                               <div>
//                                 <select
//                                   className={`w-full min-w-[150px] rounded-md border border-input bg-background px-2 py-1.5 text-sm ${validationErrors[
//                                     `lineItem_${item.id}_particulars`
//                                   ]
//                                     ? "border-red-500"
//                                     : ""
//                                     }`}
//                                   value={item.rawMaterial || ""}
//                                   onChange={(e) =>
//                                     handleLineItemChange(
//                                       item.id,
//                                       "rawMaterial",
//                                       e.target.value
//                                     )
//                                   }
//                                 >
//                                   <option value="">Select...</option>
//                                   <option value="Diamond">Diamond</option>
//                                   <option value="Gemstone">Gemstone</option>
//                                 </select>
//                                 {validationErrors[
//                                   `lineItem_${item.id}_particulars`
//                                 ] && (
//                                     <p className="mt-1 text-xs text-red-600">
//                                       {
//                                         validationErrors[
//                                         `lineItem_${item.id}_particulars`
//                                         ]
//                                       }
//                                     </p>
//                                   )}
//                               </div>
//                             )}
//                           </td>
//                           <td className="px-2 py-2">
//                             <Input
//                               placeholder="Shape"
//                               value={item.shape}
//                               onChange={(e) =>
//                                 handleLineItemChange(
//                                   item.id,
//                                   "shape",
//                                   e.target.value
//                                 )
//                               }
//                               className="min-w-[80px]"
//                             />
//                           </td>
//                           <td className="px-2 py-2">
//                             <Input
//                               placeholder="Colour"
//                               value={item.colour}
//                               onChange={(e) =>
//                                 handleLineItemChange(
//                                   item.id,
//                                   "colour",
//                                   e.target.value
//                                 )
//                               }
//                               className="min-w-[80px]"
//                             />
//                           </td>
//                           <td className="px-2 py-2">
//                             <Input
//                               placeholder="Clarity"
//                               value={item.clarity}
//                               onChange={(e) =>
//                                 handleLineItemChange(
//                                   item.id,
//                                   "clarity",
//                                   e.target.value
//                                 )
//                               }
//                               className="min-w-[80px]"
//                             />
//                           </td>
//                           <td className="px-2 py-2">
//                             <Input
//                               type="number"
//                               placeholder="PC"
//                               value={item.pc ?? ""}
//                               onChange={(e) =>
//                                 handleLineItemChange(
//                                   item.id,
//                                   "pc",
//                                   e.target.value
//                                     ? parseInt(e.target.value)
//                                     : null
//                                 )
//                               }
//                               className={`min-w-[70px] ${validationErrors[`lineItem_${item.id}_pc`]
//                                 ? "border-red-500"
//                                 : ""
//                                 }`}
//                             />
//                             {validationErrors[`lineItem_${item.id}_pc`] && (
//                               <p className="mt-1 text-xs text-red-600">
//                                 {validationErrors[`lineItem_${item.id}_pc`]}
//                               </p>
//                             )}
//                           </td>
//                           <td className="px-2 py-2">
//                             <Input
//                               type="number"
//                               step="0.001"
//                               placeholder="Weight"
//                               value={item.weight ?? ""}
//                               onChange={(e) =>
//                                 handleLineItemChange(
//                                   item.id,
//                                   "weight",
//                                   e.target.value
//                                     ? parseFloat(e.target.value)
//                                     : null
//                                 )
//                               }
//                               className={`min-w-[90px] ${validationErrors[`lineItem_${item.id}_weight`]
//                                 ? "border-red-500"
//                                 : ""
//                                 }`}
//                             />
//                             {validationErrors[`lineItem_${item.id}_weight`] && (
//                               <p className="mt-1 text-xs text-red-600">
//                                 {validationErrors[`lineItem_${item.id}_weight`]}
//                               </p>
//                             )}
//                           </td>
//                           <td className="px-2 py-2">
//                             <div className="min-w-[70px] px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded border">
//                               {item.unit || "-"}
//                             </div>
//                             {validationErrors[`lineItem_${item.id}_unit`] && (
//                               <p className="mt-1 text-xs text-red-600">
//                                 {validationErrors[`lineItem_${item.id}_unit`]}
//                               </p>
//                             )}
//                           </td>
//                           <td className="px-2 py-2">
//                             <Input
//                               type="number"
//                               step="0.01"
//                               placeholder="Rate"
//                               value={item.rate ?? ""}
//                               onChange={(e) =>
//                                 handleLineItemChange(
//                                   item.id,
//                                   "rate",
//                                   e.target.value
//                                     ? parseFloat(e.target.value)
//                                     : null
//                                 )
//                               }
//                               className={`min-w-[100px] ${validationErrors[`lineItem_${item.id}_rate`]
//                                 ? "border-red-500"
//                                 : ""
//                                 }`}
//                             />
//                             {validationErrors[`lineItem_${item.id}_rate`] && (
//                               <p className="mt-1 text-xs text-red-600">
//                                 {validationErrors[`lineItem_${item.id}_rate`]}
//                               </p>
//                             )}
//                           </td>
//                           <td className="px-2 py-2">
//                             <Input
//                               type="number"
//                               step="0.01"
//                               placeholder="Amount"
//                               value={item.amount}
//                               onChange={(e) =>
//                                 handleLineItemChange(
//                                   item.id,
//                                   "amount",
//                                   e.target.value
//                                     ? parseFloat(e.target.value)
//                                     : 0
//                                 )
//                               }
//                               className={`min-w-[100px] ${validationErrors[`lineItem_${item.id}_amount`]
//                                 ? "border-red-500"
//                                 : ""
//                                 }`}
//                               readOnly
//                             />
//                             {validationErrors[`lineItem_${item.id}_amount`] && (
//                               <p className="mt-1 text-xs text-red-600">
//                                 {validationErrors[`lineItem_${item.id}_amount`]}
//                               </p>
//                             )}
//                           </td>
//                           <td className="px-2 py-2 text-center">
//                             {item.isCompulsory ? (
//                               <span className="text-xs text-gray-500 italic">
//                                 Required
//                               </span>
//                             ) : (
//                               <Button
//                                 type="button"
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={() => handleDeleteLineItem(item.id)}
//                                 className="text-red-600 hover:text-red-700"
//                               >
//                                 Delete
//                               </Button>
//                             )}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>

//             {/* Totals Display Section */}
//             {lineItems.length > 0 && (
//               <div className="rounded-lg border bg-muted/50 p-6">
//                 <h3 className="mb-4 text-lg font-semibold">Summary</h3>
//                 <div className="space-y-3">
//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium">Total Taxable Value:</span>
//                     <span className="font-semibold">
//                       ₹ {totalTaxableValue.toFixed(2)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium">GST @ 3%:</span>
//                     <span className="font-semibold">
//                       ₹ {gstAmount.toFixed(2)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between border-t pt-3 text-base">
//                     <span className="font-bold">Grand Total:</span>
//                     <span className="text-lg font-bold text-amber-600">
//                       ₹ {grandTotal.toFixed(2)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className="flex gap-3">
//               <Button
//                 type="submit"
//                 disabled={!isFormValid || isSubmitting}
//                 className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isSubmitting ? (
//                   <span className="flex items-center gap-2">
//                     <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
//                     Saving...
//                   </span>
//                 ) : (
//                   "Save Estimate"
//                 )}
//               </Button>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => router.back()}
//                 disabled={isSubmitting}
//               >
//                 Cancel
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
// }

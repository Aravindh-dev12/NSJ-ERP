"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  queryCreate,
  accountsList,
  accountDetail,
  vouchersItemNames,
  subaccountsList,
  estimatesList,
  estimateDetail,
  goldCaratsList,
  type QueryResponse,
} from "@/lib/backend";
import { API_BASE_URL } from "@/lib/constants";
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
import { SearchableSelect } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import { VouchersHeader } from "./VouchersHeader";
import { generateQueryPDF } from "@/lib/queryPDF";
import {
  addBusinessDays,
  countBusinessDays,
  formatDateForInput,
  isBusinessDay,
  getHolidayName,
} from "@/lib/businessDays";

// Gold Carat options — fallback used only if master fetch fails
const GOLD_CARAT_FALLBACK = ["22K", "24K", "18K", "14K", "9K"];
const GENDER_OPTIONS = ["Male", "Female", "Unisex"];
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

// Remove duplicate function - now imported from shared utility
/*
function generateQueryPDF(data: any) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Customer Query - ${data.accountName}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          padding: 20px; 
          font-size: 11px;
          line-height: 1.4;
          max-width: 100%;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #333; 
          padding-bottom: 10px; 
          margin-bottom: 15px; 
        }
        .header h1 { 
          font-size: 20px; 
          color: #333; 
          margin-bottom: 5px;
          letter-spacing: 0.5px;
        }
        .header p { 
          font-size: 10px; 
          color: #666; 
          margin: 2px 0;
        }
        .content-wrapper {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }
        .left-column {
          flex: 1;
          min-width: 0;
        }
        .right-column {
          width: 280px;
          flex-shrink: 0;
        }
        .section { 
          margin-bottom: 12px;
          page-break-inside: avoid;
        }
        .section-title { 
          font-size: 12px; 
          font-weight: bold; 
          color: #333; 
          border-bottom: 1px solid #ddd; 
          padding-bottom: 4px; 
          margin-bottom: 8px; 
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .field { 
          margin-bottom: 6px; 
          display: flex;
          align-items: baseline;
        }
        .field-label { 
          font-weight: 600; 
          min-width: 140px;
          color: #555; 
          font-size: 10px;
        }
        .field-value { 
          color: #333; 
          flex: 1;
          word-wrap: break-word;
        }
        .reference-image { 
          text-align: center;
          border: 2px solid #ddd;
          border-radius: 6px;
          padding: 10px;
          background: #f9f9f9;
        }
        .reference-image img { 
          max-width: 100%; 
          max-height: 320px;
          border-radius: 4px;
          display: block;
          margin: 0 auto;
        }
        .reference-image p { 
          margin-top: 8px; 
          color: #666; 
          font-size: 9px;
          font-style: italic;
        }
        .footer { 
          margin-top: 15px; 
          padding-top: 10px; 
          border-top: 1px solid #ddd; 
          text-align: center; 
          color: #666; 
          font-size: 9px;
        }
        .footer p { 
          margin: 3px 0; 
        }
        @media print {
          body { padding: 10px; }
          button { display: none !important; }
          .content-wrapper { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>CUSTOMER QUERY FORM</h1>
        <p><strong>Query Date:</strong> ${new Date(data.queryInDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}${data.expiryDate ? ` | <strong>Valid Until:</strong> ${new Date(data.expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}</p>
      </div>
      
      <div class="content-wrapper">
        <div class="left-column">
          <div class="section">
            <div class="section-title">Account Information</div>
            <div class="field"><span class="field-label">Customer Account:</span><span class="field-value">${data.accountName}</span></div>
            ${data.subaccount ? `<div class="field"><span class="field-label">Subaccount:</span><span class="field-value">${data.subaccount}</span></div>` : ''}
            ${data.location ? `<div class="field"><span class="field-label">Delivery Location:</span><span class="field-value">${data.location}</span></div>` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">Item Specifications</div>
            <div class="field"><span class="field-label">Item Name:</span><span class="field-value">${data.itemName}</span></div>
            <div class="field"><span class="field-label">Gold Carat:</span><span class="field-value">${data.goldCarat}</span></div>
            <div class="field"><span class="field-label">Size:</span><span class="field-value">${data.size}</span></div>
            <div class="field"><span class="field-label">Gender:</span><span class="field-value">${data.gender}</span></div>
          </div>
          
          ${data.deliveryType ? `
          <div class="section">
            <div class="section-title">Delivery Information</div>
            <div class="field"><span class="field-label">Delivery Type:</span><span class="field-value">${data.deliveryType}</span></div>
          </div>
          ` : ''}
          
          <div class="footer">
            <p><strong>Generated:</strong> ${new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
            <p style="margin-top: 5px; font-style: italic;">This is a customer query. Order will be created after advance payment.</p>
          </div>
        </div>
        
        <div class="right-column">
          ${data.referenceImage && data.referenceImageType !== 'application/pdf' ? `
          <div class="reference-image">
            <img src="${data.referenceImage}" alt="Reference Design" />
            <p>Reference Design</p>
          </div>
          ` : data.referenceImageType === 'application/pdf' ? `
          <div class="reference-image">
            <p style="padding: 20px; font-size: 10px;">PDF reference file attached with query</p>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-size: 12px; font-weight: 600;">Print</button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Close</button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}
*/

export function QueryFormImproved() {
  const router = useRouter();
  const { toast } = useToast();

  // Initialize CSRF token on component mount
  useEffect(() => {
    // Fetch CSRF token to ensure it's available for POST requests
    fetch(`${API_BASE_URL}/auth/csrf`, {
      credentials: "include",
    }).catch(() => {
      // Silently fail - CSRF will be retried on actual request
    });
  }, []);

  // Data states
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [itemNameOptions, setItemNameOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [availableSubaccounts, setAvailableSubaccounts] = useState<
    { id: string; name: string }[]
  >([]);

  // Gold carat options from master
  const [goldCaratOptions, setGoldCaratOptions] =
    useState<string[]>(GOLD_CARAT_FALLBACK);

  // Estimate linking
  const [estimates, setEstimates] = useState<
    {
      id: string;
      label: string;
      account_id: string;
      account_name: string;
      item_name: string;
      gold_quality: string;
      size_details: string;
      product_image?: string;
      grand_total?: number;
    }[]
  >([]);
  const [loadingEstimates, setLoadingEstimates] = useState(true);
  const [linkedEstimateId, setLinkedEstimateId] = useState("");
  const [estimateSearch, setEstimateSearch] = useState("");
  const [estimateDropdownOpen, setEstimateDropdownOpen] = useState(false);

  // Progressive disclosure
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [accountId, setAccountId] = useState("");
  const [subaccount, setSubaccount] = useState("");
  const [location, setLocation] = useState("");
  const [itemNameId, setItemNameId] = useState("");
  const [itemNameOther, setItemNameOther] = useState("");
  const [goldCarat, setGoldCarat] = useState("");
  const [size, setSize] = useState("");
  const [gender, setGender] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [queryInDate, setQueryInDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryDays, setExpiryDays] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedQueryData, setSavedQueryData] = useState<any>(null);

  // Pre-fill from URL parameters (when coming from sub-account list)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const accountParam = params.get("account");
      const subaccountParam = params.get("subaccount");

      if (accountParam) {
        setAccountId(accountParam);
      }
      if (subaccountParam) {
        setSubaccount(subaccountParam);
      }
    }
  }, []);

  // Load accounts and masters
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
        }
      } catch (err) {
        // Fallback to empty
      } finally {
        if (mounted) setLoadingMasters(false);
      }
    };

    const loadEstimates = async () => {
      setLoadingEstimates(true);
      try {
        const data = await estimatesList({
          page_size: 200,
          status: "draft,sent,selected",
        });
        if (!mounted) return;
        const results = (data.results ?? []) as any[];
        setEstimates(
          results.map((e: any) => ({
            id: e.id,
            label: `${e.account?.account_name || "Unknown"} — ${e.item_name || "Item"} (${e.date || ""})`,
            account_id: e.account?.id || "",
            account_name: e.account?.account_name || "",
            item_name: e.item_name || "",
            gold_quality: e.gold_quality || "",
            size_details: e.size_details || "",
            product_image: e.product_image || undefined,
            grand_total: e.grand_total ? Number(e.grand_total) : undefined,
          }))
        );
      } catch {
        // Non-critical, keep empty list
      } finally {
        if (mounted) setLoadingEstimates(false);
      }
    };

    const loadGoldCarats = async () => {
      try {
        const carats = await goldCaratsList();
        if (!mounted) return;
        if (carats.length > 0) {
          setGoldCaratOptions(carats.map((c) => c.name));
        }
      } catch {
        // keep fallback
      }
    };

    void loadAccounts();
    void loadMasters();
    void loadEstimates();
    void loadGoldCarats();

    return () => {
      mounted = false;
    };
  }, [toast]);

  // Auto-populate subaccount, location, and item name when account is selected
  useEffect(() => {
    if (!accountId) {
      setSubaccount("");
      setLocation("");
      setAvailableSubaccounts([]);
      setItemNameId("");
      setItemNameOther("");
      return;
    }

    const fetchAccountDetails = async () => {
      try {
        const accountData = await accountDetail(accountId);

        // Auto-populate delivery location if available
        if (accountData.contact?.address_line) {
          setLocation(accountData.contact.address_line);
        } else if ((accountData as any).address) {
          setLocation((accountData as any).address);
        }

        // Fetch subaccounts for this account
        // Note: The backend might return subaccounts in the account detail or we need to fetch them separately
        // For now, we'll check if subaccounts are included in the account response
        if (
          (accountData as any).subaccounts &&
          Array.isArray((accountData as any).subaccounts)
        ) {
          const subaccounts = (accountData as any).subaccounts.map(
            (sub: any) => ({
              id: sub.id || sub.account_no,
              name:
                sub.sub_account_name ||
                sub.name ||
                sub.account_name ||
                sub.account_no,
            })
          );
          setAvailableSubaccounts(subaccounts);

          // If there's only one subaccount, auto-select it
          if (subaccounts.length === 1) {
            setSubaccount(subaccounts[0].name);
          } else {
            // Clear subaccount for user to select
            setSubaccount("");
          }
        } else {
          setAvailableSubaccounts([]);
          setSubaccount("");
        }

        // Auto-fill item name from sub-account
        try {
          const subAccounts = await subaccountsList({ account: accountId });
          if (subAccounts.results && subAccounts.results.length > 0) {
            const firstSubAccount = subAccounts.results[0];
            if (firstSubAccount.item_name) {
              // Try to find matching item in the dropdown
              const matchingItem = itemNameOptions.find(
                (item) =>
                  item.name.toLowerCase() ===
                  firstSubAccount.item_name?.toLowerCase()
              );

              if (matchingItem) {
                setItemNameId(matchingItem.id);
                setItemNameOther("");
              } else {
                // If not in dropdown, use "other" and set the custom value
                setItemNameId("other");
                setItemNameOther(firstSubAccount.item_name);
              }
            }
          }
        } catch (err) {
          console.warn("Could not fetch sub-account item name:", err);
        }
      } catch (err) {
        console.warn("Could not fetch account details:", err);
        // Don't show error to user, just log it
      }
    };

    fetchAccountDetails();
  }, [accountId, itemNameOptions]);

  // Auto-calculate expiry date from business days (skipping Sundays and holidays)
  useEffect(() => {
    if (expiryDays && queryInDate) {
      const days = parseInt(expiryDays);
      if (!isNaN(days) && days > 0) {
        const queryDate = new Date(queryInDate);
        // Use business days calculation
        const expiryDateCalculated = addBusinessDays(queryDate, days);
        setExpiryDate(formatDateForInput(expiryDateCalculated));
      }
    }
  }, [expiryDays, queryInDate]);

  // Auto-calculate business days from expiry date
  useEffect(() => {
    if (expiryDate && queryInDate && !expiryDays) {
      const query = new Date(queryInDate);
      const expiry = new Date(expiryDate);
      // Calculate business days between dates
      const businessDays = countBusinessDays(query, expiry);
      if (businessDays > 0) {
        setExpiryDays(businessDays.toString());
      }
    }
  }, [expiryDate, queryInDate]);

  // File handling
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

  // When user selects an estimate, auto-fill account + item fields
  const handleEstimateSelect = async (estimateId: string) => {
    setLinkedEstimateId(estimateId);
    if (!estimateId) return;

    try {
      const estimate = await estimateDetail(estimateId);
      // Auto-fill account
      if (estimate.account?.id) {
        setAccountId(estimate.account.id);
      }
      // Auto-fill item details (step 2)
      if (estimate.item_name) {
        const match = itemNameOptions.find(
          (i) => i.name.toLowerCase() === estimate.item_name.toLowerCase()
        );
        if (match) {
          setItemNameId(match.id);
          setItemNameOther("");
        } else {
          setItemNameId("other");
          setItemNameOther(estimate.item_name);
        }
      }
      if (estimate.gold_quality) setGoldCarat(estimate.gold_quality);
      if (estimate.size_details) setSize(estimate.size_details);
      // gender intentionally left for user to fill

      toast({
        title: "Estimate linked",
        description:
          "Account and item details have been pre-filled from the estimate.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Could not load estimate details",
      });
    }
  };

  const accountOptions = useMemo(() => {
    return accounts.map((s) => {
      const [id, name] = s.split("::");
      return { id, name };
    });
  }, [accounts]);

  // Validation for each step
  const canProceedToStep2 =
    linkedEstimateId.trim() !== "" && accountId.trim() !== "";
  const canProceedToStep3 =
    itemNameId.trim() !== "" &&
    goldCarat.trim() !== "" &&
    size.trim() !== "" &&
    gender.trim() !== "";
  const canProceedToStep4 = queryInDate.trim() !== "";

  const handleNext = () => {
    if (currentStep === 1 && !linkedEstimateId.trim()) {
      toast({
        variant: "destructive",
        title: "Please link an estimate to continue",
        description: "An estimate must be linked before creating a query.",
      });
      return;
    }
    if (currentStep === 1 && !accountId.trim()) {
      toast({
        variant: "destructive",
        title: "Please select a customer account to continue",
      });
      return;
    }
    if (currentStep === 2 && !canProceedToStep3) {
      toast({
        variant: "destructive",
        title: "Please fill in item name, gold carat, size, and gender",
      });
      return;
    }
    if (currentStep === 3 && !canProceedToStep4) {
      toast({ variant: "destructive", title: "Please select query date" });
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId || !goldCarat || !size || !gender || !queryInDate || !file) {
      toast({
        variant: "destructive",
        title: "Please fill in all required fields including reference image",
      });
      return;
    }

    if (itemNameId === "other" && !itemNameOther.trim()) {
      toast({
        variant: "destructive",
        title: "Please specify the custom item name",
      });
      return;
    }

    setIsSubmitting(true);

    const payload: Partial<QueryResponse> = {
      item_name:
        itemNameId !== "other" ? { id: itemNameId, name: "" } : undefined,
      item_name_custom: itemNameId === "other" ? itemNameOther : undefined,
      gold_carat: goldCarat,
      gender: gender || undefined,
      size: size,
      location: location || undefined,
      delivery_type: deliveryType || undefined,
      query_in_date: queryInDate,
      expiry_date: expiryDate || undefined,
      account: { id: accountId, account_name: "", name: "" },
      subaccount: subaccount || undefined,
      linked_estimate_id: linkedEstimateId || undefined,
    };

    try {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (typeof v === "object") fd.append(k, JSON.stringify(v));
        else fd.append(k, String(v));
      });
      fd.append("reference_image", file);
      const createdQuery = await queryCreate(
        fd as unknown as Partial<QueryResponse>
      );

      toast({
        title: "Query created successfully",
        description: "Your query has been saved.",
      });

      // Prepare data for PDF including image
      const selectedAccount = accountOptions.find((a) => a.id === accountId);
      const selectedItem = itemNameOptions.find((i) => i.id === itemNameId);

      // Convert file to base64 for PDF
      const reader = new FileReader();
      reader.onloadend = () => {
        setSavedQueryData({
          queryId: createdQuery?.id,
          accountName: selectedAccount?.name || "Unknown",
          subaccount,
          location,
          itemName:
            itemNameId === "other"
              ? itemNameOther
              : selectedItem?.name || "Unknown",
          goldCarat,
          size,
          gender,
          deliveryType,
          queryInDate,
          expiryDate,
          referenceImage: reader.result as string,
          referenceImageType: file.type,
        });
        setShowSuccessModal(true);
      };
      reader.readAsDataURL(file);

      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not create query",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintPDF = async () => {
    if (savedQueryData) {
      try {
        await generateQueryPDF(savedQueryData);
        toast({
          title: "PDF Downloaded",
          description: "Query PDF has been downloaded successfully.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "PDF Generation Failed",
          description: "Could not generate PDF. Please try again.",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <VouchersHeader
          title="New Customer Query"
          description="Capture customer jewelry inquiry details"
        />
        <PreviousBackButton />
      </div>

      {/* Success Modal with PDF Option */}
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
            <h3 className="text-lg font-semibold text-green-700">
              ✓ Query Created Successfully
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your query has been saved. Would you like to print or share it
              with the customer?
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                onClick={handlePrintPDF}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                🖨️ Print / Export PDF
              </Button>
              {savedQueryData?.queryId && (
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push(
                      `/vouchers/pending-queries/${savedQueryData.queryId}/convert`
                    );
                  }}
                  className="w-full"
                >
                  Convert to Order →
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/vouchers/pending-queries");
                }}
                className="w-full"
              >
                View Pending Queries
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSuccessModal(false);
                  // Reset form
                  setCurrentStep(1);
                  setAccountId("");
                  setSubaccount("");
                  setLocation("");
                  setItemNameId("");
                  setItemNameOther("");
                  setGoldCarat("");
                  setSize("");
                  setGender("");
                  setDeliveryType("");
                  setQueryInDate(new Date().toISOString().split("T")[0]);
                  setExpiryDate("");
                  setExpiryDays("");
                  setFile(null);
                }}
                className="w-full"
              >
                Create Another Query
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                currentStep === step
                  ? "bg-amber-600 text-white"
                  : currentStep > step
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {currentStep > step ? "✓" : step}
            </div>
            {step < 4 && (
              <div
                className={`h-1 w-12 ${
                  currentStep > step ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Step 1: Account Information"}
            {currentStep === 2 && "Step 2: Item Details"}
            {currentStep === 3 && "Step 3: Timeline & Delivery"}
            {currentStep === 4 && "Step 4: Reference Image"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Select the customer account"}
            {currentStep === 2 && "Specify the jewelry item details"}
            {currentStep === 3 && "Set query dates and delivery preferences"}
            {currentStep === 4 &&
              "Upload reference image (required to complete)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Account Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Estimate linking (optional) */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Link Estimate <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    An estimate must be linked before creating a query. It will
                    auto-fill customer and item details.
                  </p>

                  {loadingEstimates ? (
                    <div className="h-10 animate-pulse bg-muted rounded" />
                  ) : (
                    <div className="relative">
                      {/* Trigger button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEstimateDropdownOpen((o) => !o);
                          setEstimateSearch("");
                        }}
                        className="w-full flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm text-left hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <span
                          className={
                            linkedEstimateId
                              ? "font-medium text-foreground"
                              : "text-red-400"
                          }
                        >
                          {linkedEstimateId
                            ? (() => {
                                const sel = estimates.find(
                                  (e) => e.id === linkedEstimateId
                                );
                                return sel
                                  ? `${sel.account_name} — ${sel.item_name}${sel.grand_total ? ` (₹${sel.grand_total.toLocaleString("en-IN")})` : ""}`
                                  : "Estimate selected";
                              })()
                            : "Select an estimate (required)"}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {estimateDropdownOpen ? "▲" : "▼"}
                        </span>
                      </button>

                      {/* Dropdown panel */}
                      {estimateDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-lg border border-input bg-background shadow-lg">
                          {/* Search */}
                          <div className="p-2 border-b border-input">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Search by customer or item..."
                              value={estimateSearch}
                              onChange={(e) =>
                                setEstimateSearch(e.target.value)
                              }
                              className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>

                          <div className="max-h-60 overflow-y-auto">
                            {(() => {
                              const q = estimateSearch.toLowerCase();
                              const filtered = estimates.filter(
                                (e) =>
                                  e.account_name.toLowerCase().includes(q) ||
                                  e.item_name.toLowerCase().includes(q) ||
                                  e.gold_quality.toLowerCase().includes(q)
                              );
                              const visible = filtered.slice(0, 5);
                              const hasMore = filtered.length > 5;

                              if (filtered.length === 0) {
                                return (
                                  <p className="px-3 py-3 text-sm text-muted-foreground italic">
                                    No estimates match your search.
                                  </p>
                                );
                              }

                              return (
                                <>
                                  {visible.map((est) => (
                                    <button
                                      key={est.id}
                                      type="button"
                                      onClick={() => {
                                        handleEstimateSelect(est.id);
                                        setEstimateDropdownOpen(false);
                                        setEstimateSearch("");
                                      }}
                                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 flex items-center justify-between gap-2 ${
                                        linkedEstimateId === est.id
                                          ? "bg-muted font-medium"
                                          : ""
                                      }`}
                                    >
                                      <div className="min-w-0 truncate">
                                        <span className="font-medium text-foreground">
                                          {est.account_name}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {" "}
                                          — {est.item_name}
                                        </span>
                                        {est.gold_quality && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            ({est.gold_quality})
                                          </span>
                                        )}
                                      </div>
                                      {est.grand_total !== undefined &&
                                        est.grand_total > 0 && (
                                          <span className="shrink-0 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                            ₹
                                            {est.grand_total.toLocaleString(
                                              "en-IN"
                                            )}
                                          </span>
                                        )}
                                    </button>
                                  ))}
                                  {hasMore && (
                                    <p className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-input">
                                      Showing 5 of {filtered.length} — search to
                                      narrow results
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Backdrop to close dropdown */}
                      {estimateDropdownOpen && (
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => {
                            setEstimateDropdownOpen(false);
                            setEstimateSearch("");
                          }}
                        />
                      )}
                    </div>
                  )}

                  {linkedEstimateId && (
                    <p className="text-xs text-green-700 font-medium">
                      ✓ Estimate linked — account and item details will be
                      auto-filled.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountId">Customer Account *</Label>
                  {loadingAccounts ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <select
                      id="accountId"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
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

                {/* Subaccount field - show dropdown if multiple subaccounts available */}
                {availableSubaccounts.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="subaccount">Subaccount (Optional)</Label>
                    {availableSubaccounts.length === 1 ? (
                      <Input
                        id="subaccount"
                        value={subaccount}
                        disabled
                        className="bg-muted"
                      />
                    ) : (
                      <select
                        id="subaccount"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={subaccount}
                        onChange={(e) => setSubaccount(e.target.value)}
                      >
                        <option value="">Select subaccount (optional)</option>
                        {availableSubaccounts.map((sub) => (
                          <option key={sub.id} value={sub.name}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Location field - auto-populated from account */}
                <div className="space-y-2">
                  <Label htmlFor="location">Delivery Location</Label>
                  <Input
                    id="location"
                    placeholder="Delivery address"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  {location && (
                    <p className="text-xs text-muted-foreground">
                      Auto-filled from account address. You can modify if
                      needed.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Item Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="itemNameId">Item Name *</Label>
                  {loadingMasters ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <SearchableSelect
                      options={[
                        ...itemNameOptions.map((it) => ({
                          value: it.id,
                          label: it.name,
                        })),
                        { value: "other", label: "Other (specify below)" },
                      ]}
                      value={itemNameId}
                      onChange={setItemNameId}
                      placeholder="Search or select item..."
                      searchPlaceholder="Type to search items..."
                      emptyText="No items found"
                    />
                  )}
                </div>

                {itemNameId === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="itemNameOther">Custom Item Name *</Label>
                    <Input
                      id="itemNameOther"
                      placeholder="e.g., Brooch, Anklet, Custom Ring"
                      value={itemNameOther}
                      onChange={(e) => setItemNameOther(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="goldCarat">Gold Carat *</Label>
                  <select
                    id="goldCarat"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={goldCarat}
                    onChange={(e) => setGoldCarat(e.target.value)}
                  >
                    <option value="">Select carat</option>
                    {goldCaratOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size *</Label>
                  <Input
                    id="size"
                    placeholder="e.g., 6 inches, 7.5, Medium"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <select
                    id="gender"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Timeline & Delivery */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="queryInDate">Query Date *</Label>
                  <Input
                    id="queryInDate"
                    type="date"
                    value={queryInDate}
                    onChange={(e) => setQueryInDate(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDays">
                      Expiry in Days (Business Days)
                    </Label>
                    <Input
                      id="expiryDays"
                      type="number"
                      placeholder="e.g., 7, 14, 30"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                    />
                    {/* <p className="text-xs text-muted-foreground">
                      Enter business days (excludes Sundays & holidays)
                    </p> */}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Or Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => {
                        setExpiryDate(e.target.value);
                        setExpiryDays(""); // Clear days when date is manually set
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Or select date directly
                    </p>
                  </div>
                </div>

                {/* Show helpful info about the calculated expiry date */}
                {/* {expiryDate && queryInDate && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-sm text-blue-900">
                      <strong>📅 Expiry Date:</strong> {new Date(expiryDate).toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    {expiryDays && (
                      <p className="text-xs text-blue-700 mt-1">
                        {expiryDays} business day{parseInt(expiryDays) !== 1 ? 's' : ''} from query date (Sundays & Indian holidays excluded)
                      </p>
                    )}
                    {(() => {
                      const expDate = new Date(expiryDate);
                      const holidayName = getHolidayName(expDate);
                      if (holidayName) {
                        return (
                          <p className="text-xs text-amber-700 mt-1">
                            ⚠️ Note: This date falls on {holidayName}
                          </p>
                        );
                      }
                      if (!isBusinessDay(expDate)) {
                        return (
                          <p className="text-xs text-amber-700 mt-1">
                            ⚠️ Note: This date falls on a Sunday
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )} */}

                <div className="space-y-2">
                  <Label htmlFor="deliveryType">Delivery Type </Label>
                  <select
                    id="deliveryType"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value)}
                  >
                    <option value="">Select delivery type</option>
                    {DELIVERY_TYPE_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Additional Details */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reference_image">Reference Image *</Label>
                  <input
                    id="reference_image"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={onFileChange}
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a reference image for the desired item design
                    (required)
                  </p>
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="max-w-xs rounded-lg border"
                      />
                    </div>
                  )}
                  {isPdf && file && (
                    <div className="mt-2">
                      <a
                        href={URL.createObjectURL(file)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        📄 PDF uploaded — click to view
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    ← Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                {currentStep < 4 ? (
                  <Button type="button" onClick={handleNext}>
                    Next →
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting || !file}>
                    {isSubmitting
                      ? "Saving..."
                      : !file
                        ? "Upload Image to Continue"
                        : "💾 Save Query"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

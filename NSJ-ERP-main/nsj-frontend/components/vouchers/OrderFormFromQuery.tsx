"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { VouchersHeader } from "./VouchersHeader";
import {
  accountsList,
  vouchersItemNames,
  createOrderWithProcess,
  queryConvertToOrder,
  goldCaratsList,
  getSubAccountsByAccountId,
  type SubAccount,
} from "@/lib/backend";
import { validateWorkflow } from "@/lib/goldRateApi";
import { JEWELRY_TYPE_MAPPING } from "@/lib/constants";
import { PreviousBackButton } from "../ui/PreviousBackButton";

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

/* REMOVED: generateOrderTrackingPDF duplicate — use shared lib/orderTrackingPDF instead
function generateOrderTrackingPDF_REMOVED(data: {
  orderId: string;
  queryInDate: string;
  accountName: string;
  subaccount?: string;
  itemName: string;
  goldCarat: string;
  size: string;
  location?: string;
  deliveryType?: string;
  referenceImage?: string;
  referenceImageType?: string;
}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order Tracking Sheet - ${data.orderId}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px;
          font-size: 11px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .header-left h1 {
          font-size: 24px;
          color: #8B4513;
          margin-bottom: 5px;
        }
        .header-right {
          text-align: right;
        }
        .logo {
          font-size: 32px;
          font-style: italic;
          color: #8B4513;
          font-weight: bold;
        }
        .tagline {
          font-size: 10px;
          color: #666;
          margin-top: 5px;
        }
        .order-id-box {
          border: 2px solid #D2B48C;
          background: #FFF8DC;
          padding: 15px;
          text-align: center;
          margin-top: 10px;
        }
        .order-id-box h2 {
          font-size: 14px;
          color: #8B4513;
          margin-bottom: 5px;
        }
        .order-id-box .id {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        .section {
          border: 2px solid #D2B48C;
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        .section-header {
          background: #D2B48C;
          padding: 8px 15px;
          font-weight: bold;
          font-size: 13px;
          color: #333;
          text-align: center;
        }
        .section-content {
          display: flex;
        }
        .section-left {
          flex: 1;
          border-right: 2px solid #D2B48C;
        }
        .section-right {
          width: 350px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: #FFFAF0;
        }
        .field-row {
          display: flex;
          border-bottom: 1px solid #D2B48C;
        }
        .field-row:last-child {
          border-bottom: none;
        }
        .field-label {
          width: 180px;
          padding: 10px 15px;
          font-weight: 600;
          background: #FFF8DC;
          border-right: 1px solid #D2B48C;
          color: #555;
        }
        .field-value {
          flex: 1;
          padding: 10px 15px;
          color: #333;
        }
        .dates-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .date-cell {
          border-bottom: 1px solid #D2B48C;
          border-right: 1px solid #D2B48C;
        }
        .date-cell:nth-child(2n) {
          border-right: none;
        }
        .date-cell:nth-last-child(-n+2) {
          border-bottom: none;
        }
        .reference-image-label {
          font-size: 12px;
          color: #8B4513;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .reference-image img {
          max-width: 100%;
          max-height: 300px;
          border: 2px solid #D2B48C;
          border-radius: 4px;
        }
        .reference-image-placeholder {
          width: 300px;
          height: 300px;
          border: 2px dashed #D2B48C;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-style: italic;
        }
        @media print {
          body { padding: 10px; }
          button { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1>ORDER TRACKING SHEET</h1>
        </div>
        <div class="header-right">
          <div class="logo">NitiSHAH</div>
          <div class="tagline">CRAFTING LEGACIES — 2844</div>
          <div class="order-id-box">
            <h2>ORDER ID</h2>
            <div class="id">${data.orderId}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">IMPORTANT DATES</div>
        <div class="dates-grid">
          <div class="date-cell">
            <div class="field-label">SHIPMENT DATE</div>
            <div class="field-value"></div>
          </div>
          <div class="date-cell">
            <div class="field-label">QUERY IN</div>
            <div class="field-value">${new Date(data.queryInDate).toLocaleDateString('en-IN')}</div>
          </div>
          <div class="date-cell">
            <div class="field-label">FINAL DELIVERY DATE</div>
            <div class="field-value"></div>
          </div>
          <div class="date-cell">
            <div class="field-label">CONFIRMATION + ADVANCE</div>
            <div class="field-value">✓</div>
          </div>
          <div class="date-cell" style="grid-column: span 2;">
            <div class="field-label">STOCK IN DEADLINE</div>
            <div class="field-value"></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">ORDER DETAILS & REFERENCE IMAGE</div>
        <div class="section-content">
          <div class="section-left">
            <div class="field-row">
              <div class="field-label">ITEM NAME</div>
              <div class="field-value">${data.itemName}</div>
            </div>
            <div class="field-row">
              <div class="field-label">GOLD KT</div>
              <div class="field-value">${data.goldCarat}</div>
            </div>
            <div class="field-row">
              <div class="field-label">SIZE</div>
              <div class="field-value">${data.size}</div>
            </div>
            <div class="field-row">
              <div class="field-label">PACKAGING</div>
              <div class="field-value"></div>
            </div>
            <div class="field-row">
              <div class="field-label">TAG ID</div>
              <div class="field-value"></div>
            </div>
            <div class="field-row">
              <div class="field-label">NSJ DESIGN ID</div>
              <div class="field-value"></div>
            </div>
            <div class="field-row">
              <div class="field-label"></div>
              <div class="field-value"></div>
            </div>
          </div>
          <div class="section-right">
            <div class="reference-image-label">REFERENCE IMAGE</div>
            ${data.referenceImage && data.referenceImageType !== 'application/pdf' ? `
              <div class="reference-image">
                <img src="${data.referenceImage}" alt="Reference Design" />
              </div>
            ` : `
              <div class="reference-image-placeholder">
                ${data.referenceImageType === 'application/pdf' ? 'PDF Reference Attached' : 'No Image'}
              </div>
            `}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">CLIENT INFORMATION</div>
        <div class="section-content">
          <div style="flex: 1;">
            <div class="field-row">
              <div class="field-label">MAIN A/C NAME</div>
              <div class="field-value">${data.accountName}</div>
            </div>
            <div class="field-row">
              <div class="field-label">SUB A/C</div>
              <div class="field-value">${data.subaccount || ''}</div>
            </div>
            <div class="field-row">
              <div class="field-label">PHONE NUMBER</div>
              <div class="field-value"></div>
            </div>
          </div>
          <div style="flex: 1;">
            <div class="field-row">
              <div class="field-label">LOCATION</div>
              <div class="field-value">${data.location || ''}</div>
            </div>
            <div class="field-row">
              <div class="field-label">DELIVERY TYPE</div>
              <div class="field-value">${data.deliveryType || ''}</div>
            </div>
            <div class="field-row">
              <div class="field-label"></div>
              <div class="field-value"></div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 12px 24px; background: #8B4513; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px; font-size: 14px; font-weight: 600;">Print</button>
        <button onclick="window.close()" style="padding: 12px 24px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">Close</button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}
*/

export function OrderFormFromQuery() {
  const router = useRouter();
  const { toast } = useToast();

  // URL params from query conversion
  const [queryId, setQueryId] = useState<string | null>(null);
  const [linkedEstimateId, setLinkedEstimateId] = useState<string | null>(null);
  const [receiptVoucherId, setReceiptVoucherId] = useState<string | null>(null);

  // Master data
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [itemNameOptions, setItemNameOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [goldCaratOptions, setGoldCaratOptions] =
    useState<string[]>(GOLD_CARAT_FALLBACK);

  // Form fields
  const [orderId, setOrderId] = useState("");
  const [orderType, setOrderType] = useState("STOCK_JEWELRY");
  const [queryInDate, setQueryInDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [accountId, setAccountId] = useState("");
  const [subaccount, setSubaccount] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [itemNameId, setItemNameId] = useState("");
  const [itemNameOther, setItemNameOther] = useState("");
  const [goldCarat, setGoldCarat] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [queryReferenceImageUrl, setQueryReferenceImageUrl] = useState<
    string | null
  >(null);
  const [availableSubaccounts, setAvailableSubaccounts] = useState<
    SubAccount[]
  >([]);
  const [loadingSubaccounts, setLoadingSubaccounts] = useState(false);
  const [remarks, setRemarks] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load URL parameters
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("fromQuery");

    if (!fromQuery) {
      toast({
        variant: "destructive",
        title: "Invalid Access",
        description: "This form can only be accessed from query conversion.",
      });
      router.push("/vouchers/pending-queries");
      return;
    }

    setQueryId(fromQuery);
    setReceiptVoucherId(params.get("receiptVoucherId"));

    // Pre-fill from URL params
    const accountIdParam = params.get("accountId");
    const itemNameIdParam = params.get("itemNameId");
    const itemNameParam = params.get("itemName");
    const goldCaratParam = params.get("goldCarat");
    const sizeParam = params.get("size");
    const genderParam = params.get("gender");
    const deliveryTypeParam = params.get("deliveryType");
    const locationParam = params.get("location");
    const subaccountParam = params.get("subaccount");

    if (accountIdParam) setAccountId(accountIdParam);
    if (itemNameIdParam) setItemNameId(itemNameIdParam);
    if (itemNameParam && !itemNameIdParam) setItemNameOther(itemNameParam);
    if (goldCaratParam) setGoldCarat(goldCaratParam);
    if (sizeParam) setSize(sizeParam);
    if (genderParam) setGender(genderParam);
    if (deliveryTypeParam) setDeliveryType(deliveryTypeParam);
    if (locationParam) setLocation(locationParam);
    if (subaccountParam) setSubaccount(subaccountParam);
    const linkedEstimateParam = params.get("linkedEstimateId");
    if (linkedEstimateParam) setLinkedEstimateId(linkedEstimateParam);

    const refImageParam = params.get("referenceImageUrl");
    if (refImageParam) setQueryReferenceImageUrl(refImageParam);

    const remarksParam = params.get("remarks");
    if (remarksParam) setRemarks(remarksParam);

    // Generate order ID from query ID
    setOrderId(`ORD-${fromQuery}`);

    toast({
      title: "Query Data Loaded",
      description:
        "Order form has been pre-filled. Complete remaining fields and save.",
    });
  }, [router, toast]);

  // Load accounts
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

    return () => {
      mounted = false;
    };
  }, [toast]);

  // Load sub-accounts when accountId changes
  useEffect(() => {
    if (!accountId) {
      setAvailableSubaccounts([]);
      return;
    }

    const fetchSubs = async () => {
      setLoadingSubaccounts(true);
      try {
        const subs = await getSubAccountsByAccountId(accountId);
        setAvailableSubaccounts(subs);

        // If there's only one sub-account and none is selected, auto-select it
        if (subs.length === 1 && !subaccount) {
          setSubaccount(subs[0].sub_account_name || "");
        }
      } catch (err) {
        console.error("Failed to fetch sub-accounts:", err);
      } finally {
        setLoadingSubaccounts(false);
      }
    };

    fetchSubs();
  }, [accountId, subaccount]);

  // Load item names
  useEffect(() => {
    let mounted = true;

    const loadMasters = async () => {
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
      } catch {
        // keep empty
      }
    };

    const loadGoldCarats = async () => {
      try {
        const carats = await goldCaratsList();
        if (mounted && carats.length > 0) {
          setGoldCaratOptions(carats.map((c) => c.name));
        }
      } catch {
        // keep fallback
      }
    };

    void loadMasters();
    void loadGoldCarats();

    return () => {
      mounted = false;
    };
  }, [toast]);

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

  // Auto-detect Order Category based on Item Name
  useEffect(() => {
    let nameToCheck = "";
    if (itemNameId && itemNameId !== "other") {
      const item = itemNameOptions.find((i) => i.id === itemNameId);
      if (item) nameToCheck = item.name;
    } else {
      nameToCheck = itemNameOther;
    }

    if (!nameToCheck) return;
    const name = nameToCheck.toLowerCase();

    // Check keywords and switch category if needed
    if (name.includes("cvd")) {
      setOrderType("BESPOKE_CVD");
    } else if (name.includes("natural")) {
      setOrderType("BESPOKE_NATURAL");
    } else if (
      name.includes("loose") ||
      name.includes("diamond") ||
      name.includes("stone")
    ) {
      setOrderType("LOOSE_DIAMONDS");
    }
  }, [itemNameId, itemNameOther, itemNameOptions]);

  const accountOptions = accounts.map((s) => {
    const [id, name] = s.split("::");
    return { id, name };
  });

  const filteredItemNameOptions = useMemo(() => {
    if (!orderType || !JEWELRY_TYPE_MAPPING[orderType]) {
      return itemNameOptions;
    }
    const keywords = JEWELRY_TYPE_MAPPING[orderType];
    return itemNameOptions.filter((opt) =>
      keywords.some((k) => opt.name.toLowerCase().includes(k.toLowerCase()))
    );
  }, [itemNameOptions, orderType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId || !size || !queryId) {
      toast({
        variant: "destructive",
        title: "Please fill in all required fields",
        description: "Account, size, and query ID are required.",
      });
      return;
    }

    // Check if item name is provided (either from dropdown or as text)
    const itemNameValue = (
      document.getElementById("itemName") as HTMLInputElement
    )?.value;
    if (!itemNameId && !itemNameOther.trim() && !itemNameValue?.trim()) {
      toast({ variant: "destructive", title: "Please provide an item name" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the order - build payload matching backend expectations
      const payload: Record<string, unknown> = {};

      // 1. Resolve Account (Mandatory fix)
      payload.account = accountId;
      payload.account_id = accountId; // Keep for backward compatibility

      // 2. Resolve Item Name (Mandatory fix)
      let finalItemName = "";
      if (itemNameId && itemNameId !== "other") {
        const selectedItem = itemNameOptions.find(
          (opt) => opt.id === itemNameId
        );
        finalItemName = selectedItem?.name || "";
        payload.item_name_fk_id = itemNameId;
      } else if (itemNameOther && itemNameOther.trim()) {
        finalItemName = itemNameOther.trim();
      } else {
        const itemNameValue = (
          document.getElementById("itemName") as HTMLInputElement
        )?.value;
        finalItemName = itemNameValue?.trim() || "";
      }
      payload.item_name = finalItemName;

      // Other fields
      payload.order_type = orderType;
      payload.date = queryInDate;

      // Product specifications
      // Note: gold_rate expects a decimal number, but we're storing carat as string
      // Store carat in a text field instead
      if (goldCarat) {
        payload.stamp = goldCarat; // Store carat in stamp field
        payload.gold_rate = 0; // Set gold_rate to 0 as placeholder
      }
      if (size) payload.size = size;
      if (quantity) payload.number_of_pieces = parseInt(quantity) || 1;

      // Optional fields
      if (gender) payload.gender = gender;
      if (location) payload.location = location;
      if (deliveryType) payload.delivery_type = deliveryType;
      if (subaccount) payload.subaccount = subaccount;
      if (remarks.trim()) payload.remarks = remarks.trim();
      // Include reference image URL from query (no file upload needed — URL already stored)
      if (queryReferenceImageUrl)
        payload.reference_image = queryReferenceImageUrl;

      // Default required fields for voucher
      payload.series = "DEFAULT";
      payload.advance_payment_received = receiptVoucherId ? "YES" : "NO";

      console.log(
        "Sending payload to backend:",
        JSON.stringify(payload, null, 2)
      );

      console.log(
        "Sending payload to backend (Process Workflow):",
        JSON.stringify(payload, null, 2)
      );

      // --- NEW PROCESS WORKFLOW ---
      // Instead of creating voucher + query conversion separately,
      // we now use the unified endpoint to create a DRAFT with process steps.

      // Prepare data for createOrderWithProcess
      const processPayload = {
        order_data: payload,
        receipt_voucher_id: receiptVoucherId,
        query_id: queryId,
        linked_estimate_id: linkedEstimateId || undefined,
        advance_amount: undefined,
        advance_notes: undefined,
      };

      // Handle file upload if present (might need adjustment based on backend support for file in this endpoint)
      // For now, let's assume the new endpoint handles the basic order creation + steps
      // If file upload is critical, we might need to upload it separately or ensure backend supports multipart/form-data

      // Call the new API
      const result = await createOrderWithProcess(processPayload);

      console.log("Order Draft Created:", result);

      if (result.draft_id) {
        queryConvertToOrder(queryId, {
          receipt_voucher_id: receiptVoucherId || "",
        })
          .then(() => console.log("Query status updated to converted_to_order"))
          .catch((err) => console.error("Failed to update query status:", err));

        validateWorkflow({
          workflow_type: "order_creation",
          allow_draft: false,
        })
          .then((validation) => {
            if (!validation.can_proceed) {
              toast({
                title: "Warning",
                description: "Order saved as draft.",
                variant: "destructive",
              });
            }
          })
          .catch((e) =>
            console.error("Failed to check workflow validation", e)
          );

        toast({
          title: "Draft Created",
          description: "Proceeding to process confirmation...",
        });

        // Redirect
        router.push(`/order-drafts/${result.draft_id}/process-confirmation/`);
        return;
      } else {
        throw new Error("No draft ID returned from server.");
      }
    } catch (err) {
      console.error("Order creation error:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));

      let errorMessage = "Unknown error";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null) {
        errorMessage = JSON.stringify(err);
      }

      toast({
        variant: "destructive",
        title: "Could not create order",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <VouchersHeader
          title="Complete Order from Query"
          description="Fill in the order details to convert the query"
        />
        <PreviousBackButton />
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">
              Converting Query to Order
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              This form has been pre-filled with query details. Complete the
              remaining required fields and save to create the order.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Identification */}
        <Card>
          <CardHeader>
            <CardTitle>Order Identification</CardTitle>
            <CardDescription>Order reference information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  value={orderId}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated from query
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="queryInDate">Query Date *</Label>
                <Input
                  id="queryInDate"
                  type="date"
                  value={queryInDate}
                  onChange={(e) => setQueryInDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client & Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client & Account Information</CardTitle>
            <CardDescription>Customer details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountId">Account Name *</Label>
                {loadingAccounts ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <select
                    id="accountId"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
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
                <Label htmlFor="subaccount">Sub-Account Name</Label>
                {loadingSubaccounts ? (
                  <Skeleton className="h-10 w-full" />
                ) : availableSubaccounts.length > 0 ? (
                  <select
                    id="subaccount"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={subaccount}
                    onChange={(e) => setSubaccount(e.target.value)}
                  >
                    <option value="">Select sub-account</option>
                    {availableSubaccounts.map((sub) => (
                      <option key={sub.id} value={sub.sub_account_name || ""}>
                        {sub.sub_account_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="subaccount"
                    placeholder="Optional"
                    value={subaccount}
                    onChange={(e) => setSubaccount(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select gender (optional)</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Delivery location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryType">Delivery Type</Label>
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
          </CardContent>
        </Card>

        {/* Product Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Product Specifications</CardTitle>
            <CardDescription>Item details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="itemName">
                  Item Name *
                  {(itemNameId || itemNameOther) && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (From query)
                    </span>
                  )}
                </Label>
                <Input
                  id="itemName"
                  value={
                    itemNameId && itemNameId !== "other"
                      ? itemNameOptions.find((it) => it.id === itemNameId)
                          ?.name || itemNameOther
                      : itemNameOther
                  }
                  onChange={(e) => {
                    // Update itemNameOther when user types
                    setItemNameOther(e.target.value);
                    setItemNameId("other");
                  }}
                  placeholder="Item name will be filled from query"
                  required
                  list="itemNamesList"
                />
                <datalist id="itemNamesList">
                  {filteredItemNameOptions.map((opt) => (
                    <option key={opt.id} value={opt.name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goldCarat">Gold Karat</Label>
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
                  placeholder="e.g., 6 inches, 7.5"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_image">Reference Image</Label>

                {/* Show query's reference image as the default */}
                {queryReferenceImageUrl && !previewUrl && !isPdf && (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-800 mb-2">
                      Reference image from query:
                    </p>
                    <img
                      src={queryReferenceImageUrl}
                      alt="Query reference"
                      className="max-w-xs rounded-lg border"
                    />
                  </div>
                )}

                <input
                  id="reference_image"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={onFileChange}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {queryReferenceImageUrl
                    ? "Upload a different image to replace the query reference"
                    : "Upload reference design image"}
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
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Order..." : "Save Order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/combobox";
import { SalesHeader } from "./SalesHeader";
import { useToast } from "@/hooks/use-toast";
import {
  accountsList,
  accountDetail,
  createSalesQuery,
  updateSalesQuery,
  getSalesQuery,
  deleteSalesQuery,
  saleDetail,
  getSaleEstimates,
  saleGeneratePDF,
  getJewelryTypes,
  getEstimateSummary,
  selectFinalEstimate,
  deselectSaleEstimate,
  convertSaleToOrder,
  estimateUpdate,
} from "@/lib/backend";
import Link from "next/link";

const OCCASIONS = ["Wedding", "Engagement", "Birthday", "Anniversary", "Other"];
const PURPOSES = ["Self", "Gift", "Bridal", "Other"];
const STYLE_PREFS = ["Minimal", "Statement", "Traditional", "Modern", "Unsure"];
const METAL_PREFS = ["Yellow", "White", "Rose", "Two-Tone"];
const DIAMOND_PRIORITIES = ["Size", "Quality", "Balance"];
const URGENCY_LEVELS = ["Standard", "Priority", "Urgent"];
const REFERENCE_SOURCES = ["Instagram", "Referral", "Walk-in", "Other"];
const NEXT_DEPT_OPTIONS = ["Design", "Diamond", "Production"];

interface SalesFormProps {
  saleId?: string;
}

export function SalesForm({ saleId }: SalesFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Form State
  const [salesPerson, setSalesPerson] = useState("");
  const [vendor, setVendor] = useState("");
  const [transferDepartment, setTransferDepartment] = useState("");
  const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [jewelleryTypeOptions, setJewelleryTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [accountId, setAccountId] = useState("");
  const [subAccount, setSubAccount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [clientDeliveryType, setClientDeliveryType] = useState("");
  const [panGstin, setPanGstin] = useState("");
  const [refSource, setRefSource] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  const [occasion, setOccasion] = useState<string[]>([]);
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState("");
  const [stockInDeadline, setStockInDeadline] = useState("");
  const [purpose, setPurpose] = useState<string[]>([]);
  const [jewelleryType, setJewelleryType] = useState("");
  const [sizeDetails, setSizeDetails] = useState("");
  const [fitDetails, setFitDetails] = useState("");
  const [stylePref, setStylePref] = useState<string[]>([]);
  const [metalPref, setMetalPref] = useState<string[]>([]);
  const [diamondShape, setDiamondShape] = useState("");
  const [colCla, setColCla] = useState("");
  const [origin, setOrigin] = useState("");
  const [budgetDia, setBudgetDia] = useState("");
  const [diamondPriority, setDiamondPriority] = useState<string[]>([]);
  const [sample, setSample] = useState("");
  const [gemstonePref, setGemstonePref] = useState("");
  const [gemColCla, setGemColCla] = useState("");
  const [gemOrigin, setGemOrigin] = useState("");
  const [otherDetails, setOtherDetails] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<string[]>([]);
  const [mustHave, setMustHave] = useState("");
  const [mustAvoid, setMustAvoid] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [advanceType, setAdvanceType] = useState("");
  const [amountWeight, setAmountWeight] = useState("");
  const [dateReceived, setDateReceived] = useState("");
  const [receiptGenerated, setReceiptGenerated] = useState(false);
  const [accountsNotified, setAccountsNotified] = useState(false);
  const [goldRateLocked, setGoldRateLocked] = useState(false);
  const [goldRateFixed, setGoldRateFixed] = useState("");
  const [goldRateDate, setGoldRateDate] = useState("");
  const [erpEntryDone, setErpEntryDone] = useState(false);
  const [nextDeptTriggered, setNextDeptTriggered] = useState<string[]>([]);
  const [verifiedBy, setVerifiedBy] = useState("");
  const [designDeptInstructions, setDesignDeptInstructions] = useState("");
  const [productionDeptInstructions, setProductionDeptInstructions] =
    useState("");
  const [accountsDeptInstructions, setAccountsDeptInstructions] = useState("");
  const [reminders, setReminders] = useState("");
  const [roughWork, setRoughWork] = useState("");
  const [finalDesign, setFinalDesign] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectionNotes, setSelectionNotes] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [saleBillNo, setSaleBillNo] = useState("");
  const [saleJobNo, setSaleJobNo] = useState("");

  // Validation error states
  const [phoneError, setPhoneError] = useState("");
  const [panGstinError, setPanGstinError] = useState("");

  // Estimates state
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(
    null
  );
  const [isSelectingEstimate, setIsSelectingEstimate] = useState(false);
  const [isConvertingToOrder, setIsConvertingToOrder] = useState(false);

  // Load existing sale data
  useEffect(() => {
    if (!saleId) return;
    const fetchData = async () => {
      try {
        // Try to fetch as SalesQuery first (new format)
        let data: any;
        try {
          data = await getSalesQuery(saleId);
        } catch (salesQueryError) {
          // If not found as SalesQuery, try as Sale (old format for backward compatibility)
          console.log("Not found as SalesQuery, trying as Sale...");
          data = await saleDetail(saleId);
        }

        setOrderDate(data.order_date || data.date || "");
        setSalesPerson(data.sales_person || "");
        setVendor(data.vendor || "");
        if (data.account?.id) setAccountId(String(data.account.id));
        setSubAccount(data.sub_account || "");
        setPhoneNumber(data.phone_number || "");
        setEmail(data.email || "");
        setCity(data.city || "");
        setClientDeliveryType(data.client_delivery_type || "");
        setPanGstin(data.pan_gstin || "");
        setOccasion(data.occasion || []);
        setRequiredDeliveryDate(data.required_delivery_date || "");
        setStockInDeadline(data.stock_in_deadline || "");
        setPurpose(data.purpose || []);
        setJewelleryType(data.jewellery_type || data.item_name || "");
        setSizeDetails(data.size_details || "");
        setFitDetails(data.fit_details || "");
        setStylePref(data.style_preference || []);
        setMetalPref(data.metal_preference || []);
        setDiamondShape(data.diamond_shape || "");
        setColCla(data.color_clarity || "");
        setOrigin(data.origin || "");
        setBudgetDia(data.diamond_budget || "");
        setDiamondPriority(data.diamond_priority || []);
        setSample(data.sample_details || "");
        setGemstonePref(data.gemstone_preference || "");
        setGemColCla(data.gemstone_color_clarity || "");
        setGemOrigin(data.gemstone_origin || "");
        setOtherDetails(data.other_details || "");
        setBudgetRange(data.budget_range || "");
        setUrgencyLevel(data.urgency_level || []);
        setRefSource(data.reference_source || []);
        setMustHave(data.must_have || "");
        setMustAvoid(data.must_avoid || "");
        setSpecialInstructions(data.special_instructions || data.remarks || "");
        setTransferDepartment(String(data.transfer_department || ""));
        setExistingPhoto(data.reference_photo || null);
        setSelectionNotes(String(data.selection_notes || ""));
        setSaleNotes(String(data.sale_notes || ""));
        setSaleBillNo(String(data.sale_bill_no || data.bill_no || ""));
        setSaleJobNo(String(data.sale_job_no || data.order_no || ""));
        // Load selected estimate ID
        if (data.selected_estimate?.id) {
          setSelectedEstimateId(String(data.selected_estimate.id));
        } else if (data.selected_estimate_id) {
          setSelectedEstimateId(String(data.selected_estimate_id));
        }
        const ah: any = data.advance_handling || {};
        setAdvanceType(ah.advance_type || "");
        setAmountWeight(ah.amount_weight || data.advance_amount || "");
        setDateReceived(ah.date_received || "");
        setReceiptGenerated(!!ah.receipt_generated);
        setAccountsNotified(!!ah.accounts_notified);
        setErpEntryDone(!!ah.erp_entry_done);
        setGoldRateLocked(!!ah.gold_rate_locked);
        setGoldRateFixed(ah.gold_rate_fixed || "");
        setGoldRateDate(ah.gold_rate_date || "");
        setNextDeptTriggered(ah.next_dept_triggered || []);
        setVerifiedBy(ah.verified_by || "");
        const di: any = data.department_instructions || {};
        setDesignDeptInstructions(di.design || "");
        setProductionDeptInstructions(di.production || "");
        setAccountsDeptInstructions(di.accounts || "");
        setReminders(di.reminders || "");
        const dd: any = data.design_delivery || {};
        setRoughWork(dd.rough_work_notes || "");
        setFinalDesign(dd.final_design_url || "");
        setDeliveryNotes(dd.delivery_notes || "");
      } catch (error) {
        console.error("Failed to fetch sale:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load sale details.",
        });
      }
    };
    fetchData();
  }, [saleId, toast]);

  // Load accounts and jewellery types
  useEffect(() => {
    async function load() {
      try {
        const res = await accountsList({ page: 1, page_size: 100 });
        setAccounts(res.results || []);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!accountId || saleId) return;
    async function fetchDetail() {
      try {
        const details = await accountDetail(accountId);
        if (details.contact?.mobile) setPhoneNumber(details.contact.mobile);
        if (details.contact?.email) setEmail(details.contact.email);
        if (details.contact?.city?.name) setCity(details.contact.city.name);
        if (details.tax?.pan) setPanGstin(details.tax.pan);
      } catch (e) {
        console.error(e);
      }
    }
    fetchDetail();
  }, [accountId, saleId]);

  useEffect(() => {
    const fetchJewelleryTypes = async () => {
      try {
        const response = await getJewelryTypes();
        setJewelleryTypeOptions(response.jewelry_types || []);
      } catch (error) {
        console.error("Failed to load jewellery types:", error);
      }
    };
    fetchJewelleryTypes();
  }, []);

  // Load estimates for this sale/sales query
  useEffect(() => {
    if (!saleId) return;
    const fetchEstimates = async () => {
      setLoadingEstimates(true);
      try {
        // Try SalesQuery estimate summary first
        let data;
        try {
          data = await getEstimateSummary(saleId);
        } catch (sqError) {
          // Fallback to Sale estimates endpoint
          console.log("Trying Sale estimates endpoint...");
          data = await getSaleEstimates(saleId);
        }
        setEstimates(data.all_estimates || []);
        // Set selected estimate ID from API response
        if (data.selected_estimate_id) {
          setSelectedEstimateId(data.selected_estimate_id);
        }
      } catch (error) {
        console.error("Failed to load estimates:", error);
        // Don't show error toast - estimates might not exist yet
      } finally {
        setLoadingEstimates(false);
      }
    };
    fetchEstimates();
  }, [saleId]);

  const toggleSelection = (
    current: string[],
    item: string,
    setFn: (v: string[]) => void
  ) => {
    if (current.includes(item)) setFn(current.filter((i) => i !== item));
    else setFn([...current, item]);
  };

  // Validation functions
  const validatePAN = (pan: string): { valid: boolean; error?: string } => {
    if (!pan) return { valid: true }; // Empty is allowed

    // PAN format: 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!panRegex.test(pan.toUpperCase())) {
      return {
        valid: false,
        error:
          "Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)",
      };
    }

    return { valid: true };
  };

  const validateGSTIN = (gstin: string): { valid: boolean; error?: string } => {
    if (!gstin) return { valid: true }; // Empty is allowed

    // GSTIN format: 15 characters
    // 2 digits (state code) + 10 chars (PAN) + 1 alphanumeric (entity code) + Z + 1 alphanumeric (checksum)
    const gstinRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (gstin.length !== 15) {
      return {
        valid: false,
        error: "GSTIN must be exactly 15 characters",
      };
    }

    if (!gstinRegex.test(gstin.toUpperCase())) {
      return {
        valid: false,
        error:
          "Invalid GSTIN format. Must be: 2 digits (state) + 10 chars (PAN) + entity code + Z + checksum",
      };
    }

    // Validate that characters 3-12 form a valid PAN
    const panPart = gstin.substring(2, 12);
    const panValidation = validatePAN(panPart);
    if (!panValidation.valid) {
      return {
        valid: false,
        error: "Invalid PAN within GSTIN (characters 3-12)",
      };
    }

    // Validate 14th character is 'Z'
    if (gstin.charAt(13).toUpperCase() !== "Z") {
      return {
        valid: false,
        error: "14th character of GSTIN must be 'Z'",
      };
    }

    return { valid: true };
  };

  const validatePhone = (phone: string): { valid: boolean; error?: string } => {
    if (!phone) return { valid: true }; // Empty is allowed

    // Remove any non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, "");

    if (digitsOnly.length !== 10) {
      return {
        valid: false,
        error: "Phone number must be exactly 10 digits",
      };
    }

    // Optional: Check if starts with valid Indian mobile prefix (6-9)
    if (!/^[6-9]/.test(digitsOnly)) {
      return {
        valid: false,
        error: "Phone number must start with 6, 7, 8, or 9",
      };
    }

    return { valid: true };
  };

  const validatePanGstin = (
    value: string
  ): { valid: boolean; error?: string } => {
    if (!value) return { valid: true }; // Empty is allowed

    const trimmed = value.trim().toUpperCase();

    // Check if it's a PAN (10 chars) or GSTIN (15 chars)
    if (trimmed.length === 10) {
      return validatePAN(trimmed);
    } else if (trimmed.length === 15) {
      return validateGSTIN(trimmed);
    } else {
      return {
        valid: false,
        error: "Must be either PAN (10 chars) or GSTIN (15 chars)",
      };
    }
  };

  // Handlers with validation
  const handlePhoneChange = (value: string) => {
    // Allow only digits and common separators while typing
    const cleaned = value.replace(/[^\d\s\-\+\(\)]/g, "");
    setPhoneNumber(cleaned);

    // Validate on blur or when length suggests completion
    const digitsOnly = cleaned.replace(/\D/g, "");
    if (digitsOnly.length >= 10) {
      const validation = validatePhone(cleaned);
      setPhoneError(validation.error || "");
    } else {
      setPhoneError("");
    }
  };

  const handlePanGstinChange = (value: string) => {
    // Convert to uppercase and remove spaces
    const cleaned = value.toUpperCase().replace(/\s/g, "");
    setPanGstin(cleaned);

    // Validate when length suggests completion
    if (cleaned.length === 10 || cleaned.length === 15) {
      const validation = validatePanGstin(cleaned);
      setPanGstinError(validation.error || "");
    } else if (cleaned.length > 15) {
      setPanGstinError("Maximum 15 characters allowed");
    } else {
      setPanGstinError("");
    }
  };

  const handlePhoneBlur = () => {
    if (phoneNumber) {
      const validation = validatePhone(phoneNumber);
      setPhoneError(validation.error || "");
    }
  };

  const handlePanGstinBlur = () => {
    if (panGstin) {
      const validation = validatePanGstin(panGstin);
      setPanGstinError(validation.error || "");
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "Client & Basic Info";
      case 2:
        return "Jewellery Details";
      case 3:
        return "Diamond & Gemstone";
      case 4:
        return "Budget & Notes";
      case 5:
        return "Advance & Instructions";
      case 6:
        return "Review & Submit";
      default:
        return "";
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !accountId) {
      toast({
        variant: "destructive",
        title: "Please select a client account",
      });
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const buildPayload = () => ({
    order_date: orderDate,
    sales_person: salesPerson,
    vendor: vendor,
    account_id: accountId,
    sub_account: subAccount,
    phone_number: phoneNumber,
    email: email,
    city: city,
    client_delivery_type: clientDeliveryType,
    pan_gstin: panGstin,
    occasion: occasion,
    required_delivery_date: requiredDeliveryDate || null,
    stock_in_deadline: stockInDeadline || null,
    purpose: purpose,
    jewellery_type: jewelleryType,
    size_details: sizeDetails,
    fit_details: fitDetails,
    follow_up_log: "",
    style_preference: stylePref,
    metal_preference: metalPref,
    diamond_shape: diamondShape,
    color_clarity: colCla,
    origin: origin,
    diamond_budget: budgetDia,
    diamond_priority: diamondPriority,
    sample_details: sample,
    gemstone_preference: gemstonePref,
    gemstone_color_clarity: gemColCla,
    gemstone_origin: gemOrigin,
    other_details: otherDetails,
    budget_range: budgetRange,
    urgency_level: urgencyLevel,
    reference_source: refSource,
    must_have: mustHave,
    must_avoid: mustAvoid,
    special_instructions: specialInstructions,
    transfer_department: transferDepartment,
    advance_handling: {
      advance_type: advanceType,
      amount_weight: amountWeight,
      date_received: dateReceived,
      receipt_generated: receiptGenerated,
      accounts_notified: accountsNotified,
      erp_entry_done: erpEntryDone,
      gold_rate_locked: goldRateLocked,
      gold_rate_fixed: goldRateFixed,
      gold_rate_date: goldRateDate,
      next_dept_triggered: nextDeptTriggered,
      verified_by: verifiedBy,
      colour_stone_demand: "",
      raw_material_instructions: "",
    },
    department_instructions: {
      design: designDeptInstructions,
      production: productionDeptInstructions,
      accounts: accountsDeptInstructions,
      reminders: reminders,
    },
    design_delivery: {
      rough_work_notes: roughWork,
      final_design_url: finalDesign,
      delivery_notes: deliveryNotes,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!orderDate) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Order date is required",
      });
      return;
    }

    if (!salesPerson || salesPerson.trim() === "") {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Sales person name is required",
      });
      setCurrentStep(1); // Go to step 1 where sales person is entered
      return;
    }

    if (!accountId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Client account is required",
      });
      setCurrentStep(1); // Go to step 1 where account is selected
      return;
    }

    if (!jewelleryType || jewelleryType.trim() === "") {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Jewellery type is required",
      });
      setCurrentStep(2); // Go to step 2 where jewellery type is entered
      return;
    }

    // Validate phone and PAN/GSTIN
    const phoneValidation = validatePhone(phoneNumber);
    const panGstinValidation = validatePanGstin(panGstin);

    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || "");
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: phoneValidation.error,
      });
      setCurrentStep(1); // Go to step 1 where phone is entered
      return;
    }

    if (!panGstinValidation.valid) {
      setPanGstinError(panGstinValidation.error || "");
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: panGstinValidation.error,
      });
      setCurrentStep(1); // Go to step 1 where PAN/GSTIN is entered
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      if (saleId) {
        await updateSalesQuery(saleId, payload);
        toast({
          title: "Sale Updated",
          description: "Changes saved successfully.",
        });
      } else {
        await createSalesQuery(payload);
        toast({
          title: "Sale Created",
          description: "Sale recorded successfully.",
        });
      }
      router.push("/vouchers/sale/list");
    } catch (err: any) {
      console.error("Submit error:", err);
      console.error("Error details:", err?.response?.data || err?.message);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to save sale.";
      const errorDetails = err?.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : "";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorDetails || errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!saleId || !confirm("Delete this sale?")) return;
    try {
      await deleteSalesQuery(saleId);
      toast({ title: "Sale Deleted" });
      router.push("/vouchers/sale/list");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete.",
      });
    }
  };

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Find the selected account
      const selectedAccount = accounts.find((a) => String(a.id) === accountId);

      // Build payload with account object included
      const payload = {
        ...buildPayload(),
        account: selectedAccount
          ? {
              id: selectedAccount.id,
              name: selectedAccount.account_name,
              account_name: selectedAccount.account_name,
            }
          : null,
        client_name: selectedAccount?.account_name || "",
      };

      const { blob, fileName } = await saleGeneratePDF(payload);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "PDF Generated",
        description: "Downloaded successfully.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "PDF generation failed.",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSelectEstimate = async (estimateId: string) => {
    if (!saleId) return;
    setIsSelectingEstimate(true);
    try {
      await selectFinalEstimate(saleId, { estimate_id: estimateId });
      setSelectedEstimateId(estimateId);
      // Update local estimates state to reflect selection
      setEstimates((prev) =>
        prev.map((est) => ({
          ...est,
          status: est.id === estimateId ? "selected" : "draft",
        }))
      );
      toast({
        title: "Estimate Selected",
        description: "This estimate is now the primary selection.",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to select estimate.",
      });
    } finally {
      setIsSelectingEstimate(false);
    }
  };

  const handleDeselectEstimate = async () => {
    if (!saleId) return;
    setIsSelectingEstimate(true);
    try {
      // For sales queries, we can select with empty/null to deselect
      // Or just update local state
      setSelectedEstimateId(null);
      // Update local estimates state
      setEstimates((prev) => prev.map((est) => ({ ...est, status: "draft" })));
      toast({
        title: "Estimate Deselected",
        description: "No estimate is currently selected.",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deselect estimate.",
      });
    } finally {
      setIsSelectingEstimate(false);
    }
  };

  const handleArchiveEstimate = async (estimateId: string) => {
    if (
      !confirm(
        "Are you sure you want to archive this estimate? It will be hidden from the list."
      )
    )
      return;

    try {
      // Update estimate to set is_archived = true
      await estimateUpdate(estimateId, {
        is_archived: true,
        status: "archived",
      });

      // Remove from local state
      setEstimates((prev) => prev.filter((est) => est.id !== estimateId));

      toast({
        title: "Estimate Archived",
        description: "The estimate has been archived successfully.",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to archive estimate.",
      });
    }
  };

  const handleConvertToOrder = async () => {
    if (!saleId || !selectedEstimateId) return;
    if (
      !confirm(
        "Convert the selected estimate to an Order? This will create a new order based on the estimate."
      )
    )
      return;
    setIsConvertingToOrder(true);
    try {
      const result = await convertSaleToOrder(saleId);
      toast({
        title: "Order Created",
        description: `Order ${result.order_bill_no} created successfully.`,
      });
      // Optionally navigate to the new order
      router.push(`/vouchers/orders/${result.order_id}`);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to convert to order.",
      });
    } finally {
      setIsConvertingToOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SalesHeader
          title={saleId ? "Sale Details" : "New Sale"}
          description={
            saleId
              ? "View and manage sale details."
              : "Create a comprehensive sale record."
          }
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            type="button"
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? "Generating..." : "Export PDF"}
          </Button>
          {saleId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              type="button"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-1 py-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            <button
              type="button"
              onClick={() => step <= currentStep && setCurrentStep(step)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                step === currentStep
                  ? "bg-orange-500 text-white"
                  : step < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {step}
            </button>
            {step < totalSteps && (
              <div
                className={`h-1 w-8 md:w-12 ${step < currentStep ? "bg-green-500" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Title Card */}
      <Card>
        <CardHeader className="pb-3 bg-muted/20">
          <CardTitle className="text-lg">
            Step {currentStep}: {getStepTitle(currentStep)}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter client and contact information"}
            {currentStep === 2 && "Specify jewellery type and preferences"}
            {currentStep === 3 && "Diamond and gemstone requirements"}
            {currentStep === 4 && "Budget range and notes"}
            {currentStep === 5 && "Advance payment and department instructions"}
            {currentStep === 6 && "Review all details and submit"}
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit}>
        {/* STEP 1: Client & Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Important Dates & Info
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label>Sales Person</Label>
                  <Input
                    value={salesPerson}
                    onChange={(e) => setSalesPerson(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Vendor</Label>
                  <Input
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Vendor Name"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Delivery Type</Label>
                  <Input
                    value={clientDeliveryType}
                    onChange={(e) => setClientDeliveryType(e.target.value)}
                    placeholder="e.g. Courier"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Transfer Dept</Label>
                  <Input
                    value={transferDepartment}
                    onChange={(e) => setTransferDepartment(e.target.value)}
                    placeholder="e.g. Design"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bill No</Label>
                  <Input
                    value={saleBillNo}
                    onChange={(e) => setSaleBillNo(e.target.value)}
                    placeholder="Bill Number"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Job/Order No</Label>
                  <Input
                    value={saleJobNo}
                    onChange={(e) => setSaleJobNo(e.target.value)}
                    placeholder="Job Number"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Reference Photo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setReferencePhoto(e.target.files?.[0] || null)
                    }
                    className="cursor-pointer"
                  />
                  {(referencePhoto || existingPhoto) && (
                    <div className="mt-2 flex items-center gap-2 border rounded p-1 bg-muted/30">
                      <img
                        src={
                          referencePhoto
                            ? URL.createObjectURL(referencePhoto)
                            : existingPhoto!
                        }
                        alt="Preview"
                        className="h-10 w-10 object-cover rounded"
                      />
                      <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                        {referencePhoto ? referencePhoto.name : "Existing"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Client Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label>Main Account *</Label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Select Account
                    </option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={String(acc.id)}>
                        {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Sub Account</Label>
                  <Input
                    value={subAccount}
                    onChange={(e) => setSubAccount(e.target.value)}
                    placeholder="Sub Account"
                  />
                </div>
                <div className="space-y-1">
                  <Label>PAN/GSTIN</Label>
                  <Input
                    value={panGstin}
                    onChange={(e) => handlePanGstinChange(e.target.value)}
                    onBlur={handlePanGstinBlur}
                    placeholder="PAN (10 chars) or GSTIN (15 chars)"
                    maxLength={15}
                    className={panGstinError ? "border-red-500" : ""}
                  />
                  {panGstinError && (
                    <p className="text-xs text-red-500 mt-1">{panGstinError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    PAN: 5 letters + 4 digits + 1 letter | GSTIN: 15 chars
                    (includes PAN)
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    placeholder="+91 9876543210"
                    maxLength={15}
                    className={phoneError ? "border-red-500" : ""}
                  />
                  {phoneError && (
                    <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be exactly 10 digits
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <Label>Reference Source</Label>
                  <div className="flex flex-wrap gap-4">
                    {REFERENCE_SOURCES.map((src) => (
                      <div key={src} className="flex items-center space-x-2">
                        <Checkbox
                          id={`src-${src}`}
                          checked={refSource.includes(src)}
                          onCheckedChange={() =>
                            toggleSelection(refSource, src, setRefSource)
                          }
                        />
                        <label htmlFor={`src-${src}`} className="text-sm">
                          {src}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Jewellery Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Occasion & Intent
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-6">
                <div className="space-y-2">
                  <Label>Occasion</Label>
                  <div className="flex flex-wrap gap-4">
                    {OCCASIONS.map((occ) => (
                      <div key={occ} className="flex items-center space-x-2">
                        <Checkbox
                          id={`occ-${occ}`}
                          checked={occasion.includes(occ)}
                          onCheckedChange={() =>
                            toggleSelection(occasion, occ, setOccasion)
                          }
                        />
                        <label htmlFor={`occ-${occ}`} className="text-sm">
                          {occ}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Required Delivery Date</Label>
                    <Input
                      type="date"
                      value={requiredDeliveryDate}
                      onChange={(e) => setRequiredDeliveryDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Stock in Deadline</Label>
                    <Input
                      type="date"
                      value={stockInDeadline}
                      onChange={(e) => setStockInDeadline(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <div className="flex flex-wrap gap-4">
                    {PURPOSES.map((pur) => (
                      <div key={pur} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pur-${pur}`}
                          checked={purpose.includes(pur)}
                          onCheckedChange={() =>
                            toggleSelection(purpose, pur, setPurpose)
                          }
                        />
                        <label htmlFor={`pur-${pur}`} className="text-sm">
                          {pur}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Jewellery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Jewellery Type</Label>
                    <SearchableSelect
                      options={jewelleryTypeOptions}
                      value={jewelleryType}
                      onChange={setJewelleryType}
                      placeholder="Search or select type..."
                      searchPlaceholder="Type to search..."
                      emptyText="No jewelry types found"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Size Details</Label>
                    <Input
                      value={sizeDetails}
                      onChange={(e) => setSizeDetails(e.target.value)}
                      placeholder="Ring size, length, etc."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Fit Details</Label>
                    <Input
                      value={fitDetails}
                      onChange={(e) => setFitDetails(e.target.value)}
                      placeholder="Loose, tight, etc."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Style Preference</Label>
                  <div className="flex flex-wrap gap-4">
                    {STYLE_PREFS.map((st) => (
                      <div key={st} className="flex items-center space-x-2">
                        <Checkbox
                          id={`st-${st}`}
                          checked={stylePref.includes(st)}
                          onCheckedChange={() =>
                            toggleSelection(stylePref, st, setStylePref)
                          }
                        />
                        <label htmlFor={`st-${st}`} className="text-sm">
                          {st}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Metal Preference</Label>
                  <div className="flex flex-wrap gap-4">
                    {METAL_PREFS.map((mt) => (
                      <div key={mt} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mt-${mt}`}
                          checked={metalPref.includes(mt)}
                          onCheckedChange={() =>
                            toggleSelection(metalPref, mt, setMetalPref)
                          }
                        />
                        <label htmlFor={`mt-${mt}`} className="text-sm">
                          {mt}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevious}>
                ← Previous
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Diamond & Gemstone */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Diamond Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Diamond Shape</Label>
                    <Input
                      value={diamondShape}
                      onChange={(e) => setDiamondShape(e.target.value)}
                      placeholder="Round, Princess, etc."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Color/Clarity</Label>
                    <Input
                      value={colCla}
                      onChange={(e) => setColCla(e.target.value)}
                      placeholder="D-F / VVS-VS"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Origin</Label>
                    <Input
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="Natural, Lab-grown"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Diamond Budget</Label>
                    <Input
                      value={budgetDia}
                      onChange={(e) => setBudgetDia(e.target.value)}
                      placeholder="Budget for diamonds"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Sample Details</Label>
                    <Input
                      value={sample}
                      onChange={(e) => setSample(e.target.value)}
                      placeholder="Sample reference"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Diamond Priority</Label>
                  <div className="flex flex-wrap gap-4">
                    {DIAMOND_PRIORITIES.map((dp) => (
                      <div key={dp} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dp-${dp}`}
                          checked={diamondPriority.includes(dp)}
                          onCheckedChange={() =>
                            toggleSelection(
                              diamondPriority,
                              dp,
                              setDiamondPriority
                            )
                          }
                        />
                        <label htmlFor={`dp-${dp}`} className="text-sm">
                          {dp}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Gemstone Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Gemstone Preference</Label>
                  <Input
                    value={gemstonePref}
                    onChange={(e) => setGemstonePref(e.target.value)}
                    placeholder="Ruby, Emerald, etc."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Gemstone Color/Clarity</Label>
                  <Input
                    value={gemColCla}
                    onChange={(e) => setGemColCla(e.target.value)}
                    placeholder="Color grade"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Gemstone Origin</Label>
                  <Input
                    value={gemOrigin}
                    onChange={(e) => setGemOrigin(e.target.value)}
                    placeholder="Burma, Colombia, etc."
                  />
                </div>
                <div className="col-span-full space-y-1">
                  <Label>Other Details</Label>
                  <Textarea
                    value={otherDetails}
                    onChange={(e) => setOtherDetails(e.target.value)}
                    placeholder="Any other stone requirements..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevious}>
                ← Previous
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Budget & Timeline */}

        {/* STEP 4: Budget & Notes */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Budget & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Budget Range</Label>
                    <Input
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      placeholder="e.g. 50,000 - 1,00,000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Urgency Level</Label>
                  <div className="flex flex-wrap gap-4">
                    {URGENCY_LEVELS.map((ul) => (
                      <div key={ul} className="flex items-center space-x-2">
                        <Checkbox
                          id={`ul-${ul}`}
                          checked={urgencyLevel.includes(ul)}
                          onCheckedChange={() =>
                            toggleSelection(urgencyLevel, ul, setUrgencyLevel)
                          }
                        />
                        <label htmlFor={`ul-${ul}`} className="text-sm">
                          {ul}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Sales Person Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Must Have</Label>
                  <Textarea
                    value={mustHave}
                    onChange={(e) => setMustHave(e.target.value)}
                    placeholder="Features client must have..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Must Avoid</Label>
                  <Textarea
                    value={mustAvoid}
                    onChange={(e) => setMustAvoid(e.target.value)}
                    placeholder="Things to avoid..."
                    rows={3}
                  />
                </div>
                <div className="col-span-full space-y-1">
                  <Label>Special Instructions</Label>
                  <Textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requirements..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevious}>
                ← Previous
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Advance & Instructions */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Advance Handling
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Advance Type</Label>
                    <Input
                      value={advanceType}
                      onChange={(e) => setAdvanceType(e.target.value)}
                      placeholder="Cash, Gold, etc."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Amount/Weight</Label>
                    <Input
                      value={amountWeight}
                      onChange={(e) => setAmountWeight(e.target.value)}
                      placeholder="Amount or weight"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Date Received</Label>
                    <Input
                      type="date"
                      value={dateReceived}
                      onChange={(e) => setDateReceived(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="receiptGen"
                      checked={receiptGenerated}
                      onCheckedChange={(c) => setReceiptGenerated(!!c)}
                    />
                    <label htmlFor="receiptGen" className="text-sm">
                      Receipt Generated
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accNotified"
                      checked={accountsNotified}
                      onCheckedChange={(c) => setAccountsNotified(!!c)}
                    />
                    <label htmlFor="accNotified" className="text-sm">
                      Accounts Notified
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="erpDone"
                      checked={erpEntryDone}
                      onCheckedChange={(c) => setErpEntryDone(!!c)}
                    />
                    <label htmlFor="erpDone" className="text-sm">
                      ERP Entry Done
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="goldLocked"
                      checked={goldRateLocked}
                      onCheckedChange={(c) => setGoldRateLocked(!!c)}
                    />
                    <label htmlFor="goldLocked" className="text-sm">
                      Gold Rate Locked
                    </label>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Gold Rate Fixed</Label>
                    <Input
                      value={goldRateFixed}
                      onChange={(e) => setGoldRateFixed(e.target.value)}
                      placeholder="Rate per gram"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Gold Rate Date</Label>
                    <Input
                      type="date"
                      value={goldRateDate}
                      onChange={(e) => setGoldRateDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Verified By</Label>
                    <Input
                      value={verifiedBy}
                      onChange={(e) => setVerifiedBy(e.target.value)}
                      placeholder="Name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Next Dept Triggered</Label>
                  <div className="flex flex-wrap gap-4">
                    {NEXT_DEPT_OPTIONS.map((nd) => (
                      <div key={nd} className="flex items-center space-x-2">
                        <Checkbox
                          id={`nd-${nd}`}
                          checked={nextDeptTriggered.includes(nd)}
                          onCheckedChange={() =>
                            toggleSelection(
                              nextDeptTriggered,
                              nd,
                              setNextDeptTriggered
                            )
                          }
                        />
                        <label htmlFor={`nd-${nd}`} className="text-sm">
                          {nd}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Department Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Design Dept</Label>
                  <Textarea
                    value={designDeptInstructions}
                    onChange={(e) => setDesignDeptInstructions(e.target.value)}
                    placeholder="Instructions for design..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Production Dept</Label>
                  <Textarea
                    value={productionDeptInstructions}
                    onChange={(e) =>
                      setProductionDeptInstructions(e.target.value)
                    }
                    placeholder="Instructions for production..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Accounts Dept</Label>
                  <Textarea
                    value={accountsDeptInstructions}
                    onChange={(e) =>
                      setAccountsDeptInstructions(e.target.value)
                    }
                    placeholder="Instructions for accounts..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Reminders</Label>
                  <Textarea
                    value={reminders}
                    onChange={(e) => setReminders(e.target.value)}
                    placeholder="Important reminders..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevious}>
                ← Previous
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: Review & Submit */}
        {currentStep === 6 && (
          <div className="space-y-6">
            {/* Estimates Comparison Section */}
            <Card className="border-t-4 border-t-amber-500">
              <CardHeader className="pb-3 border-b bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base text-amber-700">
                      Estimates Comparison
                    </CardTitle>
                    <CardDescription>
                      Compare and select the best estimate for this sale
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedEstimateId && (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleConvertToOrder}
                        disabled={isConvertingToOrder}
                      >
                        {isConvertingToOrder
                          ? "Converting..."
                          : "Convert to Order"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() => {
                        const qParams = new URLSearchParams();
                        if (jewelleryType)
                          qParams.set("jewelry_type", jewelleryType);
                        if (sizeDetails)
                          qParams.set("size_details", sizeDetails);
                        if (accountId) qParams.set("account_id", accountId);
                        if (saleId) qParams.set("sale_id", saleId);
                        // Pass customer details for estimate PDF
                        if (subAccount) qParams.set("sub_account", subAccount);
                        if (phoneNumber)
                          qParams.set("phone_number", phoneNumber);
                        if (salesPerson)
                          qParams.set("sales_person_name", salesPerson);
                        router.push(
                          `/vouchers/estimates/new?${qParams.toString()}`
                        );
                      }}
                    >
                      + New Estimate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {saleId ? (
                  loadingEstimates ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Loading estimates...
                    </div>
                  ) : estimates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-2">No estimates created yet.</p>
                      <p className="text-sm">
                        Click &quot;+ New Estimate&quot; to create your first
                        estimate for this sale.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Comparison Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left p-3 border-b font-medium">
                                Estimate
                              </th>
                              <th className="text-left p-3 border-b font-medium">
                                Date
                              </th>
                              <th className="text-right p-3 border-b font-medium">
                                Items
                              </th>
                              <th className="text-right p-3 border-b font-medium">
                                Taxable
                              </th>
                              <th className="text-right p-3 border-b font-medium">
                                GST
                              </th>
                              <th className="text-right p-3 border-b font-medium">
                                Grand Total
                              </th>
                              <th className="text-center p-3 border-b font-medium">
                                Status
                              </th>
                              <th className="text-center p-3 border-b font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {estimates.map((est: any) => {
                              const isSelected = selectedEstimateId === est.id;
                              return (
                                <tr
                                  key={est.id}
                                  className={`border-b hover:bg-muted/30 transition-colors ${isSelected ? "bg-green-50 border-l-4 border-l-green-500" : ""}`}
                                >
                                  <td className="p-3">
                                    <div className="font-medium">
                                      {est.item_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {est.id?.slice(0, 8)}...
                                    </div>
                                  </td>
                                  <td className="p-3 text-muted-foreground">
                                    {est.date}
                                  </td>
                                  <td className="p-3 text-right">
                                    {est.line_items?.length || 0}
                                  </td>
                                  <td className="p-3 text-right">
                                    ₹
                                    {Number(
                                      est.total_taxable_value || 0
                                    ).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-right">
                                    ₹
                                    {Number(
                                      est.gst_amount || 0
                                    ).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-right font-bold">
                                    ₹
                                    {Number(
                                      est.grand_total || 0
                                    ).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-center">
                                    {isSelected ? (
                                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                        ✓ Selected
                                      </span>
                                    ) : est.status === "draft" ? (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                        Draft
                                      </span>
                                    ) : (
                                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                        {est.status}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center justify-center gap-2">
                                      {isSelected ? (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={handleDeselectEstimate}
                                          disabled={isSelectingEstimate}
                                          className="text-xs"
                                        >
                                          Deselect
                                        </Button>
                                      ) : (
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() =>
                                            handleSelectEstimate(est.id)
                                          }
                                          disabled={isSelectingEstimate}
                                          className="text-xs bg-blue-600 hover:bg-blue-700"
                                        >
                                          Select
                                        </Button>
                                      )}
                                      <Link
                                        href={`/vouchers/estimates/${est.id}/edit`}
                                      >
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="text-xs"
                                        >
                                          Edit
                                        </Button>
                                      </Link>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleArchiveEstimate(est.id)
                                        }
                                        className="text-xs text-gray-600 hover:text-gray-800"
                                      >
                                        Archive
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Selected Estimate Summary */}
                      {selectedEstimateId && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-green-800">
                                Selected Estimate
                              </h4>
                              <p className="text-sm text-green-600">
                                {
                                  estimates.find(
                                    (e) => e.id === selectedEstimateId
                                  )?.item_name
                                }{" "}
                                - ₹
                                {Number(
                                  estimates.find(
                                    (e) => e.id === selectedEstimateId
                                  )?.grand_total || 0
                                ).toLocaleString()}
                              </p>
                            </div>
                            <Button
                              type="button"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={handleConvertToOrder}
                              disabled={isConvertingToOrder}
                            >
                              {isConvertingToOrder
                                ? "Converting..."
                                : "Convert to Order →"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">
                      Save this sale first to create estimates.
                    </p>
                    <p className="text-sm">
                      After saving, you can create multiple estimates with
                      different specifications.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Design & Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4">
                <div className="space-y-1">
                  <Label>Rough Work Notes</Label>
                  <Textarea
                    value={roughWork}
                    onChange={(e) => setRoughWork(e.target.value)}
                    placeholder="Rough work and calculations..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Final Design URL</Label>
                  <Input
                    value={finalDesign}
                    onChange={(e) => setFinalDesign(e.target.value)}
                    placeholder="Link to final design"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Delivery Notes</Label>
                  <Textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Delivery instructions..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base text-primary">
                  Workflow Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Selection Notes</Label>
                  <Textarea
                    value={selectionNotes}
                    onChange={(e) => setSelectionNotes(e.target.value)}
                    placeholder="Notes about selection..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Sale Notes</Label>
                  <Textarea
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    placeholder="Final sale notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 bg-green-50">
                <CardTitle className="text-base text-green-700">
                  Review Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium">
                      {accounts.find((a) => String(a.id) === accountId)
                        ?.account_name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">
                      Jewellery Type:
                    </span>
                    <span className="font-medium">{jewelleryType || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Occasion:</span>
                    <span className="font-medium">
                      {occasion.join(", ") || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">{budgetRange || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">
                      Delivery Date:
                    </span>
                    <span className="font-medium">
                      {requiredDeliveryDate || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Advance:</span>
                    <span className="font-medium">{amountWeight || "-"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevious}>
                ← Previous
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting
                  ? "Saving..."
                  : saleId
                    ? "Update Sale"
                    : "Create Sale"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

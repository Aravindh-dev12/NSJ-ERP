// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";

// import { Checkbox } from "@/components/ui/checkbox";
// import { SalesQueriesHeader } from "./SalesQueriesHeader";
// import { useToast } from "@/hooks/use-toast";
// import { accountsList, accountDetail, getSalesQuery, createSalesQuery, updateSalesQuery, deleteSalesQuery, SalesQueryPayload } from "@/lib/backend";
// import { api } from "@/lib/api";
// import { API_ENDPOINTS } from "@/lib/constants";

// // --- Mock Data Options ---
// const OCCASIONS = ["Wedding", "Engagement", "Birthday", "Anniversary", "Other"];
// const PURPOSES = ["Self", "Gift", "Bridal", "Other"];
// const STYLE_PREFS = [
//     "Minimal",
//     "Statement",
//     "Traditional",
//     "Modern",
//     "Unsure",
// ];
// const METAL_PREFS = ["Yellow", "White", "Rose", "Two-Tone"];
// const DIAMOND_PRIORITIES = ["Size", "Quality", "Balance"];
// const URGENCY_LEVELS = ["Standard", "Priority", "Urgent"];
// const REFERENCE_SOURCES = ["Instagram", "Referral", "Walk-in", "Other"];
// const NEXT_DEPT_OPTIONS = ["Design", "Diamond", "Production"];

// export function SalesQueriesForm({ queryId }: { queryId?: string }) {
//     const router = useRouter();
//     const { toast } = useToast();
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     // --- State for Form Fields ---
//     // Important Dates
//     const [salesPerson, setSalesPerson] = useState("");
//     const [vendor, setVendor] = useState("");
//     const [transferDepartment, setTransferDepartment] = useState("");
//     const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
//     const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
//     const [isImageZoomed, setIsImageZoomed] = useState(false);
//     const [orderDate, setOrderDate] = useState(
//         new Date().toISOString().split("T")[0]
//     );

//     // --- Additional State for Estimate Functionality ---
//     const [jewelleryTypeOptions, setJewelleryTypeOptions] = useState<{ value: string; label: string }[]>([]);
//     const [isCreatingEstimate, setIsCreatingEstimate] = useState(false);
//     const [showEstimateDetails, setShowEstimateDetails] = useState(false);
//     const [estimateData, setEstimateData] = useState<any>(null);

//     // Client Details
//     const [accountId, setAccountId] = useState("");
//     const [subAccount, setSubAccount] = useState("");
//     const [phoneNumber, setPhoneNumber] = useState("");
//     const [email, setEmail] = useState("");
//     const [city, setCity] = useState("");
//     const [clientDeliveryType, setClientDeliveryType] = useState("");
//     const [panGstin, setPanGstin] = useState("");
//     const [refSource, setRefSource] = useState<string[]>([]);
//     const [accounts, setAccounts] = useState<any[]>([]);

//     // Occasion & Intent
//     const [occasion, setOccasion] = useState<string[]>([]);
//     const [requiredDeliveryDate, setRequiredDeliveryDate] = useState("");
//     const [stockInDeadline, setStockInDeadline] = useState("");
//     const [purpose, setPurpose] = useState<string[]>([]);

//     // Jewellery Details
//     const [jewelleryType, setJewelleryType] = useState("");
//     const [goldQuality, setGoldQuality] = useState("");
//     const [sizeDetails, setSizeDetails] = useState("");
//     const [fitDetails, setFitDetails] = useState("");
//     const [followUpLog, setFollowUpLog] = useState("");

//     // Follow-up Logs Table
//     const [followUpLogs, setFollowUpLogs] = useState<{
//         date: string;
//         mode: string;
//         outcome: string;
//         next_action: string;
//         next_follow_up_date: string;
//         comments: string;
//     }[]>([{ date: "", mode: "", outcome: "", next_action: "", next_follow_up_date: "", comments: "" }]);

//     const [stylePref, setStylePref] = useState<string[]>([]);
//     const [metalPref, setMetalPref] = useState<string[]>([]);

//     // Diamond/Gemstone
//     const [diamondShape, setDiamondShape] = useState("");
//     const [colCla, setColCla] = useState("");
//     const [origin, setOrigin] = useState("");
//     const [budgetDia, setBudgetDia] = useState("");
//     const [diamondPriority, setDiamondPriority] = useState<string[]>([]);
//     const [sample, setSample] = useState("");
//     const [gemstonePref, setGemstonePref] = useState("");
//     const [gemColCla, setGemColCla] = useState("");
//     const [gemOrigin, setGemOrigin] = useState("");
//     const [otherDetails, setOtherDetails] = useState("");

//     // Budget & Timeline
//     const [budgetRange, setBudgetRange] = useState("");
//     const [urgencyLevel, setUrgencyLevel] = useState<string[]>([]);

//     // Notes
//     const [mustHave, setMustHave] = useState("");
//     const [mustAvoid, setMustAvoid] = useState("");
//     const [specialInstructions, setSpecialInstructions] = useState("");

//     // --- SECOND IMAGE FIELDS ---
//     // Advance Handling
//     const [advanceType, setAdvanceType] = useState("");
//     const [amountWeight, setAmountWeight] = useState("");
//     const [dateReceived, setDateReceived] = useState("");
//     const [receiptGenerated, setReceiptGenerated] = useState(false);
//     const [accountsNotified, setAccountsNotified] = useState(false);
//     const [goldRateLocked, setGoldRateLocked] = useState(false);
//     const [goldRateFixed, setGoldRateFixed] = useState("");
//     const [goldRateDate, setGoldRateDate] = useState("");
//     const [erpEntryDone, setErpEntryDone] = useState(false);
//     const [nextDeptTriggered, setNextDeptTriggered] = useState<string[]>([]);
//     const [verifiedBy, setVerifiedBy] = useState("");
//     const [colourStoneDemand, setColourStoneDemand] = useState("");
//     const [rawMaterialInstructions, setRawMaterialInstructions] = useState("");

//     // Ledger State
//     const [ledgerEntries, setLedgerEntries] = useState([
//         { date: "", particulars: "", gold: "", diamond: "", cash: "", narration: "" }
//     ]);

//     // Instructions
//     const [designDeptInstructions, setDesignDeptInstructions] = useState("");
//     const [productionDeptInstructions, setProductionDeptInstructions] = useState("");
//     const [accountsDeptInstructions, setAccountsDeptInstructions] = useState("");
//     const [reminders, setReminders] = useState("");

//     // Bottom Section
//     const [roughWork, setRoughWork] = useState("");
//     const [finalDesign, setFinalDesign] = useState("");
//     const [deliveryNotes, setDeliveryNotes] = useState("");

//     const [createdQueryId, setCreatedQueryId] = useState<string | null>(null);

//     // Determines the effective query ID: either passed via props or created during this session (e.g. by estimate creation)
//     const effectiveQueryId = queryId || createdQueryId;

//     // Load Data if queryId exists
//     useEffect(() => {
//         if (!effectiveQueryId) return;

//         const fetchData = async () => {
//             try {
//                 const data = await getSalesQuery(effectiveQueryId);

//                 // Map data to state
//                 setOrderDate(data.order_date || "");
//                 setSalesPerson(data.sales_person || "");
//                 setVendor(data.vendor || "");
//                 if (data.account?.id) setAccountId(String(data.account.id));
//                 setSubAccount(data.sub_account || "");
//                 setPhoneNumber(data.phone_number || "");
//                 setEmail(data.email || "");
//                 setCity(data.city || "");
//                 setClientDeliveryType(data.client_delivery_type || "");
//                 setPanGstin(data.pan_gstin || "");
//                 setOccasion(data.occasion || []);
//                 setRequiredDeliveryDate(data.required_delivery_date || "");
//                 setStockInDeadline(data.stock_in_deadline || "");
//                 setPurpose(data.purpose || []);
//                 setJewelleryType(data.jewellery_type || "");
//                 setGoldQuality(data.gold_quality || "");
//                 setSizeDetails(data.size_details || "");
//                 setFitDetails(data.fit_details || "");
//                 setFollowUpLog(data.follow_up_log || "");
//                 setStylePref(data.style_preference || []);
//                 setMetalPref(data.metal_preference || []);
//                 setDiamondShape(data.diamond_shape || "");
//                 setColCla(data.color_clarity || "");
//                 setOrigin(data.origin || "");
//                 setBudgetDia(data.diamond_budget || "");
//                 setDiamondPriority(data.diamond_priority || []);
//                 setSample(data.sample_details || "");
//                 setGemstonePref(data.gemstone_preference || "");
//                 setGemColCla(data.gemstone_color_clarity || "");
//                 setGemOrigin(data.gemstone_origin || "");
//                 setOtherDetails(data.other_details || "");
//                 setBudgetRange(data.budget_range || "");
//                 setUrgencyLevel(data.urgency_level || []);
//                 setRefSource(data.reference_source || []);
//                 setMustHave(data.must_have || "");
//                 setMustAvoid(data.must_avoid || "");
//                 setSpecialInstructions(data.special_instructions || "");
//                 setTransferDepartment(String(data.transfer_department || ""));
//                 setFollowUpLog(String(data.follow_up_log || ""));
//                 setExistingPhoto(data.reference_photo || null);

//                 // Map follow_up_logs list
//                 if (Array.isArray(data.follow_up_logs) && data.follow_up_logs.length > 0) {
//                     // @ts-ignore
//                     const formattedLogs = data.follow_up_logs.map((e: any) => ({
//                         date: e.date || "",
//                         mode: e.mode || "",
//                         outcome: e.outcome || "",
//                         next_action: e.next_action || "",
//                         next_follow_up_date: e.next_follow_up_date || "",
//                         comments: e.comments || ""
//                     }));
//                     setFollowUpLogs(formattedLogs);
//                 }

//                 // JSON fields mapping
//                 const ah = data.advance_handling || {};
//                 setAdvanceType(ah.advance_type || "");
//                 setAmountWeight(ah.amount_weight || "");
//                 setDateReceived(ah.date_received || "");
//                 setReceiptGenerated(!!ah.receipt_generated);
//                 setAccountsNotified(!!ah.accounts_notified);
//                 setErpEntryDone(!!ah.erp_entry_done);
//                 setGoldRateLocked(!!ah.gold_rate_locked);
//                 setGoldRateFixed(ah.gold_rate_fixed || "");
//                 setGoldRateDate(ah.gold_rate_date || "");
//                 setNextDeptTriggered(ah.next_dept_triggered || []);
//                 setVerifiedBy(ah.verified_by || "");
//                 setColourStoneDemand(ah.colour_stone_demand || "");
//                 setRawMaterialInstructions(ah.raw_material_instructions || "");

//                 const di = data.department_instructions || {};
//                 setDesignDeptInstructions(di.design || "");
//                 setProductionDeptInstructions(di.production || "");
//                 setAccountsDeptInstructions(di.accounts || "");
//                 setReminders(di.reminders || "");

//                 const dd = data.design_delivery || {};
//                 setRoughWork(dd.rough_work_notes || "");
//                 setFinalDesign(dd.final_design_url || "");
//                 setDeliveryNotes(dd.delivery_notes || "");

//                 if (Array.isArray(data.ledger_entries) && data.ledger_entries.length > 0) {
//                     const formattedEntries = data.ledger_entries.map((e: any) => ({
//                         date: e.date || "",
//                         particulars: e.particulars || "",
//                         gold: String(e.gold || ""),
//                         diamond: String(e.diamond || ""),
//                         cash: String(e.cash || ""),
//                         narration: e.narration || ""
//                     }));
//                     setLedgerEntries(formattedEntries);
//                 }

//             } catch (error) {
//                 console.error("Failed to fetch sales lead:", error);
//                 toast({
//                     variant: "destructive",
//                     title: "Error",
//                     description: "Failed to load sales lead details.",
//                 });
//             }
//         };
//         fetchData();
//     }, [effectiveQueryId, toast]);

//     // Helper to update ledger entry
//     const updateLedgerEntry = (index: number, field: string, value: string) => {
//         const newEntries = [...ledgerEntries];
//         // @ts-ignore
//         newEntries[index][field] = value;
//         setLedgerEntries(newEntries);
//     };

//     // Helper to add row
//     const addLedgerRow = () => {
//         setLedgerEntries([
//             ...ledgerEntries,
//             { date: "", particulars: "", gold: "", diamond: "", cash: "", narration: "" }
//         ]);
//     };

//     // Helper to remove row
//     const removeLedgerRow = (index: number) => {
//         if (ledgerEntries.length > 1) {
//             const newEntries = [...ledgerEntries];
//             newEntries.splice(index, 1);
//             setLedgerEntries(newEntries);
//         }
//     };

//     // --- Follow-Up Logs Helpers ---
//     const updateFollowUpLog = (index: number, field: string, value: string) => {
//         const newLogs = [...followUpLogs];
//         // @ts-ignore
//         newLogs[index][field] = value;
//         setFollowUpLogs(newLogs);
//     };

//     const addFollowUpLog = () => {
//         setFollowUpLogs([
//             ...followUpLogs,
//             { date: "", mode: "", outcome: "", next_action: "", next_follow_up_date: "", comments: "" }
//         ]);
//     };

//     const removeFollowUpLog = (index: number) => {
//         if (followUpLogs.length > 1) {
//             const newLogs = [...followUpLogs];
//             newLogs.splice(index, 1);
//             setFollowUpLogs(newLogs);
//         }
//     };

//     // Calculate totals
//     const ledgerTotals = ledgerEntries.reduce((acc, curr) => {
//         return {
//             gold: acc.gold + (parseFloat(curr.gold) || 0),
//             diamond: acc.diamond + (parseFloat(curr.diamond) || 0),
//             cash: acc.cash + (parseFloat(curr.cash) || 0)
//         };
//     }, { gold: 0, diamond: 0, cash: 0 });

//     // Load Accounts
//     useEffect(() => {
//         async function load() {
//             try {
//                 const res = await accountsList({ page: 1, page_size: 100 });
//                 setAccounts(res.results || []);
//             } catch (e) {
//                 console.error(e);
//             }
//         }
//         load();
//     }, []);

//     // Set phone/email when account changes (Only for new entries or manual change)
//     useEffect(() => {
//         if (!accountId || effectiveQueryId) return; // Don't overwrite if loading existing data
//         async function fetchDetail() {
//             try {
//                 const details = await accountDetail(accountId);
//                 if (details.contact?.mobile)
//                     setPhoneNumber(details.contact.mobile);
//                 if (details.contact?.email) setEmail(details.contact.email);
//                 if (details.contact?.city?.name) setCity(details.contact.city.name);
//                 if (details.tax?.pan) setPanGstin(details.tax.pan);
//             } catch (e) {
//                 console.error(e);
//             }
//         }
//         fetchDetail();
//     }, [accountId, effectiveQueryId]);

//     // Load jewellery type options
//     useEffect(() => {
//         const fetchJewelleryTypes = async () => {
//             try {
//                 const response = await api.get<{ estimate_options: { value: string; label: string }[]; count: number }>(API_ENDPOINTS.SALES_QUERIES.AVAILABLE_ESTIMATES);
//                 setJewelleryTypeOptions(response.estimate_options || []);
//             } catch (error) {
//                 console.error("Failed to load jewellery type options:", error);
//                 toast({
//                     variant: "destructive",
//                     title: "Error",
//                     description: "Failed to load jewellery type options.",
//                 });
//             }
//         };
//         fetchJewelleryTypes();
//     }, [toast]);

//     const toggleSelection = (
//         current: string[],
//         item: string,
//         setFn: (v: string[]) => void
//     ) => {
//         if (current.includes(item)) {
//             setFn(current.filter((i) => i !== item));
//         } else {
//             setFn([...current, item]);
//         }
//     };

//     const handleCreateEstimate = async () => {
//         setIsCreatingEstimate(true);
//         try {
//             // Prepare the payload for creating estimate
//             const payload = {
//                 jewellery_type: jewelleryType,
//                 order_date: orderDate,
//                 sales_person: salesPerson,
//                 account_id: accountId,
//                 occasion: occasion,
//                 purpose: purpose,
//                 budget_range: budgetRange,
//                 sales_query_id: effectiveQueryId, // Link to existing query if available
//             };

//             const response = await api.post<{ sales_query: any; estimate_data: any; message: string }>(
//                 API_ENDPOINTS.SALES_QUERIES.CREATE_ESTIMATE,
//                 payload
//             );

//             setEstimateData(response.estimate_data);
//             setShowEstimateDetails(true);

//             // If a sales lead was created/returned, store its ID so subsequent saves are updates, not creates.
//             if (response.sales_query?.id) {
//                 setCreatedQueryId(response.sales_query.id);

//                 // Update form with special instructions from the estimate if available
//                 if (response.sales_query.special_instructions) {
//                     setSpecialInstructions(response.sales_query.special_instructions);
//                 }
//             }

//             toast({
//                 title: "Estimate Created",
//                 description: response.message,
//             });

//         } catch (error) {
//             console.error("Failed to create estimate:", error);
//             toast({
//                 variant: "destructive",
//                 title: "Error",
//                 description: "Failed to create estimate. Please check all fields.",
//             });
//         } finally {
//             setIsCreatingEstimate(false);
//         }
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setIsSubmitting(true);
//         try {
//             const payload: SalesQueryPayload = {
//                 order_date: orderDate,
//                 sales_person: salesPerson,
//                 vendor: vendor,
//                 account_id: accountId,
//                 sub_account: subAccount,
//                 phone_number: phoneNumber,
//                 email: email,
//                 city: city,
//                 client_delivery_type: clientDeliveryType,
//                 pan_gstin: panGstin,
//                 occasion: occasion,
//                 required_delivery_date: requiredDeliveryDate,
//                 stock_in_deadline: stockInDeadline,
//                 purpose: purpose,
//                 jewelleryType,
//                 goldQuality,
//                 size_details: sizeDetails,
//                 fit_details: fitDetails,
//                 follow_up_log: followUpLog,
//                 style_preference: stylePref,
//                 metal_preference: metalPref,
//                 diamond_shape: diamondShape,
//                 color_clarity: colCla,
//                 origin: origin,
//                 diamond_budget: budgetDia,
//                 diamond_priority: diamondPriority,
//                 sample_details: sample,
//                 gemstone_preference: gemstonePref,
//                 gemstone_color_clarity: gemColCla,
//                 gemstone_origin: gemOrigin,
//                 other_details: otherDetails,
//                 budget_range: budgetRange,
//                 urgency_level: urgencyLevel,
//                 reference_source: refSource,
//                 must_have: mustHave,
//                 must_avoid: mustAvoid,
//                 special_instructions: specialInstructions,
//                 transfer_department: transferDepartment,
//                 follow_up_logs: followUpLogs,
//                 advance_handling: {
//                     advance_type: advanceType,
//                     amount_weight: amountWeight,
//                     date_received: dateReceived,
//                     receipt_generated: receiptGenerated,
//                     accounts_notified: accountsNotified,
//                     erp_entry_done: erpEntryDone,
//                     gold_rate_locked: goldRateLocked,
//                     gold_rate_fixed: goldRateFixed,
//                     gold_rate_date: goldRateDate,
//                     next_dept_triggered: nextDeptTriggered,
//                     verified_by: verifiedBy,
//                     colour_stone_demand: colourStoneDemand,
//                     raw_material_instructions: rawMaterialInstructions,
//                 },
//                 department_instructions: {
//                     design: designDeptInstructions,
//                     production: productionDeptInstructions,
//                     accounts: accountsDeptInstructions,
//                     reminders: reminders,
//                 },
//                 design_delivery: {
//                     rough_work_notes: roughWork,
//                     final_design_url: finalDesign,
//                     delivery_notes: deliveryNotes,
//                 },
//             };

//             if (panGstin && panGstin.length !== 12) {
//                 toast({
//                     variant: "destructive",
//                     title: "Validation Error",
//                     description: "PAN/GSTIN/AADHAR must be exactly 12 digits.",
//                 });
//                 setIsSubmitting(false);
//                 return;
//             }

//             const formData = new FormData();
//             Object.entries(payload).forEach(([key, value]) => {
//                 if (value === null || value === undefined) return;
//                 if (Array.isArray(value) || (typeof value === 'object' && key !== 'reference_photo')) {
//                     formData.append(key, JSON.stringify(value));
//                 } else if (key !== 'reference_photo') {
//                     formData.append(key, String(value));
//                 }
//             });

//             if (referencePhoto) {
//                 formData.append('reference_photo', referencePhoto);
//             }

//             if (effectiveQueryId) {
//                 await updateSalesQuery(effectiveQueryId, formData);
//                 toast({
//                     title: "Sales Lead Updated",
//                     description: "The changes have been successfully saved.",
//                 });
//                 router.push("/vouchers/sales-leads/list");
//             } else {
//                 await createSalesQuery(formData);
//                 toast({
//                     title: "Sales Lead Created",
//                     description: "The sales lead has been successfully recorded.",
//                 });
//                 router.push("/vouchers/sales-leads/list");
//             }
//         } catch (err) {
//             console.error(err);
//             toast({
//                 variant: "destructive",
//                 title: "Error",
//                 description: "Failed to save query. Please check all fields.",
//             });
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const handleDelete = async () => {
//         if (!effectiveQueryId || !confirm("Are you sure you want to delete this sales lead? This action cannot be undone.")) return;
//         try {
//             await deleteSalesQuery(effectiveQueryId);
//             toast({
//                 title: "Sales Lead Deleted",
//                 description: "The sales lead has been permanently removed.",
//             });
//             router.push("/vouchers/sales-leads/list");
//         } catch (err) {
//             console.error(err);
//             toast({
//                 variant: "destructive",
//                 title: "Error",
//                 description: "Failed to delete query.",
//             });
//         }
//     };

//     return (
//         <div className="space-y-6">
//             <div className="flex items-center justify-between">
//                 <SalesQueriesHeader
//                     title={effectiveQueryId ? "Sales Lead Details" : "New Sales Lead"}
//                     description={effectiveQueryId ? "View and manage sales lead details." : "Detailed sales lead and process form."}
//                 />
//                 <div className="flex items-center gap-2">
//                     {effectiveQueryId && (
//                         <Link href={`/vouchers/sales-queries/${effectiveQueryId}/estimates`}>
//                             <Button variant="outline" size="sm" type="button">
//                                 View Estimates
//                             </Button>
//                         </Link>
//                     )}
//                     {effectiveQueryId && (
//                         <Button variant="destructive" size="sm" onClick={handleDelete} type="button">
//                             Delete Query
//                         </Button>
//                     )}
//                 </div>
//             </div>

//             <form onSubmit={handleSubmit}>
//                 <div className="grid gap-6">
//                     {/* Section 1: Top Bar (Dates & Dept) */}
//                     <Card>
//                         <CardHeader className="pb-3">
//                             <CardTitle className="text-base">Important Dates & Info</CardTitle>
//                         </CardHeader>
//                         <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//                             <div className="space-y-1">
//                                 <Label>Sales Person</Label>
//                                 <Input
//                                     value={salesPerson}
//                                     onChange={(e) => setSalesPerson(e.target.value)}
//                                     placeholder="Name"
//                                 />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Vendor</Label>
//                                 <Input
//                                     value={vendor}
//                                     onChange={(e) => setVendor(e.target.value)}
//                                     placeholder="Vendor Name"
//                                 />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Delivery Type</Label>
//                                 <Input
//                                     value={clientDeliveryType}
//                                     onChange={(e) => setClientDeliveryType(e.target.value)}
//                                     placeholder="Type (e.g. Courier)"
//                                 />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Date</Label>
//                                 <Input
//                                     type="date"
//                                     value={orderDate}
//                                     onChange={(e) => setOrderDate(e.target.value)}
//                                 />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Transfer Dept</Label>
//                                 <Input
//                                     value={transferDepartment}
//                                     onChange={(e) => setTransferDepartment(e.target.value)}
//                                     placeholder="e.g. Design Department"
//                                 />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Reference Photo</Label>
//                                 <Input
//                                     type="file"
//                                     accept="image/*"
//                                     onChange={(e) => setReferencePhoto(e.target.files?.[0] || null)}
//                                     className="cursor-pointer"
//                                 />
//                                 {(referencePhoto || existingPhoto) && (
//                                     <div className="mt-2 flex items-center gap-2 border rounded p-1 bg-muted/30">
//                                         <img
//                                             src={referencePhoto ? URL.createObjectURL(referencePhoto) : existingPhoto!}
//                                             alt="Preview"
//                                             className="h-10 w-10 object-cover rounded cursor-zoom-in hover:opacity-80 transition-opacity"
//                                             onClick={() => setIsImageZoomed(true)}
//                                         />
//                                         <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
//                                             {referencePhoto ? referencePhoto.name : "Existing Photo"}
//                                         </span>
//                                         {referencePhoto && (
//                                             <Button
//                                                 type="button"
//                                                 variant="ghost"
//                                                 size="sm"
//                                                 className="h-6 w-6 p-0 ml-auto"
//                                                 onClick={() => setReferencePhoto(null)}
//                                             >
//                                                 ×
//                                             </Button>
//                                         )}
//                                     </div>
//                                 )}
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Section 2: Client Details */}
//                     <Card>
//                         <CardHeader className="pb-3 border-b bg-muted/20">
//                             <CardTitle className="text-base text-primary">Client Details</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                             <div className="space-y-1">
//                                 <Label>Main Account</Label>
//                                 <select
//                                     value={accountId}
//                                     onChange={(e) => setAccountId(e.target.value)}
//                                     className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
//                                 >
//                                     <option value="" disabled>Select Account</option>
//                                     {accounts.map((acc) => (
//                                         <option key={acc.id} value={String(acc.id)}>
//                                             {acc.account_name}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Sub Account</Label>
//                                 <Input
//                                     value={subAccount}
//                                     onChange={(e) => setSubAccount(e.target.value)}
//                                     placeholder="Sub Account Name"
//                                 />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>PAN / GSTIN / AADHAR</Label>
//                                 <Input
//                                     value={panGstin}
//                                     onChange={(e) => setPanGstin(e.target.value)}
//                                     placeholder="ID Number"
//                                 />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Phone Number</Label>
//                                 <Input
//                                     value={phoneNumber}
//                                     onChange={(e) => setPhoneNumber(e.target.value)}
//                                     placeholder="+91..."
//                                 />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Email ID</Label>
//                                 <Input
//                                     value={email}
//                                     onChange={(e) => setEmail(e.target.value)}
//                                     placeholder="client@example.com"
//                                 />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>City</Label>
//                                 <Input
//                                     value={city}
//                                     onChange={(e) => setCity(e.target.value)}
//                                     placeholder="City"
//                                 />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Client Delivery Type</Label>
//                                 <Input
//                                     value={clientDeliveryType}
//                                     onChange={(e) => setClientDeliveryType(e.target.value)}
//                                     placeholder="e.g. Home"
//                                 />
//                             </div>
//                             <div className="col-span-full space-y-2">
//                                 <Label>Reference Source</Label>
//                                 <div className="flex flex-wrap gap-4">
//                                     {REFERENCE_SOURCES.map((src) => (
//                                         <div key={src} className="flex items-center space-x-2">
//                                             <Checkbox
//                                                 id={`src-${src}`}
//                                                 checked={refSource.includes(src)}
//                                                 onCheckedChange={() =>
//                                                     toggleSelection(refSource, src, setRefSource)
//                                                 }
//                                             />
//                                             <label htmlFor={`src-${src}`} className="text-sm font-medium leading-none">
//                                                 {src}
//                                             </label>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Section 3: Occasion & Intent */}
//                     <Card>
//                         <CardHeader className="pb-3 border-b bg-muted/20">
//                             <CardTitle className="text-base text-primary">Occasion & Intent</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-4 grid gap-6">
//                             <div className="space-y-2">
//                                 <Label>Occasion</Label>
//                                 <div className="flex flex-wrap gap-4">
//                                     {OCCASIONS.map((occ) => (
//                                         <div key={occ} className="flex items-center space-x-2">
//                                             <Checkbox
//                                                 id={`occ-${occ}`}
//                                                 checked={occasion.includes(occ)}
//                                                 onCheckedChange={() =>
//                                                     toggleSelection(occasion, occ, setOccasion)
//                                                 }
//                                             />
//                                             <label htmlFor={`occ-${occ}`} className="text-sm font-medium leading-none">
//                                                 {occ}
//                                             </label>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="grid gap-4 md:grid-cols-2">
//                                 <div className="space-y-1">
//                                     <Label>Required Delivery Date</Label>
//                                     <Input type="date" value={requiredDeliveryDate} onChange={e => setRequiredDeliveryDate(e.target.value)} />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Stock in Deadline</Label>
//                                     <Input type="date" value={stockInDeadline} onChange={e => setStockInDeadline(e.target.value)} />
//                                 </div>
//                             </div>

//                             <div className="space-y-2">
//                                 <Label>Purpose of Purchase</Label>
//                                 <div className="flex flex-wrap gap-4">
//                                     {PURPOSES.map((pur) => (
//                                         <div key={pur} className="flex items-center space-x-2">
//                                             <Checkbox
//                                                 id={`pur-${pur}`}
//                                                 checked={purpose.includes(pur)}
//                                                 onCheckedChange={() =>
//                                                     toggleSelection(purpose, pur, setPurpose)
//                                                 }
//                                             />
//                                             <label htmlFor={`pur-${pur}`} className="text-sm font-medium leading-none">
//                                                 {pur}
//                                             </label>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Section 4: Jewellery Details */}
//                     <Card>
//                         <CardHeader className="pb-3 border-b bg-muted/20">
//                             <CardTitle className="text-base text-primary">Jewellery Details (Design Input)</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-4 grid gap-4">
//                             <div className="space-y-1">
//                                 <Label>Jewellery Type</Label>
//                                 <select
//                                     value={jewelleryType}
//                                     onChange={(e) => setJewelleryType(e.target.value)}
//                                     className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
//                                 >
//                                     <option value="" disabled>Select jewellery type</option>
//                                     {jewelleryTypeOptions.map((option) => (
//                                         <option key={option.value} value={option.value}>
//                                             {option.label}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>
//                             <div className="grid gap-4 md:grid-cols-2">
//                                 <div className="space-y-1">
//                                     <Label>Size Details</Label>
//                                     <Input value={sizeDetails} onChange={e => setSizeDetails(e.target.value)} placeholder="Size info" />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Fit Details</Label>
//                                     <Input value={fitDetails} onChange={e => setFitDetails(e.target.value)} placeholder="Fit info" />
//                                 </div>
//                             </div>

//                             <div className="space-y-2">
//                                 <Label>Follow-up Log</Label>
//                                 <Textarea value={followUpLog} onChange={e => setFollowUpLog(e.target.value)} placeholder="Log details..." />
//                             </div>

//                             <div className="space-y-2">
//                                 <Label>Style Preference</Label>
//                                 <div className="flex flex-wrap gap-4">
//                                     {STYLE_PREFS.map((style) => (
//                                         <div key={style} className="flex items-center space-x-2">
//                                             <Checkbox
//                                                 id={`style-${style}`}
//                                                 checked={stylePref.includes(style)}
//                                                 onCheckedChange={() =>
//                                                     toggleSelection(stylePref, style, setStylePref)
//                                                 }
//                                             />
//                                             <label htmlFor={`style-${style}`} className="text-sm font-medium leading-none">
//                                                 {style}
//                                             </label>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="space-y-2">
//                                 <Label>Metal Preference</Label>
//                                 <div className="flex flex-wrap gap-4">
//                                     {METAL_PREFS.map((metal) => (
//                                         <div key={metal} className="flex items-center space-x-2">
//                                             <Checkbox
//                                                 id={`metal-${metal}`}
//                                                 checked={metalPref.includes(metal)}
//                                                 onCheckedChange={() =>
//                                                     toggleSelection(metalPref, metal, setMetalPref)
//                                                 }
//                                             />
//                                             <label htmlFor={`metal-${metal}`} className="text-sm font-medium leading-none">
//                                                 {metal}
//                                             </label>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Section 5: Diamond / Gemstone */}
//                     <Card>
//                         <CardHeader className="pb-3 border-b bg-muted/20">
//                             <CardTitle className="text-base text-primary">Diamond / Gemstone Requirements</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-4 grid gap-4">
//                             <div className="grid gap-4 md:grid-cols-3">
//                                 <div className="space-y-1">
//                                     <Label>Diamond Share/Pref</Label>
//                                     <Input value={diamondShape} onChange={e => setDiamondShape(e.target.value)} placeholder="Shape" />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Col / Cla</Label>
//                                     <Input value={colCla} onChange={e => setColCla(e.target.value)} placeholder="Color/Clarity" />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Origin</Label>
//                                     <Input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Origin" />
//                                 </div>
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Budget for Dia</Label>
//                                 <Input value={budgetDia} onChange={e => setBudgetDia(e.target.value)} placeholder="Amount" />
//                             </div>
//                             <div className="space-y-2">
//                                 <Label>Diamond Priority</Label>
//                                 <div className="flex flex-wrap gap-4">
//                                     {DIAMOND_PRIORITIES.map((dp) => (
//                                         <div key={dp} className="flex items-center space-x-2">
//                                             <Checkbox
//                                                 id={`dp-${dp}`}
//                                                 checked={diamondPriority.includes(dp)}
//                                                 onCheckedChange={() =>
//                                                     toggleSelection(diamondPriority, dp, setDiamondPriority)
//                                                 }
//                                             />
//                                             <label htmlFor={`dp-${dp}`} className="text-sm font-medium leading-none">
//                                                 {dp}
//                                             </label>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="grid gap-4 md:grid-cols-3">
//                                 <div className="space-y-1">
//                                     <Label>Gemstone Pref</Label>
//                                     <Input value={gemstonePref} onChange={e => setGemstonePref(e.target.value)} placeholder="Gemstone" />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Col / Cla</Label>
//                                     <Input value={gemColCla} onChange={e => setGemColCla(e.target.value)} placeholder="Color/Clarity" />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Origin</Label>
//                                     <Input value={gemOrigin} onChange={e => setGemOrigin(e.target.value)} placeholder="Origin" />
//                                 </div>
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Other Details</Label>
//                                 <Input value={otherDetails} onChange={e => setOtherDetails(e.target.value)} placeholder="..." />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Sample</Label>
//                                 <Input value={sample} onChange={e => setSample(e.target.value)} placeholder="Sample info" />
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Section 6: Budget & Timeline */}
//                     <Card>
//                         <CardHeader className="pb-3 border-b bg-muted/20">
//                             <CardTitle className="text-base text-primary">Budget & Timeline</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-4 grid gap-4">
//                             <div className="space-y-1">
//                                 <Label>Budget Range</Label>
//                                 <Input value={budgetRange} onChange={e => setBudgetRange(e.target.value)} placeholder="Range" />
//                             </div>
//                             <div className="space-y-2">
//                                 <Label>Urgency Level</Label>
//                                 <div className="flex flex-wrap gap-4">
//                                     {URGENCY_LEVELS.map((u) => (
//                                         <div key={u} className="flex items-center space-x-2">
//                                             <Checkbox
//                                                 id={`u-${u}`}
//                                                 checked={urgencyLevel.includes(u)}
//                                                 onCheckedChange={() =>
//                                                     toggleSelection(urgencyLevel, u, setUrgencyLevel)
//                                                 }
//                                             />
//                                             <label htmlFor={`u-${u}`} className="text-sm font-medium leading-none">
//                                                 {u}
//                                             </label>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Section 7: Notes */}
//                     <Card>
//                         <CardHeader className="pb-3 border-b bg-muted/20">
//                             <CardTitle className="text-base text-primary">Sales Person Notes</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-4 grid gap-4">
//                             <div className="space-y-1">
//                                 <Label>Must-Have Elements</Label>
//                                 <Textarea value={mustHave} onChange={e => setMustHave(e.target.value)} placeholder="..." />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Must-Avoid Elements</Label>
//                                 <Textarea value={mustAvoid} onChange={e => setMustAvoid(e.target.value)} placeholder="..." />
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Special Instructions</Label>
//                                 <Textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} placeholder="..." />
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Section 7.5: Follow-up Logs */}
//                     <Card>
//                         <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
//                             <CardTitle className="text-base text-primary uppercase">Follow-up Log</CardTitle>
//                             <Button type="button" size="sm" onClick={addFollowUpLog} variant="outline">
//                                 Add Log
//                             </Button>
//                         </CardHeader>
//                         <CardContent className="pt-4 overflow-x-auto">
//                             <table className="w-full border-collapse min-w-[800px]">
//                                 <thead>
//                                     <tr className="bg-muted text-xs uppercase font-semibold">
//                                         <th className="border p-2 text-left w-32">Date</th>
//                                         <th className="border p-2 text-left w-48">Mode</th>
//                                         <th className="border p-2 text-left">Outcome</th>
//                                         <th className="border p-2 text-left">Next Action</th>
//                                         <th className="border p-2 text-left w-32">Next Follow-up Date</th>
//                                         <th className="border p-2 text-left">Comments</th>
//                                         <th className="border p-2 w-10"></th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {followUpLogs.map((log, index) => (
//                                         <tr key={index}>
//                                             <td className="border p-1">
//                                                 <Input
//                                                     type="date"
//                                                     value={log.date}
//                                                     onChange={(e) => updateFollowUpLog(index, "date", e.target.value)}
//                                                     className="h-8 text-xs border-none focus-visible:ring-0 px-1"
//                                                 />
//                                             </td>
//                                             <td className="border p-1">
//                                                 <div className="flex flex-wrap gap-2 px-1">
//                                                     {["CALL", "WHATSAPP", "VISIT"].map((mode) => (
//                                                         <div key={mode} className="flex items-center space-x-1">
//                                                             <input
//                                                                 type="checkbox"
//                                                                 id={`mode-${index}-${mode}`}
//                                                                 checked={log.mode === mode}
//                                                                 onChange={() => updateFollowUpLog(index, "mode", mode)}
//                                                                 className="h-3 w-3"
//                                                             />
//                                                             <label htmlFor={`mode-${index}-${mode}`} className="text-[10px] font-medium leading-none">
//                                                                 {mode}
//                                                             </label>
//                                                         </div>
//                                                     ))}
//                                                 </div>
//                                             </td>
//                                             <td className="border p-1">
//                                                 <Input
//                                                     value={log.outcome}
//                                                     onChange={(e) => updateFollowUpLog(index, "outcome", e.target.value)}
//                                                     className="h-8 text-xs border-none focus-visible:ring-0 px-1"
//                                                     placeholder="Outcome"
//                                                 />
//                                             </td>
//                                             <td className="border p-1">
//                                                 <Input
//                                                     value={log.next_action}
//                                                     onChange={(e) => updateFollowUpLog(index, "next_action", e.target.value)}
//                                                     className="h-8 text-xs border-none focus-visible:ring-0 px-1"
//                                                     placeholder="Next Action"
//                                                 />
//                                             </td>
//                                             <td className="border p-1">
//                                                 <Input
//                                                     type="date"
//                                                     value={log.next_follow_up_date}
//                                                     onChange={(e) => updateFollowUpLog(index, "next_follow_up_date", e.target.value)}
//                                                     className="h-8 text-xs border-none focus-visible:ring-0 px-1"
//                                                 />
//                                             </td>
//                                             <td className="border p-1">
//                                                 <Input
//                                                     value={log.comments}
//                                                     onChange={(e) => updateFollowUpLog(index, "comments", e.target.value)}
//                                                     className="h-8 text-xs border-none focus-visible:ring-0 px-1"
//                                                     placeholder="Comments"
//                                                 />
//                                             </td>
//                                             <td className="border p-1 text-center">
//                                                 {followUpLogs.length > 1 && (
//                                                     <Button
//                                                         type="button"
//                                                         variant="ghost"
//                                                         size="sm"
//                                                         className="h-6 w-6 p-0 text-destructive"
//                                                         onClick={() => removeFollowUpLog(index)}
//                                                     >
//                                                         ×
//                                                     </Button>
//                                                 )}
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </CardContent>
//                     </Card>

//                     {/* Section 8: Advance Handling (Second Image) */}
//                     <Card className="border-t-4 border-t-amber-800">
//                         <CardHeader className="pb-3 border-b bg-amber-50">
//                             <CardTitle className="text-base text-amber-900">Advance Handling (Only After Confirmation)</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-4 grid gap-4">
//                             <div className="grid gap-4 md:grid-cols-2">
//                                 <div className="space-y-1">
//                                     <Label>Advance Type</Label>
//                                     <Input value={advanceType} onChange={e => setAdvanceType(e.target.value)} placeholder="Cash/Card/Etc" />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Amount / Weight</Label>
//                                     <Input value={amountWeight} onChange={e => setAmountWeight(e.target.value)} placeholder="Info" />
//                                 </div>
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Date Received</Label>
//                                 <Input type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} />
//                             </div>

//                             <div className="flex flex-wrap gap-6 pt-2">
//                                 <div className="flex items-center space-x-2">
//                                     <Checkbox id="rec_gen" checked={receiptGenerated} onCheckedChange={(c) => setReceiptGenerated(!!c)} />
//                                     <Label htmlFor="rec_gen">Receipt Generated</Label>
//                                 </div>
//                                 <div className="flex items-center space-x-2">
//                                     <Checkbox id="acc_not" checked={accountsNotified} onCheckedChange={(c) => setAccountsNotified(!!c)} />
//                                     <Label htmlFor="acc_not">Accounts Notified</Label>
//                                 </div>
//                                 <div className="flex items-center space-x-2">
//                                     <Checkbox id="erp_done" checked={erpEntryDone} onCheckedChange={(c) => setErpEntryDone(!!c)} />
//                                     <Label htmlFor="erp_done">ERP Entry Done</Label>
//                                 </div>
//                             </div>

//                             <div className="flex items-center gap-4 border rounded p-3">
//                                 <div className="flex items-center space-x-2 min-w-fit">
//                                     <Checkbox id="gold_lock" checked={goldRateLocked} onCheckedChange={(c) => setGoldRateLocked(!!c)} />
//                                     <Label htmlFor="gold_lock">Gold Rate Locked</Label>
//                                 </div>
//                                 {goldRateLocked && (
//                                     <div className="grid grid-cols-2 gap-2 flex-grow">
//                                         <Input value={goldRateFixed} onChange={e => setGoldRateFixed(e.target.value)} placeholder="Fixed Rate" className="h-8" />
//                                         <Input type="date" value={goldRateDate} onChange={e => setGoldRateDate(e.target.value)} className="h-8" />
//                                     </div>
//                                 )}
//                             </div>

//                             <div className="space-y-2">
//                                 <Label>Next Dept Triggered</Label>
//                                 <div className="flex flex-wrap gap-4">
//                                     {NEXT_DEPT_OPTIONS.map((ndt) => (
//                                         <div key={ndt} className="flex items-center space-x-2">
//                                             <Checkbox
//                                                 id={`ndt-${ndt}`}
//                                                 checked={nextDeptTriggered.includes(ndt)}
//                                                 onCheckedChange={() =>
//                                                     toggleSelection(nextDeptTriggered, ndt, setNextDeptTriggered)
//                                                 }
//                                             />
//                                             <label htmlFor={`ndt-${ndt}`} className="text-sm font-medium leading-none">
//                                                 {ndt}
//                                             </label>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="grid gap-4 md:grid-cols-2">
//                                 <div className="space-y-1">
//                                     <Label>Verified By</Label>
//                                     <Input value={verifiedBy} onChange={e => setVerifiedBy(e.target.value)} />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Colour Stone Demand</Label>
//                                     <Input value={colourStoneDemand} onChange={e => setColourStoneDemand(e.target.value)} />
//                                 </div>
//                             </div>
//                             <div className="space-y-1">
//                                 <Label>Raw Material Dept. Instructions</Label>
//                                 <Textarea value={rawMaterialInstructions} onChange={e => setRawMaterialInstructions(e.target.value)} />
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Section 9: Ledger & Dept Instructions */}
//                     <Card className="border-t-4 border-t-amber-800">
//                         <CardHeader className="pb-3 border-b bg-amber-50">
//                             <CardTitle className="text-base text-amber-900">Ledger & Instructions</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-4 grid gap-6">
//                             <div className="space-y-4">
//                                 <div className="flex items-center justify-between">
//                                     <Label className="text-base font-semibold">Ledger Entries</Label>
//                                     <Button type="button" variant="outline" size="sm" onClick={addLedgerRow}>+ Add Row</Button>
//                                 </div>

//                                 <div className="border rounded-md overflow-hidden">
//                                     <table className="w-full text-sm">
//                                         <thead className="bg-muted/50">
//                                             <tr>
//                                                 <th className="p-2 text-left font-medium">Date</th>
//                                                 <th className="p-2 text-left font-medium">Particulars</th>
//                                                 <th className="p-2 text-left font-medium">Gold</th>
//                                                 <th className="p-2 text-left font-medium">Diamond</th>
//                                                 <th className="p-2 text-left font-medium">Cash</th>
//                                                 <th className="p-2 text-left font-medium">Narration</th>
//                                                 <th className="p-2 w-10"></th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {ledgerEntries.map((entry, index) => (
//                                                 <tr key={index} className="border-t">
//                                                     <td className="p-2">
//                                                         <Input
//                                                             type="date"
//                                                             value={entry.date}
//                                                             onChange={(e) => updateLedgerEntry(index, "date", e.target.value)}
//                                                             className="h-8 w-full"
//                                                         />
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <Input
//                                                             value={entry.particulars}
//                                                             onChange={(e) => updateLedgerEntry(index, "particulars", e.target.value)}
//                                                             className="h-8 w-full"
//                                                             placeholder="Item/Details"
//                                                         />
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <Input
//                                                             type="number"
//                                                             value={entry.gold}
//                                                             onChange={(e) => updateLedgerEntry(index, "gold", e.target.value)}
//                                                             className="h-8 w-20"
//                                                             placeholder="0.00"
//                                                         />
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <Input
//                                                             type="number"
//                                                             value={entry.diamond}
//                                                             onChange={(e) => updateLedgerEntry(index, "diamond", e.target.value)}
//                                                             className="h-8 w-20"
//                                                             placeholder="0.00"
//                                                         />
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <Input
//                                                             type="number"
//                                                             value={entry.cash}
//                                                             onChange={(e) => updateLedgerEntry(index, "cash", e.target.value)}
//                                                             className="h-8 w-24"
//                                                             placeholder="0.00"
//                                                         />
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <Input
//                                                             value={entry.narration}
//                                                             onChange={(e) => updateLedgerEntry(index, "narration", e.target.value)}
//                                                             className="h-8 w-full"
//                                                             placeholder="Notes"
//                                                         />
//                                                     </td>
//                                                     <td className="p-2">
//                                                         {ledgerEntries.length > 1 && (
//                                                             <Button
//                                                                 type="button"
//                                                                 variant="ghost"
//                                                                 size="sm"
//                                                                 className="h-8 w-8 p-0 text-destructive"
//                                                                 onClick={() => removeLedgerRow(index)}
//                                                             >
//                                                                 &times;
//                                                             </Button>
//                                                         )}
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                             <tr className="border-t bg-muted/20 font-semibold">
//                                                 <td className="p-2" colSpan={2}>Total</td>
//                                                 <td className="p-2">{ledgerTotals.gold.toFixed(2)}</td>
//                                                 <td className="p-2">{ledgerTotals.diamond.toFixed(2)}</td>
//                                                 <td className="p-2">{ledgerTotals.cash.toFixed(2)}</td>
//                                                 <td className="p-2" colSpan={2}></td>
//                                             </tr>
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>

//                             <div className="space-y-4 pt-4 border-t">
//                                 <div className="space-y-1">
//                                     <Label>Design Dept. Instructions</Label>
//                                     <Input value={designDeptInstructions} onChange={e => setDesignDeptInstructions(e.target.value)} />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Production Dept. Instructions</Label>
//                                     <Input value={productionDeptInstructions} onChange={e => setProductionDeptInstructions(e.target.value)} />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Accounts Dept. Instructions</Label>
//                                     <Input value={accountsDeptInstructions} onChange={e => setAccountsDeptInstructions(e.target.value)} />
//                                 </div>
//                                 <div className="space-y-1">
//                                     <Label>Reminders</Label>
//                                     <Input value={reminders} onChange={e => setReminders(e.target.value)} />
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Section 10: Rough Work & Final Design */}
//                     <div className="grid gap-6 md:grid-cols-2">
//                         <Card className="border-t-4 border-t-amber-800">
//                             <CardHeader className="pb-3 border-b bg-amber-50">
//                                 <CardTitle className="text-base text-amber-900">Rough Work</CardTitle>
//                             </CardHeader>
//                             <CardContent className="pt-4">
//                                 <Textarea value={roughWork} onChange={e => setRoughWork(e.target.value)} className="min-h-[200px]" />
//                             </CardContent>
//                         </Card>
//                         <Card className="border-t-4 border-t-amber-800">
//                             <CardHeader className="pb-3 border-b bg-amber-50">
//                                 <CardTitle className="text-base text-amber-900">Final Design</CardTitle>
//                             </CardHeader>
//                             <CardContent className="pt-4">
//                                 <Textarea value={finalDesign} onChange={e => setFinalDesign(e.target.value)} className="min-h-[200px]" />
//                             </CardContent>
//                         </Card>
//                     </div>

//                     {/* Section 11: Delivery Notes */}
//                     <Card className="border-t-4 border-t-amber-800">
//                         <CardHeader className="pb-3 border-b bg-amber-50">
//                             <CardTitle className="text-base text-amber-900">Delivery Notes</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-4">
//                             <Textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} className="min-h-[100px]" />
//                         </CardContent>
//                     </Card>

//                     {/* Estimate Details Section */}
//                     {showEstimateDetails && estimateData && (
//                         <Card className="border-t-4 border-t-green-600">
//                             <CardHeader className="pb-3 border-b bg-green-50">
//                                 <CardTitle className="text-base text-green-900">Estimate Details</CardTitle>
//                             </CardHeader>
//                             <CardContent className="pt-4">
//                                 <div className="grid gap-4">
//                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                                         <div className="space-y-1">
//                                             <Label className="text-sm font-medium">Estimate ID</Label>
//                                             <div className="text-sm">{estimateData.id}</div>
//                                         </div>
//                                         <div className="space-y-1">
//                                             <Label className="text-sm font-medium">Item Name</Label>
//                                             <div className="text-sm">{estimateData.item_name}</div>
//                                         </div>
//                                         <div className="space-y-1">
//                                             <Label className="text-sm font-medium">Date</Label>
//                                             <div className="text-sm">{estimateData.date}</div>
//                                         </div>
//                                         <div className="space-y-1">
//                                             <Label className="text-sm font-medium">Total Taxable Value</Label>
//                                             <div className="text-sm">₹{estimateData.total_taxable_value}</div>
//                                         </div>
//                                     </div>

//                                     <div className="space-y-2">
//                                         <Label className="text-sm font-medium">Line Items</Label>
//                                         <div className="border rounded-md overflow-hidden">
//                                             <table className="w-full text-sm">
//                                                 <thead className="bg-muted/50">
//                                                     <tr>
//                                                         <th className="p-2 text-left font-medium">Particulars</th>
//                                                         <th className="p-2 text-left font-medium">Weight</th>
//                                                         <th className="p-2 text-left font-medium">Rate</th>
//                                                         <th className="p-2 text-left font-medium">Amount</th>
//                                                     </tr>
//                                                 </thead>
//                                                 <tbody>
//                                                     {estimateData.line_items?.map((item: any, index: number) => (
//                                                         <tr key={index} className="border-t">
//                                                             <td className="p-2">{item.particulars}</td>
//                                                             <td className="p-2">{item.weight} {item.unit}</td>
//                                                             <td className="p-2">₹{item.rate}</td>
//                                                             <td className="p-2">₹{item.amount}</td>
//                                                         </tr>
//                                                     ))}
//                                                 </tbody>
//                                             </table>
//                                         </div>
//                                     </div>

//                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
//                                         <div className="space-y-1">
//                                             <Label className="text-sm font-medium">GST Amount</Label>
//                                             <div className="text-sm">₹{estimateData.gst_amount}</div>
//                                         </div>
//                                         <div className="space-y-1">
//                                             <Label className="text-sm font-medium">Grand Total</Label>
//                                             <div className="font-semibold text-sm">₹{estimateData.grand_total}</div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     )}

//                     <div className="flex justify-end gap-3 sticky bottom-4 bg-background p-4 border rounded shadow-lg">
//                         <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
//                         <Button
//                             type="button"
//                             onClick={handleCreateEstimate}
//                             disabled={isCreatingEstimate || isSubmitting}
//                             className="bg-blue-600 hover:bg-blue-700 text-white"
//                         >
//                             {isCreatingEstimate ? "Creating Estimate..." : "Create Estimate"}
//                         </Button>
//                         <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700">
//                             {isSubmitting ? "Saving..." : "Save Complete Query"}
//                         </Button>
//                     </div>
//                 </div>
//             </form>

//             {/* Image Zoom Modal */}
//             {isImageZoomed && (referencePhoto || existingPhoto) && (
//                 <div
//                     className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-all animate-in fade-in duration-200"
//                     onClick={() => setIsImageZoomed(false)}
//                 >
//                     <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
//                         <Button
//                             variant="ghost"
//                             className="absolute top-0 right-0 m-4 text-white hover:bg-white/20 h-10 w-10 rounded-full text-xl"
//                             onClick={() => setIsImageZoomed(false)}
//                         >
//                             ×
//                         </Button>
//                         <img
//                             src={referencePhoto ? URL.createObjectURL(referencePhoto) : existingPhoto!}
//                             alt="Zoomed Reference"
//                             className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
//                         />
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SalesLeadsHeader } from "./SalesLeadsHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import { useToast } from "@/hooks/use-toast";
import {
  accountsList,
  accountDetail,
  getSalesQuery,
  createSalesQuery,
  updateSalesQuery,
  deleteSalesQuery,
  SalesQueryPayload,
  createEstimateVariation,
  getVouchersMaster,
  getAvailableBaseEstimates,
  estimateUpdate,
  getOrderFromSalesQuery,
  getSubAccountsByAccountId,
  goldCaratsList,
  GoldQuality,
} from "@/lib/backend";
import { api, ApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { generateSalesQueryPDF } from "@/lib/salesQueryPDF";
import { exportToExcel } from "@/lib/export";
import {
  GoldQualityInput,
  type GoldQualityOption,
} from "@/components/ui/gold-quality-input";

// --- Mock Data Options ---
const OCCASIONS = ["Wedding", "Engagement", "Birthday", "Anniversary", "Other"];
const PURPOSES = ["Self", "Gift", "Bridal", "Other"];
const STYLE_PREFS = ["Minimal", "Statement", "Traditional", "Modern", "Unsure"];
const METAL_PREFS = ["Yellow", "White", "Rose", "Two-Tone"];
const DIAMOND_PRIORITIES = ["Size", "Quality", "Balance"];
const URGENCY_LEVELS = ["Standard", "Priority", "Urgent"];
const REFERENCE_SOURCES = ["Instagram", "Referral", "Walk-in", "Other"];
const NEXT_DEPT_OPTIONS = ["Design", "Diamond", "Production"];

export function SalesLeadsForm({ queryId }: { queryId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewProcessLoading, setViewProcessLoading] = useState(false);

  const [pendingEstimateId, setPendingEstimateId] = useState<string | null>(
    null
  );

  // --- State for Form Fields ---
  // Important Dates
  const [salesPerson, setSalesPerson] = useState("");
  const [vendor, setVendor] = useState("");
  const [transferDepartment, setTransferDepartment] = useState("");
  const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // --- Additional State for Estimate Functionality ---
  const [jewelleryTypeOptions, setJewelleryTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Sub Account State
  const [subAccountOptions, setSubAccountOptions] = useState<
    { value: string; label: string; phone?: string; email?: string }[]
  >([]);
  const [subAccountRecordId, setSubAccountRecordId] = useState<string>("");
  const [loadingSubAccounts, setLoadingSubAccounts] = useState(false);

  // Gold Quality State
  const [goldQualityOptions, setGoldQualityOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [goldQuality, setGoldQuality] = useState("");

  // Client Details
  const [accountId, setAccountId] = useState("");
  const [subAccount, setSubAccount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [clientDeliveryType, setClientDeliveryType] = useState("");
  const [panGstin, setPanGstin] = useState("");
  const [refSource, setRefSource] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Occasion & Intent
  const [occasion, setOccasion] = useState<string[]>([]);
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState("");
  const [stockInDeadline, setStockInDeadline] = useState("");
  const [purpose, setPurpose] = useState<string[]>([]);

  // Jewellery Details
  const [jewelleryType, setJewelleryType] = useState("");
  const [sizeDetails, setSizeDetails] = useState("");
  const [fitDetails, setFitDetails] = useState("");
  const [followUpLog, setFollowUpLog] = useState("");

  // Follow-up Logs Table
  const [followUpLogs, setFollowUpLogs] = useState<
    {
      date: string;
      mode: string;
      outcome: string;
      next_action: string;
      next_follow_up_date: string;
      comments: string;
    }[]
  >([
    {
      date: "",
      mode: "",
      outcome: "",
      next_action: "",
      next_follow_up_date: "",
      comments: "",
    },
  ]);

  const [stylePref, setStylePref] = useState<string[]>([]);
  const [metalPref, setMetalPref] = useState<string[]>([]);

  // Diamond/Gemstone
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

  // Budget & Timeline
  const [budgetRange, setBudgetRange] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<string[]>([]);

  // Notes
  const [mustHave, setMustHave] = useState("");
  const [mustAvoid, setMustAvoid] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // --- SECOND IMAGE FIELDS ---
  // Advance Handling
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
  const [colourStoneDemand, setColourStoneDemand] = useState("");
  const [rawMaterialInstructions, setRawMaterialInstructions] = useState("");

  // Ledger State
  const [ledgerEntries, setLedgerEntries] = useState([
    {
      date: "",
      particulars: "",
      gold: "",
      diamond: "",
      cash: "",
      narration: "",
    },
  ]);

  // Instructions
  const [designDeptInstructions, setDesignDeptInstructions] = useState("");
  const [productionDeptInstructions, setProductionDeptInstructions] =
    useState("");
  const [accountsDeptInstructions, setAccountsDeptInstructions] = useState("");
  const [reminders, setReminders] = useState("");

  // Bottom Section
  const [roughWork, setRoughWork] = useState("");
  const [finalDesign, setFinalDesign] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Workflow Details
  const [selectionNotes, setSelectionNotes] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [saleBillNo, setSaleBillNo] = useState("");
  const [saleJobNo, setSaleJobNo] = useState("");

  const [createdQueryId, setCreatedQueryId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // State for sample photo upload
  const [samplePhoto, setSamplePhoto] = useState<File | null>(null);
  const [samplePhotoPreview, setSamplePhotoPreview] = useState<string | null>(
    null
  );
  const [existingSamplePhoto, setExistingSamplePhoto] = useState<string | null>(
    null
  );
  const [isSampleImageZoomed, setIsSampleImageZoomed] = useState(false);

  // Determines the effective query ID: either passed via props or created during this session (e.g. by estimate creation)
  const effectiveQueryId = queryId || createdQueryId;

  // Handler for View Process button
  const handleViewProcess = async () => {
    if (!effectiveQueryId) return;

    setViewProcessLoading(true);
    try {
      const response = await getOrderFromSalesQuery(effectiveQueryId);

      if (response.success && response.order_id) {
        // Redirect to order tracking page
        router.push(`/vouchers/orders/${response.order_id}/tracking/`);
      } else {
        // Show error message
        toast({
          variant: "destructive",
          title: "Cannot View Process",
          description: response.message || "Failed to load order details.",
        });
      }
    } catch (error: any) {
      console.error("Failed to get order from sales lead:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Failed to load order details. Please try again.",
      });
    } finally {
      setViewProcessLoading(false);
    }
  };

  // Simple error message component
  const ErrorMsg = ({ name }: { name: string }) => {
    if (!formErrors[name]) return null;
    return (
      <p className="text-destructive text-[11px] mt-1 font-medium italic">
        {formErrors[name]}
      </p>
    );
  };

  // Load Data if queryId exists
  useEffect(() => {
    if (!effectiveQueryId) return;

    const fetchData = async () => {
      try {
        const data = await getSalesQuery(effectiveQueryId);

        // Map data to state
        setOrderDate(data.order_date || "");
        setSalesPerson(data.sales_person || "");
        setVendor(data.vendor || "");
        if (data.account?.id) setAccountId(String(data.account.id));

        // NEW: Handle Sub Account Record
        if (data.sub_account_record?.id) {
          setSubAccountRecordId(data.sub_account_record.id);
          setSubAccount(
            data.sub_account_record.name ||
              data.sub_account_record.sub_account_name ||
              ""
          );
        } else {
          setSubAccountRecordId("");
          setSubAccount(data.sub_account || "");
        }

        setPhoneNumber(data.phone_number || "");
        setEmail(data.email || "");
        setCity(data.city || "");
        setClientDeliveryType(data.client_delivery_type || "");
        setPanGstin(data.pan_gstin || "");
        setOccasion(data.occasion || []);
        setRequiredDeliveryDate(data.required_delivery_date || "");
        setStockInDeadline(data.stock_in_deadline || "");
        setPurpose(data.purpose || []);
        setJewelleryType(data.jewellery_type || "");

        // Handle Gold Quality (simple text field now)
        setGoldQuality(data.gold_quality || "");

        setSizeDetails(data.size_details || "");
        setFitDetails(data.fit_details || "");
        setFollowUpLog(data.follow_up_log || "");
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
        setSpecialInstructions(data.special_instructions || "");
        setTransferDepartment(String(data.transfer_department || ""));
        setFollowUpLog(String(data.follow_up_log || ""));
        setExistingPhoto(data.reference_photo || null);
        setExistingSamplePhoto((data.sample_photo as string) || null);
        setSelectionNotes(String(data.selection_notes || ""));
        setSaleNotes(String(data.sale_notes || ""));
        setSaleBillNo(String(data.sale_bill_no || ""));
        setSaleJobNo(String(data.sale_job_no || ""));

        // Map follow_up_logs list
        if (
          Array.isArray(data.follow_up_logs) &&
          data.follow_up_logs.length > 0
        ) {
          const formattedLogs = data.follow_up_logs.map((e: any) => ({
            date: e.date || "",
            mode: e.mode || "",
            outcome: e.outcome || "",
            next_action: e.next_action || "",
            next_follow_up_date: e.next_follow_up_date || "",
            comments: e.comments || "",
          }));
          setFollowUpLogs(formattedLogs);
        }

        // JSON fields mapping
        const ah = data.advance_handling || {};
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
        setColourStoneDemand(ah.colour_stone_demand || "");
        setRawMaterialInstructions(ah.raw_material_instructions || "");

        const di = data.department_instructions || {};
        setDesignDeptInstructions(di.design || "");
        setProductionDeptInstructions(di.production || "");
        setAccountsDeptInstructions(di.accounts || "");
        setReminders(di.reminders || "");

        const dd = data.design_delivery || {};
        setRoughWork(dd.rough_work_notes || "");
        setFinalDesign(dd.final_design_url || "");
        setDeliveryNotes(dd.delivery_notes || "");

        if (
          Array.isArray(data.ledger_entries) &&
          data.ledger_entries.length > 0
        ) {
          const formattedEntries = data.ledger_entries.map((e: any) => ({
            date: e.date || "",
            particulars: e.particulars || "",
            gold: String(e.gold || ""),
            diamond: String(e.diamond || ""),
            cash: String(e.cash || ""),
            narration: e.narration || "",
          }));
          setLedgerEntries(formattedEntries);
        }
      } catch (error) {
        console.error("Failed to fetch sales lead:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load sales lead details.",
        });
      }
    };
    fetchData();
  }, [effectiveQueryId, toast]);

  // Check for return from estimate creation
  useEffect(() => {
    // 1. Check if we have an estimate_id in URL
    const returnedEstimateId = searchParams.get("estimate_id");
    if (returnedEstimateId) {
      setPendingEstimateId(returnedEstimateId);
      toast({
        title: "Estimate Created",
        description:
          "Estimate created successfully. Saving the query will link it.",
      });
    }

    // 2. Restore form data if available
    const savedData = sessionStorage.getItem("temp_query_form_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Restore values
        if (parsed.salesPerson) setSalesPerson(parsed.salesPerson);
        if (parsed.vendor) setVendor(parsed.vendor);
        if (parsed.transferDepartment)
          setTransferDepartment(parsed.transferDepartment);
        if (parsed.orderDate) setOrderDate(parsed.orderDate);
        if (parsed.accountId) setAccountId(parsed.accountId);
        if (parsed.subAccountRecordId)
          setSubAccountRecordId(parsed.subAccountRecordId);
        if (parsed.subAccountName) setSubAccount(parsed.subAccountName);
        else if (parsed.subAccount) setSubAccount(parsed.subAccount);
        if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.city) setCity(parsed.city);
        if (parsed.clientDeliveryType)
          setClientDeliveryType(parsed.clientDeliveryType);
        if (parsed.panGstin) setPanGstin(parsed.panGstin);
        if (parsed.refSource) setRefSource(parsed.refSource);
        if (parsed.occasion) setOccasion(parsed.occasion);
        if (parsed.requiredDeliveryDate)
          setRequiredDeliveryDate(parsed.requiredDeliveryDate);
        if (parsed.stockInDeadline) setStockInDeadline(parsed.stockInDeadline);
        if (parsed.purpose) setPurpose(parsed.purpose);
        if (parsed.jewelleryType) setJewelleryType(parsed.jewelleryType);
        if (parsed.goldQuality) setGoldQuality(parsed.goldQuality);
        if (parsed.sizeDetails) setSizeDetails(parsed.sizeDetails);
        if (parsed.fitDetails) setFitDetails(parsed.fitDetails);
        if (parsed.followUpLog) setFollowUpLog(parsed.followUpLog);
        if (parsed.stylePref) setStylePref(parsed.stylePref);
        if (parsed.metalPref) setMetalPref(parsed.metalPref);
        if (parsed.diamondShape) setDiamondShape(parsed.diamondShape);
        if (parsed.colCla) setColCla(parsed.colCla);
        if (parsed.origin) setOrigin(parsed.origin);
        if (parsed.budgetDia) setBudgetDia(parsed.budgetDia);
        if (parsed.diamondPriority) setDiamondPriority(parsed.diamondPriority);
        if (parsed.sample) setSample(parsed.sample);
        if (parsed.gemstonePref) setGemstonePref(parsed.gemstonePref);
        if (parsed.gemColCla) setGemColCla(parsed.gemColCla);
        if (parsed.gemOrigin) setGemOrigin(parsed.gemOrigin);
        if (parsed.otherDetails) setOtherDetails(parsed.otherDetails);
        if (parsed.budgetRange) setBudgetRange(parsed.budgetRange);
        if (parsed.urgencyLevel) setUrgencyLevel(parsed.urgencyLevel);
        if (parsed.mustHave) setMustHave(parsed.mustHave);
        if (parsed.mustAvoid) setMustAvoid(parsed.mustAvoid);
        if (parsed.specialInstructions)
          setSpecialInstructions(parsed.specialInstructions);

        // Advance Handling restoration
        if (parsed.advanceType) setAdvanceType(parsed.advanceType);
        if (parsed.amountWeight) setAmountWeight(parsed.amountWeight);
        if (parsed.dateReceived) setDateReceived(parsed.dateReceived);
        if (parsed.receiptGenerated !== undefined)
          setReceiptGenerated(parsed.receiptGenerated);
        if (parsed.accountsNotified !== undefined)
          setAccountsNotified(parsed.accountsNotified);
        if (parsed.goldRateLocked !== undefined)
          setGoldRateLocked(parsed.goldRateLocked);
        if (parsed.goldRateFixed) setGoldRateFixed(parsed.goldRateFixed);
        if (parsed.goldRateDate) setGoldRateDate(parsed.goldRateDate);
        if (parsed.erpEntryDone !== undefined)
          setErpEntryDone(parsed.erpEntryDone);
        if (parsed.nextDeptTriggered)
          setNextDeptTriggered(parsed.nextDeptTriggered);
        if (parsed.verifiedBy) setVerifiedBy(parsed.verifiedBy);
        if (parsed.colourStoneDemand)
          setColourStoneDemand(parsed.colourStoneDemand);
        if (parsed.rawMaterialInstructions)
          setRawMaterialInstructions(parsed.rawMaterialInstructions);
        if (parsed.ledgerEntries) setLedgerEntries(parsed.ledgerEntries);

        // Instructions
        if (parsed.designDeptInstructions)
          setDesignDeptInstructions(parsed.designDeptInstructions);
        if (parsed.productionDeptInstructions)
          setProductionDeptInstructions(parsed.productionDeptInstructions);
        if (parsed.accountsDeptInstructions)
          setAccountsDeptInstructions(parsed.accountsDeptInstructions);
        if (parsed.reminders) setReminders(parsed.reminders);

        // Bottom Section
        if (parsed.roughWork) setRoughWork(parsed.roughWork);
        if (parsed.finalDesign) setFinalDesign(parsed.finalDesign);
        if (parsed.deliveryNotes) setDeliveryNotes(parsed.deliveryNotes);

        // Workflow Details
        if (parsed.selectionNotes) setSelectionNotes(parsed.selectionNotes);
        if (parsed.saleNotes) setSaleNotes(parsed.saleNotes);
        if (parsed.saleBillNo) setSaleBillNo(parsed.saleBillNo);
        if (parsed.diamondShape) setDiamondShape(parsed.diamondShape);
        if (parsed.colCla) setColCla(parsed.colCla);
        if (parsed.origin) setOrigin(parsed.origin);
        if (parsed.budgetDia) setBudgetDia(parsed.budgetDia);
        if (parsed.diamondPriority) setDiamondPriority(parsed.diamondPriority);
        if (parsed.sample) setSample(parsed.sample);
        if (parsed.gemstonePref) setGemstonePref(parsed.gemstonePref);
        if (parsed.gemColCla) setGemColCla(parsed.gemColCla);
        if (parsed.gemOrigin) setGemOrigin(parsed.gemOrigin);
        if (parsed.otherDetails) setOtherDetails(parsed.otherDetails);
        if (parsed.budgetRange) setBudgetRange(parsed.budgetRange);
        if (parsed.urgencyLevel) setUrgencyLevel(parsed.urgencyLevel);
        if (parsed.mustHave) setMustHave(parsed.mustHave);
        if (parsed.mustAvoid) setMustAvoid(parsed.mustAvoid);
        if (parsed.specialInstructions)
          setSpecialInstructions(parsed.specialInstructions);

        // Clear storage
        sessionStorage.removeItem("temp_query_form_data");
      } catch (e) {
        console.error("Failed to restore form data", e);
      }
    }
  }, [searchParams, toast]);

  // Helper to update ledger entry
  const updateLedgerEntry = (index: number, field: string, value: string) => {
    const newEntries = [...ledgerEntries];
    (newEntries[index] as Record<string, string>)[field] = value;
    setLedgerEntries(newEntries);
  };

  // Helper to add row
  const addLedgerRow = () => {
    setLedgerEntries([
      ...ledgerEntries,
      {
        date: "",
        particulars: "",
        gold: "",
        diamond: "",
        cash: "",
        narration: "",
      },
    ]);
  };

  // Helper to remove row
  const removeLedgerRow = (index: number) => {
    if (ledgerEntries.length > 1) {
      const newEntries = [...ledgerEntries];
      newEntries.splice(index, 1);
      setLedgerEntries(newEntries);
    }
  };

  // --- Follow-Up Logs Helpers ---
  const updateFollowUpLog = (index: number, field: string, value: string) => {
    const newLogs = [...followUpLogs];
    (newLogs[index] as Record<string, string>)[field] = value;
    setFollowUpLogs(newLogs);
  };

  const addFollowUpLog = () => {
    setFollowUpLogs([
      ...followUpLogs,
      {
        date: "",
        mode: "",
        outcome: "",
        next_action: "",
        next_follow_up_date: "",
        comments: "",
      },
    ]);
  };

  const removeFollowUpLog = (index: number) => {
    if (followUpLogs.length > 1) {
      const newLogs = [...followUpLogs];
      newLogs.splice(index, 1);
      setFollowUpLogs(newLogs);
    }
  };

  // Calculate totals
  const ledgerTotals = ledgerEntries.reduce(
    (acc, curr) => {
      return {
        gold: acc.gold + (parseFloat(curr.gold) || 0),
        diamond: acc.diamond + (parseFloat(curr.diamond) || 0),
        cash: acc.cash + (parseFloat(curr.cash) || 0),
      };
    },
    { gold: 0, diamond: 0, cash: 0 }
  );

  // Load Accounts
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

  // Set phone/email when account changes (Only for new entries or manual change)
  useEffect(() => {
    if (!accountId || effectiveQueryId) return; // Don't overwrite if loading existing data
    async function fetchDetail() {
      try {
        const details = await accountDetail(accountId);
        // Priority: contact.phone first, then contact.mobile as fallback
        if (details.contact?.phone) {
          setPhoneNumber(details.contact.phone);
        } else if (details.contact?.mobile) {
          setPhoneNumber(details.contact.mobile);
        }
        if (details.contact?.email) setEmail(details.contact.email);
        if (details.contact?.city?.name) setCity(details.contact.city.name);
        if (details.tax?.pan) setPanGstin(details.tax.pan);
      } catch (e) {
        console.error(e);
      }
    }
    fetchDetail();
  }, [accountId, effectiveQueryId]);

  // NEW: Load Sub Accounts when Account changes
  useEffect(() => {
    const loadSubAccounts = async () => {
      if (!accountId) {
        setSubAccountOptions([]);
        setSubAccountRecordId("");
        console.log("No account selected - clearing sub-accounts");
        return;
      }

      // Immediately clear previous options when account changes
      console.log(
        `Account changed to: ${accountId} - clearing previous sub-accounts`
      );
      setSubAccountOptions([]);
      setSubAccountRecordId("");
      setLoadingSubAccounts(true);

      try {
        console.log(`Fetching sub-accounts for account: ${accountId}`);
        // Backend filters by account_id - no client-side filtering needed
        const subAccounts = await getSubAccountsByAccountId(accountId);
        console.log(
          `Received ${subAccounts.length} sub-accounts for account ${accountId}`
        );

        const options = subAccounts.map((sub) => ({
          value: sub.id,
          label: `${sub.sub_account_name || ""}${sub.phone_number ? ` (${sub.phone_number})` : ""}`,
          phone: sub.phone_number,
          email: sub.email,
        }));
        setSubAccountOptions(options);
        console.log(`Created ${options.length} dropdown options`);
      } catch (error) {
        console.error("Failed to load sub-accounts:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load sub-accounts.",
        });
      } finally {
        setLoadingSubAccounts(false);
      }
    };

    loadSubAccounts();
  }, [accountId, effectiveQueryId, toast]);

  // NEW: Auto-fill phone/email when sub-account is selected from dropdown
  useEffect(() => {
    if (!subAccountRecordId) return;

    const selectedSubAccount = subAccountOptions.find(
      (opt) => opt.value === subAccountRecordId
    );

    if (selectedSubAccount) {
      // Only auto-fill if fields are empty (don't overwrite user input)
      if (!phoneNumber && selectedSubAccount.phone) {
        setPhoneNumber(selectedSubAccount.phone);
      }
      if (!email && selectedSubAccount.email) {
        setEmail(selectedSubAccount.email);
      }
    }
  }, [subAccountRecordId, phoneNumber, email, subAccountOptions]);

  // Load jewellery type options from vouchers master
  useEffect(() => {
    const fetchJewelleryTypes = async () => {
      try {
        const response = await getVouchersMaster();
        const options = (response.item_names || []).map((item) => ({
          value: item.name,
          label: item.name,
        }));
        setJewelleryTypeOptions(options);
      } catch (error) {
        console.error("Failed to load jewellery type options:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load jewellery type options.",
        });
      }
    };
    fetchJewelleryTypes();
  }, [toast]);

  useEffect(() => {
    const fetchGoldCarats = async () => {
      try {
        const carats = await goldCaratsList();
        if (carats.length > 0) {
          setGoldQualityOptions(carats.map((c) => ({ value: c.name, label: c.name })));
        }
      } catch {
        setGoldQualityOptions([
          { value: "22K", label: "22K" },
          { value: "18K", label: "18K" },
          { value: "14K", label: "14K" },
        ]);
      }
    };
    void fetchGoldCarats();
  }, []);

  // Real-time validation
  useEffect(() => {
    setFormErrors((prev) => {
      const newErrors = { ...prev };

      // PAN/GSTIN Validation: Show error while typing if not exactly 12
      if (panGstin && (panGstin.length < 10 || panGstin.length > 20)) {
        newErrors.panGstin =
          "PAN/Aadhaar must be between 10 and 20 characters.";
      } else {
        delete newErrors.panGstin;
      }

      // Phone validation
      if (
        phoneNumber &&
        !/^[+]?[0-9]{10,15}$/.test(phoneNumber.replace(/\s/g, ""))
      ) {
        newErrors.phoneNumber = "Please enter a valid phone number.";
      } else {
        delete newErrors.phoneNumber;
      }

      // Email validation
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Please enter a valid email address.";
      } else {
        delete newErrors.email;
      }

      // Clear required field errors as soon as user types/selects
      if (salesPerson) delete newErrors.salesPerson;
      if (jewelleryType) delete newErrors.jewelleryType;
      if (city) delete newErrors.city;
      if (phoneNumber) delete newErrors.phoneNumber;
      if (email) delete newErrors.email;
      if (panGstin) delete newErrors.panGstin;
      if (accountId) delete newErrors.accountId;
      if (orderDate) delete newErrors.orderDate;
      if (requiredDeliveryDate) delete newErrors.requiredDeliveryDate;
      if (occasion.length > 0) delete newErrors.occasion;
      if (purpose.length > 0) delete newErrors.purpose;
      if (metalPref.length > 0) delete newErrors.metalPref;
      if (clientDeliveryType) delete newErrors.clientDeliveryType;

      // Only updating if there's a real change to avoid unnecessary re-renders
      if (JSON.stringify(newErrors) === JSON.stringify(prev)) return prev;
      return newErrors;
    });
  }, [
    panGstin,
    salesPerson,
    jewelleryType,
    city,
    phoneNumber,
    email,
    accountId,
    orderDate,
    requiredDeliveryDate,
    occasion,
    purpose,
    metalPref,
    clientDeliveryType,
  ]);

  const toggleSelection = (
    current: string[],
    item: string,
    setFn: (v: string[]) => void
  ) => {
    if (current.includes(item)) {
      setFn(current.filter((i) => i !== item));
    } else {
      setFn([...current, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: SalesQueryPayload = {
        order_date: orderDate,
        sales_person: salesPerson,
        vendor: vendor,
        account_id: accountId,
        // Use selected sub-account ID if exists, otherwise use text field
        sub_account_record_id: subAccountRecordId || undefined,
        sub_account: subAccount, // Text field for manual entry or backward compatibility
        phone_number: phoneNumber,
        email: email,
        city: city,
        client_delivery_type: clientDeliveryType,
        pan_gstin: panGstin,
        occasion: occasion,
        required_delivery_date: requiredDeliveryDate,
        stock_in_deadline: stockInDeadline,
        purpose: purpose,
        // Jewellery Type (text field)
        jewellery_type: jewelleryType,
        gold_quality: goldQuality,
        size_details: sizeDetails,
        fit_details: fitDetails,
        follow_up_log: followUpLog,
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
        follow_up_logs: followUpLogs,
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
          colour_stone_demand: colourStoneDemand,
          raw_material_instructions: rawMaterialInstructions,
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
      };

      const errors: Record<string, string> = {};

      // Phone validation
      if (!phoneNumber) {
        errors.phoneNumber = "Phone number is mandatory.";
      } else if (!/^[+]?[0-9]{10,15}$/.test(phoneNumber.replace(/\s/g, ""))) {
        errors.phoneNumber = "Please enter a valid phone number.";
      }

      // Email validation
      if (!email) {
        errors.email = "Email ID is mandatory.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Please enter a valid email address.";
      }

      // PAN/Aadhaar validation
      if (!panGstin) {
        errors.panGstin = "PAN/Aadhaar details is mandatory.";
      } else if (panGstin.length < 10 || panGstin.length > 20) {
        errors.panGstin = "PAN/Aadhaar must be between 10 and 20 characters.";
      }

      // Metal preference validation
      if (metalPref.length === 0) {
        errors.metalPref = "Metal preference is mandatory.";
      }

      // Delivery type validation
      if (!clientDeliveryType) {
        errors.clientDeliveryType = "Delivery option is mandatory.";
      }

      if (panGstin && (panGstin.length < 10 || panGstin.length > 20)) {
        errors.panGstin = "PAN/Aadhaar must be between 10 and 20 characters.";
      }
      if (!accountId) {
        errors.accountId = "Main Account is required.";
      }
      if (!salesPerson) {
        errors.salesPerson = "Sales Person is required.";
      }
      if (!orderDate) {
        errors.orderDate = "Date is required.";
      }
      if (!jewelleryType) {
        errors.jewelleryType = "Jewellery Type is required.";
      }

      if (!requiredDeliveryDate) {
        errors.requiredDeliveryDate = "Delivery Date is required.";
      }
      if (occasion.length === 0) {
        errors.occasion = "At least one Occasion is required.";
      }
      if (purpose.length === 0) {
        errors.purpose = "At least one Purpose is required.";
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast({
          variant: "destructive",
          title: "Missing Required Fields",
          description: `The following items are required: ${Object.keys(errors)
            .map((k) => k.replace(/([A-Z])/g, " $1").toLowerCase())
            .join(", ")}`,
        });
        setIsSubmitting(false);
        return;
      }

      setFormErrors({}); // Clear errors if valid

      if (!effectiveQueryId) {
        (payload as any).workflow_status = "inquiry_received";
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (
          Array.isArray(value) ||
          (typeof value === "object" && key !== "reference_photo")
        ) {
          formData.append(key, JSON.stringify(value));
        } else if (key !== "reference_photo") {
          formData.append(key, String(value));
        }
      });

      if (referencePhoto) {
        formData.append("reference_photo", referencePhoto);
      }

      // Add sample photo if uploaded
      if (samplePhoto) {
        formData.append("sample_photo", samplePhoto);
      }

      if (effectiveQueryId) {
        await updateSalesQuery(effectiveQueryId, formData);
        toast({
          title: "Sales Lead Updated",
          description: "The changes have been successfully saved.",
        });
        router.push("/vouchers/sales-leads/list");
      } else {
        const res = await createSalesQuery(formData);
        const newQueryId = (res as any)?.id;

        // Link pending estimate if it exists
        if (pendingEstimateId && newQueryId) {
          try {
            await estimateUpdate(pendingEstimateId, {
              sales_query_id: newQueryId,
            });
            toast({
              title: "Estimate Linked",
              description:
                "The created estimate has been linked to this query.",
            });
          } catch (linkErr) {
            console.error("Failed to link estimate", linkErr);
            toast({
              variant: "destructive",
              title: "Link Warning",
              description:
                "Query saved, but could not auto-link the estimate. Please link manually.",
            });
          }
        }

        toast({
          title: "Sales Lead Created",
          description: "The sales lead has been successfully recorded.",
        });
        router.push("/vouchers/sales-leads/list");
      }
    } catch (err: any) {
      console.error(err);

      // Handle backend validation errors (400 Bad Request)
      if (err?.status === 400 && err?.data) {
        const backendErrors: Record<string, string> = {};

        // Map backend field names to form field names and extract error messages
        const fieldMapping: Record<string, string> = {
          phone_number: "phoneNumber",
          email: "email",
          pan_gstin: "panGstin",
          metal_preference: "metalPref",
          client_delivery_type: "clientDeliveryType",
        };

        Object.entries(err.data).forEach(([field, message]) => {
          const formField = fieldMapping[field] || field;
          backendErrors[formField] = Array.isArray(message)
            ? message.join(", ")
            : String(message);
        });

        setFormErrors(backendErrors);

        // Show toast with summary of validation errors
        const errorSummary = Object.values(backendErrors).join(", ");
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: errorSummary || "Please check all mandatory fields.",
        });
      } else {
        // Generic error handling
        let errorMessage = "Failed to save query. Please check all fields.";
        if (err instanceof ApiError && err.data) {
          // If the backend returns field-level errors (standard DRF behavior)
          const fieldErrors = Object.entries(err.data)
            .filter(
              ([key]) => key !== "code" && key !== "message" && key !== "detail"
            )
            .map(([field, msgs]) => {
              const label = field
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              return `${label}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`;
            })
            .join(", ");

          if (fieldErrors) {
            errorMessage = fieldErrors;
          } else if (err.data.detail) {
            errorMessage = err.data.detail;
          } else if (err.data.message) {
            errorMessage = err.data.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        toast({
          variant: "destructive",
          title: "Error Saving Query",
          description: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !effectiveQueryId ||
      !confirm(
        "Are you sure you want to delete this sales lead? This action cannot be undone."
      )
    )
      return;
    try {
      await deleteSalesQuery(effectiveQueryId);
      toast({
        title: "Sales Lead Deleted",
        description: "The sales lead has been permanently removed.",
      });
      router.push("/vouchers/sales-leads/list");
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error Deleting Lead",
        description:
          err instanceof ApiError
            ? err.message
            : "Failed to delete lead. It might have linked estimates or tasks.",
      });
    }
  };

  const handleExportExcel = async () => {
    if (!effectiveQueryId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot export Excel for unsaved lead.",
      });
      return;
    }

    try {
      const account = accounts.find((acc) => String(acc.id) === accountId);
      const accountName = account?.account_name || "Unknown";

      const headers = [
        "Lead ID",
        "Order Date",
        "Sales Person",
        "Vendor",
        "Account",
        "Sub Account",
        "Phone",
        "Email",
        "City",
        "Delivery Type",
        "PAN/GSTIN",
        "Reference Source",
        "Occasion",
        "Required Delivery",
        "Stock In Deadline",
        "Purpose",
        "Jewellery Type",
        "Gold Quality",
        "Size Details",
        "Fit Details",
        "Style Preference",
        "Metal Preference",
        "Diamond Shape",
        "Color Clarity",
        "Origin",
        "Diamond Budget",
        "Diamond Priority",
        "Gemstone Preference",
        "Gemstone Color Clarity",
        "Gemstone Origin",
        "Other Details",
        "Sample",
        "Budget Range",
        "Urgency Level",
        "Must Have",
        "Must Avoid",
        "Special Instructions",
        "Transfer Department",
        "Advance Type",
        "Amount/Weight",
        "Date Received",
        "Receipt Generated",
        "Accounts Notified",
        "Gold Rate Locked",
        "Gold Rate Fixed",
        "Gold Rate Date",
        "ERP Entry Done",
        "Next Dept Triggered",
        "Verified By",
        "Colour Stone Demand",
        "Raw Material Instructions",
        "Design Dept Instructions",
        "Production Dept Instructions",
        "Accounts Dept Instructions",
        "Reminders",
        "Rough Work",
        "Final Design",
        "Delivery Notes",
      ];

      const dataRow = [
        effectiveQueryId,
        orderDate,
        salesPerson,
        vendor,
        accountName,
        subAccount,
        phoneNumber,
        email,
        city,
        clientDeliveryType,
        panGstin,
        refSource.join(", "),
        occasion.join(", "),
        requiredDeliveryDate,
        stockInDeadline,
        purpose.join(", "),
        jewelleryType,
        goldQuality,
        sizeDetails,
        fitDetails,
        stylePref,
        metalPref,
        diamondShape,
        colCla,
        origin,
        budgetDia,
        diamondPriority,
        gemstonePref,
        gemColCla,
        gemOrigin,
        otherDetails,
        sample,
        budgetRange,
        urgencyLevel,
        mustHave,
        mustAvoid,
        specialInstructions,
        transferDepartment,
        advanceType,
        amountWeight,
        dateReceived,
        receiptGenerated,
        accountsNotified,
        goldRateLocked,
        goldRateFixed,
        goldRateDate,
        erpEntryDone,
        nextDeptTriggered,
        verifiedBy,
        colourStoneDemand,
        rawMaterialInstructions,
        designDeptInstructions,
        productionDeptInstructions,
        accountsDeptInstructions,
        reminders,
        roughWork,
        finalDesign,
        deliveryNotes,
      ];

      const result = exportToExcel({
        formName: "Sales Lead",
        headers,
        dataRow,
        includeFooterTimestamp: true,
      });

      if (result.ok) {
        toast({
          title: "Excel Exported",
          description: `Sales lead exported to ${result.filename}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Export failed",
          description: "Failed to export to Excel. Please try again.",
        });
      }
    } catch (error) {
      console.error("Failed to export Excel:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export Excel. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PreviousBackButton />
      <div className="flex items-center justify-between">
        <SalesLeadsHeader
          title={effectiveQueryId ? "Sales Lead Details" : "New Sales Lead"}
          description={
            effectiveQueryId
              ? "View and manage sales lead details."
              : "Detailed sales lead and process form."
          }
        />
        <div className="flex items-center gap-2">
          {false && effectiveQueryId && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                // Save current state to sessionStorage for restoration after redirect
                const selectedSubAccountOption = subAccountOptions.find(
                  (opt) => opt.value === subAccountRecordId
                );
                const subAccountNameValue = selectedSubAccountOption
                  ? selectedSubAccountOption.label.replace(/\s*\(.*\)$/, "")
                  : subAccount;

                const currentValues = {
                  salesPerson,
                  vendor,
                  transferDepartment,
                  orderDate,
                  accountId,
                  subAccountRecordId,
                  subAccountName: subAccountNameValue,
                  subAccount,
                  phoneNumber,
                  email,
                  city,
                  clientDeliveryType,
                  panGstin,
                  refSource,
                  occasion,
                  requiredDeliveryDate,
                  stockInDeadline,
                  purpose,
                  jewelleryType,
                  goldQuality,
                  sizeDetails,
                  fitDetails,
                  followUpLog,
                  stylePref,
                  metalPref,
                  diamondShape,
                  colCla,
                  origin,
                  budgetDia,
                  diamondPriority,
                  sample,
                  gemstonePref,
                  gemColCla,
                  gemOrigin,
                  otherDetails,
                  budgetRange,
                  urgencyLevel,
                  mustHave,
                  mustAvoid,
                  specialInstructions,
                  advanceType,
                  amountWeight,
                  dateReceived,
                  receiptGenerated,
                  accountsNotified,
                  goldRateLocked,
                  goldRateFixed,
                  goldRateDate,
                  erpEntryDone,
                  nextDeptTriggered,
                  verifiedBy,
                  colourStoneDemand,
                  rawMaterialInstructions,
                  ledgerEntries,
                  designDeptInstructions,
                  productionDeptInstructions,
                  accountsDeptInstructions,
                  reminders,
                  roughWork,
                  finalDesign,
                  deliveryNotes,
                  selectionNotes,
                  saleNotes,
                  saleBillNo,
                };
                sessionStorage.setItem(
                  "temp_query_form_data",
                  JSON.stringify(currentValues)
                );

                const qParams = new URLSearchParams({
                  sales_query_id: effectiveQueryId,
                  jewelry_type: jewelleryType,
                  account_id: accountId,
                });

                // Add sub-account info if available
                if (subAccountRecordId) {
                  qParams.set("sub_account_record_id", subAccountRecordId);
                  const selectedSubAccount = subAccountOptions.find(
                    (opt) => opt.value === subAccountRecordId
                  );
                  if (selectedSubAccount) {
                    const subAccountName = selectedSubAccount.label.replace(
                      /\s*\(.*\)$/,
                      ""
                    );
                    qParams.set("sub_account_name", subAccountName);
                  }
                } else if (subAccount) {
                  qParams.set("sub_account", subAccount);
                  qParams.set("sub_account_name", subAccount);
                }

                router.push(`/vouchers/estimates/new?${qParams.toString()}`);
              }}
            >
              + New Estimate
            </Button>
          )}
          {effectiveQueryId && (
            <Link href={`/vouchers/sales-leads/${effectiveQueryId}/estimates`}>
              <Button variant="outline" size="sm" type="button">
                Manage Workflow
              </Button>
            </Link>
          )}
          {effectiveQueryId && (
            <Link
              href={`/vouchers/sales-leads/${effectiveQueryId}/process-tasks`}
            >
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                📋 Manage Process Tasks
              </Button>
            </Link>
          )}
          {effectiveQueryId && (
            <Button
              variant="default"
              size="sm"
              onClick={handleExportExcel}
              type="button"
            >
              Export Excel
            </Button>
          )}
          {effectiveQueryId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              type="button"
            >
              Delete Lead
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Section 1: Top Bar (Dates & Dept) */}
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
                  className={
                    formErrors.salesPerson
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <ErrorMsg name="salesPerson" />
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
                <Label>Delivery Type *</Label>
                <select
                  value={clientDeliveryType}
                  onChange={(e) => setClientDeliveryType(e.target.value)}
                  className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${
                    formErrors.clientDeliveryType
                      ? "border-destructive"
                      : "border-input"
                  }`}
                >
                  <option value="" disabled>
                    Select Delivery Type
                  </option>
                  <option value="HOME">Home Delivery</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="INSTORE">In-Store</option>
                  <option value="LOCAL_PARCEL">Local Parcel</option>
                  <option value="JAY_AMBE">Jay Ambe Express Logistics</option>
                  <option value="MAA_BHAWANI">Maa Bhawani Logistics</option>
                  <option value="BVC">BVC Logistics</option>
                  <option value="SEQUEL">Sequel Logistics</option>
                </select>
                <ErrorMsg name="clientDeliveryType" />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className={
                    formErrors.orderDate
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <ErrorMsg name="orderDate" />
              </div>
              <div className="space-y-1">
                <Label>Transfer Dept</Label>
                <Input
                  value={transferDepartment}
                  onChange={(e) => setTransferDepartment(e.target.value)}
                  placeholder="e.g. Design Department"
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
                      className="h-10 w-10 object-cover rounded cursor-zoom-in hover:opacity-80 transition-opacity"
                      onClick={() => setIsImageZoomed(true)}
                    />
                    <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                      {referencePhoto ? referencePhoto.name : "Existing Photo"}
                    </span>
                    {referencePhoto && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-auto"
                        onClick={() => setReferencePhoto(null)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Client Details */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base text-primary">
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>Main Account</Label>
                <SearchableSelect
                  options={accounts.map((acc) => ({
                    value: String(acc.id),
                    label: acc.account_name,
                  }))}
                  value={accountId}
                  onChange={setAccountId}
                  placeholder="Select Account"
                />
                <ErrorMsg name="accountId" />
              </div>
              <div className="space-y-1">
                <Label>Sub Account</Label>
                {subAccountOptions.length > 0 ? (
                  <>
                    <SearchableSelect
                      options={subAccountOptions}
                      value={subAccountRecordId}
                      onChange={setSubAccountRecordId}
                      placeholder="Select a sub account"
                      disabled={!accountId}
                      emptyMessage={
                        loadingSubAccounts
                          ? "Loading..."
                          : "No sub-accounts available"
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Select from existing sub-accounts
                    </p>
                  </>
                ) : (
                  <Input
                    value={subAccount}
                    onChange={(e) => setSubAccount(e.target.value)}
                    placeholder="Enter sub-account name"
                    disabled={!accountId || loadingSubAccounts}
                  />
                )}
                {!accountId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Please select a main account first
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>PAN / Aadhaar Details *</Label>
                <Input
                  value={panGstin}
                  onChange={(e) => setPanGstin(e.target.value)}
                  placeholder="Enter PAN or Aadhaar number"
                  className={
                    formErrors.panGstin
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <ErrorMsg name="panGstin" />
              </div>
              <div className="space-y-1">
                <Label>Phone Number *</Label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91..."
                  className={
                    formErrors.phoneNumber
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <ErrorMsg name="phoneNumber" />
              </div>
              <div className="space-y-1">
                <Label>Email ID *</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className={
                    formErrors.email
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <ErrorMsg name="email" />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className={
                    formErrors.city
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <ErrorMsg name="city" />
              </div>
              <div className="space-y-1">
                <Label>Client Delivery Type *</Label>
                <select
                  value={clientDeliveryType}
                  onChange={(e) => setClientDeliveryType(e.target.value)}
                  className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${
                    formErrors.clientDeliveryType
                      ? "border-destructive"
                      : "border-input"
                  }`}
                >
                  <option value="" disabled>
                    Select Delivery Type
                  </option>
                  <option value="HOME">Home Delivery</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="INSTORE">In-Store</option>
                  <option value="LOCAL_PARCEL">Local Parcel</option>
                  <option value="JAY_AMBE">Jay Ambe Express Logistics</option>
                  <option value="MAA_BHAWANI">Maa Bhawani Logistics</option>
                  <option value="BVC">BVC Logistics</option>
                  <option value="SEQUEL">Sequel Logistics</option>
                </select>
                <ErrorMsg name="clientDeliveryType" />
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
                      <label
                        htmlFor={`src-${src}`}
                        className="text-sm font-medium leading-none"
                      >
                        {src}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Occasion & Intent */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base text-primary">
                Occasion & Intent
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-6">
              <div className="space-y-2">
                <Label>Occasion</Label>
                <div
                  className={`flex flex-wrap gap-4 p-2 rounded-md ${formErrors.occasion ? "border border-destructive bg-destructive/5" : ""}`}
                >
                  {OCCASIONS.map((occ) => (
                    <div key={occ} className="flex items-center space-x-2">
                      <Checkbox
                        id={`occ-${occ}`}
                        checked={occasion.includes(occ)}
                        onCheckedChange={() =>
                          toggleSelection(occasion, occ, setOccasion)
                        }
                      />
                      <label
                        htmlFor={`occ-${occ}`}
                        className="text-sm font-medium leading-none"
                      >
                        {occ}
                      </label>
                    </div>
                  ))}
                </div>
                <ErrorMsg name="occasion" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Required Delivery Date</Label>
                  <Input
                    type="date"
                    value={requiredDeliveryDate}
                    onChange={(e) => setRequiredDeliveryDate(e.target.value)}
                    className={
                      formErrors.requiredDeliveryDate
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                  <ErrorMsg name="requiredDeliveryDate" />
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
                <Label>Purpose of Purchase</Label>
                <div
                  className={`flex flex-wrap gap-4 p-2 rounded-md ${formErrors.purpose ? "border border-destructive bg-destructive/5" : ""}`}
                >
                  {PURPOSES.map((pur) => (
                    <div key={pur} className="flex items-center space-x-2">
                      <Checkbox
                        id={`pur-${pur}`}
                        checked={purpose.includes(pur)}
                        onCheckedChange={() =>
                          toggleSelection(purpose, pur, setPurpose)
                        }
                      />
                      <label
                        htmlFor={`pur-${pur}`}
                        className="text-sm font-medium leading-none"
                      >
                        {pur}
                      </label>
                    </div>
                  ))}
                </div>
                <ErrorMsg name="purpose" />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Jewellery Details */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base text-primary">
                Jewellery Details (Design Input)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-4">
              <div className="space-y-1">
                <Label>Jewellery Type *</Label>
                <select
                  value={jewelleryType}
                  onChange={(e) => setJewelleryType(e.target.value)}
                  className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${
                    formErrors.jewelleryType
                      ? "border-destructive"
                      : "border-input"
                  }`}
                >
                  <option value="" disabled>
                    Select jewellery type
                  </option>
                  {jewelleryTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ErrorMsg name="jewelleryType" />
              </div>
              <GoldQualityInput
                value={goldQuality}
                onChange={setGoldQuality}
                options={goldQualityOptions}
                placeholder="Enter custom value (e.g., 20KT, 23KT)"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Size Details</Label>
                  <Input
                    value={sizeDetails}
                    onChange={(e) => setSizeDetails(e.target.value)}
                    placeholder="Size info"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Fit Details</Label>
                  <Input
                    value={fitDetails}
                    onChange={(e) => setFitDetails(e.target.value)}
                    placeholder="Fit info"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Follow-up Log</Label>
                <Textarea
                  value={followUpLog}
                  onChange={(e) => setFollowUpLog(e.target.value)}
                  placeholder="Log details..."
                />
              </div>

              <div className="space-y-2">
                <Label>Style Preference</Label>
                <div className="flex flex-wrap gap-4">
                  {STYLE_PREFS.map((style) => (
                    <div key={style} className="flex items-center space-x-2">
                      <Checkbox
                        id={`style-${style}`}
                        checked={stylePref.includes(style)}
                        onCheckedChange={() =>
                          toggleSelection(stylePref, style, setStylePref)
                        }
                      />
                      <label
                        htmlFor={`style-${style}`}
                        className="text-sm font-medium leading-none"
                      >
                        {style}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Metal Preference *</Label>
                <div
                  className={`flex flex-wrap gap-4 p-2 rounded-md ${formErrors.metalPref ? "border border-destructive bg-destructive/5" : ""}`}
                >
                  {METAL_PREFS.map((metal) => (
                    <div key={metal} className="flex items-center space-x-2">
                      <Checkbox
                        id={`metal-${metal}`}
                        checked={metalPref.includes(metal)}
                        onCheckedChange={() =>
                          toggleSelection(metalPref, metal, setMetalPref)
                        }
                      />
                      <label
                        htmlFor={`metal-${metal}`}
                        className="text-sm font-medium leading-none"
                      >
                        {metal}
                      </label>
                    </div>
                  ))}
                </div>
                <ErrorMsg name="metalPref" />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Diamond / Gemstone */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base text-primary">
                Diamond / Gemstone Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Diamond Share/Pref</Label>
                  <Input
                    value={diamondShape}
                    onChange={(e) => setDiamondShape(e.target.value)}
                    placeholder="Shape"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Col / Cla</Label>
                  <Input
                    value={colCla}
                    onChange={(e) => setColCla(e.target.value)}
                    placeholder="Color/Clarity"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Origin</Label>
                  <Input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Origin"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Budget for Dia</Label>
                <Input
                  value={budgetDia}
                  onChange={(e) => setBudgetDia(e.target.value)}
                  placeholder="Amount"
                />
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
                      <label
                        htmlFor={`dp-${dp}`}
                        className="text-sm font-medium leading-none"
                      >
                        {dp}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Gemstone Pref</Label>
                  <Input
                    value={gemstonePref}
                    onChange={(e) => setGemstonePref(e.target.value)}
                    placeholder="Gemstone"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Col / Cla</Label>
                  <Input
                    value={gemColCla}
                    onChange={(e) => setGemColCla(e.target.value)}
                    placeholder="Color/Clarity"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Origin</Label>
                  <Input
                    value={gemOrigin}
                    onChange={(e) => setGemOrigin(e.target.value)}
                    placeholder="Origin"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Other Details</Label>
                <Input
                  value={otherDetails}
                  onChange={(e) => setOtherDetails(e.target.value)}
                  placeholder="..."
                />
              </div>
              <div className="space-y-1">
                <Label>Sample</Label>
                <Input
                  value={sample}
                  onChange={(e) => setSample(e.target.value)}
                  placeholder="Sample info"
                />
              </div>
              <div className="space-y-1">
                <Label>Attach Sample Photo (Optional)</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Check file size (5MB limit)
                      if (file.size > 5 * 1024 * 1024) {
                        toast({
                          variant: "destructive",
                          title: "File Too Large",
                          description:
                            "Please select an image smaller than 5MB.",
                        });
                        return;
                      }
                      setSamplePhoto(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSamplePhotoPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="cursor-pointer"
                />
                {(samplePhoto || samplePhotoPreview || existingSamplePhoto) && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 border rounded p-2 bg-muted/30">
                      <img
                        src={
                          samplePhotoPreview ||
                          (samplePhoto
                            ? URL.createObjectURL(samplePhoto)
                            : existingSamplePhoto!)
                        }
                        alt="Sample preview"
                        className="h-16 w-16 object-cover rounded cursor-zoom-in hover:opacity-80 transition-opacity"
                        onClick={() => setIsSampleImageZoomed(true)}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {samplePhoto
                            ? samplePhoto.name
                            : existingSamplePhoto
                              ? "Existing sample photo"
                              : "Sample photo"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {samplePhoto
                            ? `${(samplePhoto.size / 1024 / 1024).toFixed(2)} MB`
                            : ""}
                        </p>
                      </div>
                      {samplePhoto && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSamplePhoto(null);
                            setSamplePhotoPreview(null);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload a reference photo for the sample (JPG, PNG, GIF - Max
                  5MB)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Budget & Timeline */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base text-primary">
                Budget & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-4">
              <div className="space-y-1">
                <Label>Budget Range</Label>
                <Input
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  placeholder="Range"
                />
              </div>
              <div className="space-y-2">
                <Label>Urgency Level</Label>
                <div className="flex flex-wrap gap-4">
                  {URGENCY_LEVELS.map((u) => (
                    <div key={u} className="flex items-center space-x-2">
                      <Checkbox
                        id={`u-${u}`}
                        checked={urgencyLevel.includes(u)}
                        onCheckedChange={() =>
                          toggleSelection(urgencyLevel, u, setUrgencyLevel)
                        }
                      />
                      <label
                        htmlFor={`u-${u}`}
                        className="text-sm font-medium leading-none"
                      >
                        {u}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Notes */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base text-primary">
                Sales Person Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-4">
              <div className="space-y-1">
                <Label>Must-Have Elements</Label>
                <Textarea
                  value={mustHave}
                  onChange={(e) => setMustHave(e.target.value)}
                  placeholder="..."
                />
              </div>
              <div className="space-y-1">
                <Label>Must-Avoid Elements</Label>
                <Textarea
                  value={mustAvoid}
                  onChange={(e) => setMustAvoid(e.target.value)}
                  placeholder="..."
                />
              </div>
              <div className="space-y-1">
                <Label>Special Instructions</Label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 7.1: Workflow Information (Surfaced from Estimates/Sale) */}
          {(selectionNotes || saleNotes || saleBillNo || saleJobNo) && (
            <Card className="border-t-4 border-t-indigo-600 bg-indigo-50/30">
              <CardHeader className="pb-3 border-b bg-indigo-50">
                <CardTitle className="text-base text-indigo-900 flex items-center gap-2">
                  Workflow Information
                  <Badge
                    variant="outline"
                    className="bg-indigo-100 text-indigo-700 border-indigo-200"
                  >
                    System Surfaced
                  </Badge>
                </CardTitle>
                <CardDescription className="text-indigo-800/70">
                  Notes and details captured during the estimate selection and
                  sale process.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {selectionNotes && (
                    <div className="space-y-1">
                      <Label className="text-indigo-900 font-bold uppercase text-[10px]">
                        Selection Notes (Internal)
                      </Label>
                      <div className="p-3 rounded-md bg-white border border-indigo-100 text-sm shadow-sm italic text-gray-700">
                        {selectionNotes}
                      </div>
                    </div>
                  )}
                  {saleNotes && (
                    <div className="space-y-1">
                      <Label className="text-indigo-900 font-bold uppercase text-[10px]">
                        Sale Conversion Notes
                      </Label>
                      <div className="p-3 rounded-md bg-white border border-indigo-100 text-sm shadow-sm italic text-gray-700">
                        {saleNotes}
                      </div>
                    </div>
                  )}
                </div>

                {(saleBillNo || saleJobNo || amountWeight) && (
                  <div className="flex flex-wrap gap-6 pt-2 border-t border-indigo-100">
                    {amountWeight && (
                      <div className="space-y-0.5">
                        <Label className="text-indigo-900 font-bold uppercase text-[10px]">
                          Advance Captured
                        </Label>
                        <div className="text-lg font-mono font-bold text-indigo-700">
                          ₹{Number(amountWeight).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {saleBillNo && (
                      <div className="space-y-0.5">
                        <Label className="text-indigo-900 font-bold uppercase text-[10px]">
                          Bill Number
                        </Label>
                        <div className="text-lg font-mono font-bold text-indigo-700">
                          {saleBillNo}
                        </div>
                      </div>
                    )}
                    {saleJobNo && (
                      <div className="space-y-0.5">
                        <Label className="text-indigo-900 font-bold uppercase text-[10px]">
                          Job Number
                        </Label>
                        <div className="text-lg font-mono font-bold text-indigo-700">
                          {saleJobNo}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section 7.5: Follow-up Logs */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-base text-primary uppercase">
                Follow-up Log
              </CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={addFollowUpLog}
                variant="outline"
              >
                Add Log
              </Button>
            </CardHeader>
            <CardContent className="pt-4 overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-muted text-xs uppercase font-semibold">
                    <th className="border p-2 text-left w-32">Date</th>
                    <th className="border p-2 text-left w-48">Mode</th>
                    <th className="border p-2 text-left">Outcome</th>
                    <th className="border p-2 text-left">Next Action</th>
                    <th className="border p-2 text-left w-32">
                      Next Follow-up Date
                    </th>
                    <th className="border p-2 text-left">Comments</th>
                    <th className="border p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {followUpLogs.map((log, index) => (
                    <tr key={index}>
                      <td className="border p-1">
                        <Input
                          type="date"
                          value={log.date}
                          onChange={(e) =>
                            updateFollowUpLog(index, "date", e.target.value)
                          }
                          className="h-8 text-xs border-none focus-visible:ring-0 px-1"
                        />
                      </td>
                      <td className="border p-1">
                        <div className="flex flex-wrap gap-2 px-1">
                          {["CALL", "WHATSAPP", "VISIT"].map((mode) => (
                            <div
                              key={mode}
                              className="flex items-center space-x-1"
                            >
                              <input
                                type="checkbox"
                                id={`mode-${index}-${mode}`}
                                checked={log.mode === mode}
                                onChange={() =>
                                  updateFollowUpLog(index, "mode", mode)
                                }
                                className="h-3 w-3"
                              />
                              <label
                                htmlFor={`mode-${index}-${mode}`}
                                className="text-[10px] font-medium leading-none"
                              >
                                {mode}
                              </label>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="border p-1">
                        <Input
                          value={log.outcome}
                          onChange={(e) =>
                            updateFollowUpLog(index, "outcome", e.target.value)
                          }
                          className="h-8 text-xs border-none focus-visible:ring-0 px-1"
                          placeholder="Outcome"
                        />
                      </td>
                      <td className="border p-1">
                        <Input
                          value={log.next_action}
                          onChange={(e) =>
                            updateFollowUpLog(
                              index,
                              "next_action",
                              e.target.value
                            )
                          }
                          className="h-8 text-xs border-none focus-visible:ring-0 px-1"
                          placeholder="Next Action"
                        />
                      </td>
                      <td className="border p-1">
                        <Input
                          type="date"
                          value={log.next_follow_up_date}
                          onChange={(e) =>
                            updateFollowUpLog(
                              index,
                              "next_follow_up_date",
                              e.target.value
                            )
                          }
                          className="h-8 text-xs border-none focus-visible:ring-0 px-1"
                        />
                      </td>
                      <td className="border p-1">
                        <Input
                          value={log.comments}
                          onChange={(e) =>
                            updateFollowUpLog(index, "comments", e.target.value)
                          }
                          className="h-8 text-xs border-none focus-visible:ring-0 px-1"
                          placeholder="Comments"
                        />
                      </td>
                      <td className="border p-1 text-center">
                        {followUpLogs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={() => removeFollowUpLog(index)}
                          >
                            ×
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Section 8: Advance Handling (Second Image) */}
          <Card className="border-t-4 border-t-amber-800">
            <CardHeader className="pb-3 border-b bg-amber-50">
              <CardTitle className="text-base text-amber-900">
                Advance Handling (Only After Confirmation)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Advance Type</Label>
                  <Input
                    value={advanceType}
                    onChange={(e) => setAdvanceType(e.target.value)}
                    placeholder="Cash/Card/Etc"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Amount / Weight</Label>
                  <Input
                    value={amountWeight}
                    onChange={(e) => setAmountWeight(e.target.value)}
                    placeholder="Info"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Date Received</Label>
                <Input
                  type="date"
                  value={dateReceived}
                  onChange={(e) => setDateReceived(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rec_gen"
                    checked={receiptGenerated}
                    onCheckedChange={(c) => setReceiptGenerated(!!c)}
                  />
                  <Label htmlFor="rec_gen">Receipt Generated</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acc_not"
                    checked={accountsNotified}
                    onCheckedChange={(c) => setAccountsNotified(!!c)}
                  />
                  <Label htmlFor="acc_not">Accounts Notified</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="erp_done"
                    checked={erpEntryDone}
                    onCheckedChange={(c) => setErpEntryDone(!!c)}
                  />
                  <Label htmlFor="erp_done">ERP Entry Done</Label>
                </div>
              </div>

              <div className="flex items-center gap-4 border rounded p-3">
                <div className="flex items-center space-x-2 min-w-fit">
                  <Checkbox
                    id="gold_lock"
                    checked={goldRateLocked}
                    onCheckedChange={(c) => setGoldRateLocked(!!c)}
                  />
                  <Label htmlFor="gold_lock">Gold Rate Locked</Label>
                </div>
                {goldRateLocked && (
                  <div className="grid grid-cols-2 gap-2 flex-grow">
                    <Input
                      value={goldRateFixed}
                      onChange={(e) => setGoldRateFixed(e.target.value)}
                      placeholder="Fixed Rate"
                      className="h-8"
                    />
                    <Input
                      type="date"
                      value={goldRateDate}
                      onChange={(e) => setGoldRateDate(e.target.value)}
                      className="h-8"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Next Dept Triggered</Label>
                <div className="flex flex-wrap gap-4">
                  {NEXT_DEPT_OPTIONS.map((ndt) => (
                    <div key={ndt} className="flex items-center space-x-2">
                      <Checkbox
                        id={`ndt-${ndt}`}
                        checked={nextDeptTriggered.includes(ndt)}
                        onCheckedChange={() =>
                          toggleSelection(
                            nextDeptTriggered,
                            ndt,
                            setNextDeptTriggered
                          )
                        }
                      />
                      <label
                        htmlFor={`ndt-${ndt}`}
                        className="text-sm font-medium leading-none"
                      >
                        {ndt}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Verified By</Label>
                  <Input
                    value={verifiedBy}
                    onChange={(e) => setVerifiedBy(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Colour Stone Demand</Label>
                  <Input
                    value={colourStoneDemand}
                    onChange={(e) => setColourStoneDemand(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Raw Material Dept. Instructions</Label>
                <Textarea
                  value={rawMaterialInstructions}
                  onChange={(e) => setRawMaterialInstructions(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 9: Ledger & Dept Instructions */}
          <Card className="border-t-4 border-t-amber-800">
            <CardHeader className="pb-3 border-b bg-amber-50">
              <CardTitle className="text-base text-amber-900">
                Ledger & Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Ledger Entries
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLedgerRow}
                  >
                    + Add Row
                  </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 text-left font-medium">Date</th>
                        <th className="p-2 text-left font-medium">
                          Particulars
                        </th>
                        <th className="p-2 text-left font-medium">Gold</th>
                        <th className="p-2 text-left font-medium">Diamond</th>
                        <th className="p-2 text-left font-medium">Cash</th>
                        <th className="p-2 text-left font-medium">Narration</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerEntries.map((entry, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">
                            <Input
                              type="date"
                              value={entry.date}
                              onChange={(e) =>
                                updateLedgerEntry(index, "date", e.target.value)
                              }
                              className="h-8 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={entry.particulars}
                              onChange={(e) =>
                                updateLedgerEntry(
                                  index,
                                  "particulars",
                                  e.target.value
                                )
                              }
                              className="h-8 w-full"
                              placeholder="Item/Details"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={entry.gold}
                              onChange={(e) =>
                                updateLedgerEntry(index, "gold", e.target.value)
                              }
                              className="h-8 w-20"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={entry.diamond}
                              onChange={(e) =>
                                updateLedgerEntry(
                                  index,
                                  "diamond",
                                  e.target.value
                                )
                              }
                              className="h-8 w-20"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={entry.cash}
                              onChange={(e) =>
                                updateLedgerEntry(index, "cash", e.target.value)
                              }
                              className="h-8 w-24"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={entry.narration}
                              onChange={(e) =>
                                updateLedgerEntry(
                                  index,
                                  "narration",
                                  e.target.value
                                )
                              }
                              className="h-8 w-full"
                              placeholder="Notes"
                            />
                          </td>
                          <td className="p-2">
                            {ledgerEntries.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => removeLedgerRow(index)}
                              >
                                &times;
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-muted/20 font-semibold">
                        <td className="p-2" colSpan={2}>
                          Total
                        </td>
                        <td className="p-2">{ledgerTotals.gold.toFixed(2)}</td>
                        <td className="p-2">
                          {ledgerTotals.diamond.toFixed(2)}
                        </td>
                        <td className="p-2">{ledgerTotals.cash.toFixed(2)}</td>
                        <td className="p-2" colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-1">
                  <Label>Design Dept. Instructions</Label>
                  <Input
                    value={designDeptInstructions}
                    onChange={(e) => setDesignDeptInstructions(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Production Dept. Instructions</Label>
                  <Input
                    value={productionDeptInstructions}
                    onChange={(e) =>
                      setProductionDeptInstructions(e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Accounts Dept. Instructions</Label>
                  <Input
                    value={accountsDeptInstructions}
                    onChange={(e) =>
                      setAccountsDeptInstructions(e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Reminders</Label>
                  <Input
                    value={reminders}
                    onChange={(e) => setReminders(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 10: Rough Work & Final Design */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-t-4 border-t-amber-800">
              <CardHeader className="pb-3 border-b bg-amber-50">
                <CardTitle className="text-base text-amber-900">
                  Rough Work
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Textarea
                  value={roughWork}
                  onChange={(e) => setRoughWork(e.target.value)}
                  className="min-h-[200px]"
                />
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-amber-800">
              <CardHeader className="pb-3 border-b bg-amber-50">
                <CardTitle className="text-base text-amber-900">
                  Final Design
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Textarea
                  value={finalDesign}
                  onChange={(e) => setFinalDesign(e.target.value)}
                  className="min-h-[200px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Section 11: Delivery Notes */}
          <Card className="border-t-4 border-t-amber-800">
            <CardHeader className="pb-3 border-b bg-amber-50">
              <CardTitle className="text-base text-amber-900">
                Delivery Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 sticky bottom-4 bg-background p-4 border rounded shadow-lg">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            {effectiveQueryId && (
              <Button
                variant="default"
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleViewProcess}
                disabled={viewProcessLoading}
              >
                {viewProcessLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    View Process
                  </>
                )}
              </Button>
            )}
            {false && (
              <Button
                type="button"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
                onClick={async () => {
                  // Validation: Account and Jewellery Type are mandatory for estimate creation
                  if (!accountId || !jewelleryType) {
                    toast({
                      variant: "destructive",
                      title: "Missing Information",
                      description:
                        "Please select an Account and Jewellery Type before creating an estimate.",
                    });
                    return;
                  }

                  // Save current state - get subaccount name from selected option
                  const selectedSubAccountOption = subAccountOptions.find(
                    (opt) => opt.value === subAccountRecordId
                  );
                  const subAccountNameValue = selectedSubAccountOption
                    ? selectedSubAccountOption.label.replace(/\s*\(.*\)$/, "")
                    : subAccount;

                  const currentValues = {
                    salesPerson,
                    vendor,
                    transferDepartment,
                    orderDate,
                    accountId,
                    subAccountRecordId,
                    subAccountName: subAccountNameValue,
                    subAccount,
                    phoneNumber,
                    email,
                    city,
                    clientDeliveryType,
                    panGstin,
                    refSource,
                    occasion,
                    requiredDeliveryDate,
                    stockInDeadline,
                    purpose,
                    jewelleryType,
                    goldQuality,
                    sizeDetails,
                    fitDetails,
                    followUpLog,
                    stylePref,
                    metalPref,
                    diamondShape,
                    colCla,
                    origin,
                    budgetDia,
                    diamondPriority,
                    sample,
                    gemstonePref,
                    gemColCla,
                    gemOrigin,
                    otherDetails,
                    budgetRange,
                    urgencyLevel,
                    mustHave,
                    mustAvoid,
                    specialInstructions,
                    // Advance Handling & other sections
                    advanceType,
                    amountWeight,
                    dateReceived,
                    receiptGenerated,
                    accountsNotified,
                    goldRateLocked,
                    goldRateFixed,
                    goldRateDate,
                    erpEntryDone,
                    nextDeptTriggered,
                    verifiedBy,
                    colourStoneDemand,
                    rawMaterialInstructions,
                    ledgerEntries,
                    designDeptInstructions,
                    productionDeptInstructions,
                    accountsDeptInstructions,
                    reminders,
                    roughWork,
                    finalDesign,
                    deliveryNotes,
                    selectionNotes,
                    saleNotes,
                    saleBillNo,
                  };
                  sessionStorage.setItem(
                    "temp_query_form_data",
                    JSON.stringify(currentValues)
                  );

                  // Construct params for estimate prefill
                  const params = new URLSearchParams();
                  params.set("return_to", "/vouchers/sales-leads/new"); // Using common route base

                  if (accountId) params.set("account_id", accountId);
                  const accLabel = accounts.find(
                    (a) => String(a.id) === String(accountId)
                  )?.account_name;
                  if (accLabel) params.set("account_name", accLabel);

                  // Pass subaccount and gold quality for pre-filling
                  if (subAccountRecordId) {
                    params.set("sub_account_record_id", subAccountRecordId);
                    // Also pass the name for display
                    const selectedSubAccount = subAccountOptions.find(
                      (opt) => opt.value === subAccountRecordId
                    );
                    if (selectedSubAccount) {
                      const subAccountName = selectedSubAccount.label.replace(
                        /\s*\(.*\)$/,
                        ""
                      ); // Remove phone from label
                      params.set("sub_account_name", subAccountName);
                    }
                  } else if (subAccount) {
                    // Fallback to name if ID not available
                    params.set("sub_account", subAccount);
                    params.set("sub_account_name", subAccount);
                  }
                  if (goldQuality) params.set("gold_quality", goldQuality);

                  if (jewelleryType) params.set("jewelry_type", jewelleryType);
                  if (sizeDetails) params.set("size_details", sizeDetails);

                  // Pass sales person name for estimate PDF
                  if (salesPerson) {
                    params.set("sales_person_name", salesPerson);
                  }

                  router.push(`/vouchers/estimates/new?${params.toString()}`);
                }}
              >
                Create Estimate & Link
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? "Saving..." : "Save Complete Query"}
            </Button>
          </div>
        </div>
      </form>

      {/* Image Zoom Modal */}
      {isImageZoomed && (referencePhoto || existingPhoto) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-all animate-in fade-in duration-200"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              className="absolute top-0 right-0 m-4 text-white hover:bg-white/20 h-10 w-10 rounded-full text-xl"
              onClick={() => setIsImageZoomed(false)}
            >
              ×
            </Button>
            <img
              src={
                referencePhoto
                  ? URL.createObjectURL(referencePhoto)
                  : existingPhoto!
              }
              alt="Zoomed Reference"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            />
          </div>
        </div>
      )}

      {/* Sample Photo Zoom Modal */}
      {isSampleImageZoomed &&
        (samplePhoto || samplePhotoPreview || existingSamplePhoto) && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-all animate-in fade-in duration-200"
            onClick={() => setIsSampleImageZoomed(false)}
          >
            <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
              <Button
                variant="ghost"
                className="absolute top-0 right-0 m-4 text-white hover:bg-white/20 h-10 w-10 rounded-full text-xl"
                onClick={() => setIsSampleImageZoomed(false)}
              >
                ×
              </Button>
              <img
                src={
                  samplePhotoPreview ||
                  (samplePhoto
                    ? URL.createObjectURL(samplePhoto)
                    : existingSamplePhoto!)
                }
                alt="Zoomed Sample Photo"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              />
            </div>
          </div>
        )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RawMaterialNav } from "@/components/raw-material/RawMaterialNav";
import { MasterDataDropdown } from "@/components/master-data/MasterDataDropdown";
import {
  rawMaterialPurchaseCreate,
  accountsDropdown,
  vouchersMasters,
  vouchersShapes,
  ordersDropdown,
  getLiveRates,
  metalTypesList,
  originsList,
  gemstoneTypesList,
  gemstoneColorsList,
  gemstoneTreatmentsList,
  cutsList,
  polishesList,
  symmetriesList,
  sizesList,
  shapesList,
  claritiesList,
  labsList,
  goldCaratsList,
} from "@/lib/backend";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function RawMaterialPurchaseNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Master data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  const [shapes, setShapes] = useState<any[]>([]);
  const [colours, setColours] = useState<any[]>([]);
  const [clarities, setClarities] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [origins, setOrigins] = useState<any[]>([]);
  const [gemstoneTypes, setGemstoneTypes] = useState<any[]>([]);
  const [gemstoneColors, setGemstoneColors] = useState<any[]>([]);
  const [gemstoneTreatments, setGemstoneTreatments] = useState<any[]>([]);
  const [cuts, setCuts] = useState<any[]>([]);
  const [polishes, setPolishes] = useState<any[]>([]);
  const [symmetries, setSymmetries] = useState<any[]>([]);
  const [goldCarats, setGoldCarats] = useState<any[]>([]);

  // Loading states for dropdowns
  const [sizesLoading, setSizesLoading] = useState(false);
  const [shapesLoading, setShapesLoading] = useState(false);
  const [claritiesLoading, setClaritiesLoading] = useState(false);
  const [labsLoading, setLabsLoading] = useState(false);
  const [coloursLoading, setColoursLoading] = useState(false);
  const [goldCaratsLoading, setGoldCaratsLoading] = useState(false);
  const [cutsLoading, setCutsLoading] = useState(false);
  const [polishesLoading, setPolishesLoading] = useState(false);
  const [symmetriesLoading, setSymmetriesLoading] = useState(false);
  const [originsLoading, setOriginsLoading] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    supplierId: "",
    materialType: "",
    orderId: "",
    orderIdManual: "",
    isStockPurchase: true,
    shapeId: "",
    carat: "",
    numberOfPieces: "",
    colourId: "",
    colourAdditional: "",
    clarityId: "",
    cut: "",
    sizeId: "",
    originId: "",
    pol: "",
    sym: "",
    fluorescence: "", // Changed from flouro to fluorescence (text box)
    labId: "",
    certNo: "",
    additionalDetails: "",
    dimensionLength: "",
    dimensionWidth: "",
    dimensionHeight: "",
    sieveSize: "",
    rap: "",
    discount: "",
    pricePerCtUsd: "",
    exchangeRate: "",
    purchaseBudgetTotal: "",
    suggestedSupplierId: "",
    gemstoneTypeId: "",
    gemstoneColor: "",
    gemstoneTreatment: "",
    // Metal fields (Gold, Silver, Platinum)
    metalWeightGrams: "",
    metalPurity: "",
    ktValue: "",
    pricePerGram: "",
    totalMetalValue: "",
  });

  // Helper to get selected material type name
  const selectedMaterialTypeName = useMemo(() => {
    const selected = materialTypes.find((mt) => mt.id === form.materialType);
    return selected?.name || "";
  }, [form.materialType, materialTypes]);

  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(
    null
  );

  // Live rates state
  const [liveRates, setLiveRates] = useState<{
    gold?: {
      price_per_gram_24k: number;
      price_per_gram_22k: number;
      price_per_gram_18k: number;
    };
    silver?: { price_per_gram: number };
    platinum?: { price_per_gram: number };
    exchange_rate?: { usd_to_inr: number };
  }>({});

  // Order validation state
  const [orderValidation, setOrderValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid";
    message: string;
    orderDetails?: any;
  }>({ status: "idle", message: "" });

  // Auto-calculated fields
  const pricePerCtInr = useMemo(() => {
    const priceUsd = parseFloat(form.pricePerCtUsd) || 0;
    const rate = parseFloat(form.exchangeRate) || 0;
    return priceUsd * rate;
  }, [form.pricePerCtUsd, form.exchangeRate]);

  const total = useMemo(() => {
    const caratVal = parseFloat(form.carat) || 0;
    return caratVal * pricePerCtInr;
  }, [form.carat, pricePerCtInr]);

  // Auto-calculate metal price and total value
  useEffect(() => {
    if (
      selectedMaterialTypeName === "Gold" ||
      selectedMaterialTypeName === "Silver" ||
      selectedMaterialTypeName === "Platinum"
    ) {
      const weight = parseFloat(form.metalWeightGrams) || 0;
      let pricePerGram = 0;

      if (selectedMaterialTypeName === "Gold") {
        const ktVal = parseInt(form.ktValue) || 24;
        if (ktVal === 24)
          pricePerGram = liveRates.gold?.price_per_gram_24k || 0;
        else if (ktVal === 22)
          pricePerGram = liveRates.gold?.price_per_gram_22k || 0;
        else if (ktVal === 18)
          pricePerGram = liveRates.gold?.price_per_gram_18k || 0;
      } else if (selectedMaterialTypeName === "Silver") {
        pricePerGram = liveRates.silver?.price_per_gram || 0;
      } else if (selectedMaterialTypeName === "Platinum") {
        pricePerGram = liveRates.platinum?.price_per_gram || 0;
      }

      const totalValue = weight * pricePerGram;

      setForm((f) => ({
        ...f,
        pricePerGram: pricePerGram.toFixed(2),
        totalMetalValue: totalValue.toFixed(2),
      }));
    }
  }, [
    selectedMaterialTypeName,
    form.metalWeightGrams,
    form.ktValue,
    liveRates,
  ]);

  // Auto-populate exchange rate for Diamond purchases
  useEffect(() => {
    if (liveRates.exchange_rate?.usd_to_inr && !form.exchangeRate) {
      setForm((f) => ({
        ...f,
        exchangeRate: liveRates.exchange_rate.usd_to_inr.toFixed(2),
      }));
    }
  }, [liveRates.exchange_rate, form.exchangeRate]);

  // Load master data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [
          suppliersResp,
          mastersResp,
          shapesResp,
          ordersResp,
          liveRatesResp,
          metalTypesResp,
          originsResp,
          gemstoneTypesResp,
          gemstoneColorsResp,
          gemstoneTreatmentsResp,
          cutsResp,
          polishesResp,
          symmetriesResp,
          sizesResp,
          shapesMasterResp,
          claritiesResp,
          labsResp,
          goldCaratsResp,
        ] = await Promise.all([
          accountsDropdown(),
          vouchersMasters(),
          vouchersShapes(),
          ordersDropdown(),
          getLiveRates().catch(() => ({})), // Gracefully handle live rates failure
          metalTypesList().catch(() => []), // Load material types
          originsList().catch(() => []), // Load origins
          gemstoneTypesList().catch(() => []), // Load gemstone types
          gemstoneColorsList().catch(() => []), // Load gemstone colors
          gemstoneTreatmentsList().catch(() => []), // Load gemstone treatments
          cutsList().catch(() => []), // Load cuts
          polishesList().catch(() => []), // Load polishes
          symmetriesList().catch(() => []), // Load symmetries
          sizesList().catch(() => []), // Load sizes from master
          shapesList().catch(() => []), // Load shapes from master
          claritiesList().catch(() => []), // Load clarities from master
          labsList().catch(() => []), // Load labs from master
          goldCaratsList().catch(() => []), // Load gold carats from master
        ]);
        if (!mounted) return;
        setSuppliers(suppliersResp ?? []);
        setMaterialTypes(metalTypesResp ?? []);
        setShapes(shapesMasterResp ?? []);
        setColours(gemstoneColorsResp ?? []);
        setClarities(claritiesResp ?? []);
        setLabs(labsResp ?? []);
        setOrders(ordersResp?.orders ?? []);
        setSizes(sizesResp ?? []);
        setLiveRates(liveRatesResp ?? {});
        setOrigins(originsResp ?? []);
        setGemstoneTypes(gemstoneTypesResp ?? []);
        setGemstoneColors(gemstoneColorsResp ?? []);
        setGemstoneTreatments(gemstoneTreatmentsResp ?? []);
        setCuts(cutsResp ?? []);
        setPolishes(polishesResp ?? []);
        setSymmetries(symmetriesResp ?? []);
        setGoldCarats(goldCaratsResp ?? []);

        // Log live rates for debugging
        console.log("Live Rates Loaded:", liveRatesResp);
        console.log("Material Types Loaded:", metalTypesResp);
        console.log("Sizes Loaded:", sizesResp);
        console.log("Shapes Loaded:", shapesMasterResp);
        console.log("Clarities Loaded:", claritiesResp);
        console.log("Labs Loaded:", labsResp);
        console.log("Colours (Gemstone Colors) Loaded:", gemstoneColorsResp);
        console.log("Gold Carats Loaded:", goldCaratsResp);
      } catch (err) {
        toast({ variant: "destructive", title: "Could not load master data" });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProofImage(file);

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProofImagePreview(null);
    }
  };

  const clearFile = () => {
    setProofImage(null);
    setProofImagePreview(null);
  };

  // Validate order ID by checking against orders list
  const validateOrderId = async (orderIdInput: string) => {
    if (!orderIdInput || orderIdInput.trim() === "") {
      setOrderValidation({ status: "idle", message: "" });
      return;
    }

    setOrderValidation({ status: "validating", message: "Checking..." });

    // Search in loaded orders list
    const foundOrder = orders.find(
      (o: any) =>
        o.bill_no?.toLowerCase() === orderIdInput.toLowerCase() ||
        o.job_no?.toLowerCase() === orderIdInput.toLowerCase() ||
        o.id === orderIdInput
    );

    if (foundOrder) {
      setOrderValidation({
        status: "valid",
        message: `✓ Order ${foundOrder.bill_no || foundOrder.job_no} confirmed`,
        orderDetails: foundOrder,
      });
      // Set the actual order ID
      setForm((f) => ({ ...f, orderId: foundOrder.id }));
    } else {
      setOrderValidation({
        status: "invalid",
        message: "✗ Order ID not found. Please check and re-enter",
      });
      setForm((f) => ({ ...f, orderId: "" }));
    }
  };

  // Debounced validation
  useEffect(() => {
    if (!form.isStockPurchase && form.orderIdManual) {
      const timer = setTimeout(() => {
        validateOrderId(form.orderIdManual);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setOrderValidation({ status: "idle", message: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.orderIdManual, form.isStockPurchase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validation
    if (!form.supplierId) {
      toast({ variant: "destructive", title: "Please select a supplier" });
      setSubmitting(false);
      return;
    }
    if (!form.materialType) {
      toast({ variant: "destructive", title: "Please select a material type" });
      setSubmitting(false);
      return;
    }
    if (!form.isStockPurchase && !form.orderId) {
      toast({
        variant: "destructive",
        title: "Please enter a valid Order ID for job-linked purchase",
      });
      setSubmitting(false);
      return;
    }
    if (!form.isStockPurchase && orderValidation.status !== "valid") {
      toast({
        variant: "destructive",
        title: "Order ID validation failed",
        description: "Please enter a valid order ID",
      });
      setSubmitting(false);
      return;
    }

    if (selectedMaterialTypeName === "Diamond") {
      if (!form.shapeId) {
        toast({ variant: "destructive", title: "Please select a shape" });
        setSubmitting(false);
        return;
      }
      if (!form.carat || parseFloat(form.carat) <= 0) {
        toast({
          variant: "destructive",
          title: "Please enter valid carat weight",
        });
        setSubmitting(false);
        return;
      }
    }

    if (selectedMaterialTypeName === "Gemstone") {
      if (!form.gemstoneTypeId) {
        toast({
          variant: "destructive",
          title: "Please select a gemstone type",
        });
        setSubmitting(false);
        return;
      }
      if (!form.carat || parseFloat(form.carat) <= 0) {
        toast({
          variant: "destructive",
          title: "Please enter valid carat weight",
        });
        setSubmitting(false);
        return;
      }
    }

    if (
      selectedMaterialTypeName === "Gold" ||
      selectedMaterialTypeName === "Silver" ||
      selectedMaterialTypeName === "Platinum"
    ) {
      if (!form.metalWeightGrams || parseFloat(form.metalWeightGrams) <= 0) {
        toast({
          variant: "destructive",
          title: "Please enter valid weight in grams",
        });
        setSubmitting(false);
        return;
      }
    }

    const formData = new FormData();

    // Basic fields - always required
    if (form.date) formData.append("date", form.date);
    if (form.supplierId) formData.append("supplier_id", form.supplierId);
    if (form.materialType)
      formData.append("material_type_id", form.materialType);
    if (!form.isStockPurchase && form.orderId)
      formData.append("order_id", form.orderId);

    if (selectedMaterialTypeName === "Diamond") {
      if (form.shapeId) formData.append("shape_id", form.shapeId);
      if (form.carat) formData.append("carat", form.carat);
      if (form.numberOfPieces)
        formData.append("diamond_number_of_pieces", form.numberOfPieces);
      if (form.colourId) formData.append("colour_id", form.colourId);
      if (form.colourAdditional)
        formData.append("color_additional_info", form.colourAdditional);
      if (form.clarityId) formData.append("clarity_id", form.clarityId);
      if (form.cut) formData.append("cut", form.cut);
      if (form.pol) formData.append("pol", form.pol);
      if (form.sym) formData.append("sym", form.sym);
      if (form.sizeId) formData.append("master_size", form.sizeId);
      if (form.originId) formData.append("origin_type", form.originId);
      if (form.fluorescence) formData.append("fluorescence", form.fluorescence); // Text box field
      if (form.labId) formData.append("lab_id", form.labId);
      if (form.certNo) formData.append("cert_no", form.certNo);
      if (form.additionalDetails)
        formData.append("diamond_additional_details", form.additionalDetails);
      if (form.sieveSize) formData.append("sieve_size", form.sieveSize);
      if (form.dimensionLength)
        formData.append("cut_length", form.dimensionLength);
      if (form.dimensionWidth)
        formData.append("cut_width", form.dimensionWidth);
      if (form.dimensionHeight)
        formData.append("cut_height", form.dimensionHeight);
      if (form.purchaseBudgetTotal)
        formData.append("purchase_budget_total", form.purchaseBudgetTotal);
      if (form.suggestedSupplierId)
        formData.append("suggested_supplier", form.suggestedSupplierId);
      if (form.rap) formData.append("rap", form.rap);
      if (form.discount) formData.append("discount", form.discount);
      if (form.pricePerCtUsd)
        formData.append("price_per_ct_usd", form.pricePerCtUsd);
      if (form.exchangeRate)
        formData.append("exchange_rate", form.exchangeRate);
    }

    if (selectedMaterialTypeName === "Gemstone") {
      if (form.gemstoneTypeId)
        formData.append("gemstone_type", form.gemstoneTypeId);
      if (form.shapeId) formData.append("gemstone_shape", form.shapeId);
      if (form.carat) formData.append("gemstone_carat_weight", form.carat);
      if (form.numberOfPieces)
        formData.append("gemstone_number_of_pieces", form.numberOfPieces);
      if (form.gemstoneColor)
        formData.append("gemstone_color", form.gemstoneColor);
      if (form.clarityId) formData.append("gemstone_clarity", form.clarityId);
      if (form.gemstoneTreatment)
        formData.append("gemstone_treatment", form.gemstoneTreatment);
      if (form.cut) formData.append("gemstone_cut", form.cut);
      if (form.sizeId) formData.append("gemstone_size", form.sizeId);
      if (form.originId) formData.append("origin_type", form.originId);
      if (form.labId) formData.append("gemstone_lab", form.labId);
      if (form.certNo)
        formData.append("gemstone_certificate_number", form.certNo);
      if (form.additionalDetails)
        formData.append("gemstone_additional_details", form.additionalDetails);
      if (form.sieveSize) formData.append("gemstone_size_mm", form.sieveSize);
      if (form.dimensionLength)
        formData.append("cut_length", form.dimensionLength);
      if (form.dimensionWidth)
        formData.append("cut_width", form.dimensionWidth);
      if (form.dimensionHeight)
        formData.append("cut_height", form.dimensionHeight);
      if (form.purchaseBudgetTotal)
        formData.append(
          "gemstone_purchase_budget_total",
          form.purchaseBudgetTotal
        );
      if (form.suggestedSupplierId)
        formData.append(
          "gemstone_suggested_supplier",
          form.suggestedSupplierId
        );
    }

    if (
      selectedMaterialTypeName === "Gold" ||
      selectedMaterialTypeName === "Silver" ||
      selectedMaterialTypeName === "Platinum"
    ) {
      // Metal-specific fields
      if (form.metalWeightGrams)
        formData.append("metal_weight_grams", form.metalWeightGrams);
      if (form.metalPurity) formData.append("metal_purity", form.metalPurity);
      if (form.ktValue) formData.append("kt_value", form.ktValue);
      if (form.pricePerGram)
        formData.append("price_per_gram", form.pricePerGram);
      if (form.totalMetalValue)
        formData.append("total_metal_value", form.totalMetalValue);
    }

    if (proofImage) formData.append("proof_image", proofImage);

    try {
      console.log(
        "Submitting form data for material type:",
        selectedMaterialTypeName
      );
      await rawMaterialPurchaseCreate(formData);
      toast({
        title: "Purchase created",
        description: "Raw material purchase saved successfully.",
      });
      router.push("/raw-material-purchase/inventory");
      router.refresh();
    } catch (err: unknown) {
      let message = "Could not create purchase";
      if (err instanceof ApiError) {
        message = err.message || message;
        console.error("API Error details:", err);
      } else if (err && typeof err === "object" && (err as any).message) {
        message = (err as any).message;
      }
      console.error("Full error object:", err);
      toast({ variant: "destructive", title: "Error", description: message });
      console.error("raw material purchase create error", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Add Raw Material Purchase
          </h1>
          <p className="text-muted-foreground">
            Create a new diamond purchase entry.
          </p>
        </div>
        <RawMaterialNav />
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Raw Material Purchase Form</CardTitle>
          <CardDescription>
            Fill in the diamond purchase details below. Fields marked with * are
            required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Purchase Type Selection */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Purchase Type
              </h2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="purchaseType"
                    checked={form.isStockPurchase}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        isStockPurchase: true,
                        orderId: "",
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Stock Purchase</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="purchaseType"
                    checked={!form.isStockPurchase}
                    onChange={() =>
                      setForm((f) => ({ ...f, isStockPurchase: false }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">
                    Job-Linked Purchase
                  </span>
                </label>
              </div>
            </section>

            {/* Row 1: Date & Supplier */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Basic Information
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <select
                    id="supplier"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={form.supplierId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, supplierId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.account_name || s.name || s.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Row 2: Order ID & DIA. ID */}
            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orderId">
                    Order ID {!form.isStockPurchase && "*"}
                  </Label>
                  {form.isStockPurchase ? (
                    <Input
                      id="orderId"
                      value="Auto-generated on save (P0001, P0002…)"
                      disabled
                      className="bg-muted"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Input
                        id="orderId"
                        type="text"
                        placeholder="Enter Order ID (e.g., NSJ-0102)"
                        value={form.orderIdManual}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm((f) => ({ ...f, orderIdManual: value }));
                        }}
                        required
                        className={
                          orderValidation.status === "valid"
                            ? "border-green-500"
                            : orderValidation.status === "invalid"
                              ? "border-red-500"
                              : ""
                        }
                      />
                      {orderValidation.status === "validating" && (
                        <p className="text-xs text-muted-foreground">
                          {orderValidation.message}
                        </p>
                      )}
                      {orderValidation.status === "valid" && (
                        <p className="text-xs text-green-600 font-medium">
                          {orderValidation.message}
                        </p>
                      )}
                      {orderValidation.status === "invalid" && (
                        <p className="text-xs text-red-600 font-medium">
                          {orderValidation.message}
                        </p>
                      )}
                    </div>
                  )}
                  {form.isStockPurchase && (
                    <p className="text-xs text-muted-foreground">
                      A sequential Purchase ID (P0001, P0002…) is generated
                      automatically on save
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diaId">DIA. ID</Label>
                  <Input
                    id="diaId"
                    value="Auto-generated by ERP"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Will be generated automatically on save
                  </p>
                </div>
              </div>
            </section>

            {/* Material Type Selection */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Material Type
              </h2>

              <div className="space-y-2">
                <Label htmlFor="materialType">Material Type *</Label>
                <select
                  id="materialType"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.materialType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, materialType: e.target.value }))
                  }
                  required
                >
                  <option value="">
                    Select material type (Diamond, Gemstone, Metal, etc.)
                  </option>
                  {materialTypes.map((mt: any) => (
                    <option key={mt.id} value={mt.id}>
                      {mt.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Select the type of raw material being purchased.
                </p>
              </div>
            </section>

            {selectedMaterialTypeName === "Diamond" && (
              <>
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Diamond Specifications
                  </h2>

                  {/* Row 1: Master Size, Origin, Shape, Carat Weight */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="size">Master Size</Label>
                      <select
                        id="size"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.sizeId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, sizeId: e.target.value }))
                        }
                        disabled={sizesLoading}
                      >
                        <option value="">Select size</option>
                        {sizesLoading ? (
                          <option disabled>Loading...</option>
                        ) : sizes.length === 0 ? (
                          <option disabled>No sizes available</option>
                        ) : (
                          sizes.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))
                        )}
                      </select>
                      {sizes.length === 0 && !sizesLoading && (
                        <p className="text-xs text-muted-foreground">
                          No sizes available. Please add sizes in master data.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin</Label>
                      <select
                        id="origin"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.originId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, originId: e.target.value }))
                        }
                        disabled={originsLoading}
                      >
                        <option value="">Select origin</option>
                        {originsLoading ? (
                          <option disabled>Loading...</option>
                        ) : origins.length === 0 ? (
                          <option disabled>No origins available</option>
                        ) : (
                          origins.map((o: any) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))
                        )}
                      </select>
                      {origins.length === 0 && !originsLoading && (
                        <p className="text-xs text-muted-foreground">
                          No origins available. Please add origins in master
                          data.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shape">Shape *</Label>
                      <select
                        id="shape"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.shapeId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, shapeId: e.target.value }))
                        }
                        required
                        disabled={shapesLoading}
                      >
                        <option value="">Select shape</option>
                        {shapesLoading ? (
                          <option disabled>Loading...</option>
                        ) : shapes.length === 0 ? (
                          <option disabled>No shapes available</option>
                        ) : (
                          shapes.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))
                        )}
                      </select>
                      {shapes.length === 0 && !shapesLoading && (
                        <p className="text-xs text-red-600">
                          No shapes available. Please add shapes in master data.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carat">Carat Weight</Label>
                      <Input
                        id="carat"
                        type="text"
                        placeholder="000.000"
                        value={form.carat}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, carat: e.target.value }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Format must be: 000.000
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Number of Pieces, Color, Clarity */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="numberOfPieces">Number of pieces</Label>
                      <Input
                        id="numberOfPieces"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        value={form.numberOfPieces}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            numberOfPieces: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="colour">Color</Label>
                      <select
                        id="colour"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.colourId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, colourId: e.target.value }))
                        }
                        disabled={coloursLoading}
                      >
                        <option value="">Select colour</option>
                        {coloursLoading ? (
                          <option disabled>Loading...</option>
                        ) : colours.length === 0 ? (
                          <option disabled>No colours available</option>
                        ) : (
                          colours.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))
                        )}
                      </select>
                      {colours.length === 0 && !coloursLoading && (
                        <p className="text-xs text-muted-foreground">
                          No colours available. Please add colours in master
                          data.
                        </p>
                      )}
                      <Input
                        type="text"
                        placeholder="Additional color info"
                        value={form.colourAdditional}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            colourAdditional: e.target.value,
                          }))
                        }
                        className="mt-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clarity">Clarity</Label>
                      <select
                        id="clarity"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.clarityId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, clarityId: e.target.value }))
                        }
                        disabled={claritiesLoading}
                      >
                        <option value="">Select clarity</option>
                        {claritiesLoading ? (
                          <option disabled>Loading...</option>
                        ) : clarities.length === 0 ? (
                          <option disabled>No clarities available</option>
                        ) : (
                          clarities.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))
                        )}
                      </select>
                      {clarities.length === 0 && !claritiesLoading && (
                        <p className="text-xs text-muted-foreground">
                          No clarities available. Please add clarities in master
                          data.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Lab, Certificate Number, Additional Details */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="lab">Lab</Label>
                      <select
                        id="lab"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.labId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, labId: e.target.value }))
                        }
                        disabled={labsLoading}
                      >
                        <option value="">Select lab</option>
                        {labsLoading ? (
                          <option disabled>Loading...</option>
                        ) : labs.length === 0 ? (
                          <option disabled>No labs available</option>
                        ) : (
                          labs.map((l: any) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))
                        )}
                      </select>
                      {labs.length === 0 && !labsLoading && (
                        <p className="text-xs text-muted-foreground">
                          No labs available. Please add labs in master data.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certNo">Certificate Number</Label>
                      <Input
                        id="certNo"
                        placeholder="Enter certificate number"
                        value={form.certNo}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, certNo: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="additionalDetails">
                        Additional Details
                      </Label>
                      <Input
                        id="additionalDetails"
                        placeholder="Enter additional details"
                        value={form.additionalDetails}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            additionalDetails: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Row 4: Cut, POL, SYM */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="cut">Cut</Label>
                      <select
                        id="cut"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.cut}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, cut: e.target.value }))
                        }
                        disabled={cutsLoading}
                      >
                        <option value="">Select cut</option>
                        {cutsLoading ? (
                          <option disabled>Loading...</option>
                        ) : cuts.length === 0 ? (
                          <option disabled>No cuts available</option>
                        ) : (
                          cuts.map((cut) => (
                            <option key={cut.id} value={cut.id}>
                              {cut.name}
                            </option>
                          ))
                        )}
                      </select>
                      {cuts.length === 0 && !cutsLoading && (
                        <p className="text-xs text-muted-foreground">
                          No cuts available. Please add cuts in master data.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pol">POL (Polish)</Label>
                      <select
                        id="pol"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.pol}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, pol: e.target.value }))
                        }
                        disabled={polishesLoading}
                      >
                        <option value="">Select polish</option>
                        {polishesLoading ? (
                          <option disabled>Loading...</option>
                        ) : polishes.length === 0 ? (
                          <option disabled>No polishes available</option>
                        ) : (
                          polishes.map((pol) => (
                            <option key={pol.id} value={pol.id}>
                              {pol.name}
                            </option>
                          ))
                        )}
                      </select>
                      {polishes.length === 0 && !polishesLoading && (
                        <p className="text-xs text-muted-foreground">
                          No polishes available. Please add polishes in master
                          data.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sym">SYM (Symmetry)</Label>
                      <select
                        id="sym"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.sym}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, sym: e.target.value }))
                        }
                        disabled={symmetriesLoading}
                      >
                        <option value="">Select symmetry</option>
                        {symmetriesLoading ? (
                          <option disabled>Loading...</option>
                        ) : symmetries.length === 0 ? (
                          <option disabled>No symmetries available</option>
                        ) : (
                          symmetries.map((sym) => (
                            <option key={sym.id} value={sym.id}>
                              {sym.name}
                            </option>
                          ))
                        )}
                      </select>
                      {symmetries.length === 0 && !symmetriesLoading && (
                        <p className="text-xs text-muted-foreground">
                          No symmetries available. Please add symmetries in
                          master data.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Size, Fluorescence */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sieveSize">Size</Label>
                      <Input
                        id="sieveSize"
                        type="text"
                        placeholder="Enter size"
                        value={form.sieveSize}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, sieveSize: e.target.value }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        (Sieve size)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fluorescence">Fluorescence</Label>
                      <Input
                        id="fluorescence"
                        type="text"
                        placeholder="Enter fluorescence (e.g., None, Faint, Medium Blue)"
                        value={form.fluorescence}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            fluorescence: e.target.value,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Free text input for fluorescence details
                      </p>
                    </div>
                  </div>

                  {/* Row 6: Dimensions (Length, Width, Height) */}
                  <div className="space-y-2">
                    <Label>Dimensions</Label>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input
                        type="text"
                        placeholder="Length (mm)"
                        value={form.dimensionLength}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            dimensionLength: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="text"
                        placeholder="Width (mm)"
                        value={form.dimensionWidth}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            dimensionWidth: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="text"
                        placeholder="Height (mm)"
                        value={form.dimensionHeight}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            dimensionHeight: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </section>

                {/* Pricing Section - Only for Diamond */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Pricing
                  </h2>

                  {/* Row 1: RAP, Discount, Price Per Ct USD, Exchange Rate */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="rap">RAP</Label>
                      <Input
                        id="rap"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.rap}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, rap: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.discount}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, discount: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerCtUsd">Price Per Ct (USD)</Label>
                      <Input
                        id="pricePerCtUsd"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.pricePerCtUsd}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            pricePerCtUsd: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exchangeRate">
                        Exchange Rate (USD to INR)
                      </Label>
                      <Input
                        id="exchangeRate"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Auto-fetched"
                        value={form.exchangeRate}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            exchangeRate: e.target.value,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {liveRates.exchange_rate?.usd_to_inr
                          ? `Live rate: ₹${liveRates.exchange_rate.usd_to_inr.toFixed(2)}`
                          : "Fetching live rate..."}
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Price Per Ct INR (Auto-calculated), Total (Auto-calculated) */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pricePerCtInr">Price Per Ct (INR)</Label>
                      <Input
                        id="pricePerCtInr"
                        value={
                          pricePerCtInr
                            ? `₹${pricePerCtInr.toFixed(2)}`
                            : "Auto-calculated"
                        }
                        disabled
                        className="bg-green-50 font-medium"
                      />
                      <p className="text-xs text-muted-foreground">
                        Calculated: Price Per Ct USD × Exchange Rate
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total">Total (INR)</Label>
                      <Input
                        id="total"
                        value={
                          total ? `₹${total.toFixed(2)}` : "Auto-calculated"
                        }
                        disabled
                        className="bg-green-50 font-medium"
                      />
                      <p className="text-xs text-muted-foreground">
                        Calculated: Carat Weight × Price Per Ct INR
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Purchase Budget Total, Purchase Budget Per Carat, Suggested Supplier */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="purchaseBudgetTotal">
                        Purchase Budget Total
                      </Label>
                      <Input
                        id="purchaseBudgetTotal"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.purchaseBudgetTotal}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            purchaseBudgetTotal: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseBudgetPerCarat">
                        Purchase Budget Per Carat
                      </Label>
                      <Input
                        id="purchaseBudgetPerCarat"
                        value={
                          form.purchaseBudgetTotal &&
                          form.numberOfPieces &&
                          form.carat
                            ? `$${(
                                parseFloat(form.purchaseBudgetTotal) /
                                (parseFloat(form.numberOfPieces) *
                                  parseFloat(form.carat))
                              ).toFixed(2)}`
                            : "Auto-calculated"
                        }
                        disabled
                        className="bg-green-50 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suggestedSupplier">
                        Suggested Supplier
                      </Label>
                      <select
                        id="suggestedSupplier"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.suggestedSupplierId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            suggestedSupplierId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select supplier</option>
                        {suppliers.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.account_name || s.name || s.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              </>
            )}

            {selectedMaterialTypeName === "Gemstone" && (
              <>
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Gemstone Specifications
                  </h2>

                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneSize">Master Size</Label>
                      <select
                        id="gemstoneSize"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.sizeId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, sizeId: e.target.value }))
                        }
                        disabled={sizesLoading}
                      >
                        <option value="">Select size</option>
                        {sizesLoading ? (
                          <option disabled>Loading...</option>
                        ) : sizes.length === 0 ? (
                          <option disabled>No sizes available</option>
                        ) : (
                          sizes.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))
                        )}
                      </select>
                      {sizes.length === 0 && !sizesLoading && (
                        <p className="text-xs text-muted-foreground">
                          No sizes available. Please add sizes in master data.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneOrigin">Origin</Label>
                      <select
                        id="gemstoneOrigin"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.originId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, originId: e.target.value }))
                        }
                        disabled={originsLoading}
                      >
                        <option value="">Select origin</option>
                        {originsLoading ? (
                          <option disabled>Loading...</option>
                        ) : origins.length === 0 ? (
                          <option disabled>No origins available</option>
                        ) : (
                          origins.map((o: any) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))
                        )}
                      </select>
                      {origins.length === 0 && !originsLoading && (
                        <p className="text-xs text-muted-foreground">
                          No origins available. Please add origins in master
                          data.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneType">Gemstone Type</Label>
                      <select
                        id="gemstoneType"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.gemstoneTypeId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            gemstoneTypeId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select gemstone type</option>
                        {gemstoneTypes.map((g: any) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneShape">Shape</Label>
                      <select
                        id="gemstoneShape"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.shapeId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, shapeId: e.target.value }))
                        }
                        disabled={shapesLoading}
                      >
                        <option value="">Select shape</option>
                        {shapesLoading ? (
                          <option disabled>Loading...</option>
                        ) : shapes.length === 0 ? (
                          <option disabled>No shapes available</option>
                        ) : (
                          shapes.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))
                        )}
                      </select>
                      {shapes.length === 0 && !shapesLoading && (
                        <p className="text-xs text-muted-foreground">
                          No shapes available. Please add shapes in master data.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneCarat">Carat Weight</Label>
                      <Input
                        id="gemstoneCarat"
                        type="text"
                        placeholder="000.000"
                        value={form.carat}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, carat: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneNumberOfPieces">
                        Number of pieces
                      </Label>
                      <Input
                        id="gemstoneNumberOfPieces"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        value={form.numberOfPieces}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            numberOfPieces: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneColor">Color</Label>
                      <select
                        id="gemstoneColor"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.gemstoneColor}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            gemstoneColor: e.target.value,
                          }))
                        }
                        disabled={coloursLoading}
                      >
                        <option value="">Select color</option>
                        {coloursLoading ? (
                          <option disabled>Loading...</option>
                        ) : colours.length === 0 ? (
                          <option disabled>No colours available</option>
                        ) : (
                          colours.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))
                        )}
                      </select>
                      {colours.length === 0 && !coloursLoading && (
                        <p className="text-xs text-muted-foreground">
                          No colours available. Please add colours in master
                          data.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneClarity">Clarity</Label>
                      <select
                        id="gemstoneClarity"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.clarityId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, clarityId: e.target.value }))
                        }
                        disabled={claritiesLoading}
                      >
                        <option value="">Select clarity</option>
                        {claritiesLoading ? (
                          <option disabled>Loading...</option>
                        ) : clarities.length === 0 ? (
                          <option disabled>No clarities available</option>
                        ) : (
                          clarities.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))
                        )}
                      </select>
                      {clarities.length === 0 && !claritiesLoading && (
                        <p className="text-xs text-muted-foreground">
                          No clarities available. Please add clarities in master
                          data.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneTreatment">Treatment</Label>
                      <select
                        id="gemstoneTreatment"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.gemstoneTreatment}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            gemstoneTreatment: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select treatment</option>
                        {gemstoneTreatments.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      {gemstoneTreatments.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No treatments available. Please add treatments in
                          master data.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneLab">Lab</Label>
                      <select
                        id="gemstoneLab"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.labId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, labId: e.target.value }))
                        }
                        disabled={labsLoading}
                      >
                        <option value="">Select lab</option>
                        {labsLoading ? (
                          <option disabled>Loading...</option>
                        ) : labs.length === 0 ? (
                          <option disabled>No labs available</option>
                        ) : (
                          labs.map((l: any) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))
                        )}
                      </select>
                      {labs.length === 0 && !labsLoading && (
                        <p className="text-xs text-muted-foreground">
                          No labs available. Please add labs in master data.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneCertNo">Certificate Number</Label>
                      <Input
                        id="gemstoneCertNo"
                        placeholder="Enter certificate number"
                        value={form.certNo}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, certNo: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneAdditionalDetails">
                        Additional Details
                      </Label>
                      <Input
                        id="gemstoneAdditionalDetails"
                        placeholder="Enter additional details"
                        value={form.additionalDetails}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            additionalDetails: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneCut">Cut</Label>
                      <Input
                        id="gemstoneCut"
                        type="text"
                        placeholder="Enter cut"
                        value={form.cut}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, cut: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneSize">Size</Label>
                      <Input
                        id="gemstoneSize"
                        type="text"
                        placeholder="Enter size in mm"
                        value={form.sieveSize}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, sieveSize: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dimensions</Label>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input
                        type="text"
                        placeholder="Length (mm)"
                        value={form.dimensionLength}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            dimensionLength: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="text"
                        placeholder="Width (mm)"
                        value={form.dimensionWidth}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            dimensionWidth: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="text"
                        placeholder="Height (mm)"
                        value={form.dimensionHeight}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            dimensionHeight: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Pricing
                  </h2>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="gemstonePurchaseBudgetTotal">
                        Purchase Budget Total
                      </Label>
                      <Input
                        id="gemstonePurchaseBudgetTotal"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.purchaseBudgetTotal}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            purchaseBudgetTotal: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstonePurchaseBudgetPerCarat">
                        Purchase Budget Per Carat
                      </Label>
                      <Input
                        id="gemstonePurchaseBudgetPerCarat"
                        value={
                          form.purchaseBudgetTotal &&
                          form.numberOfPieces &&
                          form.carat
                            ? `$${(
                                parseFloat(form.purchaseBudgetTotal) /
                                (parseFloat(form.numberOfPieces) *
                                  parseFloat(form.carat))
                              ).toFixed(2)}`
                            : "Auto-calculated"
                        }
                        disabled
                        className="bg-green-50 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gemstoneSuggestedSupplier">
                        Suggested Supplier
                      </Label>
                      <select
                        id="gemstoneSuggestedSupplier"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.suggestedSupplierId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            suggestedSupplierId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select supplier</option>
                        {suppliers.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.account_name || s.name || s.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              </>
            )}

            {(selectedMaterialTypeName === "Gold" ||
              selectedMaterialTypeName === "Silver" ||
              selectedMaterialTypeName === "Platinum") && (
              <>
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedMaterialTypeName} Specifications
                  </h2>

                  {/* Live Rate Display */}
                  {liveRates && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="font-semibold text-sm mb-2">
                        💰 Live Rates (Auto-Updated)
                      </h3>
                      <div className="grid gap-2 text-sm">
                        {selectedMaterialTypeName === "Gold" &&
                          liveRates.gold && (
                            <>
                              <div className="flex justify-between">
                                <span>24K Gold:</span>
                                <span className="font-semibold">
                                  ₹
                                  {liveRates.gold.price_per_gram_24k?.toFixed(
                                    2
                                  )}
                                  /gram
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>22K Gold:</span>
                                <span className="font-semibold">
                                  ₹
                                  {liveRates.gold.price_per_gram_22k?.toFixed(
                                    2
                                  )}
                                  /gram
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>18K Gold:</span>
                                <span className="font-semibold">
                                  ₹
                                  {liveRates.gold.price_per_gram_18k?.toFixed(
                                    2
                                  )}
                                  /gram
                                </span>
                              </div>
                            </>
                          )}
                        {selectedMaterialTypeName === "Silver" &&
                          liveRates.silver && (
                            <div className="flex justify-between">
                              <span>Silver:</span>
                              <span className="font-semibold">
                                ₹{liveRates.silver.price_per_gram?.toFixed(2)}
                                /gram
                              </span>
                            </div>
                          )}
                        {selectedMaterialTypeName === "Platinum" &&
                          liveRates.platinum && (
                            <div className="flex justify-between">
                              <span>Platinum:</span>
                              <span className="font-semibold">
                                ₹{liveRates.platinum.price_per_gram?.toFixed(2)}
                                /gram
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedMaterialTypeName === "Gold" && (
                      <div className="space-y-2">
                        <Label htmlFor="ktValue">KT Value</Label>
                        <select
                          id="ktValue"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          value={form.ktValue}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, ktValue: e.target.value }))
                          }
                          disabled={goldCaratsLoading}
                        >
                          <option value="">Select KT</option>
                          {goldCaratsLoading ? (
                            <option disabled>Loading...</option>
                          ) : goldCarats.length === 0 ? (
                            <option disabled>No carats available</option>
                          ) : (
                            goldCarats.map((carat: any) => (
                              <option key={carat.id} value={carat.id}>
                                {carat.name}
                              </option>
                            ))
                          )}
                        </select>
                        {goldCarats.length === 0 && !goldCaratsLoading && (
                          <p className="text-xs text-muted-foreground">
                            No carats available. Please add gold carats in
                            master data.
                          </p>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="metalPurity">Purity Details</Label>
                      <Input
                        id="metalPurity"
                        type="text"
                        placeholder="e.g., 999 → 99.9, 925 → 92.5, 99.5%"
                        value={form.metalPurity}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            metalPurity: e.target.value,
                          }))
                        }
                        onBlur={(e) => {
                          const raw = e.target.value.trim();
                          const num = parseFloat(raw.replace("%", ""));
                          if (!isNaN(num) && num >= 100) {
                            // e.g. 995 → 99.5, 925 → 92.5
                            const converted = (num / 10).toFixed(1);
                            setForm((f) => ({ ...f, metalPurity: converted }));
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter as percentage (e.g., 99.5) — values ≥ 100 are
                        auto-divided by 10 (995 → 99.5)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metalWeightGrams">Weight (grams) *</Label>
                    <Input
                      id="metalWeightGrams"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="Enter weight in grams"
                      value={form.metalWeightGrams}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          metalWeightGrams: e.target.value,
                        }))
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Units in grams. Accept only numbers
                    </p>
                  </div>

                  {/* Auto-calculated fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pricePerGram">Price per Gram (₹)</Label>
                      <Input
                        id="pricePerGram"
                        type="text"
                        value={form.pricePerGram}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto-calculated from live rates
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalMetalValue">Total Value (₹)</Label>
                      <Input
                        id="totalMetalValue"
                        type="text"
                        value={form.totalMetalValue}
                        disabled
                        className="bg-muted font-semibold"
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto-calculated: Weight × Price per Gram
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metalSuggestedSupplier">
                      Suggested Supplier
                    </Label>
                    <select
                      id="metalSuggestedSupplier"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={form.suggestedSupplierId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          suggestedSupplierId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.account_name || s.name || s.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>
              </>
            )}

            {/* Row 8: Proof Image */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Proof of Purchase
              </h2>
              <div className="space-y-2">
                <Label htmlFor="proofImage">Upload Image</Label>
                <Input
                  id="proofImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {proofImagePreview && (
                  <div className="mt-2">
                    <img
                      src={proofImagePreview}
                      alt="Proof preview"
                      className="max-w-xs rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={clearFile}
                      className="mt-2"
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>
            </section>

            {/* Submit buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || loading}>
                {submitting ? "Saving..." : "Save Purchase"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

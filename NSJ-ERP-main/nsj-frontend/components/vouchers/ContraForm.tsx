"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  contraCreate,
  contraUpdate,
  contraDetail,
  contraNextVoucherNo,
  accountsDropdown,
  accountBalance,
  autoCompleteStep,
  subaccountsList,
} from "@/lib/backend";
import { generateVoucherPDF } from "@/lib/voucherPDF";
import { amountInWords } from "@/lib/numberToWords";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditEntry {
  party_id: string;
  sub_ac: string;
  balance: number | null;
  balance_type: string;
  cr: number;
  narration: string;
}

interface ContraFormProps {
  id?: string;
}

export function ContraForm({ id }: ContraFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [contraParties, setContraParties] = useState<
    { id: string; name: string }[]
  >([]);
  const contraPartyOptions = useMemo(
    () => contraParties.map((p) => ({ value: p.id, label: p.name })),
    [contraParties]
  );

  // Header State
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [series, setSeries] = useState("CONTRA M");
  const [voucherNo, setVoucherNo] = useState("");

  // Debit Entry State (Fixed Row 1)
  const [drPartyId, setDrPartyId] = useState("");
  const [drSubAc, setDrSubAc] = useState("");
  const [drBalance, setDrBalance] = useState<number | null>(null);
  const [drBalanceType, setDrBalanceType] = useState("");
  const [drBalanceDisplay, setDrBalanceDisplay] = useState("");
  const [drAmount, setDrAmount] = useState<number>(0);
  const [drNarration, setDrNarration] = useState("");

  // Credit Entries State
  const [creditEntries, setCreditEntries] = useState<CreditEntry[]>([
    {
      party_id: "",
      sub_ac: "",
      balance: null,
      balance_type: "",
      cr: 0,
      narration: "",
    },
  ]);

  const [commonNarration, setCommonNarration] = useState("");

  // Sub Accounts Data Cache
  const [subAccountsMap, setSubAccountsMap] = useState<
    Record<string, { loading: boolean; options: any[] }>
  >({});

  const fetchSubAccounts = useCallback((partyId: string) => {
    if (!partyId) return;
    setSubAccountsMap((prev) => {
      if (prev[partyId]) return prev;
      return { ...prev, [partyId]: { loading: true, options: [] } };
    });

    subaccountsList({ account_id: partyId, account: partyId, page_size: 100 })
      .then((res) => {
        const records =
          res.items || res.results || (Array.isArray(res) ? res : []);
        setSubAccountsMap((prev) => ({
          ...prev,
          [partyId]: { loading: false, options: records },
        }));
      })
      .catch((err) => {
        console.error("Failed to load subaccounts for", partyId, err);
        setSubAccountsMap((prev) => ({
          ...prev,
          [partyId]: { loading: false, options: [] },
        }));
      });
  }, []);

  // Load Contra Accounts
  useEffect(() => {
    accountsDropdown({ type: "contra" })
      .then((data) => setContraParties(data || []))
      .catch(() =>
        toast({
          variant: "destructive",
          title: "Failed to load contra accounts",
        })
      );
  }, [toast]);

  // Helper for displaying balance without "undefined"
  const renderBalance = (amount: number | null, type?: string) => {
    if (amount === null || amount === undefined) return "";
    const formatted = parseFloat(String(amount)).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });
    const label =
      type && String(type) !== "undefined" && String(type) !== "null"
        ? ` ${type}`
        : "";
    return `${formatted}${label}`;
  };

  // Load Next Voucher Number on mount (only for new receipts)
  useEffect(() => {
    if (!id) {
      contraNextVoucherNo()
        .then((res) => {
          if (res?.voucher_no) setVoucherNo(res.voucher_no);
          else if ((res as any)?.data?.voucher_no)
            setVoucherNo((res as any).data.voucher_no);
        })
        .catch((err) =>
          console.error("Failed to fetch next voucher number:", err)
        );
    }
  }, [id]);

  // Load existing data if editing
  useEffect(() => {
    if (id) {
      setLoading(true);
      contraDetail(id)
        .then((data) => {
          setDate(data.date || "");
          setSeries(data.series || "CONTRA M");
          setVoucherNo(data.voucher_no || "");
          setDrPartyId(data.party_name_id || data.party_name?.id || "");
          setDrAmount(parseFloat(data.dr) || 0);
          setDrBalance(parseFloat(data.balance) || null);
          let loadedDrNarration = data.dr_narration || "";
          let loadedCommonNarration = data.narration || "";
          if (loadedCommonNarration.includes(" |GEN_REMARKS| ")) {
            const parts = loadedCommonNarration.split(" |GEN_REMARKS| ");
            loadedDrNarration = parts[0];
            loadedCommonNarration = parts.slice(1).join(" |GEN_REMARKS| ");
          }

          setCommonNarration(loadedCommonNarration);
          setDrNarration(loadedDrNarration);
          setDrSubAc(data.sub_ac || data.sub_account || "");

          if (data.credit_entries && Array.isArray(data.credit_entries)) {
            setCreditEntries(
              data.credit_entries.map((c: any) => ({
                party_id: c.party_id || c.party?.id || c.party_name_id || "",
                sub_ac: c.sub_ac || c.sub_account || "",
                balance: parseFloat(c.balance) || null,
                balance_type: c.balance_type || "",
                cr: parseFloat(c.cr) || 0,
                narration: c.narration || "",
              }))
            );
          }
        })
        .catch(() =>
          toast({
            variant: "destructive",
            title: "Failed to load receipt details",
          })
        )
        .finally(() => setLoading(false));
    }
  }, [id, toast]);

  // Handle Debit Party Balance & Subaccounts Fetch
  useEffect(() => {
    if (drPartyId) {
      if (!subAccountsMap[drPartyId]) fetchSubAccounts(drPartyId);

      accountBalance(drPartyId)
        .then((res) => {
          setDrBalance(parseFloat(String(res.balance)));
          setDrBalanceType(
            res.balance_type ||
              (res as any).balance_drcr ||
              (res as any).amount_drcr ||
              ""
          );
          setDrBalanceDisplay(res.balance_display || "");
        })
        .catch(() => {
          setDrBalance(null);
          setDrBalanceType("");
          setDrBalanceDisplay("");
        });
    } else {
      setDrBalance(null);
      setDrBalanceType("");
      setDrBalanceDisplay("");
    }
  }, [drPartyId, subAccountsMap, fetchSubAccounts]);

  // Handle Credit Parties Subaccounts Fetch on load
  useEffect(() => {
    creditEntries.forEach((entry) => {
      if (entry.party_id && !subAccountsMap[entry.party_id]) {
        fetchSubAccounts(entry.party_id);
      }
    });
  }, [creditEntries, subAccountsMap, fetchSubAccounts]);

  // Calculation Helpers
  const totalDr = useMemo(() => {
    // Only read from the first fixed row's drAmount
    return parseFloat(parseFloat(String(drAmount || 0)).toFixed(2));
  }, [drAmount]);
  const totalCr = useMemo(() => {
    // Only sum cr values from the secondary entries array
    const sum = creditEntries.reduce(
      (acc, entry) => acc + (parseFloat(String(entry.cr)) || 0),
      0
    );
    return parseFloat(sum.toFixed(2));
  }, [creditEntries]);

  const isBalanced = Math.abs(totalCr - totalDr) < 0.01 && totalCr > 0;

  const handleAddCrRow = () => {
    setCreditEntries((prev) => [
      ...prev,
      {
        party_id: "",
        sub_ac: "",
        balance: null,
        balance_type: "",
        cr: 0,
        narration: "",
      },
    ]);
  };

  const handleRemoveCrRow = (index: number) => {
    setCreditEntries((prev) => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return [
        {
          party_id: "",
          sub_ac: "",
          balance: null,
          balance_type: "",
          cr: 0,
          narration: "",
        },
      ];
    });
  };

  const updateCreditEntry = (
    index: number,
    field: keyof CreditEntry,
    value: any
  ) => {
    setCreditEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [field]: value };

      // Auto-reset sub account when party changes
      if (field === "party_id") {
        newEntries[index].sub_ac = "";
      }

      return newEntries;
    });

    if (field === "party_id" && value) {
      if (!subAccountsMap[value]) fetchSubAccounts(value);

      accountBalance(value)
        .then((res) => {
          setCreditEntries((prev) => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = {
                ...updated[index],
                balance: parseFloat(String(res.balance)),
                balance_type:
                  res.balance_type ||
                  (res as any).balance_drcr ||
                  (res as any).amount_drcr ||
                  "",
              };
            }
            return updated;
          });
        })
        .catch(() => {
          setCreditEntries((prev) => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = {
                ...updated[index],
                balance: null,
                balance_type: "",
              };
            }
            return updated;
          });
        });
    }
  };

  const isSaveDisabled =
    !drPartyId ||
    totalDr <= 0 ||
    !creditEntries.some(
      (c) => c.party_id && (parseFloat(String(c.cr)) || 0) > 0
    ) ||
    !isBalanced ||
    !commonNarration.trim() ||
    submitting;

  const handleSubmit = async (
    e: React.FormEvent,
    shouldPrint: boolean = false
  ) => {
    e.preventDefault();
    if (submitting || isSaveDisabled) return;

    setSubmitting(true);
    try {
      let finalNarration = commonNarration;
      if (drNarration) {
        finalNarration = `${drNarration} |GEN_REMARKS| ${commonNarration}`;
      }

      const payload = {
        date,
        series,
        voucher_no: voucherNo,
        party_name_id: drPartyId,
        dr: totalDr,
        balance: drBalance,
        sub_ac: drSubAc,
        sub_account: drSubAc,
        narration: finalNarration,
        dr_narration: drNarration,
        credit_entries: creditEntries
          .filter((c) => c.party_id && (parseFloat(String(c.cr)) || 0) > 0)
          .map((c, index) => ({
            party_id: c.party_id,
            cr: parseFloat(String(c.cr)),
            balance: c.balance,
            sub_ac: c.sub_ac,
            sub_account: c.sub_ac,
            narration: c.narration,
            order: index,
          })),
      };

      let result;
      if (id) {
        result = await contraUpdate(id, payload);
        toast({
          title: "Contra Updated",
          description: "Successfully updated the contra voucher.",
        });
      } else {
        result = await contraCreate(payload);
        toast({
          title: "Contra Created",
          description: "Successfully saved the new contra voucher.",
        });
      }

      if (result?.order_id && result?.id) {
        try {
          await autoCompleteStep(
            result.order_id,
            "Advance Received",
            result.id,
            `Contra ${id ? "updated" : "created"}: ${result.voucher_no || result.id}`
          );
        } catch (e) {
          console.warn("Auto-complete failed", e);
        }
      }

      if (shouldPrint && result?.id) {
        try {
          const data = await contraDetail(result.id);

          const formatBalance = (bal: any): string => {
            if (bal === null || bal === undefined || bal === "" || bal === 0)
              return "-";
            const balanceStr = String(bal)
              .replace(/Rs\./gi, "")
              .replace(/Rs/gi, "")
              .trim();
            const numericMatch = balanceStr.match(/[\d,]+\.?\d*/);
            return numericMatch
              ? `Rs. ${numericMatch[0].replace(/,/g, "")}`
              : "-";
          };

          const entries: any[] = [];
          if (data.credit_entries && Array.isArray(data.credit_entries)) {
            data.credit_entries.forEach((entry: any) => {
              entries.push({
                type: "CR",
                partyName:
                  entry.party?.account_name || entry.party?.name || "-",
                subAc: "-",
                balance: formatBalance(entry.balance),
                drAmount: 0,
                crAmount: parseFloat(entry.cr || 0),
                narration: entry.narration || "-",
              });
            });
          }

          if (data.party_name) {
            entries.push({
              type: "DR",
              partyName:
                data.party_name?.account_name ||
                data.party_name?.name ||
                data.party_name ||
                "-",
              subAc: "-",
              balance: formatBalance(data.balance),
              drAmount: parseFloat(data.dr || 0),
              crAmount: 0,
              narration: data.narration || "-",
            });
          }

          generateVoucherPDF("Contra", {
            voucherType: "Contra",
            date: data.date || "-",
            voucherNo: data.voucher_no || "-",
            series: data.series || "CONTRA M",
            entries,
            generalRemarks: data.narration || "",
            totalDebit: entries.reduce((sum, e) => sum + e.drAmount, 0),
            totalCredit: entries.reduce((sum, e) => sum + e.crAmount, 0),
            amountInWords: amountInWords(
              Math.max(
                entries.reduce((sum, e) => sum + e.drAmount, 0),
                entries.reduce((sum, e) => sum + e.crAmount, 0)
              )
            ),
          });

          router.push("/vouchers/contra/list");
        } catch (pdfErr) {
          console.error("PDF generation failed:", pdfErr);
          router.push("/vouchers/contra/list");
        }
      } else {
        router.push("/vouchers/contra/list");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error saving receipt",
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputBaseClasses =
    "border-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-rose-400 focus:ring-rose-400 h-full text-[13px] px-2 w-full transition-all hover:bg-rose-50/30";

  return (
    <div className="w-full max-w-[1240px] mx-auto pb-10 px-2 sm:px-4">
      <Card className="border-purple-200 shadow-xl bg-white overflow-visible">
        <form onSubmit={(e) => handleSubmit(e, false)}>
          {/* Header Section */}
          <div className="p-4 bg-gradient-to-r from-[#fce4e4]/60 to-[#fdf2f2]/40 border-b border-rose-100">
            <div className="flex flex-wrap items-center gap-6 justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor="date"
                    className="text-[11px] font-bold text-rose-900 uppercase tracking-wider"
                  >
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-9 w-40 border-rose-200 focus:ring-rose-400 text-[13px] font-medium rounded-md shadow-sm"
                  />
                </div>
                <input type="hidden" value={series} />
              </div>

              <div className="flex items-center gap-8"></div>

              <div className="flex items-center gap-3">
                <Label
                  htmlFor="voucherNo"
                  className="text-[11px] font-bold text-rose-900 uppercase tracking-wider"
                >
                  Voucher No.
                </Label>
                <Input
                  id="voucherNo"
                  value={voucherNo}
                  readOnly
                  className="h-9 w-28 border-rose-200 focus:ring-0 text-[13px] font-bold text-center rounded-md shadow-sm bg-gray-50/50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Spreadsheet Table */}
            <div className="overflow-visible">
              <table className="w-full border-collapse border border-rose-100">
                <thead>
                  <tr className="bg-[#fce4e4] text-[#800000] border-b border-rose-200 h-9">
                    <th className="px-4 text-left w-[60px] text-[10px] font-bold uppercase tracking-widest border-r border-rose-200">
                      Type
                    </th>
                    <th className="px-4 text-left w-[280px] text-[10px] font-bold uppercase tracking-widest border-r border-rose-200">
                      Party Name
                    </th>
                    <th className="px-3 text-left w-[120px] text-[10px] font-bold uppercase tracking-widest border-r border-rose-200">
                      Sub Ac
                    </th>
                    <th className="px-3 text-right w-[160px] text-[10px] font-bold uppercase tracking-widest border-r border-rose-200">
                      Balance
                    </th>
                    <th className="px-3 text-right w-[120px] text-[10px] font-bold uppercase tracking-widest border-r border-rose-200">
                      Dr
                    </th>
                    <th className="px-3 text-right w-[120px] text-[10px] font-bold uppercase tracking-widest border-r border-rose-200">
                      Cr
                    </th>
                    <th className="px-4 text-left text-[10px] font-bold uppercase tracking-widest">
                      Narration
                    </th>
                    <th className="w-[45px]"></th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {/* Fixed Debit Row */}
                  <tr className="bg-[#fffafa] h-10 group">
                    <td className="border-r border-rose-100 p-2 text-center bg-blue-50/30">
                      <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm border border-blue-200">
                        Dr
                      </span>
                    </td>
                    <td className="border-r border-rose-100 p-0 relative overflow-visible">
                      <select
                        value={drPartyId}
                        onChange={(e) => {
                          setDrPartyId(e.target.value);
                          setDrSubAc("");
                        }}
                        className="border-none bg-transparent shadow-none h-10 w-full text-[13px] focus:ring-0 px-4 hover:bg-rose-50/50 cursor-pointer"
                      >
                        <option value="">Select Account...</option>
                        {contraPartyOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-r border-rose-100 p-0 h-10 relative">
                      {drPartyId &&
                      subAccountsMap[drPartyId]?.options?.length > 0 ? (
                        <select
                          value={drSubAc}
                          onChange={(e) => setDrSubAc(e.target.value)}
                          className={cn(
                            inputBaseClasses,
                            "border-transparent ring-0 focus:ring-rose-400 focus:border-transparent outline-none cursor-pointer"
                          )}
                        >
                          <option value="">Select Sub AC</option>
                          {subAccountsMap[drPartyId].options.map((opt: any) => (
                            <option
                              key={opt.id}
                              value={opt.sub_account_name || opt.name || opt.id}
                            >
                              {opt.sub_account_name || opt.name || opt.id}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          value={drSubAc}
                          onChange={(e) => setDrSubAc(e.target.value)}
                          className={inputBaseClasses}
                          placeholder={
                            drPartyId && subAccountsMap[drPartyId]?.loading
                              ? "Loading..."
                              : ""
                          }
                          disabled={
                            drPartyId
                              ? !!subAccountsMap[drPartyId]?.loading
                              : false
                          }
                        />
                      )}
                    </td>
                    <td className="border-r border-rose-100 p-0 h-10 bg-[#fafafa]/50">
                      <div
                        className={cn(
                          "text-xs font-bold tabular-nums px-4 h-full flex items-center justify-end",
                          drBalanceType === "Dr"
                            ? "text-blue-600"
                            : "text-rose-600"
                        )}
                      >
                        {drBalanceDisplay ||
                          renderBalance(drBalance, drBalanceType)}
                      </div>
                    </td>
                    <td className="border-r border-rose-100 p-0 h-10">
                      <Input
                        type="number"
                        value={drAmount || ""}
                        onChange={(e) =>
                          setDrAmount(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className={cn(
                          inputBaseClasses,
                          "text-right font-black"
                        )}
                      />
                    </td>
                    <td className="border-r border-rose-100 p-0 h-10 bg-gray-50/30">
                      <div className="flex items-center justify-center h-full text-rose-300 font-bold">
                        —
                      </div>
                    </td>
                    <td className="p-0 h-10">
                      <Input
                        value={drNarration}
                        onChange={(e) => setDrNarration(e.target.value)}
                        className={inputBaseClasses}
                        placeholder="Contra narration..."
                      />
                    </td>
                    <td className="border-l border-rose-100"></td>
                  </tr>

                  {/* Dynamic Credit Rows */}
                  {creditEntries.map((entry, idx) => (
                    <tr
                      key={idx}
                      className="h-10 hover:bg-gray-50/30 transition-colors border-t border-rose-50 overflow-visible"
                    >
                      <td className="border-r border-rose-100 p-2 text-center bg-green-50/30">
                        <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm border border-green-200">
                          Cr
                        </span>
                      </td>
                      <td className="border-r border-rose-100 p-0 relative overflow-visible">
                        <select
                          value={entry.party_id}
                          onChange={(e) =>
                            updateCreditEntry(idx, "party_id", e.target.value)
                          }
                          className="border-none bg-transparent shadow-none h-10 w-full text-[13px] focus:ring-0 px-4 hover:bg-rose-50/50 cursor-pointer"
                        >
                          <option value="">Search Account...</option>
                          {contraPartyOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-r border-rose-100 p-0 h-10 relative">
                        {entry.party_id &&
                        subAccountsMap[entry.party_id]?.options?.length > 0 ? (
                          <select
                            value={entry.sub_ac}
                            onChange={(e) =>
                              updateCreditEntry(idx, "sub_ac", e.target.value)
                            }
                            className={cn(
                              inputBaseClasses,
                              "border-transparent ring-0 focus:ring-rose-400 focus:border-transparent outline-none cursor-pointer"
                            )}
                          >
                            <option value="">Select Sub AC</option>
                            {subAccountsMap[entry.party_id].options.map(
                              (opt: any) => (
                                <option
                                  key={opt.id}
                                  value={
                                    opt.sub_account_name || opt.name || opt.id
                                  }
                                >
                                  {opt.sub_account_name || opt.name || opt.id}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          <Input
                            value={entry.sub_ac}
                            onChange={(e) =>
                              updateCreditEntry(idx, "sub_ac", e.target.value)
                            }
                            className={inputBaseClasses}
                            placeholder={
                              entry.party_id &&
                              subAccountsMap[entry.party_id]?.loading
                                ? "Loading..."
                                : ""
                            }
                            disabled={
                              entry.party_id
                                ? !!subAccountsMap[entry.party_id]?.loading
                                : false
                            }
                          />
                        )}
                      </td>
                      <td className="border-r border-rose-100 p-0 h-10 bg-[#fafafa]/50">
                        <div
                          className={cn(
                            "text-xs font-bold tabular-nums px-4 h-full flex items-center justify-end",
                            entry.balance_type === "Dr"
                              ? "text-blue-600"
                              : "text-rose-600"
                          )}
                        >
                          {renderBalance(entry.balance, entry.balance_type)}
                        </div>
                      </td>
                      <td className="border-r border-rose-100 p-0 h-10 bg-gray-50/30">
                        <div className="flex items-center justify-center h-full text-rose-300 font-bold">
                          —
                        </div>
                      </td>
                      <td className="border-r border-rose-100 p-0 h-10">
                        <Input
                          type="number"
                          value={entry.cr || ""}
                          onChange={(e) =>
                            updateCreditEntry(
                              idx,
                              "cr",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                          className={cn(
                            inputBaseClasses,
                            "text-right font-black"
                          )}
                        />
                      </td>
                      <td className="p-0 h-10">
                        <Input
                          value={entry.narration}
                          onChange={(e) =>
                            updateCreditEntry(idx, "narration", e.target.value)
                          }
                          className={inputBaseClasses}
                          placeholder="Entry narration..."
                        />
                      </td>
                      <td className="text-center border-l border-rose-100">
                        <button
                          type="button"
                          onClick={() => handleRemoveCrRow(idx)}
                          className="text-rose-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-white flex justify-start border-b border-rose-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCrRow}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 h-8 px-4 text-[12px] font-bold flex items-center gap-2 rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Entry Row
              </Button>
            </div>

            {/* Premium Footer */}
            <div className="p-8 bg-gradient-to-b from-[#fffafa] to-white">
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                <div className="w-full lg:w-[40%] space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                    <Label
                      htmlFor="commonNarration"
                      className="text-[11px] font-bold text-rose-800 uppercase tracking-widest"
                    >
                      General Remarks <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <Textarea
                    id="commonNarration"
                    value={commonNarration}
                    onChange={(e) => setCommonNarration(e.target.value)}
                    placeholder="Type common narration here..."
                    className="min-h-[100px] border-rose-200 focus:ring-rose-400 bg-white text-sm shadow-inner rounded-xl resize-none p-4"
                  />
                  {/* Total Amount in Words - Under General Remarks */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider whitespace-nowrap">
                      Total Amount:
                    </span>
                    <div className="w-[300px] border-b-2 border-dashed border-rose-300 pb-1">
                      <span className="text-[13px] font-semibold text-rose-800">
                        {totalDr > 0 || totalCr > 0
                          ? amountInWords(Math.max(totalDr, totalCr))
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center justify-center space-y-4">
                  <div className="w-full max-w-[300px] space-y-4">
                    <div className="flex justify-between items-end border-b border-dashed border-rose-200 pb-2">
                      <span className="text-[11px] font-bold text-rose-400 uppercase tracking-tighter">
                        Total Debit
                      </span>
                      <span
                        className={cn(
                          "text-xl font-black tabular-nums tracking-tight",
                          isBalanced ? "text-green-600" : "text-rose-900"
                        )}
                      >
                        {totalDr.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-dashed border-rose-200 pb-2">
                      <span className="text-[11px] font-bold text-rose-400 uppercase tracking-tighter">
                        Total Credit
                      </span>
                      <span
                        className={cn(
                          "text-xl font-black tabular-nums tracking-tight",
                          isBalanced ? "text-green-600" : "text-rose-900"
                        )}
                      >
                        {totalCr.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {totalDr > 0 && totalCr > 0 && !isBalanced && (
                      <div className="flex justify-between items-center bg-rose-50 p-2 rounded-lg border border-rose-100">
                        <span className="text-[10px] font-bold text-rose-500 uppercase">
                          Difference
                        </span>
                        <span className="text-sm font-black text-rose-600 tabular-nums">
                          ₹
                          {Math.abs(totalDr - totalCr).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    {isBalanced && (
                      <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-1 rounded-full border border-green-100 animate-pulse">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Balanced & Valid
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-[30%] flex flex-col items-end space-y-8 pt-2">
                  <div className="text-right space-y-2 group">
                    <Label className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block transition-colors group-hover:text-rose-600 text-nowrap">
                      Debit Party Final Balance
                    </Label>
                    <div className="text-3xl font-black text-rose-700 tabular-nums leading-none tracking-tighter">
                      {drBalanceDisplay ||
                        (drBalance !== null
                          ? `${drBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ${drBalanceType}`
                          : "₹0.00")}
                    </div>
                  </div>

                  <div className="flex gap-2 w-full">
                    <Button
                      type="button"
                      disabled={isSaveDisabled || submitting}
                      onClick={(e) => handleSubmit(e, false)}
                      className={cn(
                        "flex-1 h-10 text-sm font-bold transition-all rounded-lg shadow-sm border",
                        isSaveDisabled
                          ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
                          : "bg-[#fce4e4] text-[#800000] border-rose-200 hover:bg-[#f8d0d0] active:scale-[0.98]"
                      )}
                    >
                      {submitting ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaveDisabled || submitting}
                      onClick={(e) => handleSubmit(e, true)}
                      className={cn(
                        "flex-1 h-10 text-sm font-bold transition-all rounded-lg shadow-sm border",
                        isSaveDisabled
                          ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
                          : "bg-[#800000] text-white border-[#800000] hover:bg-[#6b0000] active:scale-[0.98]"
                      )}
                    >
                      Save & Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Smart Diagnostics (Bottom Sheet) */}
      <div className="mt-8 mx-auto max-w-2xl bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-wrap justify-center gap-x-8 gap-y-2 opacity-60 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isBalanced ? "bg-green-500" : "bg-rose-300"
            )}
          ></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase">
            Tally: {isBalanced ? "OK" : "Diff"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              drPartyId ? "bg-green-500" : "bg-rose-300"
            )}
          ></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase">
            Dr Account: {drPartyId ? "OK" : "MISSING"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              totalDr > 0 ? "bg-green-500" : "bg-rose-300"
            )}
          ></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase">
            Amount: {totalDr > 0 ? "OK" : "ZERO"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              creditEntries.filter(
                (c) => c.party_id && (parseFloat(String(c.cr)) || 0) > 0
              ).length > 0
                ? "bg-green-500"
                : "bg-rose-300"
            )}
          ></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase">
            Entries:{" "}
            {
              creditEntries.filter(
                (c) => c.party_id && (parseFloat(String(c.cr)) || 0) > 0
              ).length
            }{" "}
            valid
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              commonNarration.trim() ? "bg-green-500" : "bg-rose-300"
            )}
          ></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase">
            Narration: {commonNarration.trim() ? "OK" : "REQD"}
          </span>
        </div>
      </div>
    </div>
  );
}

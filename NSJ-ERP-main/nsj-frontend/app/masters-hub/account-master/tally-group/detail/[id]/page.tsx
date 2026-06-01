"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  accountTransactionsList,
  type AccountTransaction,
} from "@/lib/backend";
import {
  ArrowLeft,
  Calendar,
  FileText,
  User,
  Hash,
  BookOpen,
  Scale,
  AlignLeft,
  Tag,
} from "lucide-react";

const TXN_TYPE_LABELS: Record<string, string> = {
  order: "Order",
  sale: "Sale",
  payment: "Payment",
  journal: "Journal",
  receipt: "Receipt",
  purchase: "Purchase",
  purchase_tagwise: "Purchase Tagwise",
  purchase_diamond: "Purchase Diamond",
  approval_loose: "Approval Loose",
  approval_tag: "Approval Tag",
  pur_approval: "Pur & Approval",
  pur_return: "Pur Return",
  sales_return: "Sales Return",
  receive: "Receive",
  repair: "Repair",
  payment_voucher: "Payment Voucher",
  journal_voucher: "Journal Voucher",
};

const TXN_TYPE_COLORS: Record<string, string> = {
  order: "bg-blue-100 text-blue-800",
  sale: "bg-green-100 text-green-800",
  payment: "bg-purple-100 text-purple-800",
  journal: "bg-yellow-100 text-yellow-800",
  receipt: "bg-emerald-100 text-emerald-800",
  purchase: "bg-orange-100 text-orange-800",
  purchase_tagwise: "bg-orange-100 text-orange-800",
  purchase_diamond: "bg-cyan-100 text-cyan-800",
  approval_loose: "bg-indigo-100 text-indigo-800",
  approval_tag: "bg-indigo-100 text-indigo-800",
  pur_approval: "bg-amber-100 text-amber-800",
  pur_return: "bg-red-100 text-red-800",
  sales_return: "bg-rose-100 text-rose-800",
  receive: "bg-teal-100 text-teal-800",
  repair: "bg-slate-100 text-slate-800",
  payment_voucher: "bg-purple-100 text-purple-800",
  journal_voucher: "bg-yellow-100 text-yellow-800",
};

export default function TallyTransactionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [txn, setTxn] = useState<AccountTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransaction = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const compositeId = params.id;
      const parts = compositeId.split("--");
      if (parts.length !== 2) {
        setError("Invalid transaction ID format.");
        setLoading(false);
        return;
      }
      const [txnType, realId] = parts;
      const data = await accountTransactionsList({
        type: txnType,
        page_size: 1000,
      });
      const results = data.results || [];
      const found = results.find((t: AccountTransaction) => t.id === realId);
      if (!found) {
        setError("Transaction not found.");
      } else {
        setTxn(found);
      }
    } catch (err) {
      console.error("Failed to load transaction:", err);
      setError("Failed to load transaction details.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadTransaction();
  }, [loadTransaction]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="flex justify-between items-start mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <p className="text-center text-gray-500">Loading transaction...</p>
      </div>
    );
  }

  if (error || !txn) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="flex justify-between items-start mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <p className="text-center text-gray-500">
          {error || "Transaction not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {TXN_TYPE_LABELS[txn.transaction_type] || txn.transaction_type}
              {txn.reference_no ? ` #${txn.reference_no}` : ""}
            </h1>
            <p className="text-gray-600 mt-1">
              Transaction Date: {formatDate(txn.date)}
            </p>
          </div>
        </div>
        <Badge
          className={
            TXN_TYPE_COLORS[txn.transaction_type] || "bg-gray-100 text-gray-800"
          }
        >
          {TXN_TYPE_LABELS[txn.transaction_type] || txn.transaction_type}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Transaction Summary</h2>

            {/* Amount banner */}
            <div className="bg-muted/10 border rounded-lg p-5 flex justify-between items-center mb-6">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Account Name</p>
                  <p className="text-lg font-bold">{txn.account_name}</p>
                  {txn.account_no && (
                    <p className="text-xs text-gray-500">
                      A/C No: {txn.account_no}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(txn.amount || 0)}
                </p>
              </div>
            </div>

            {/* Key fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{formatDate(txn.date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Reference No</p>
                  <p className="font-medium font-mono">
                    {txn.reference_no || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">
                    {TXN_TYPE_LABELS[txn.transaction_type] ||
                      txn.transaction_type}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Tally Parent Group</p>
                  <p className="font-medium">{txn.tally_parent_group || "—"}</p>
                </div>
              </div>
              {txn.type && (
                <div className="flex items-start gap-2">
                  <Scale className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Dr / Cr</p>
                    <p className="font-medium">{txn.type}</p>
                  </div>
                </div>
              )}
              {txn.item_name && (
                <div className="flex items-start gap-2">
                  <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Item Name</p>
                    <p className="font-medium">{txn.item_name}</p>
                  </div>
                </div>
              )}
            </div>

            {txn.narration && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-start gap-2">
                  <AlignLeft className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Narration</p>
                    <p className="font-medium whitespace-pre-wrap">
                      {txn.narration}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Amount Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold">
                  {formatCurrency(txn.amount || 0)}
                </span>
              </div>
              {txn.type && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-bold">{txn.type}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">Net:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(txn.amount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Record ID</p>
                <p className="text-xs font-mono text-gray-500 break-all">
                  #{txn.id}
                </p>
              </div>
              {txn.account_id && (
                <div>
                  <p className="text-sm text-gray-600">Account ID</p>
                  <p className="text-xs font-mono text-gray-500 break-all">
                    #{txn.account_id}
                  </p>
                </div>
              )}
              {txn.created_at && (
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="text-sm">
                    {new Date(txn.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  accountTransactionsList,
  accountTransactionsTallyExport,
  acGroupMastersList,
  type AccountTransaction,
  type ACGroupMaster,
} from "@/lib/backend";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

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

export function TallyGroupsList() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groups, setGroups] = useState<ACGroupMaster[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  useEffect(() => {
    acGroupMastersList().then(setGroups).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      if (search) params.search = search;
      if (typeFilter !== "all") params.type = typeFilter;
      if (groupFilter !== "all") params.tally_parent_group = groupFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await accountTransactionsList(params);
      setTransactions(data.results || []);
      setTotal(data.count || 0);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, groupFilter, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: {
        start_date?: string;
        end_date?: string;
      } = {};

      // Only add dates if they are provided
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      // Note: groupFilter is only used for display filtering, backend doesn't support tally_parent_group filter

      const blob = await accountTransactionsTallyExport(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename based on whether dates are provided
      const dateRange =
        startDate && endDate ? `_${startDate}_to_${endDate}` : "_all";
      link.download = `transactions${dateRange}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const description =
        startDate && endDate
          ? `Downloaded for ${startDate} to ${endDate}.`
          : "Downloaded all transactions.";

      toast({
        title: "Export successful",
        description,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Please try again.",
      });
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            All account transactions — sales, purchases, payments, receipts, and
            more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search by account name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="flex-1"
              />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px]"
              >
                <option value="all">All Types</option>
                {Object.entries(TXN_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={groupFilter}
                onChange={(e) => {
                  setGroupFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[160px]"
              >
                <option value="all">All Account Groups</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.tally_parent_group}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  From:
                </span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  To:
                </span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting}
                className="whitespace-nowrap"
              >
                <Download className="h-4 w-4 mr-1" />
                {exporting ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found.
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Tally Parent Group</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dr/Cr</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead className="text-center">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => (
                      <TableRow key={`${txn.transaction_type}-${txn.id}`}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {txn.date
                            ? new Date(txn.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {txn.account_name}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {txn.tally_parent_group || "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              TXN_TYPE_COLORS[txn.transaction_type] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {TXN_TYPE_LABELS[txn.transaction_type] ||
                              txn.transaction_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          {txn.type ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                txn.type === "Dr"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-green-50 text-green-700"
                              }`}
                            >
                              {txn.type}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium whitespace-nowrap">
                          {txn.amount
                            ? txn.amount.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0.00"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {txn.narration || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link
                            href={`/masters-hub/account-master/tally-group/detail/${txn.transaction_type}--${txn.id}`}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  subaccountsList,
  subaccountDelete,
  subaccountDetail,
  subaccountUpdate,
  exportSubaccountsAll,
  type SubAccount,
} from "@/lib/backend";
import { exportRowsToExcel, exportToExcel } from "@/lib/export";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Plus, Package } from "lucide-react";

type EditState = {
  open: boolean;
  record?: SubAccount | null;
};

export function SubAccountsList() {
  const { toast } = useToast();
  const router = useRouter();
  const [records, setRecords] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<EditState>({
    open: false,
    record: null,
  });
  const [saving, setSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize, search };
      const data = await subaccountsList(params);
      setRecords(data.items ?? data.results ?? []);
      setTotal(
        (data.total as number) ??
          (data.count as number) ??
          data.results?.length ??
          0
      );
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to load sub accounts" });
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this sub account?"
      );
      if (!confirmed) return;
      try {
        await subaccountDelete(id);
        toast({ title: "Deleted", description: "Sub account removed" });
        void fetchData();
      } catch (err) {
        toast({ variant: "destructive", title: "Delete failed" });
      }
    },
    [fetchData, toast]
  );

  const openEdit = useCallback(
    async (record: SubAccount) => {
      // Ensure we have fresh data
      try {
        const data = await subaccountDetail(record.id);
        setEditing({ open: true, record: data });
      } catch (err) {
        toast({ variant: "destructive", title: "Failed to load record" });
      }
    },
    [toast]
  );

  const closeEdit = useCallback(
    () => setEditing({ open: false, record: null }),
    []
  );

  const handleSaveEdit = useCallback(
    async (payload: Partial<SubAccount>) => {
      if (!editing.record) return;
      setSaving(true);
      try {
        await subaccountUpdate(editing.record.id, payload);
        toast({ title: "Saved", description: "Sub account updated" });
        closeEdit();
        void fetchData();
      } catch (err) {
        toast({ variant: "destructive", title: "Save failed" });
      } finally {
        setSaving(false);
      }
    },
    [editing, fetchData, closeEdit, toast]
  );

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const handleCreateOrder = useCallback(
    (subAccountId: string, accountId: string) => {
      // Navigate to order creation with pre-filled account and sub-account as URL parameters
      const params = new URLSearchParams({
        account: accountId,
        subaccount: subAccountId,
      });
      router.push(`/vouchers/new?${params.toString()}`);
    },
    [router]
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Sub Accounts List</CardTitle>
              <CardDescription>
                Browse and manage sub accounts with linked orders.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by name or phone"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Button onClick={() => void fetchData()}>Search</Button>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    const { blob, fileName } = await exportSubaccountsAll();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = fileName ?? "subaccounts_data.xlsx";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    toast({ title: "Sub accounts exported" });
                  } catch (err) {
                    toast({ variant: "destructive", title: "Export failed" });
                  }
                }}
              >
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-6 py-14 text-center text-sm text-muted-foreground">
              No sub accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-10"></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Sub Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Orders
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {records.map((r) => {
                    const isExpanded = expandedRows.has(r.id);
                    const linkedOrders = (r as any).linked_orders;
                    const ordersCount = linkedOrders?.orders_count || 0;
                    const paymentsCount = linkedOrders?.payments_count || 0;
                    const journalsCount = linkedOrders?.journals_count || 0;
                    const totalLinked =
                      ordersCount + paymentsCount + journalsCount;

                    return (
                      <React.Fragment key={r.id}>
                        <tr className="hover:bg-muted/40">
                          <td className="px-4 py-4">
                            {totalLinked > 0 && (
                              <button
                                onClick={() => toggleRow(r.id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {(r as any)?.account_detail?.name ??
                              (typeof r.account === "string"
                                ? r.account
                                : (r.account?.name ?? "—"))}
                          </td>
                          <td className="px-4 py-4 text-sm text-foreground font-medium">
                            {r.sub_account_name ?? "—"}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            <div className="space-y-1">
                              {r.phone_number && <div>📞 {r.phone_number}</div>}
                              {r.email && <div>📧 {r.email}</div>}
                              {!r.phone_number && !r.email && <div>—</div>}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {totalLinked > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                <Package className="h-3 w-3" />
                                {totalLinked}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No orders
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {totalLinked === 0 && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    handleCreateOrder(
                                      r.id,
                                      (r as any)?.account_detail?.id ||
                                        r.account
                                    )
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Create Order
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void openEdit(r)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => void handleDelete(r.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && linkedOrders && (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 bg-muted/20">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm">
                                  Linked Orders
                                </h4>

                                {linkedOrders.orders &&
                                  linkedOrders.orders.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                        Orders ({ordersCount})
                                      </h5>
                                      <div className="space-y-2">
                                        {linkedOrders.orders.map(
                                          (order: any) => (
                                            <div
                                              key={order.id}
                                              className="flex items-center justify-between p-2 bg-background rounded border"
                                            >
                                              <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium">
                                                  {order.bill_no ||
                                                    order.job_no}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                  {order.item_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                  {order.date}
                                                </span>
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  router.push(
                                                    `/vouchers/${order.id}`
                                                  )
                                                }
                                              >
                                                View
                                              </Button>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {linkedOrders.payments &&
                                  linkedOrders.payments.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                        Payments ({paymentsCount})
                                      </h5>
                                      <div className="space-y-2">
                                        {linkedOrders.payments.map(
                                          (payment: any) => (
                                            <div
                                              key={payment.id}
                                              className="flex items-center justify-between p-2 bg-background rounded border"
                                            >
                                              <div className="flex items-center gap-3">
                                                <span className="text-sm">
                                                  {payment.narration ||
                                                    "Payment"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                  {payment.date}
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {linkedOrders.journals &&
                                  linkedOrders.journals.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                        Journals ({journalsCount})
                                      </h5>
                                      <div className="space-y-2">
                                        {linkedOrders.journals.map(
                                          (journal: any) => (
                                            <div
                                              key={journal.id}
                                              className="flex items-center justify-between p-2 bg-background rounded border"
                                            >
                                              <div className="flex items-center gap-3">
                                                <span className="text-sm">
                                                  {journal.narration ||
                                                    "Journal"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                  {journal.date}
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleCreateOrder(
                                      r.id,
                                      (r as any)?.account_detail?.id ||
                                        r.account
                                    )
                                  }
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add New Order
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · {total} total
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      {editing.open && editing.record ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={closeEdit} />
          <div className="relative z-10 w-full max-w-2xl rounded bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Sub Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account
                </label>
                <div className="p-2 border rounded bg-muted/10">
                  {(editing.record as any)?.account_detail?.name ??
                    (typeof editing.record.account === "string"
                      ? editing.record.account
                      : (editing.record.account?.name ?? ""))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub Account Name
                </label>
                <Input
                  defaultValue={editing.record.sub_account_name ?? ""}
                  id="editSubName"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    defaultValue={editing.record.phone_number ?? ""}
                    id="editPhone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    defaultValue={editing.record.email ?? ""}
                    id="editEmail"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  defaultValue={editing.record.address ?? ""}
                  id="editAddress"
                  className="w-full border rounded p-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  defaultValue={editing.record.gender ?? ""}
                  id="editGender"
                  className="w-full border rounded p-2"
                >
                  <option value="">-- Select --</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHERS">Others</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={closeEdit}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const elSub = document.getElementById(
                      "editSubName"
                    ) as HTMLInputElement | null;
                    const elPhone = document.getElementById(
                      "editPhone"
                    ) as HTMLInputElement | null;
                    const elEmail = document.getElementById(
                      "editEmail"
                    ) as HTMLInputElement | null;
                    const elAddress = document.getElementById(
                      "editAddress"
                    ) as HTMLTextAreaElement | null;
                    const elGender = document.getElementById(
                      "editGender"
                    ) as HTMLSelectElement | null;

                    const payload: Partial<SubAccount> = {};
                    if (elSub) payload.sub_account_name = elSub.value || null;
                    if (elPhone) payload.phone_number = elPhone.value || null;
                    if (elEmail) payload.email = elEmail.value || null;
                    if (elAddress) payload.address = elAddress.value || null;
                    if (elGender) payload.gender = elGender.value || null;

                    await handleSaveEdit(payload);
                  }}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

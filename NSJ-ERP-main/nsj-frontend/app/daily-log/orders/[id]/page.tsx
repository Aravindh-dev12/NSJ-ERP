"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Package,
  Calendar,
  User,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderProgressTracker } from "@/components/vouchers/OrderProgressTracker";
import { voucherDetail } from "@/lib/backend";
import { cn as _cn } from "@/lib/utils";

export default function DailyLogOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    voucherDetail(id)
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => {
        console.error("Failed to fetch order:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#fafafa] min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-fuchsia-400 mx-auto" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Loading Order Details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#fafafa] min-h-screen">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              className="h-10 w-10 p-0 rounded-full hover:bg-gray-50 border border-gray-100 shadow-sm"
            >
              <Link href="/daily-log/orders">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-black text-gray-900">
                Order Not Found
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                The order you&apos;re looking for doesn&apos;t exist.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const orderBillNo =
    order.bill_no || order.job_no || order.voucher_number || id;
  const orderDate = order.date
    ? new Date(order.date).toLocaleDateString("en-IN", { dateStyle: "long" })
    : "—";
  const orderItem = order.item_name || "—";
  const orderAccount =
    typeof order.account === "object"
      ? order.account?.account_name || order.account?.name
      : order.account || "—";
  const orderStatus = order.status || "—";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#fafafa] min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              className="h-10 w-10 p-0 rounded-full hover:bg-gray-50 border border-gray-100 shadow-sm"
            >
              <Link href="/daily-log/orders">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 text-fuchsia-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                  Order #{orderBillNo}
                </h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Order Details & Query Orders
                </p>
              </div>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="h-11 px-6 rounded-xl border-gray-200 hover:bg-gray-50 font-bold"
          >
            <Link href={`/vouchers/${id}`}>Edit Order</Link>
          </Button>
        </div>

        {/* Order Info Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 pt-4 border-t border-gray-100">
          {[
            {
              label: "Date",
              value: orderDate,
              icon: <Calendar className="h-3.5 w-3.5 text-blue-400" />,
            },
            {
              label: "Item",
              value: orderItem,
              icon: <Tag className="h-3.5 w-3.5 text-purple-400" />,
            },
            {
              label: "Customer",
              value: orderAccount,
              icon: <User className="h-3.5 w-3.5 text-emerald-400" />,
            },
            {
              label: "Status",
              value: orderStatus,
              icon: <Package className="h-3.5 w-3.5 text-amber-400" />,
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-muted/20 p-3"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {icon}
                {label}
              </div>
              <p
                className="text-sm font-semibold text-foreground truncate"
                title={String(value)}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Query Orders Section */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-fuchsia-50 to-purple-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-fuchsia-600" />
            Query Orders
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Track the complete production workflow for this order
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <OrderProgressTracker orderId={id} />
        </CardContent>
      </Card>
    </div>
  );
}

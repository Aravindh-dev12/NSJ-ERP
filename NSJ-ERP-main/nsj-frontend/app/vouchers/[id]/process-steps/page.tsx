"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrderProcessSteps, OrderProcess } from "@/lib/backend";
import { OrderProgressTracker } from "@/components/vouchers/OrderProgressTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VoucherProcessStepsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const billNo = searchParams.get("order_id");

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderProcess | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    getOrderProcessSteps(id)
      .then((data) => {
        setOrderData(data);
      })
      .catch((err) => {
        console.error("Error loading process steps:", err);
        setError("Unable to load query orders for this order.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#fafafa] min-h-screen">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              className="h-10 w-10 p-0 rounded-full hover:bg-gray-50 border border-gray-100 shadow-sm"
            >
              <Link href="/query-orders">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                  Query Orders {billNo ? `- Order #${billNo}` : ""}
                </h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Production Workflow Details
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center p-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Loading Query Orders...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-xl">⚠</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Error Loading Query Orders
              </h3>
              <p className="text-sm text-gray-600 mb-6">{error}</p>
              <Button asChild variant="outline">
                <Link href="/query-orders">Go Back</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : orderData ? (
        <Card>
          <CardHeader>
            <CardTitle>Production Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderProgressTracker orderId={id} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-yellow-600 text-xl">ℹ</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No Query Orders Found
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                This order doesn&apos;t have a production workflow attached.
              </p>
              <Button asChild variant="outline">
                <Link href="/query-orders">Go Back</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

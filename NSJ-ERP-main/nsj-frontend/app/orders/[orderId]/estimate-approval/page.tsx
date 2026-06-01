"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Lock, Edit } from "lucide-react";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import { EstimateVoucherForm } from "@/components/vouchers/EstimateVoucherForm";
import { EstimateReadOnlyView } from "@/components/vouchers/EstimateReadOnlyView";
import {
  getOrderEstimateApproval,
  EstimateApprovalResponse,
  autoCompleteStep,
} from "@/lib/backend";

export default function EstimateApprovalPage() {
  const params = useParams();
  const { toast } = useToast();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [approvalData, setApprovalData] = useState<EstimateApprovalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrderEstimateApproval(orderId)
      .then((data) => setApprovalData(data))
      .catch((err: any) => {
        setError(err.message || "Failed to load estimate approval data");
        toast({ variant: "destructive", title: "Error", description: err.message });
      })
      .finally(() => setLoading(false));
  }, [orderId, toast]);

  const handleMarkAsDone = async () => {
    if (!approvalData?.estimate?.id) return;
    try {
      setMarkingDone(true);
      await autoCompleteStep(
        orderId,
        "Estimate Approval",
        approvalData.estimate.id,
        "Estimate approved by user"
      );
      toast({ title: "Estimate Approved", description: "Step has been locked." });
      const refreshed = await getOrderEstimateApproval(orderId);
      setApprovalData(refreshed);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to approve estimate",
      });
    } finally {
      setMarkingDone(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-96 w-full" /></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !approvalData) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <PreviousBackButton />
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600">{error || "No data available"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { estimate, is_locked, step_status, flow } = approvalData;
  const isAutoLinked = flow === "query_linked" || flow === "sale_conversion";

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PreviousBackButton />
            <div>
              <h1 className="text-2xl font-bold">Estimate Approval</h1>
              <p className="text-sm text-muted-foreground">
                Order ID: {orderId} • Status: {step_status}
              </p>
            </div>
          </div>
          <div>
            {is_locked ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg">
                <Edit className="h-4 w-4" />
                <span className="text-sm font-medium">Edit Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {is_locked && isAutoLinked ? (
          <div className="rounded-lg border border-green-300 bg-green-50 p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-green-700 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Estimate Linked &amp; Approved</p>
              <p className="text-sm text-green-700">
                This estimate was pre-linked when the order was created and has been automatically approved.
              </p>
            </div>
          </div>
        ) : is_locked ? (
          <div className="rounded-lg border border-green-300 bg-green-50 p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-green-700 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Estimate Approved</p>
              <p className="text-sm text-green-700">This estimate has been approved and the step is locked.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Edit className="h-5 w-5 text-blue-700 shrink-0" />
              <div>
                <p className="font-semibold text-blue-800">Fill Estimate Details</p>
                <p className="text-sm text-blue-700">
                  Add line items and amounts, then click "Approve Estimate" to lock this step.
                </p>
              </div>
            </div>
            <button
              onClick={handleMarkAsDone}
              disabled={markingDone}
              className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {markingDone ? "Approving..." : "Approve Estimate"}
            </button>
          </div>
        )}

        {/* Estimate Details */}
        {is_locked ? (
          <EstimateReadOnlyView estimate={estimate} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Estimate Details</CardTitle>
            </CardHeader>
            <CardContent>
              <EstimateVoucherForm
                initialData={estimate}
                estimateId={estimate.id}
                disableAccountAndItem={true}
                onSuccess={async () => {
                  const refreshed = await getOrderEstimateApproval(orderId);
                  setApprovalData(refreshed);
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

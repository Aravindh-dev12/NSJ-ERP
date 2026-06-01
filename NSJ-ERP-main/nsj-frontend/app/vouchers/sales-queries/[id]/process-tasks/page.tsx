"use client";

import { useParams, useRouter } from "next/navigation";
import { ProcessTaskReorder } from "@/components/sales-queries/ProcessTaskReorder";
import { ProcessTask } from "@/lib/processTasksApi";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProcessTasksPage() {
  const params = useParams();
  const router = useRouter();
  const salesQueryId = params.id as string;

  const handleSave = (_tasks: ProcessTask[], _isCustom: boolean) => {
    // Navigate back to sales query detail page
    router.push(`/vouchers/sales-queries/${salesQueryId}`);
  };

  const handleCancel = () => {
    // Navigate back to sales query detail page
    router.push(`/vouchers/sales-queries/${salesQueryId}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href={`/vouchers/sales-queries/${salesQueryId}`}>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales Lead
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Production Process Management</h1>
          <p className="text-sm text-gray-600">
            Configure the 29-step production pipeline for this order
          </p>
        </div>
      </div>

      {/* Process Task Reorder Component */}
      <ProcessTaskReorder
        salesQueryId={salesQueryId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}

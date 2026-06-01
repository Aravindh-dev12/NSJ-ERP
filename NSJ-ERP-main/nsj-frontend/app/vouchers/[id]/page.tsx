"use client";

import { useRouter } from "next/navigation";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import { Button } from "@/components/ui/button";

type Params = {
  id: string;
};

export default function VoucherEditPage({ params }: { params: Params }) {
  const { id } = params;
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <VouchersHeader title="Edit Order" description="Edit the order details" />

      <div className="rounded-lg border border-border bg-background p-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Edit functionality for order ID:{" "}
            <span className="font-mono font-medium">{id}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            This page can be customized with form fields as per your order
            model.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

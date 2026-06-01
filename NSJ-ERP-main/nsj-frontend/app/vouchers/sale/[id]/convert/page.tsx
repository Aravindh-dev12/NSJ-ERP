"use client";

import { use } from "react";
import { OrderConversionForm } from "@/components/vouchers/OrderConversionForm";

export default function OrderConversionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  return (
    <div className="container mx-auto px-4 py-8">
      <OrderConversionForm saleId={id} />
    </div>
  );
}

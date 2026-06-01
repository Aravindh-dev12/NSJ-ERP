"use client";

import { useEffect, useState } from "react";
import { QueryFormImproved } from "@/components/vouchers/QueryFormImproved";
import { OrderFormFromQuery } from "@/components/vouchers/OrderFormFromQuery";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function VoucherNewPage() {
  const [isFromQuery, setIsFromQuery] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsFromQuery(params.has("fromQuery"));
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <PreviousBackButton />
        </div>
        Loading...
      </div>
    );
  }

  // If coming from query conversion, show order form
  if (isFromQuery) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <PreviousBackButton />
        </div>
        <OrderFormFromQuery />
      </div>
    );
  }

  // Otherwise show query form
  return (
    <div className="p-6">
      <div className="mb-4">
        <PreviousBackButton />
      </div>
      <QueryFormImproved />
    </div>
  );
}

"use client";

import { EstimateVoucherForm } from "@/components/vouchers/EstimateVoucherForm";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function EstimateFormWrapper() {
  const searchParams = useSearchParams();
  const salesQueryId = searchParams.get("sales_query_id") || undefined;
  const saleId = searchParams.get("sale_id") || undefined;
  const jewelryType = searchParams.get("jewelry_type") || undefined;
  const sizeDetails = searchParams.get("size_details") || undefined;
  const accountId = searchParams.get("account_id") || undefined;
  const subAccountRecordId =
    searchParams.get("sub_account_record_id") || undefined;
  const subAccountName = searchParams.get("sub_account_name") || undefined;
  const subAccount = searchParams.get("sub_account") || undefined;
  const phoneNumber = searchParams.get("phone_number") || undefined;
  const salesPersonName = searchParams.get("sales_person_name") || undefined;
  const accountName = searchParams.get("account_name") || undefined;
  const orderId = searchParams.get("order_id") || undefined;
  const itemName = searchParams.get("item_name") || undefined;
  const goldQuality = searchParams.get("gold_quality") || undefined;

  return (
    <EstimateVoucherForm
      salesQueryId={salesQueryId}
      saleId={saleId}
      prefilledJewelryType={itemName || jewelryType}
      prefilledSizeDetails={sizeDetails}
      prefilledAccountId={accountId}
      prefilledAccountName={accountName}
      prefilledSubAccount={subAccountRecordId}
      prefilledSubAccountName={subAccountName || subAccount}
      prefilledPhoneNumber={phoneNumber}
      prefilledSalesPersonName={salesPersonName}
      prefilledOrderId={orderId}
      prefilledGoldQuality={goldQuality}
    />
  );
}

export default function NewEstimatePage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-5xl">
      <Suspense fallback={<div>Loading form...</div>}>
        <EstimateFormWrapper />
      </Suspense>
    </div>
  );
}

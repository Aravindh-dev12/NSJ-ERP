import React from "react";
import ReceiptClient from "@/components/receipt/ReceiptClient";

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const id = params?.id ?? "";
  return <ReceiptClient id={id} />;
}

// Required when using `output: export` in Next.js for dynamic routes.
// Returning an empty array ensures the static export step won't fail during dev/build.
export function generateStaticParams() {
  return [];
}

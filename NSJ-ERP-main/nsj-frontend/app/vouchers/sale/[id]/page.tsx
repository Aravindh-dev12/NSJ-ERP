"use client";
import { useParams } from "next/navigation";
import { SalesForm } from "@/components/vouchers/SalesForm";

export default function SaleEditPage() {
  const params = useParams();
  const id = params.id as string;

  return <SalesForm saleId={id} />;
}

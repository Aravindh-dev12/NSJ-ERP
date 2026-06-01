import { ItemFinalPackingListDetail } from "@/components/process/ItemFinalPackingListDetail";

export default function ItemFinalPackingListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ItemFinalPackingListDetail params={params} />;
}

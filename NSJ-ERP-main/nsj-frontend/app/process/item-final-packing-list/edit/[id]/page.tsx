import { EditItemFinalPackingListForm } from "@/components/process/EditItemFinalPackingListForm";

export default function EditItemFinalPackingListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EditItemFinalPackingListForm params={params} />;
}

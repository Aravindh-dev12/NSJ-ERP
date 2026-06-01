import { EditStoneDemandToBaggingForm } from "@/components/process/EditStoneDemandToBaggingForm";

export default function EditStoneDemandToBaggingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EditStoneDemandToBaggingForm params={params} />;
}

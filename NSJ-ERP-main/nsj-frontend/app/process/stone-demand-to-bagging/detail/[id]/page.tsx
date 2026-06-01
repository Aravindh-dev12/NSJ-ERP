import { StoneDemandToBaggingDetail } from "@/components/process/StoneDemandToBaggingDetail";

export default function StoneDemandToBaggingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <StoneDemandToBaggingDetail params={params} />;
}

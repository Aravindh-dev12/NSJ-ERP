"use client";

import { useEffect, useState } from "react";
import { GhatApprovalForm } from "@/components/process/GhatApprovalForm";

export default function EditGhatApprovalPage({
  params,
}: {
  params: { id: string };
}) {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    // In newer Next.js versions, params is already resolved
    setId(params.id);
  }, [params]);

  if (!id) return null;

  return <GhatApprovalForm mode="edit" id={id} />;
}

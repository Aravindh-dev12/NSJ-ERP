"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MastersHubPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/masters-hub/account-master");
  }, [router]);

  return null;
}

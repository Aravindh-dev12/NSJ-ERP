"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { goldPricesCurrent, goldPricesCheckPermission } from "@/lib/backend";
import { getTodayRates } from "@/lib/goldRateApi";

export function GoldPriceMandatoryPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  const checkGoldPrice = async () => {
    try {
      // Check new system first: if opening rate exists, we're good
      try {
        const { rates } = await getTodayRates();
        const hasOpeningRate = rates.some((r) => r.rate_type === "OPENING");
        if (hasOpeningRate) {
          return;
        }
      } catch (e) {
        // If new API fails, continue to legacy check
        console.error("Failed to check new gold rates:", e);
      }

      const [currentRate, permission] = await Promise.all([
        goldPricesCurrent(),
        goldPricesCheckPermission(),
      ]);

      // Redirect to gold rates page if:
      // 1. Today's rate is not fed (needs_feeding = true)
      // 2. User can update (mehul or niti)
      // 3. Not already on the gold rates page
      if (
        currentRate?.needs_feeding &&
        permission?.can_update &&
        pathname !== "/gold-rates"
      ) {
        router.push("/gold-rates");
      }
    } catch (error: any) {
      console.error("Failed to check gold price:", error);
      // Don't redirect if API fails - gracefully degrade
      // The system can still function without gold price check
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkGoldPrice();
  }, [pathname]);

  return null;
}

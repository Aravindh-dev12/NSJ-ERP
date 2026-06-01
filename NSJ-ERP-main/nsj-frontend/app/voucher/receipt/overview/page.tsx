"use client";

import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/constants";

export default function ReceiptOverviewPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/receipt/overview/`, {
          credentials: "include",
        });
        if (!mounted) return;
        if (!res.ok) {
          setError(`Server ${res.status}`);
          setLoading(false);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Unknown";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-6">Loading overview…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Receipt Overview</h1>
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded">
          Total Receipts: {(data?.total_count as number) ?? 0}
        </div>
        <div className="p-4 border rounded">
          Total Dr: {(data?.total_dr as number) ?? 0}
        </div>
        <div className="p-4 border rounded">
          Total Cr: {(data?.total_cr as number) ?? 0}
        </div>
        <div className="p-4 border rounded">
          Net Balance: {(data?.running_balance as number) ?? 0}
        </div>
      </div>

      <h2 className="mt-6 text-lg font-medium">Recent</h2>
      <ul className="mt-2 list-disc pl-6">
        {((data?.recent as Record<string, unknown>[]) || []).map(
          (r: Record<string, unknown>) => (
            <li key={r.id as string} className="mt-1">
              {r.date as string} — {r.type as string} —{" "}
              {r.party_name && typeof r.party_name === "object"
                ? ((r.party_name as Record<string, unknown>).name as string)
                : (r.party_name as string)}{" "}
              — Dr: {(r.dr as number) || 0} Cr: {(r.cr as number) || 0}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

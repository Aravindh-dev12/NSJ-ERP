"use client";

import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/constants";

export default function ReceiptListPage() {
  const [data, setData] = useState<{
    results: Record<string, unknown>[];
    count: number;
  }>({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/receipt/list/?page_size=50`, {
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

  if (loading) return <div className="p-6">Loading list…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Receipts</h1>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Party</th>
            <th className="border p-2">Balance</th>
            <th className="border p-2">Dr</th>
            <th className="border p-2">Cr</th>
            <th className="border p-2">Narration</th>
          </tr>
        </thead>
        <tbody>
          {(data.results || []).map((r: Record<string, unknown>) => (
            <tr key={r.id as string}>
              <td className="border p-2">{r.date as string}</td>
              <td className="border p-2">{r.type as string}</td>
              <td className="border p-2">
                {r.party_name && typeof r.party_name === "object"
                  ? ((r.party_name as Record<string, unknown>).name as string)
                  : (r.party_name as string)}
              </td>
              <td className="border p-2">{(r.balance as string) ?? ""}</td>
              <td className="border p-2">{(r.dr as string) ?? ""}</td>
              <td className="border p-2">{(r.cr as string) ?? ""}</td>
              <td className="border p-2">{(r.narration as string) ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

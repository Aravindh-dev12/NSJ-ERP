"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/constants";

export default function ReceiptAddNewPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "Dr",
    party_name: "",
    balance: "",
    dr: "",
    cr: "",
    narration: "",
  });

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/accounts/dropdown/`, {
          credentials: "include",
        });
        if (!mounted) return;
        if (!res.ok) return;
        const json = await res.json();
        setAccounts(json?.accounts ?? []);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, string | null> = {
        type: form.type,
        party_name: form.party_name || null,
        balance: form.balance || null,
        dr: form.dr || null,
        cr: form.cr || null,
        narration: form.narration || null,
      };

      const res = await fetch(`${API_BASE_URL}/receipt/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.message || JSON.stringify(j) || `Server ${res.status}`);
        setLoading(false);
        return;
      }
      // success -> redirect to list
      router.push("/voucher/receipt/list");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Add Receipt</h1>
      <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => onChange("type", e.target.value)}
            className="w-full border p-2"
          >
            <option value="Cr">Cr</option>
            <option value="Dr">Dr</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Party</label>
          <select
            value={form.party_name}
            onChange={(e) => onChange("party_name", e.target.value)}
            className="w-full border p-2"
          >
            <option value="">Select party</option>
            {accounts.map((a) => (
              <option key={a.id as string} value={a.id as string}>
                {a.name as string}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Balance</label>
          <input
            value={form.balance}
            onChange={(e) => onChange("balance", e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Dr</label>
            <input
              value={form.dr}
              onChange={(e) => onChange("dr", e.target.value)}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block mb-1">Cr</label>
            <input
              value={form.cr}
              onChange={(e) => onChange("cr", e.target.value)}
              className="w-full border p-2"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1">Narration</label>
          <textarea
            value={form.narration}
            onChange={(e) => onChange("narration", e.target.value)}
            className="w-full border p-2"
          />
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

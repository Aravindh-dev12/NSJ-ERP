// components/CompaniesCrud.tsx
"use client";

import { useEffect, useState } from "react";
import { backend, Company } from "@/lib/backend";

type Draft = {
  name: string;
  display_name?: string;
  is_active: boolean;
  address: string;
};

export default function CompaniesCrud() {
  const [rows, setRows] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [draft, setDraft] = useState<Draft>({
    name: "",
    display_name: "",
    is_active: true,
    address: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await backend.companiesList();
      setRows(data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate() {
    if (!draft.name.trim()) return;
    await backend.companyCreate(draft);
    setDraft({ name: "", display_name: "", is_active: true, address: "" });
    await refresh();
  }

  async function onSave(row: Company) {
    await backend.companyUpdate(row.id, {
      name: row.name,
      display_name: row.display_name,
      is_active: row.is_active,
      address: row.address,
    });
    setEditingId(null);
    await refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this company?")) return;
    await backend.companyDelete(id);
    await refresh();
  }

  if (loading) return <p>Loading…</p>;
  if (err) return <p style={{ color: "red" }}>{err}</p>;

  return (
    <div className="space-y-6">
      {/* Create */}
      <div className="rounded border p-4">
        <h3 className="mb-3 font-semibold">Create Company</h3>
        <div className="flex gap-2">
          <input
            className="border px-2 py-1 rounded w-56"
            placeholder="name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <input
            className="border px-2 py-1 rounded w-56"
            placeholder="display_name"
            value={draft.display_name ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, display_name: e.target.value }))
            }
          />
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) =>
                setDraft((d) => ({ ...d, is_active: e.target.checked }))
              }
            />
            active
          </label>
          <button
            className="rounded bg-blue-600 px-3 py-1 text-white"
            onClick={onCreate}
          >
            Add
          </button>
        </div>
      </div>

      {/* List / Edit / Delete */}
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Display Name</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isEditing = editingId === r.id;
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <input
                        className="border px-2 py-1 rounded w-56"
                        defaultValue={r.name}
                        onChange={(e) => (r.name = e.target.value)}
                      />
                    ) : (
                      r.name
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <input
                        className="border px-2 py-1 rounded w-56"
                        defaultValue={r.display_name ?? ""}
                        onChange={(e) => (r.display_name = e.target.value)}
                      />
                    ) : (
                      (r.display_name ?? "—")
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <input
                        type="checkbox"
                        defaultChecked={r.is_active}
                        onChange={(e) => (r.is_active = e.target.checked)}
                      />
                    ) : r.is_active ? (
                      "Yes"
                    ) : (
                      "No"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <>
                        <button
                          className="mr-2 rounded bg-green-600 px-3 py-1 text-white"
                          onClick={() => onSave(r)}
                        >
                          Save
                        </button>
                        <button
                          className="rounded bg-gray-300 px-3 py-1"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="mr-2 rounded bg-blue-600 px-3 py-1 text-white"
                          onClick={() => setEditingId(r.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded bg-red-600 px-3 py-1 text-white"
                          onClick={() => onDelete(r.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

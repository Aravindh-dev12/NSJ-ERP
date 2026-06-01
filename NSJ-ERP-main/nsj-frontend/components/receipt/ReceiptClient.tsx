"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/constants";

export default function ReceiptClient({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasLogoImage, setHasLogoImage] = useState(false);

  // check if a custom logo image exists at /images/nitishah-script.png and prefer it
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await fetch("/images/nitishah-script.png", {
          method: "HEAD",
        });
        if (!mounted) return;
        if (res.ok) setHasLogoImage(true);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/vouchers/${id}/receipt/`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!mounted) return;
        if (res.status === 401) {
          setError("Unauthorized. Please login.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const txt = await res.text();
          setError(`Server error: ${res.status} ${txt}`);
          setLoading(false);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    void fetchReceipt();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="p-6">Loading receipt…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">No data</div>;

  const order = data.order ?? {};
  const company = data.company ?? null;

  const uploadUrl = (() => {
    const f = order.upload_file || order.upload_file_url || null;
    return typeof f === "string" && f ? f : null;
  })();

  // small numeric formatter for display (keeps empty when not numeric)
  const fmtNumber = (v: any) => {
    if (v === null || v === undefined || v === "") return "";
    const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
    if (!Number.isFinite(n)) return String(v);
    return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
  };

  return (
    <div className="w-full bg-white print:bg-white">
      {/*
        Receipt header - pixel-focused layout.
        Developer note: place the exact provided logo PNG at `public/images/nitishah-logo.png`.
        The header is intentionally full width and uses fixed height + print rules in globals.css
        to keep the PDF/print view stable.
      */}
      <header className="receipt-header">
        <div className="receipt-left">
          {/* Prefer a provided decorative logo image (place your file at public/images/nitishah-script.png). */}
          {hasLogoImage ? (
            <img
              src="/images/nitishah-script.png"
              alt="NitiSHAH"
              className="receipt-logo"
            />
          ) : (
            <div className="logo-text-block" aria-hidden>
              <div className="logo-text">
                <span className="logo-script">Niti</span>
                <span className="logo-sans">SHAH</span>
              </div>
              <div className="logo-sub">
                CRAFTING LEGACIES&nbsp;&nbsp;&nbsp;&nbsp;2044
              </div>
              <div className="tagline-rule" />
            </div>
          )}
        </div>

        <div className="receipt-right">
          <div className="company-name">Niti Shah Jewels</div>
          <div className="company-lines">2/63 JVPD, NS Road No. 1</div>
          <div className="company-lines">Vile Parle West, Mumbai</div>
          <div className="company-lines">
            <svg
              className="icon-phone"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M3 5.5a2.5 2.5 0 0 1 2.5-2.5h1.5a1 1 0 0 1 1 1v2.2a1 1 0 0 1-.75.97l-1.1.3a12 12 0 0 0 5.95 5.95l.3-1.1a1 1 0 0 1 .97-.75h2.2a1 1 0 0 1 1 1v1.5A2.5 2.5 0 0 1 18.5 21H18A16 16 0 0 1 3 5.5z"
                stroke="#5a2d2d"
                strokeWidth="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="company-contact"> +919987520906</span>
          </div>
          <div className="company-lines">
            <svg
              className="icon-mail"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M3 6.5v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-11"
                stroke="#5a2d2d"
                strokeWidth="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 6.5l-9 6-9-6"
                stroke="#5a2d2d"
                strokeWidth="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="company-contact"> hello@nitishahjewels.com</span>
          </div>

          <div className="company-lines gst-block">
            <div>GSTIN/UIN: 27FSFFS4058J1Z5</div>
            <div>State Name: Maharashtra</div>
            <div>Code: 27</div>
          </div>
        </div>
      </header>

      {/* Tabular Order Form data - styled to resemble the reference table */}
      <section className="mt-4 mb-6">
        <div className="overflow-x-auto">
          <table
            className="w-full table-fixed border-collapse"
            style={{ border: "1px solid #5a2d2d" }}
          >
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "78%" }} />
            </colgroup>
            <thead>
              <tr className="bg-[#5a2d2d] text-white">
                <th
                  className="p-2 border-r"
                  style={{ borderRight: "1px solid rgba(255,255,255,0.2)" }}
                >
                  Field Name
                </th>
                <th className="p-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: "bill_no", label: "Bill No. (auto)" },
                { key: "date", label: "Date" },
                { key: "account", label: "Account" },
                { key: "item_name", label: "Item name" },
                { key: "design", label: "Design" },
                { key: "job_no", label: "Job No. (auto)" },
                { key: "series", label: "Series" },
                { key: "stamp", label: "Stamp" },
                { key: "gold_rate", label: "Gold rate" },
                { key: "base_metal", label: "Base metal" },
                { key: "size", label: "Size" },
                { key: "number_of_pieces", label: "Number of pieces" },
                {
                  key: "estimated_gross_weight",
                  label: "Estimated gross weight",
                },
                {
                  key: "estimated_gold_weight",
                  label: "Estimated gold weight",
                },
                {
                  key: "estimated_diamond_weight",
                  label: "Estimated diamond weight",
                },
                { key: "tunch_percent", label: "Tunch percent (purity)" },
                { key: "average_diamond_rate", label: "Average diamond rate" },
                {
                  key: "gemstone_stone_weight",
                  label: "Gemstone / stone weight",
                },
                { key: "craftsmanship_fee", label: "Craftsmanship fee" },
                {
                  key: "advance_payment_received",
                  label: "Advance payment received",
                },
                // include line-level fields so print shows everything entered on the Add Order form
                { key: "wt", label: "Wt (line)" },
                { key: "unit", label: "Unit" },
                { key: "rate_item", label: "Rate (per unit)" },
                { key: "discount", label: "Discount %" },
                { key: "value_item", label: "Value (item)" },
              ].map((f) => (
                <tr key={f.key} className="odd:bg-white even:bg-gray-50">
                  <td
                    className="p-2 align-top border-t"
                    style={{ borderTop: "1px solid #e6d8d8" }}
                  >
                    <div className="text-sm font-semibold text-[#5a2d2d]">
                      {f.label}
                    </div>
                  </td>
                  <td
                    className="p-2 align-top border-t"
                    style={{ borderTop: "1px solid #e6d8d8" }}
                  >
                    <div className="text-sm">
                      {f.key === "account" || f.key === "item_name"
                        ? renderField((order as any)[f.key])
                        : typeof (order as any)[f.key] === "number"
                          ? fmtNumber((order as any)[f.key])
                          : renderField((order as any)[f.key])}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {uploadUrl && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold">Attachment</h2>
          <div className="mt-2">
            {uploadUrl.endsWith(".pdf") ? (
              <a
                href={uploadUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600"
              >
                Open PDF
              </a>
            ) : (
              <img
                src={uploadUrl}
                alt="attachment"
                style={{ maxWidth: "320px" }}
              />
            )}
          </div>
        </section>
      )}

      <div className="flex gap-3 justify-end">
        <button
          className="px-4 py-2 border rounded"
          type="button"
          onClick={() => router.back()}
        >
          Close
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          type="button"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>
    </div>
  );
}

function renderField(val: any): string {
  if (!val && val !== 0) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") {
    // prefer name -> display_name -> id
    if (val.name) return String(val.name);
    if (val.display_name) return String(val.display_name);
    if (val.id) return String(val.id);
    // if it's an array-like object, join
    if (Array.isArray(val)) return val.map((v) => String(v)).join(", ");
    try {
      return String(val);
    } catch (e) {
      return "";
    }
  }
  return String(val);
}

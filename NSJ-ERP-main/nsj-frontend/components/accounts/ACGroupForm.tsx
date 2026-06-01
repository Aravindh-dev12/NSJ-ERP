"use client";

import React, { useEffect, useState } from "react";
import { backend, acGroupCreate, acGroupMastersList } from "../../lib/backend";
import type { ACGroupMaster, ACGroup } from "../../lib/backend";
import { exportToExcel } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  initial?: Partial<ACGroup>;
};

const YES_NO = ["YES", "NO"] as const;

function isAdminUser(user: ReturnType<typeof useAuth>["user"]): boolean {
  if (!user) return false;
  if (user.is_superuser) return true;
  const role = (user as { role?: string }).role;
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export default function ACGroupForm({ initial }: Props) {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);

  const [masters, setMasters] = useState<ACGroupMaster[]>([]);
  const [acGroupId, setAcGroupId] = useState<string | undefined>(
    initial?.ac_group_id ?? ""
  );
  const [inclInSale, setInclInSale] = useState<string | null>(
    initial?.incl_in_sale ?? "NO"
  );
  const [inclInPur, setInclInPur] = useState<string | null>(
    initial?.incl_in_pur ?? "NO"
  );
  const [inclInOut, setInclInOut] = useState<string | null>(
    initial?.incl_in_out ?? "NO"
  );
  const [inclInIR, setInclInIR] = useState<string | null>(
    initial?.incl_in_ir ?? "NO"
  );
  const [addressReq, setAddressReq] = useState<string | null>(
    initial?.address_req ?? "NO"
  );
  const [restrictCredit, setRestrictCredit] = useState<string | null>(
    initial?.restrict_credit_facility ?? "NO"
  );

  // State for the 6 main dropdown fields
  const [tallyParentGroup, setTallyParentGroup] = useState<string>(
    initial?.tally_parent_group ?? ""
  );
  const [financialStatement, setFinancialStatement] = useState<
    "Balance Sheet" | "Profit & Loss" | ""
  >(initial?.financial_statement ?? "");
  const [universalNature, setUniversalNature] = useState<
    "Asset" | "Liability" | "Income" | "Expense" | "Capital" | ""
  >(initial?.universal_nature ?? "");
  const [normalBalance, setNormalBalance] = useState<"Dr" | "Cr" | "">(
    initial?.normal_balance ?? ""
  );
  const [status, setStatus] = useState<"Active" | "Restricted">(
    initial?.status ?? "Active"
  );

  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    acGroupMastersList()
      .then((data) => {
        if (mounted) setMasters(data);
      })
      .catch(() => {
        if (mounted) setMasters([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Get selected master details
  const selectedMaster = masters.find((m) => m.id === acGroupId);

  // Auto-populate dropdowns when master is selected
  useEffect(() => {
    if (selectedMaster) {
      setTallyParentGroup(selectedMaster.tally_parent_group);
      setFinancialStatement(selectedMaster.financial_statement);
      setUniversalNature(selectedMaster.universal_nature);
      setNormalBalance(selectedMaster.normal_balance);
      setStatus(selectedMaster.status);
    }
  }, [selectedMaster]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acGroupId) {
      alert("Please select A/C Group Name");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<ACGroup> = {
        ac_group_id: acGroupId,
        // 6 main fields from dropdowns
        tally_parent_group: tallyParentGroup,
        financial_statement: financialStatement as
          | "Balance Sheet"
          | "Profit & Loss",
        universal_nature: universalNature as
          | "Asset"
          | "Liability"
          | "Income"
          | "Expense"
          | "Capital",
        normal_balance: normalBalance as "Dr" | "Cr",
        status: status,
        // Usage flags
        incl_in_sale: (inclInSale ?? "NO") as "YES" | "NO",
        incl_in_pur: (inclInPur ?? "NO") as "YES" | "NO",
        incl_in_out: (inclInOut ?? "NO") as "YES" | "NO",
        incl_in_ir: (inclInIR ?? "NO") as "YES" | "NO",
        address_req: (addressReq ?? "NO") as "YES" | "NO",
        restrict_credit_facility: (restrictCredit ?? "NO") as "YES" | "NO",
      };
      await acGroupCreate(payload);
      alert("A/C Group saved successfully");
      // reset form
      setAcGroupId("");
      setTallyParentGroup("");
      setFinancialStatement("");
      setUniversalNature("");
      setNormalBalance("");
      setStatus("Active");
      setInclInSale("NO");
      setInclInPur("NO");
      setInclInOut("NO");
      setInclInIR("NO");
      setAddressReq("NO");
      setRestrictCredit("NO");
    } catch (err) {
      console.error(err);
      alert("Failed to save A/C Group");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 bg-red-50 text-red-800 rounded border border-red-200">
        <h3 className="font-semibold text-lg mb-2">Access Restricted</h3>
        <p>
          You do not have permission to create or modify Account Groups. This
          action is restricted to administrators only.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="p-4 bg-white rounded shadow">
      <div className="mb-4">
        <label
          htmlFor="ac-group-name"
          className="block text-sm font-medium text-gray-700"
        >
          1. Spark Account Group <span className="text-red-500">*</span>
        </label>
        <select
          id="ac-group-name"
          value={acGroupId}
          onChange={(e) => setAcGroupId(e.target.value)}
          className="mt-1 block w-full border rounded p-2"
        >
          <option value="">-- Select A/C Group --</option>
          {masters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* 6 Dropdown fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* 2. Tally Parent Group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            2. Tally Parent Group
          </label>
          <select
            value={tallyParentGroup}
            onChange={(e) => setTallyParentGroup(e.target.value)}
            className="block w-full border rounded p-2"
          >
            <option value="">-- Select --</option>
            <option value="Current Assets">Current Assets</option>
            <option value="Current Liabilities">Current Liabilities</option>
            <option value="Fixed Assets">Fixed Assets</option>
            <option value="Capital Account">Capital Account</option>
            <option value="Direct Expenses">Direct Expenses</option>
            <option value="Indirect Expenses">Indirect Expenses</option>
            <option value="Direct Income">Direct Income</option>
            <option value="Indirect Income">Indirect Income</option>
            <option value="Loans (Liability)">Loans (Liability)</option>
            <option value="Loans & Advances (Asset)">
              Loans & Advances (Asset)
            </option>
            <option value="Sundry Creditors">Sundry Creditors</option>
            <option value="Sundry Debtors">Sundry Debtors</option>
            <option value="Duties & Taxes">Duties & Taxes</option>
            <option value="Bank Accounts">Bank Accounts</option>
            <option value="Cash-in-Hand">Cash-in-Hand</option>
            <option value="Stock-in-Hand">Stock-in-Hand</option>
            <option value="Investments">Investments</option>
            <option value="Deposits (Asset)">Deposits (Asset)</option>
            <option value="Provisions">Provisions</option>
            <option value="Reserves & Surplus">Reserves & Surplus</option>
            <option value="Sales Accounts">Sales Accounts</option>
            <option value="Purchase Accounts">Purchase Accounts</option>
            <option value="Misc. Expenses (Asset)">
              Misc. Expenses (Asset)
            </option>
            <option value="Suspense Account">Suspense Account</option>
          </select>
        </div>

        {/* 3. Financial Statement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            3. Financial Statement
          </label>
          <select
            value={financialStatement}
            onChange={(e) =>
              setFinancialStatement(
                e.target.value as "Balance Sheet" | "Profit & Loss"
              )
            }
            className="block w-full border rounded p-2"
          >
            <option value="">-- Select --</option>
            <option value="Balance Sheet">Balance Sheet</option>
            <option value="Profit & Loss">Profit & Loss</option>
          </select>
        </div>

        {/* 4. Universal Nature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            4. Universal Nature
          </label>
          <select
            value={universalNature}
            onChange={(e) =>
              setUniversalNature(
                e.target.value as
                  | "Asset"
                  | "Liability"
                  | "Income"
                  | "Expense"
                  | "Capital"
              )
            }
            className="block w-full border rounded p-2"
          >
            <option value="">-- Select --</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
            <option value="Capital">Capital</option>
          </select>
        </div>

        {/* 5. Normal Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            5. Normal Balance
          </label>
          <select
            value={normalBalance}
            onChange={(e) => setNormalBalance(e.target.value as "Dr" | "Cr")}
            className="block w-full border rounded p-2"
          >
            <option value="">-- Select --</option>
            <option value="Dr">Dr (Debit)</option>
            <option value="Cr">Cr (Credit)</option>
          </select>
        </div>

        {/* 6. Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            6. Status
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "Active" | "Restricted")
            }
            className="block w-full border rounded p-2"
          >
            <option value="Active">Active</option>
            <option value="Restricted">Restricted</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="incl-in-sale"
            className="block text-sm font-medium text-gray-700"
          >
            Incl. in Sale
          </label>
          <select
            id="incl-in-sale"
            value={inclInSale ?? "NO"}
            onChange={(e) => setInclInSale(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          >
            {YES_NO.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="incl-in-pur"
            className="block text-sm font-medium text-gray-700"
          >
            Incl. in Pur
          </label>
          <select
            id="incl-in-pur"
            value={inclInPur ?? "NO"}
            onChange={(e) => setInclInPur(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          >
            {YES_NO.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="incl-in-out"
            className="block text-sm font-medium text-gray-700"
          >
            Incl. in Out
          </label>
          <select
            id="incl-in-out"
            value={inclInOut ?? "NO"}
            onChange={(e) => setInclInOut(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          >
            {YES_NO.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="incl-in-ir"
            className="block text-sm font-medium text-gray-700"
          >
            Incl. in I/R
          </label>
          <select
            id="incl-in-ir"
            value={inclInIR ?? "NO"}
            onChange={(e) => setInclInIR(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          >
            {YES_NO.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="address-req"
            className="block text-sm font-medium text-gray-700"
          >
            Address Req
          </label>
          <select
            id="address-req"
            value={addressReq ?? "NO"}
            onChange={(e) => setAddressReq(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          >
            {YES_NO.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="restrict-credit"
            className="block text-sm font-medium text-gray-700"
          >
            Restrict Credit Facility
          </label>
          <select
            id="restrict-credit"
            value={restrictCredit ?? "NO"}
            onChange={(e) => setRestrictCredit(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          >
            {YES_NO.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

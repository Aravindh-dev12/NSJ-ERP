"use client";

import React, { useEffect, useState } from "react";
import { accountsDropdown, subaccountCreate } from "../../lib/backend";
import type { SubAccount } from "../../lib/backend";
import { exportToExcel } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

export default function SubAccountForm() {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [subName, setSubName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    accountsDropdown()
      .then((data) => {
        if (mounted) setAccounts(data);
      })
      .catch(() => {
        if (mounted) setAccounts([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast({ variant: "destructive", title: "Please select an Account" });
      return;
    }
    if (!subName) {
      toast({ variant: "destructive", title: "Please enter Sub Account Name" });
      return;
    }
    // Client-side validation for phone: numeric only, max 10 digits
    if (phone && !/^[0-9]{1,10}$/.test(phone)) {
      toast({
        variant: "destructive",
        title: "Phone must contain only numbers and be at most 10 digits",
      });
      return;
    }
    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        variant: "destructive",
        title: "Please enter a valid email address",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<SubAccount> = {
        account: accountId,
        sub_account_name: subName,
        phone_number: phone || null,
        email: email || null,
        address: address || null,
        gender: gender || null,
      };
      await subaccountCreate(payload);
      toast({
        title: "Success",
        description: "Sub Account saved successfully",
      });
      // reset
      setAccountId("");
      setSubName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setGender("");
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Failed to save Sub Account" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="p-6 bg-white rounded-lg shadow space-y-6"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="account-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Account <span className="text-red-500">*</span>
          </label>
          <select
            id="account-select"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">-- Select Account --</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="sub-account-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sub Account Name <span className="text-red-500">*</span>
          </label>
          <input
            id="sub-account-name"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter contact person name"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="10-digit number"
              maxLength={10}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Enter full address"
          />
        </div>

        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Gender
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select --</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHERS">Others</option>
          </select>
        </div>
      </div>

      {/* <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          
        </p>
      </div> */}

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => {
            // Collect current form data and headers
            const headers = [
              "Account",
              "Sub Account Name",
              "Phone Number",
              "Email",
              "Address",
              "Gender",
            ];
            const selectedAccount =
              accounts.find((a) => a.id === accountId)?.name ?? "";
            const dataRow = [
              selectedAccount,
              subName || null,
              phone || null,
              email || null,
              address || null,
              gender || null,
            ];
            const res = exportToExcel({
              formName: "Sub Account",
              headers,
              dataRow,
              includeFooterTimestamp: true,
            });
            if (res.ok) {
              toast({ title: "Form data successfully exported to Excel." });
            } else {
              toast({ variant: "destructive", title: "Export failed" });
            }
          }}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Export Data
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Sub Account"}
        </button>
      </div>
    </form>
  );
}

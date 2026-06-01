import React, { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import {
  Mail,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
} from "lucide-react";
import { ActivityLog } from "@/components/ActivityLog";

const PAGE_SIZE = 20;
const PaymentTracking: React.FC = () => {
  // Dropdown state
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const partyDropdownRef = useRef<HTMLDivElement>(null);
  const partyButtonRef = useRef<HTMLButtonElement>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string[]>([]);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const monthButtonRef = useRef<HTMLButtonElement>(null);
  const [partyFilter, setPartyFilter] = useState<string[]>([]);

  // Filtering logic and unique values for dropdowns

  useEffect(() => {
    Papa.parse("/Raw data dump-June to August sales.csv", {
      download: true,
      header: true,
      delimiter: ";",
      skipEmptyLines: "greedy",
      complete: (results) => {
        setInvoices(
          (results.data as any[]).filter((row) => row && row["Invoice No"])
        );
      },
    });
  }, []);

  const getStatusIcon = (row: any) => {
    const status = getStatus(row);
    switch (status) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "overdue":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (row: any) => {
    const status = getStatus(row);
    const daysOverdue = getDaysOverdue(row);
    switch (status) {
      case "paid":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Paid
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Pending
          </span>
        );
      case "overdue":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            {daysOverdue} days overdue
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            Unknown
          </span>
        );
    }
  };

  function getStatus(row: any) {
    if (parseFloat(row["Disc %"] || "0") > 40) return "overdue";
    if (parseFloat(row["Net Amount"] || "0") > 0) return "paid";
    return "pending";
  }

  function getDaysOverdue(row: any) {
    return parseFloat(row["Disc %"] || "0") > 40
      ? Math.floor(parseFloat(row["Disc %"]))
      : 0;
  }

  const totalOutstanding = invoices.reduce(
    (sum: number, row: any) => sum + parseFloat(row["Net Amount"] || "0"),
    0
  );

  // Close dropdowns on outside click
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      // Status dropdown
      if (showStatusDropdown) {
        if (
          statusDropdownRef.current?.contains(target) ||
          statusButtonRef.current?.contains(target)
        ) {
          return;
        }
        setShowStatusDropdown(false);
      }
      // Party dropdown
      if (showPartyDropdown) {
        if (
          partyDropdownRef.current?.contains(target) ||
          partyButtonRef.current?.contains(target)
        ) {
          return;
        }
        setShowPartyDropdown(false);
      }
      // Month dropdown
      if (showMonthDropdown) {
        if (
          monthDropdownRef.current?.contains(target) ||
          monthButtonRef.current?.contains(target)
        ) {
          return;
        }
        setShowMonthDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showStatusDropdown, showPartyDropdown, showMonthDropdown]);

  // Filtering logic
  const filteredInvoices = invoices.filter((row) => {
    const matchesSearch =
      search === "" ||
      (row["Invoice No"] &&
        row["Invoice No"].toLowerCase().includes(search.toLowerCase())) ||
      (row["Party Name"] &&
        row["Party Name"].toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(getStatus(row));
    const matchesMonth =
      monthFilter.length === 0 ||
      monthFilter.some(
        (m) => row["Invoice Date"] && row["Invoice Date"].includes(m)
      );
    const matchesParty =
      partyFilter.length === 0 || partyFilter.includes(row["Party Name"]);
    return matchesSearch && matchesStatus && matchesMonth && matchesParty;
  });

  // Unique values for dropdowns
  const partyNames = Array.from(
    new Set(invoices.map((row) => row["Party Name"]).filter(Boolean))
  );
  const months = Array.from(
    new Set(
      invoices
        .map((row) =>
          row["Invoice Date"] ? row["Invoice Date"].slice(3, 10) : ""
        )
        .filter(Boolean)
    )
  );

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Tracking
            </h3>
            <p className="text-sm text-gray-600">
              Monitor invoice status and send reminders
            </p>
          </div>
          <div className="flex gap-4 mb-6">
            {/* Due Soon Card */}
            <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm py-6 w-1/4 min-w-[110px]">
              <Clock className="h-7 w-7 text-yellow-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {invoices.filter((row) => getStatus(row) === "pending").length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Due Soon</div>
            </div>
            {/* Overdue Card */}
            <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm py-6 w-1/4 min-w-[110px]">
              <AlertTriangle className="h-7 w-7 text-red-500 mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {invoices.filter((row) => getStatus(row) === "overdue").length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Overdue</div>
            </div>
            {/* Outstanding Card */}
            <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm py-6 w-1/2 min-w-[110px]">
              <Calendar className="h-7 w-7 text-blue-500 mb-2" />
              <div className="text-2xl font-bold text-blue-900">
                ₹{Math.round(totalOutstanding / 1000000)}K
              </div>
              <div className="text-sm text-gray-500 mt-1">Outstanding</div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 mb-2 items-center">
          <input
            type="text"
            placeholder="Search by Invoice No or Party Name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
          />
          {/* Custom multi-select dropdown for Status */}
          <div className="relative">
            <button
              type="button"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[120px] bg-white flex items-center justify-between"
              onClick={() => setShowStatusDropdown((s) => !s)}
              ref={statusButtonRef}
            >
              {statusFilter.length === 0
                ? "All Status"
                : statusFilter
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(", ")}
              <span className="ml-2">▼</span>
            </button>
            {showStatusDropdown && (
              <div
                className="absolute z-10 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg"
                ref={statusDropdownRef}
              >
                <div
                  className="px-4 py-2 cursor-pointer text-red-600 hover:bg-red-50 border-b border-gray-100"
                  onClick={() => setStatusFilter([])}
                >
                  Unselect All
                </div>
                {["paid", "pending", "overdue"].map((status) => (
                  <div
                    key={status}
                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center ${statusFilter.includes(status) ? "bg-blue-100" : ""}`}
                    onClick={() => {
                      setStatusFilter(
                        statusFilter.includes(status)
                          ? statusFilter.filter((s) => s !== status)
                          : [...statusFilter, status]
                      );
                      setVisibleCount(PAGE_SIZE);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      readOnly
                      className="mr-2"
                    />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[120px] bg-white flex items-center justify-between"
              onClick={() => setShowMonthDropdown((s) => !s)}
              ref={monthButtonRef}
            >
              {monthFilter.length === 0 ? "All Months" : monthFilter.join(", ")}
              <span className="ml-2">▼</span>
            </button>
            {showMonthDropdown && (
              <div
                className="absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                ref={monthDropdownRef}
              >
                <div
                  className="px-4 py-2 cursor-pointer text-red-600 hover:bg-red-50 border-b border-gray-100"
                  onClick={() => setMonthFilter([])}
                >
                  Unselect All
                </div>
                {months.map((month) => (
                  <div
                    key={month}
                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center ${monthFilter.includes(month) ? "bg-blue-100" : ""}`}
                    onClick={() => {
                      setMonthFilter(
                        monthFilter.includes(month)
                          ? monthFilter.filter((m) => m !== month)
                          : [...monthFilter, month]
                      );
                      setVisibleCount(PAGE_SIZE);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={monthFilter.includes(month)}
                      readOnly
                      className="mr-2"
                    />
                    {month}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Custom multi-select dropdown for Party */}
          <div className="relative">
            <button
              type="button"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[120px] bg-white flex items-center justify-between"
              onClick={() => setShowPartyDropdown((s) => !s)}
              ref={partyButtonRef}
            >
              {partyFilter.length === 0
                ? "All Parties"
                : partyFilter.join(", ")}
              <span className="ml-2">▼</span>
            </button>
            {showPartyDropdown && (
              <div
                className="absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                ref={partyDropdownRef}
              >
                <div
                  className="px-4 py-2 cursor-pointer text-red-600 hover:bg-red-50 border-b border-gray-100"
                  onClick={() => setPartyFilter([])}
                >
                  Unselect All
                </div>
                {partyNames.map((name) => (
                  <div
                    key={name}
                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center ${partyFilter.includes(name) ? "bg-blue-100" : ""}`}
                    onClick={() => {
                      setPartyFilter(
                        partyFilter.includes(name)
                          ? partyFilter.filter((p) => p !== name)
                          : [...partyFilter, name]
                      );
                      setVisibleCount(PAGE_SIZE);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={partyFilter.includes(name)}
                      readOnly
                      className="mr-2"
                    />
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {search && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
              Search: &quot;{search}&quot;
              <button
                className="ml-2 text-blue-500 hover:text-blue-700"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            </span>
          )}
          {statusFilter.map((status) => (
            <span
              key={status}
              className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center"
            >
              Status: {status.charAt(0).toUpperCase() + status.slice(1)}
              <button
                className="ml-2 text-green-500 hover:text-green-700"
                onClick={() =>
                  setStatusFilter(statusFilter.filter((s) => s !== status))
                }
              >
                ×
              </button>
            </span>
          ))}
          {monthFilter.map((month) => (
            <span
              key={month}
              className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center"
            >
              Month: {month}
              <button
                className="ml-2 text-yellow-500 hover:text-yellow-700"
                onClick={() =>
                  setMonthFilter(monthFilter.filter((m) => m !== month))
                }
              >
                ×
              </button>
            </span>
          ))}
          {partyFilter.map((party) => (
            <span
              key={party}
              className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium flex items-center"
            >
              Party: {party}
              <button
                className="ml-2 text-purple-500 hover:text-purple-700"
                onClick={() =>
                  setPartyFilter(partyFilter.filter((p) => p !== party))
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Invoice No
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Party Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Net Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Invoice Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices
                .slice(0, visibleCount)
                .map((row: any, index: number) => (
                  <tr
                    key={`${row["Invoice No"]}-${index}`}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-gray-25" : ""}`}
                  >
                    <td className="py-3 px-4 text-sm">{row["Invoice No"]}</td>
                    <td className="py-3 px-4 text-sm">{row["Party Name"]}</td>
                    <td className="py-3 px-4 text-sm">
                      ₹{parseFloat(row["Net Amount"] || "0").toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm">{row["Invoice Date"]}</td>
                    <td className="py-3 px-4 text-sm">{getStatusBadge(row)}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          title="Send Email"
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Mail className="h-4 w-4 text-blue-500" />
                        </button>
                        <button
                          title="Send Whatsapp"
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <MessageCircle className="h-4 w-4 text-green-500" />
                        </button>
                        <button
                          title="Mark as Paid"
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </button>
                        <button
                          title="Delete"
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {visibleCount < filteredInvoices.length && (
          <div className="flex justify-center mt-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
              onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
            >
              Show More
            </button>
          </div>
        )}
      </div>
      <ActivityLog />
    </div>
  );
};

export default PaymentTracking;

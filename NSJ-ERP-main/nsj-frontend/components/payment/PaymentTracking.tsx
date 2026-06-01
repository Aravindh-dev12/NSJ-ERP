import React, { useState } from "react";
import { PaymentFilters } from "./PaymentFilters";
import { PaymentTable } from "./PaymentTable";
import { BulkActions } from "./BulkActions";
import { ScheduleBuilder } from "./ScheduleBuilder";
import { ActivityLog } from "./ActivityLog";
import { Calendar, Clock, AlertTriangle } from "lucide-react";

export const PaymentTracking = () => {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showScheduleBuilder, setShowScheduleBuilder] = useState(false);
  const [filters, setFilters] = useState({
    vendor: "",
    invoice_no: "",
    status: "all",
    overdue_days: "",
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectionChange = (invoiceIds: string[]) => {
    setSelectedInvoices(invoiceIds);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Tracking</h1>
          <p className="text-gray-600">
            Monitor invoices and manage payment reminders
          </p>
        </div>

        {/* Summary Cards */}
        <div className="flex space-x-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">23</p>
            <p className="text-sm text-gray-600">Due Soon</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">12</p>
            <p className="text-sm text-gray-600">Overdue</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$453K</p>
            <p className="text-sm text-gray-600">Outstanding</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <PaymentFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <BulkActions
          selectedCount={selectedInvoices.length}
          onScheduleBuilder={() => setShowScheduleBuilder(true)}
        />
      )}

      {/* Payment Table */}
      <PaymentTable
        selectedInvoices={selectedInvoices}
        onSelectionChange={handleSelectionChange}
      />

      {/* Schedule Builder Modal */}
      {showScheduleBuilder && (
        <ScheduleBuilder onClose={() => setShowScheduleBuilder(false)} />
      )}

      {/* Activity Log */}
      <ActivityLog />
    </div>
  );
};

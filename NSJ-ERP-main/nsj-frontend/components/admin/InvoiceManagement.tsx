import React, { useState } from "react";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";

export const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([
    {
      id: "1",
      invoice_no: "INV-2024-001",
      vendor_id: "1",
      vendor_name: "Acme Corporation",
      amount: 12450,
      currency: "USD",
      issue_date: "2024-01-01",
      due_date: "2024-01-31",
      status: "paid",
      payment_link: "https://pay.example.com/inv-001",
      notes: "Office supplies for Q1",
    },
    {
      id: "2",
      invoice_no: "INV-2024-002",
      vendor_id: "2",
      vendor_name: "TechStart Solutions",
      amount: 8750,
      currency: "USD",
      issue_date: "2024-01-05",
      due_date: "2024-01-20",
      status: "overdue",
      payment_link: "https://pay.example.com/inv-002",
      notes: "Software development services",
    },
  ]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: "bg-gray-100 text-gray-800",
      due: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800",
      paid: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusConfig[status as keyof typeof statusConfig] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Invoice Management
        </h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Invoice</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Invoice
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Vendor
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Amount
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Issue Date
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Due Date
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, index) => (
                <tr
                  key={invoice.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-gray-25" : ""}`}
                >
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">
                        {invoice.invoice_no}
                      </p>
                      {invoice.notes && (
                        <p className="text-sm text-gray-600">{invoice.notes}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {invoice.vendor_name}
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-900">
                    ${invoice.amount.toLocaleString()} {invoice.currency}
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {invoice.issue_date}
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {invoice.due_date}
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      {invoice.payment_link && (
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

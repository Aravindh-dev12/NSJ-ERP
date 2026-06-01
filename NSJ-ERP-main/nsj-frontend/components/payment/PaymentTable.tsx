import React from "react";
import {
  Mail,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface PaymentTableProps {
  selectedInvoices: string[];
  onSelectionChange: (invoiceIds: string[]) => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  selectedInvoices,
  onSelectionChange,
}) => {
  const invoices = [
    {
      id: "inv-001",
      vendor_name: "Acme Corp",
      invoice_no: "INV-2024-001",
      amount: 12450,
      currency: "USD",
      due_date: "2024-01-15",
      status: "paid",
      days_overdue: 0,
      last_reminder_at: "2024-01-10",
      next_reminder_at: null,
      channels: { email: true, whatsapp: false },
    },
    {
      id: "inv-002",
      vendor_name: "TechStart Ltd",
      invoice_no: "INV-2024-002",
      amount: 8750,
      currency: "USD",
      due_date: "2024-01-20",
      status: "due",
      days_overdue: 0,
      last_reminder_at: null,
      next_reminder_at: "2024-01-18",
      channels: { email: true, whatsapp: true },
    },
    {
      id: "inv-003",
      vendor_name: "Global Solutions Inc",
      invoice_no: "INV-2024-003",
      amount: 15230,
      currency: "USD",
      due_date: "2024-01-10",
      status: "overdue",
      days_overdue: 5,
      last_reminder_at: "2024-01-12",
      next_reminder_at: "2024-01-16",
      channels: { email: true, whatsapp: true },
    },
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(invoices.map((inv) => inv.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedInvoices, invoiceId]);
    } else {
      onSelectionChange(selectedInvoices.filter((id) => id !== invoiceId));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "due":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "overdue":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string, daysOverdue: number) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Paid
          </span>
        );
      case "due":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Due Soon
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
        <div className="text-sm text-gray-600">
          {selectedInvoices.length > 0 && `${selectedInvoices.length} selected`}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === invoices.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Invoice
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Vendor
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Amount
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Due Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Last Reminder
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
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
                <td className="py-4 px-4">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={(e) =>
                      handleSelectInvoice(invoice.id, e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(invoice.status)}
                    <span className="font-medium text-gray-900">
                      {invoice.invoice_no}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-900">
                  {invoice.vendor_name}
                </td>
                <td className="py-4 px-4 font-semibold text-gray-900">
                  ${invoice.amount.toLocaleString()} {invoice.currency}
                </td>
                <td className="py-4 px-4 text-gray-600">{invoice.due_date}</td>
                <td className="py-4 px-4">
                  {getStatusBadge(invoice.status, invoice.days_overdue)}
                </td>
                <td className="py-4 px-4 text-gray-600 text-sm">
                  {invoice.last_reminder_at || "Never"}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Send Email Reminder"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    {invoice.status === "overdue" && (
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Escalate Issue"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

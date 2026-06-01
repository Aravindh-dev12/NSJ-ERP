import React, { useState } from "react";
import { Search, Filter, Eye } from "lucide-react";

export const AuditLog = () => {
  const [filters, setFilters] = useState({
    user: "",
    action: "",
    entity_type: "",
    date_from: "",
    date_to: "",
  });

  const auditLogs = [
    {
      id: "1",
      timestamp: "2024-01-15 14:30:00",
      user_id: "user-1",
      user_name: "John Admin",
      action: "UPDATE",
      entity_type: "vendor",
      entity_id: "vendor-1",
      before_snapshot: { name: "Acme Corp", active: false },
      after_snapshot: { name: "Acme Corporation", active: true },
      status: "success",
    },
    {
      id: "2",
      timestamp: "2024-01-15 14:25:00",
      user_id: "user-2",
      user_name: "Sarah Manager",
      action: "CREATE",
      entity_type: "invoice",
      entity_id: "invoice-123",
      before_snapshot: null,
      after_snapshot: {
        invoice_no: "INV-2024-123",
        amount: 5000,
        status: "draft",
      },
      status: "success",
    },
    {
      id: "3",
      timestamp: "2024-01-15 14:20:00",
      user_id: "user-1",
      user_name: "John Admin",
      action: "DELETE",
      entity_type: "template",
      entity_id: "template-5",
      before_snapshot: { name: "Old Template", channel: "email" },
      after_snapshot: null,
      status: "success",
    },
  ];

  const getActionBadge = (action: string) => {
    const actionConfig = {
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${actionConfig[action as keyof typeof actionConfig] || "bg-gray-100 text-gray-800"}`}
      >
        {action}
      </span>
    );
  };

  // Filter audit logs based on filters state
  const filteredLogs = auditLogs.filter((log) => {
    // User filter (case-insensitive substring match)
    if (
      filters.user &&
      !log.user_name.toLowerCase().includes(filters.user.toLowerCase())
    ) {
      return false;
    }
    // Action filter (exact match)
    if (filters.action && log.action !== filters.action) {
      return false;
    }
    // Entity type filter (exact match)
    if (filters.entity_type && log.entity_type !== filters.entity_type) {
      return false;
    }
    // Date from filter
    if (filters.date_from && log.timestamp < filters.date_from) {
      return false;
    }
    // Date to filter
    if (filters.date_to && log.timestamp > filters.date_to) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Audit Log</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search user..."
              value={filters.user}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, user: e.target.value }))
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.action}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, action: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>

          <select
            value={filters.entity_type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, entity_type: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Entities</option>
            <option value="vendor">Vendor</option>
            <option value="invoice">Invoice</option>
            <option value="template">Template</option>
            <option value="stakeholder">Stakeholder</option>
          </select>

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, date_from: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, date_to: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Timestamp
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  User
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Action
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Entity
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Entity ID
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-gray-25" : ""}`}
                >
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {log.timestamp}
                  </td>
                  <td className="py-4 px-6 text-gray-900">{log.user_name}</td>
                  <td className="py-4 px-6">{getActionBadge(log.action)}</td>
                  <td className="py-4 px-6 text-gray-900 capitalize">
                    {log.entity_type}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-mono text-sm">
                    {log.entity_id}
                  </td>
                  <td className="py-4 px-6">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
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

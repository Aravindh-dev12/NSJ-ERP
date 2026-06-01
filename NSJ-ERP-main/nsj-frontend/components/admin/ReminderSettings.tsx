import React, { useState } from "react";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export const ReminderSettings = () => {
  const [defaults, setDefaults] = useState({
    cadence_days: 7,
    grace_days: 3,
    channels: { email: true, whatsapp: false },
    send_window_start: "09:00",
    send_window_end: "17:00",
    escalation_threshold_days: 14,
    escalation_stakeholder_ids: ["1", "2"],
  });

  const [exceptions, setExceptions] = useState([
    {
      id: "1",
      scope: "vendor_1",
      scope_name: "Acme Corporation",
      cadence_days: 3,
      grace_days: 1,
      channels: { email: true, whatsapp: true },
      send_window_start: "08:00",
      send_window_end: "18:00",
      escalation_threshold_days: 7,
      escalation_stakeholder_ids: ["1"],
      active: true,
    },
  ]);

  const toggleException = (exceptionId: string) => {
    setExceptions((prev) =>
      prev.map((exception) =>
        exception.id === exceptionId
          ? { ...exception, active: !exception.active }
          : exception
      )
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Reminder Settings</h2>

      {/* Default Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Default Settings
            </h3>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Edit Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cadence
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {defaults.cadence_days} days
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grace Period
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {defaults.grace_days} days
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Escalation Threshold
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {defaults.escalation_threshold_days} days
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Send Window
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {defaults.send_window_start} - {defaults.send_window_end}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channels
            </label>
            <div className="flex space-x-2">
              {defaults.channels.email && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Email
                </span>
              )}
              {defaults.channels.whatsapp && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  WhatsApp
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exception Rules */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Exception Rules
          </h3>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Add Exception</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Scope
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Cadence
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Grace
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Escalation
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
              {exceptions.map((exception, index) => (
                <tr
                  key={exception.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-gray-25" : ""}`}
                >
                  <td className="py-4 px-4">
                    <p className="font-medium text-gray-900">
                      {exception.scope_name}
                    </p>
                    <p className="text-sm text-gray-600">Vendor Override</p>
                  </td>
                  <td className="py-4 px-4 text-gray-900">
                    {exception.cadence_days} days
                  </td>
                  <td className="py-4 px-4 text-gray-900">
                    {exception.grace_days} days
                  </td>
                  <td className="py-4 px-4 text-gray-900">
                    {exception.escalation_threshold_days} days
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => toggleException(exception.id)}
                      className="flex items-center space-x-2"
                    >
                      {exception.active ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Inactive
                          </span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
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

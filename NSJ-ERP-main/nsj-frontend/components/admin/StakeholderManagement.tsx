import React, { useState } from "react";
import { Plus, Edit, Trash2, Mail, MessageCircle } from "lucide-react";

export const StakeholderManagement = () => {
  const [stakeholders, setStakeholders] = useState([
    {
      id: "1",
      name: "John Manager",
      role: "Finance Manager",
      email: "john.manager@company.com",
      whatsapp_phone: "+1234567890",
      escalation_level: "L1",
      departments: ["Finance", "Operations"],
      notify_channels: { email: true, whatsapp: false },
    },
    {
      id: "2",
      name: "Sarah Director",
      role: "Finance Director",
      email: "sarah.director@company.com",
      whatsapp_phone: "+1987654321",
      escalation_level: "L2",
      departments: ["Finance", "Executive"],
      notify_channels: { email: true, whatsapp: true },
    },
  ]);

  const getEscalationBadge = (level: string) => {
    const levelConfig = {
      L1: "bg-green-100 text-green-800",
      L2: "bg-yellow-100 text-yellow-800",
      L3: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${levelConfig[level as keyof typeof levelConfig] || "bg-gray-100 text-gray-800"}`}
      >
        {level}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Stakeholder Management
        </h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Stakeholder</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Name & Role
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Contact
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Departments
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Escalation Level
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Channels
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {stakeholders.map((stakeholder, index) => (
                <tr
                  key={stakeholder.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-gray-25" : ""}`}
                >
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">
                        {stakeholder.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {stakeholder.role}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-gray-900">{stakeholder.email}</p>
                      <p className="text-sm text-gray-600">
                        {stakeholder.whatsapp_phone}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {stakeholder.departments.map((dept) => (
                        <span
                          key={dept}
                          className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getEscalationBadge(stakeholder.escalation_level)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      {stakeholder.notify_channels.email && (
                        <Mail className="h-4 w-4 text-blue-500" />
                      )}
                      {stakeholder.notify_channels.whatsapp && (
                        <MessageCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label={`Edit stakeholder ${stakeholder.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Delete stakeholder ${stakeholder.name}`}
                      >
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

import React, { useState } from "react";
import { VendorManagement } from "./VendorManagement";
import { InvoiceManagement } from "./InvoiceManagement";
import { ReminderSettings } from "./ReminderSettings";
import { TemplateManagement } from "./TemplateManagement";
import { StakeholderManagement } from "./StakeholderManagement";
import { AuditLog } from "./AuditLog";
import {
  Users,
  FileText,
  Settings,
  Mail,
  UserCheck,
  Activity,
} from "lucide-react";

export const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState("vendors");

  const sections = [
    { id: "vendors", label: "Vendors", icon: Users },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "reminders", label: "Reminder Settings", icon: Settings },
    { id: "templates", label: "Templates", icon: Mail },
    { id: "stakeholders", label: "Stakeholders", icon: UserCheck },
    { id: "audit", label: "Audit Log", icon: Activity },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case "vendors":
        return <VendorManagement />;
      case "invoices":
        return <InvoiceManagement />;
      case "reminders":
        return <ReminderSettings />;
      case "templates":
        return <TemplateManagement />;
      case "stakeholders":
        return <StakeholderManagement />;
      case "audit":
        return <AuditLog />;
      default:
        return <VendorManagement />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">
            Manage system settings and configurations
          </p>
        </div>
      </div>

      <div className="flex space-x-6">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">{renderActiveSection()}</div>
      </div>
    </div>
  );
};

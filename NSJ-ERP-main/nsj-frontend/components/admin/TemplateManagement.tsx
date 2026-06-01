import React, { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Mail,
  MessageCircle,
} from "lucide-react";

export const TemplateManagement = () => {
  const [templates, setTemplates] = useState([
    {
      id: "1",
      name: "Payment Reminder - First Notice",
      channel: "email",
      subject: "Payment Reminder: Invoice {{invoice_no}}",
      body: "Dear {{vendor_name}},\n\nThis is a friendly reminder that invoice {{invoice_no}} for {{amount}} is due on {{due_date}}.\n\nPlease process payment at your earliest convenience.\n\nPayment Link: {{payment_link}}\n\nThank you!",
      variables_supported: [
        "vendor_name",
        "invoice_no",
        "amount",
        "due_date",
        "payment_link",
      ],
      last_edited_at: "2024-01-15",
      in_use_count: 23,
    },
    {
      id: "2",
      name: "WhatsApp Payment Reminder",
      channel: "whatsapp",
      subject: null,
      body: "Hi {{vendor_name}}! 👋\n\nJust a quick reminder that invoice {{invoice_no}} ({{amount}}) is due on {{due_date}}.\n\nPay here: {{payment_link}}\n\nThanks! 🙏",
      variables_supported: [
        "vendor_name",
        "invoice_no",
        "amount",
        "due_date",
        "payment_link",
      ],
      last_edited_at: "2024-01-14",
      in_use_count: 15,
    },
  ]);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "whatsapp":
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Template Management
        </h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getChannelIcon(template.channel)}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {template.channel} template
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <Send className="h-4 w-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {template.subject && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  SUBJECT
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {template.subject}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                BODY
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                {template.body.split("\n").map((line, index) => (
                  <p key={index} className={index > 0 ? "mt-2" : ""}>
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                VARIABLES
              </label>
              <div className="flex flex-wrap gap-1">
                {template.variables_supported.map((variable) => (
                  <span
                    key={variable}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {`{{${variable}}}`}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Used {template.in_use_count} times</span>
              <span>Last edited: {template.last_edited_at}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

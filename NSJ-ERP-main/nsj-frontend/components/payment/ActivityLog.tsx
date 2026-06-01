import React from "react";
import { Mail, MessageCircle, CheckCircle, XCircle, Clock } from "lucide-react";

export const ActivityLog = () => {
  const activities = [
    {
      id: "1",
      timestamp: "2024-01-15 14:30:00",
      action: "Email Reminder Sent",
      channel: "email",
      recipient: "finance@acmecorp.com",
      invoice_id: "INV-2024-001",
      status: "sent",
      notes: "First reminder for overdue payment",
    },
    {
      id: "2",
      timestamp: "2024-01-15 14:25:00",
      action: "WhatsApp Reminder Sent",
      channel: "whatsapp",
      recipient: "+1234567890",
      invoice_id: "INV-2024-003",
      status: "failed",
      notes: "Invalid phone number",
    },
    {
      id: "3",
      timestamp: "2024-01-15 10:15:00",
      action: "Payment Received",
      channel: null,
      recipient: null,
      invoice_id: "INV-2024-002",
      status: "sent",
      notes: "Payment confirmed via bank transfer",
    },
    {
      id: "4",
      timestamp: "2024-01-14 16:45:00",
      action: "Escalation Triggered",
      channel: "email",
      recipient: "manager@company.com",
      invoice_id: "INV-2024-004",
      status: "sent",
      notes: "Invoice overdue by 7 days",
    },
  ];

  const getChannelIcon = (channel: string | null) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "whatsapp":
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
          <p className="text-sm text-gray-600">
            Recent payment tracking activities
          </p>
        </div>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All Activities
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              {getChannelIcon(activity.channel)}
              {getStatusIcon(activity.status)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.action}
                </p>
                <span className="text-xs text-gray-500">
                  {activity.timestamp}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                {activity.recipient && <p>To: {activity.recipient}</p>}
                {activity.invoice_id && <p>Invoice: {activity.invoice_id}</p>}
                {activity.notes && <p className="italic">{activity.notes}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

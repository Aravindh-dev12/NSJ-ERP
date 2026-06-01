import React, { useState } from "react";
import { X, Mail, MessageCircle, Clock, Users } from "lucide-react";

interface ScheduleBuilderProps {
  onClose: () => void;
}

export const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({
  onClose,
}) => {
  const [schedule, setSchedule] = useState({
    cadence_days: 7,
    start_datetime: "",
    grace_days: 3,
    channels: { email: true, whatsapp: false },
    send_window_start: "09:00",
    send_window_end: "17:00",
    escalation_threshold_days: 14,
    escalation_stakeholder_ids: [],
    template_id: "",
    test_recipient: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Schedule created:", schedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Schedule Builder
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cadence (days)
              </label>
              <input
                type="number"
                value={schedule.cadence_days}
                onChange={(e) =>
                  setSchedule((prev) => ({
                    ...prev,
                    cadence_days: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grace Days
              </label>
              <input
                type="number"
                value={schedule.grace_days}
                onChange={(e) =>
                  setSchedule((prev) => ({
                    ...prev,
                    grace_days: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Communication Channels
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={schedule.channels.email}
                  onChange={(e) =>
                    setSchedule((prev) => ({
                      ...prev,
                      channels: { ...prev.channels, email: e.target.checked },
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Mail className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Email</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={schedule.channels.whatsapp}
                  onChange={(e) =>
                    setSchedule((prev) => ({
                      ...prev,
                      channels: {
                        ...prev.channels,
                        whatsapp: e.target.checked,
                      },
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <MessageCircle className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Send Window */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send Window Start
              </label>
              <input
                type="time"
                value={schedule.send_window_start}
                onChange={(e) =>
                  setSchedule((prev) => ({
                    ...prev,
                    send_window_start: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send Window End
              </label>
              <input
                type="time"
                value={schedule.send_window_end}
                onChange={(e) =>
                  setSchedule((prev) => ({
                    ...prev,
                    send_window_end: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Escalation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escalation Threshold (days)
            </label>
            <input
              type="number"
              value={schedule.escalation_threshold_days}
              onChange={(e) =>
                setSchedule((prev) => ({
                  ...prev,
                  escalation_threshold_days: parseInt(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Test Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Recipient (Email/Phone)
            </label>
            <input
              type="text"
              value={schedule.test_recipient}
              onChange={(e) =>
                setSchedule((prev) => ({
                  ...prev,
                  test_recipient: e.target.value,
                }))
              }
              placeholder="test@example.com or +1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Test Send
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from "react";
import {
  Mail,
  MessageCircle,
  AlertTriangle,
  Clock,
  Calendar,
} from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  onScheduleBuilder: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onScheduleBuilder,
}) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} invoice{selectedCount > 1 ? "s" : ""} selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Mail className="h-4 w-4" />
            <span>Send Reminder</span>
          </button>

          <button className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
            <MessageCircle className="h-4 w-4" />
            <span>WhatsApp</span>
          </button>

          <button className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
            <Clock className="h-4 w-4" />
            <span>Snooze</span>
          </button>

          <button className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Escalate</span>
          </button>

          <button
            onClick={onScheduleBuilder}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <Calendar className="h-4 w-4" />
            <span>Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};

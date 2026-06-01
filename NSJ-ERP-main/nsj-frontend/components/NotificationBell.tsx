"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { API_BASE_URL } from "@/lib/constants";

interface Notification {
  id: string;
  task_id: string;
  task_title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getHeaders(): HeadersInit {
    const headers: Record<string, string> = {};
    if (typeof window === "undefined") return headers;

    // JWT token for main ERP session users
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Simulated user for dev/task-management mode (only when no JWT)
    if (!token) {
      const simulatedUserId = localStorage.getItem("currentTaskUser");
      if (simulatedUserId) {
        headers["X-Simulated-User-Id"] = simulatedUserId;
      }
    }

    return headers;
  }

  async function fetchNotifications() {
    try {
      const headers = getHeaders();

      // 1. Fetch unread count
      const unreadRes = await fetch(
        `${API_BASE_URL}/tasks/notifications/?is_read=false`,
        { headers, credentials: "include" }
      );
      if (unreadRes.ok) {
        const unreadData = await unreadRes.json();
        if (Array.isArray(unreadData)) setUnreadCount(unreadData.length);
      }

      // 2. Fetch recent notifications for dropdown
      const res = await fetch(`${API_BASE_URL}/tasks/notifications/`, {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = data.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          setNotifications(sorted.slice(0, 10));
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }

  async function markAsRead(_notificationId: string, taskId: string) {
    try {
      setIsOpen(false);
      router.push(`/tasks/${taskId}`);
    } catch (error) {
      console.error("Failed to navigate to task:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch(`${API_BASE_URL}/tasks/mark_notifications_read/`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-6 min-w-[24px] px-1.5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-20 right-4 w-80 sm:w-96 rounded-xl border border-gray-100 bg-white shadow-xl z-[9999] overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/80">
            <h3 className="font-semibold text-gray-800 tracking-tight">
              Notifications
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto w-full">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.task_id)}
                    className={`flex cursor-pointer flex-col gap-1.5 px-4 py-3 transition-colors ${
                      !notif.is_read
                        ? "bg-red-50/20 hover:bg-red-50/40"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={`text-sm leading-snug ${!notif.is_read ? "font-extrabold text-gray-900" : "font-normal text-gray-700"}`}
                      >
                        {notif.message}
                      </p>
                      {!notif.is_read && (
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-500 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {notif.task_title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium tracking-wider">
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50/50 text-center">
              <span className="text-xs font-medium text-gray-500">
                Showing 10 most recent
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

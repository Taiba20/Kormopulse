import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../services/notificationService";
import { getSocket } from "../services/socket";

const ICONS = {
  application_received: "📥",
  application_status: "📋",
  interview: "🗓️",
  message: "💬",
  job_alert: "🔔",
  review: "⭐",
  system: "ℹ️",
};

const timeAgo = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

function NotificationBell({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await notificationService.list({ limit: 15 });
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    notificationService
      .getUnreadCount()
      .then((data) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});

    const socket = getSocket();
    const onNew = (notification) => {
      setItems((prev) => [notification, ...prev].slice(0, 15));
      setUnreadCount((prev) => prev + 1);
    };
    socket.on("notification:new", onNew);
    return () => socket.off("notification:new", onNew);
  }, []);

  useEffect(() => {
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const handleClick = async (notification) => {
    setOpen(false);
    if (!notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setItems((prev) => prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)));
      notificationService.markRead(notification._id).catch(() => {});
    }
    if (notification.link) navigate(notification.link);
  };

  const markAllRead = async (e) => {
    e.stopPropagation();
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllRead();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 ${className}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-md border border-neutral-200 bg-background shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5">
            <span className="font-semibold text-text-primary text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:text-primary-dark">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-text-secondary">Loading...</p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-secondary">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`flex w-full gap-2.5 border-b border-neutral-100 px-4 py-3 text-left last:border-b-0 hover:bg-neutral-50 ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="text-lg leading-none">{ICONS[n.type] || "🔔"}</span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm ${!n.isRead ? "font-semibold text-text-primary" : "text-text-primary"}`}>{n.title}</span>
                    {n.message && <span className="block text-xs text-text-secondary line-clamp-2 mt-0.5">{n.message}</span>}
                    <span className="block text-[11px] text-text-muted mt-1">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.isRead && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

// src/pages/Notifications.tsx
import React from "react";
import { Button } from "../components/ui/Button";

type Notification = {
  id: number | string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
  date: string;
  read: boolean;
};

type NotificationsPageProps = {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  loading: boolean;
};

export default function Notifications({
  notifications,
  setNotifications,
  loading,
}: NotificationsPageProps) {
  // Marquer une notification comme lue (optimiste côté UI)
  const markAsRead = (id: number | string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
    // Plus tard : PATCH backend si besoin
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    alert("✅ Toutes les notifications ont été marquées comme lues.");
  };

  const handleClick = (id: number | string) => {
    markAsRead(id);
    const clicked = notifications.find((n) => n.id === id);
    if (clicked) {
      alert(`📬 ${clicked.title}\n\n${clicked.message}`);
    }
  };

  const getColor = (type: string, read: boolean) => {
    const base = read ? "opacity-60" : "opacity-100";
    switch (type) {
      case "success":
        return `bg-green-100 text-green-800 dark:bg-green-700 dark:text-white ${base}`;
      case "error":
        return `bg-red-100 text-red-800 dark:bg-red-700 dark:text-white ${base}`;
      case "info":
      default:
        return `bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white ${base}`;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
        🔔 Notifications
      </h1>

      <div className="text-center mb-6">
        <Button onClick={markAllAsRead} className="w-60">
          🧹 Tout marquer comme lu
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 mt-8">Chargement...</div>
      ) : (
        <div className="space-y-4 max-w-xl mx-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleClick(notification.id)}
                className={`cursor-pointer p-4 rounded-lg shadow hover:scale-[1.01] transition ${getColor(
                  notification.type,
                  notification.read
                )}`}
              >
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm">{notification.message}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  📅 {notification.date}
                </div>
                {!notification.read && (
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-300">
                    • Non lue
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-300 italic mt-10">
              Aucune notification pour le moment.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

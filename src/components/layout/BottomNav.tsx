// src/components/layout/BottomNav.tsx
import { Link, useLocation } from "react-router-dom";

type Notification = {
  id: number | string;
  read: boolean;
  // autres props si besoin
};

type BottomNavProps = {
  notifications: Notification[];
};

export const BottomNav = ({ notifications }: BottomNavProps) => {
  const { pathname } = useLocation();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabs = [
    { to: "/", label: "Dashboard", icon: "🏠" },
    { to: "/analyse", label: "Analyser", icon: "⚽" },
    { to: "/tickets", label: "Mes Tickets", icon: "🎟️" },
    {
      to: "/notifications",
      label: "Notifications",
      icon: "🔔",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { to: "/profile", label: "Profil", icon: "👤" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md flex justify-around py-2 border-t border-gray-200 z-50">
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={`relative flex flex-col items-center text-xs font-medium ${
            pathname === tab.to ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.badge && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-red-500 text-white rounded-full px-1.5">
              {tab.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};

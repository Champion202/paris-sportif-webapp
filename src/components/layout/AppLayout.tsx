// src/components/layout/AppLayout.tsx
import React, { useEffect, useState } from "react";
import { BottomNav } from "./BottomNav";
import axios from "axios";

type Notification = {
  id: number | string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
  date: string;
  read: boolean;
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupère les notifications depuis le backend au montage
    axios
      .get("http://localhost:8000/api/notifications/")
      .then((res) => {
        setNotifications(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur récupération notifications :", err);
        setLoading(false);
      });
  }, []);

  // ➡️ Passe notifications à BottomNav (et potentiellement aux pages enfants via React context si besoin)
  return (
    <div className="min-h-screen pb-20 bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-white transition duration-300">
      {children}
      <BottomNav notifications={notifications} />
    </div>
  );
};

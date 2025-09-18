// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import Profile from "./pages/Profile";
import MatchAnalysis from "./pages/MatchAnalysis";
import Notifications from "./pages/Notifications";
import { BottomNav } from "./components/layout/BottomNav";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { useEffect, useState } from "react";
import axios from "axios";
import ScrollToTop from "./components/ScrollToTop"; // ← AJOUT

type Notification = {
  id: number | string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
  date: string;
  read: boolean;
};

function AppRoutes() {
  const { theme } = useTheme();

  // 💡 Centralisation des notifications ici
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <ScrollToTop /> {/* ← AJOUT ICI */}
      <div className="min-h-screen pb-20 bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-white transition duration-300">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/analyse/:id" element={<MatchAnalysis />} />
          <Route path="/analyse" element={<MatchAnalysis />} />
          <Route path="/notifications" element={<Notifications notifications={notifications} setNotifications={setNotifications} loading={loading} />} />
        </Routes>
        <BottomNav notifications={notifications} />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

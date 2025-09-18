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
import ScrollToTop from "./components/ScrollToTop";
import { useAuth } from "./context/AuthContext"; // ⬅️ NEW

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
  const { ready } = useAuth(); // ⬅️ NEW

  // Centralisation des notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // ⚠️ Attend que l'auth soit prête (token injecté dans axios par AuthContext)
  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    axios
      .get("/api/notifications/") // baseURL déjà mise par AuthContext
      .then((res) => setNotifications(res.data))
      .catch((err) => {
        console.error("Erreur récupération notifications :", err?.response?.data || err?.message);
      })
      .finally(() => setLoading(false));
  }, [ready]);

  // Petit splash tant que l'auth n'est pas prête (évite 401 au 1er rendu)
  if (!ready) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-white">
          <div className="text-sm opacity-80">Initialisation…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <ScrollToTop />
      <div className="min-h-screen pb-20 bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-white transition duration-300">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/analyse/:id" element={<MatchAnalysis />} />
          <Route path="/analyse" element={<MatchAnalysis />} />
          <Route
            path="/notifications"
            element={
              <Notifications
                notifications={notifications}
                setNotifications={setNotifications}
                loading={loading}
              />
            }
          />
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

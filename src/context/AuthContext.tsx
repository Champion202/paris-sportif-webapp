// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

type AuthCtx = {
  token: string | null;
  ready: boolean;            // true : handshake terminé (réussi ou non)
  logout: () => void;
};

const AuthContext = createContext<AuthCtx>({ token: null, ready: false, logout: () => {} });

// Configurable via .env : VITE_API_BASE=http://localhost:8000
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const onceRef = useRef(false);

  // Base config axios
  useEffect(() => {
    axios.defaults.baseURL = API_BASE;

    const stored = localStorage.getItem("ps_jwt");
    if (stored) {
      setToken(stored);
      axios.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
    }
  }, []);

  // Handshake Telegram initData → backend → token
  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;

    (async () => {
      try {
        const tg = (window as any)?.Telegram?.WebApp;
        const initData = tg?.initData || "";

        if (!initData) {
          setReady(true);
          return;
        }

        // ⚠️ On implémentera cet endpoint côté Django juste après
        const res = await axios.post(
          "/api/auth/tma/verify/",
          null,
          { headers: { Authorization: `tma ${initData}` } }
        );

        const tk: string | undefined = res.data?.access_token || res.data?.token;
        if (tk) {
          setToken(tk);
          localStorage.setItem("ps_jwt", tk);
          axios.defaults.headers.common["Authorization"] = `Bearer ${tk}`;
        }
      } catch (err) {
        console.warn("[Auth] Handshake échoué :", err);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const logout = () => {
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("ps_jwt");
    setToken(null);
  };

  const value = useMemo(() => ({ token, ready, logout }), [token, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// src/context/UserContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Type de profil exposé à toute l’app
export type UserProfile = {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  name: string;
  avatar: string;
};

type Ctx = {
  user: UserProfile | null;
  ready: boolean; // true quand la détection est terminée (même si pas d’utilisateur)
};

const UserContext = createContext<Ctx>({ user: null, ready: false });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;

    // Petit overlay de debug (optionnel, utile la première fois)
    const debug = document.createElement("pre");
    debug.style.position = "fixed";
    debug.style.top = "16px";
    debug.style.left = "16px";
    debug.style.zIndex = "99999";
    debug.style.background = "#fff";
    debug.style.color = "#000";
    debug.style.fontSize = "10px";
    debug.style.padding = "8px";
    debug.style.maxWidth = "80vw";
    debug.style.maxHeight = "50vh";
    debug.style.overflow = "auto";
    debug.style.border = "1px solid #ddd";
    debug.style.borderRadius = "8px";
    document.body.appendChild(debug);

    try {
      if (!tg) {
        debug.innerText = "[ParisSportif] Telegram.WebApp introuvable.\nOuvre via Telegram.";
        return;
      }

      tg.ready?.();
      tg.expand?.();

      const u = tg.initDataUnsafe?.user; // source officielle
      debug.innerText =
        "[ParisSportif] Telegram.WebApp OK ✅\n\n" +
        "initDataUnsafe.user:\n" + JSON.stringify(u, null, 2) + "\n\n" +
        "initDataRaw:\n" + tg.initData + "\n";

      if (u?.id) {
        setUser({
          id: String(u.id),
          username: u.username ?? "",
          first_name: u.first_name ?? "",
          last_name: u.last_name ?? "",
          name:
            [u.first_name, u.last_name].filter(Boolean).join(" ") ||
            u.username ||
            `user_${u.id}`,
          avatar:
            u.photo_url ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              u.username || String(u.id)
            )}`,
        });
      }
    } finally {
      setReady(true);
      // Retire le debug après 8s
      setTimeout(() => debug.remove(), 8000);
    }

    return () => {
      debug.remove();
    };
  }, []);

  const value = useMemo(() => ({ user, ready }), [user, ready]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

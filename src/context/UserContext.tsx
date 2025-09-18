// src/context/UserContext.tsx (version clean, sans overlay)
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  ready: boolean;
};

const UserContext = createContext<Ctx>({ user: null, ready: false });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const tg = (window as any)?.Telegram?.WebApp;
      if (tg) {
        tg.ready?.();
        tg.expand?.();

        const u = tg.initDataUnsafe?.user;
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
      }
    } finally {
      setReady(true);
    }
  }, []);

  const value = useMemo(() => ({ user, ready }), [user, ready]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

// src/hooks/useTelegram.ts
import { useEffect, useState } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramInitData {
  user?: TelegramUser;
  query_id?: string;
  auth_date?: string;
  hash?: string;
  [key: string]: any; // Pour supporter les autres propriétés Telegram
}

/**
 * Hook pour récupérer l'utilisateur Telegram et toutes les données d'init (initDataUnsafe)
 * Permet d'accéder à toutes les infos utiles dans la mini-app.
 */
export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<TelegramInitData | null>(null);

  useEffect(() => {
    // @ts-ignore: window.Telegram peut ne pas exister hors Telegram
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initDataUnsafe) {
      setUser(tg.initDataUnsafe.user || null);
      setInitData(tg.initDataUnsafe);
    }
  }, []);

  return { user, initData };
}

/**
 * Hook rapide pour récupérer tout initDataUnsafe si besoin (hors contexte utilisateur).
 */
export function useTelegramInitData() {
  // @ts-ignore
  const tg = window.Telegram?.WebApp;
  return tg ? tg.initDataUnsafe : null;
}

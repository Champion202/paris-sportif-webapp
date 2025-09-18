// src/pages/Profile.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

type SectionKey = "premium" | "history" | "partner" | "referrals" | null;

export default function Profile() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // ── Compat: useUser() peut renvoyer soit le profil, soit { user: profil }
  const raw = useUser() as any;
  const user = (raw && typeof raw === "object" && "user" in raw) ? raw.user : raw;

  const [section, setSection] = useState<SectionKey>(null);
  const [lang, setLang] = useState<string>(() => localStorage.getItem("lang") || "fr");

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const displayName = useMemo(() => {
    if (!user) return "Utilisateur";
    return (
      user.name ||
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.username ||
      "Utilisateur"
    );
  }, [user]);

  const avatar: string =
    user?.avatar || user?.photo_url || "/assets/default-logo.png";
  const username = user?.username ? `@${user.username}` : "";
  const idLabel = user?.id ? `ID: ${user.id}` : "";

  const MENU: { key: Exclude<SectionKey, null>; label: string; icon: string }[] = [
    { key: "premium",   label: "Premium",              icon: "👑" },
    { key: "history",   label: "Historique d’analyse", icon: "📜" },
    { key: "partner",   label: "Partenariat",          icon: "🤝" },
    { key: "referrals", label: "Parrainage",           icon: "👥" },
  ];

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English",  flag: "🇬🇧" },
    { code: "es", label: "Español",  flag: "🇪🇸" },
  ];

  const isLight = theme !== "dark";

  function SectionContainer({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="max-w-md mx-auto">
        <button
          className="mb-3 flex items-center gap-1 text-blue-600 dark:text-blue-300"
          onClick={() => setSection(null)}
        >
          ← Retour
        </button>
        <div className="bg-white dark:bg-gray-700 rounded-2xl shadow p-5">
          <h3 className="text-lg font-bold mb-2">{title}</h3>
          {children}
        </div>
      </div>
    );
  }

  function renderSection() {
    switch (section) {
      case "premium":
        return (
          <SectionContainer title="Premium">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Débloque les analyses avancées, alertes en temps réel et recommandations à forte valeur.
            </p>
            <div className="text-center mt-4">
              <Button>🚀 Passer en Premium</Button>
            </div>
          </SectionContainer>
        );
      case "history":
        return (
          <SectionContainer title="Historique d’analyse">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Tes analyses récentes apparaîtront ici. (À venir)
            </p>
            <ul className="mt-3 text-sm text-gray-500 dark:text-gray-300 list-disc pl-5">
              <li>Historique filtré par date / compétition</li>
              <li>Accès rapide au détail d’un match</li>
              <li>Export CSV (plus tard)</li>
            </ul>
          </SectionContainer>
        );
      case "partner":
        return (
          <SectionContainer title="Partenariat">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Propose une collaboration, deviens affilié ou sponsor.
            </p>
            <a
              href="https://t.me/Mmiracle2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full"
            >
              Contacter l’admin 💬
            </a>
          </SectionContainer>
        );
      case "referrals":
        return (
          <SectionContainer title="Parrainage">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Invite tes amis et gagne des avantages. (À venir)
            </p>
            <div className="mt-3 rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-sm">
              Ton lien de parrainage sera affiché ici.
            </div>
          </SectionContainer>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen p-6 transition duration-300 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
      {/* En-tête profil */}
      <div className="flex flex-col items-center mb-6">
        <img src={avatar} alt={displayName} className="w-24 h-24 rounded-full border shadow mb-3 object-cover" />
        <h1 className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 text-center">
          {displayName}
        </h1>
        <div className="text-gray-500 dark:text-gray-300 text-sm text-center">
          {username} {username && idLabel ? " • " : ""}{idLabel}
        </div>
      </div>

      {section ? (
        <div className="mt-2">{renderSection()}</div>
      ) : (
        <>
          {/* Menu principal */}
          <div className="flex flex-col gap-2 mb-6 max-w-md mx-auto">
            {MENU.map((item) => (
              <button
                key={item.key}
                className="w-full bg-white dark:bg-gray-700 rounded-2xl shadow flex items-center justify-between p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                onClick={() => setSection(item.key)}
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </span>
                <span className="text-gray-400">›</span>
              </button>
            ))}
          </div>

          {/* Mode clair & Langue */}
          <div className="max-w-md mx-auto bg-white dark:bg-gray-700 rounded-2xl shadow p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Mode clair</span>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition p-1 ${
                  isLight ? "bg-blue-500 justify-end" : "bg-gray-300 justify-start dark:bg-gray-600"
                } flex items-center`}
                aria-label="Basculer le mode clair/sombre"
              >
                <span className="block w-5 h-5 rounded-full bg-white shadow" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Langue</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="rounded bg-gray-100 dark:bg-gray-800 px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-center mt-6">
            <Button onClick={() => navigate("/notifications")} className="w-64">
              🔔 Voir mes notifications
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// src/pages/Profile.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useTheme } from "../context/ThemeContext";
import { useTelegram } from "../hooks/useTelegram";

export default function Profile() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useTelegram();

  return (
    <div className="min-h-screen p-6 transition duration-300 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold text-blue-700 text-center mb-6">
        👤 Profil Utilisateur
      </h1>

      {/* Avatar et infos utilisateur */}
      <div className="text-center mb-6">
        <img
          src={
            user?.photo_url
              ? user.photo_url
              : "/assets/default-logo.png"
          }
          alt="Avatar"
          className="w-24 h-24 rounded-full mx-auto mb-4 border"
        />
        <div className="text-lg font-semibold">
          {user
            ? `${user.first_name} ${user.last_name || ""}`
            : "Champion"}
        </div>
        {user?.username && (
          <div className="text-gray-500 dark:text-gray-300">
            @{user.username}
          </div>
        )}
        {user?.id && (
          <div className="text-xs text-gray-400">ID : {user.id}</div>
        )}
        {/* À remplacer plus tard par le vrai nombre de tickets gagnés */}
        <div className="text-gray-500 dark:text-gray-300">
          📊 Tickets gagnés : 15
        </div>
      </div>

      {/* Bouton mode sombre/clair */}
      <div className="text-center mb-6">
        <Button onClick={toggleTheme} className="w-40">
          {theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
        </Button>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="shadow rounded-xl p-4 bg-white dark:bg-gray-700">
          <h2 className="text-xl font-semibold">Paramètres</h2>
          <p className="text-gray-500 dark:text-gray-300">
            Modifiez vos informations et paramètres de sécurité ici.
          </p>
        </div>

        <div className="shadow rounded-xl p-4 text-center bg-white dark:bg-gray-700">
          <h2 className="text-lg font-semibold mb-2">🔔 Notifications</h2>
          <Button
            onClick={() => navigate("/notifications")}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Voir mes notifications
          </Button>
        </div>
      </div>

      {/* Message si pas d'utilisateur Telegram */}
      {!user && (
        <div className="text-center mt-8 text-sm text-yellow-500">
          Pour afficher ton vrai profil Telegram, ouvre cette mini-app via Telegram !
        </div>
      )}
    </div>
  );
}

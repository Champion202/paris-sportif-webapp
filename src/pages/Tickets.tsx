// src/pages/Tickets.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

type Match = {
  home_team: string;
  away_team: string;
  logo_home?: string;
  logo_away?: string;
  time: string;
};

type Ticket = {
  id: number;
  user_id: string;
  match: Match;
  status: string; // "pending", "win", "lose", "canceled"
  risk_level: string; // "faible", "moyen", "élevé"
  created_at: string;
  result?: string | null;
};

function formatStatus(status: string) {
  switch (status) {
    case "win":
      return "✅ Gagné";
    case "lose":
      return "❌ Perdu";
    case "canceled":
      return "🚫 Annulé";
    default:
      return "⏳ En attente";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "win":
      return "bg-green-100 text-green-700 dark:bg-green-700 dark:text-white";
    case "lose":
      return "bg-red-100 text-red-700 dark:bg-red-700 dark:text-white";
    case "canceled":
      return "bg-gray-200 text-gray-700 dark:bg-gray-500 dark:text-white";
    default:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-white";
  }
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/tickets/")
      .then((res) => {
        setTickets(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur récupération tickets :", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300">
      <h1 className="text-2xl font-bold text-blue-700 text-center mb-6">
        🎟️ Mes Tickets
      </h1>

      {loading ? (
        <div className="text-center text-gray-400 mt-8">Chargement...</div>
      ) : tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-white dark:bg-gray-700 shadow-lg rounded-xl p-4 border-l-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer transform hover:shadow-xl`}
              style={{
                borderColor:
                  ticket.status === "win"
                    ? "#16a34a"
                    : ticket.status === "lose"
                    ? "#dc2626"
                    : ticket.status === "canceled"
                    ? "#6b7280"
                    : "#facc15",
              }}
              onClick={() =>
                alert(
                  `Ticket #${ticket.id}
Match : ${ticket.match.home_team} vs ${ticket.match.away_team}
Heure : ${ticket.match.time}
Statut : ${formatStatus(ticket.status)}
Résultat : ${ticket.result || "Non disponible"}
Risque : ${ticket.risk_level}`
                )
              }
            >
              <div className="flex items-center gap-3 mb-1">
                <img
                  src={ticket.match.logo_home || "https://placehold.co/40x40"}
                  alt={ticket.match.home_team}
                  className="w-8 h-8 rounded-full border"
                />
                <span className="font-semibold">
                  {ticket.match.home_team}
                </span>
                <span className="mx-1 text-gray-400">vs</span>
                <span className="font-semibold">
                  {ticket.match.away_team}
                </span>
                <img
                  src={ticket.match.logo_away || "https://placehold.co/40x40"}
                  alt={ticket.match.away_team}
                  className="w-8 h-8 rounded-full border"
                />
                <span className="ml-auto text-sm text-blue-700 dark:text-blue-300">
                  ⏰ {ticket.match.time}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300 mb-1">
                Date : {ticket.created_at?.slice(0, 10)}
              </div>
              {ticket.result && (
                <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">
                  Résultat : {ticket.result}
                </div>
              )}
              <div>
                <span
                  className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${statusColor(
                    ticket.status
                  )}`}
                >
                  {formatStatus(ticket.status)}
                </span>
                <span className="ml-2 inline-block px-2 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-800 text-blue-700 dark:text-white">
                  Risque : {ticket.risk_level}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-300 italic mt-10">
          Aucun ticket pour le moment.
        </div>
      )}
    </div>
  );
}

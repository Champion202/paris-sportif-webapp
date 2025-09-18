// src/pages/Dashboard.tsx
import axios from "axios";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { MatchCard } from "../components/MatchCard";
import banniere from "./banniere.png";

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  date: string;
  time: string;
  championship: string;
  is_live: boolean;
  logo_home?: string;
  logo_away?: string;
};

export default function Dashboard() {
  const navigate = useNavigate();

  // States
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [championship, setChampionship] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLive, setLoadingLive] = useState(true);

  // --- Fetch matchs du jour (pré-match)
  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:8000/api/matchs/")
      .then((res) => {
        setMatches(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur récupération matchs :", err);
        setLoading(false);
      });
  }, []);

  // --- Fetch matchs live + refresh automatique toutes les 60s
  const fetchLiveMatches = useCallback(() => {
    setLoadingLive(true);
    axios
      .get("http://localhost:8000/api/matchs/live/")
      .then((res) => {
        setLiveMatches(res.data);
        setLoadingLive(false);
      })
      .catch((err) => {
        console.error("Erreur récupération matchs live :", err);
        setLoadingLive(false);
      });
  }, []);

  useEffect(() => {
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 600000); // toutes les 600s
    return () => clearInterval(interval);
  }, [fetchLiveMatches]);

  // --- Liste unique des championnats (prend tous les championnats des deux listes)
  const championships = useMemo(() => {
    const all = [
      ...matches.map((m) => m.championship),
      ...liveMatches.map((m) => m.championship),
    ].filter(Boolean);
    return Array.from(new Set(all)).sort();
  }, [matches, liveMatches]);

  // --- Filtres & tri croissant (heure) pour les matchs du jour
  const filteredMatches = useMemo(() => {
    return matches
      .filter(
        (match) =>
          (match.home_team?.toLowerCase().includes(search.toLowerCase()) ||
            match.away_team?.toLowerCase().includes(search.toLowerCase())) &&
          (!championship || match.championship === championship) &&
          match.date === date
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [matches, search, championship, date]);

  // --- Filtres & tri croissant (heure) pour les matchs live
  const filteredLiveMatches = useMemo(() => {
    return liveMatches
      .filter(
        (match) =>
          (match.home_team?.toLowerCase().includes(search.toLowerCase()) ||
            match.away_team?.toLowerCase().includes(search.toLowerCase())) &&
          (!championship || match.championship === championship)
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [liveMatches, search, championship]);

  return (
    <div className="min-h-screen flex flex-col items-center text-center px-4 pb-16 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Bannière en haut */}
      <img
        src={banniere}
        alt="Bannière sport"
        className="w-full max-w-[640px] h-auto object-cover rounded-xl mt-6 mb-2"
      />

      {/* Recherche & filtres */}
      <div className="w-full max-w-2xl mb-8 bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un match..."
          className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-blue-400 focus:outline-none"
          />
          <select
            value={championship}
            onChange={(e) => setChampionship(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-blue-400 focus:outline-none"
          >
            <option value="">🌍 Tous les championnats</option>
            {championships.map((champ) => (
              <option key={champ} value={champ}>
                {champ}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Menu des matchs */}
      <div className="flex justify-center gap-2 mb-6">
        <Button
          onClick={() => setIsLive(true)}
          className={`px-3 py-1 text-[14px] font-medium rounded-lg transition-all duration-200 ${
            isLive ? "bg-black text-white" : "bg-gray-800 text-white opacity-70"
          }`}
          style={{ minWidth: "auto", width: "auto", whiteSpace: "nowrap" }}
        >
          Matchs en Live
        </Button>
        <Button
          onClick={() => setIsLive(false)}
          className={`px-3 py-1 text-[14px] font-medium rounded-lg transition-all duration-200 ${
            !isLive ? "bg-black text-white" : "bg-gray-800 text-white opacity-70"
          }`}
          style={{ minWidth: "auto", width: "auto", whiteSpace: "nowrap" }}
        >
          Matchs du jour
        </Button>
      </div>

      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-100">
          📅 {isLive ? "Matchs en live" : "Matchs du jour"}
        </h2>
        {isLive ? (
          loadingLive ? (
            <div className="text-gray-400 mt-12">Chargement des matchs live...</div>
          ) : filteredLiveMatches.length > 0 ? (
            <div className="space-y-4">
              {filteredLiveMatches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => navigate(`/analyse/${match.id}`)}
                  className="cursor-pointer"
                >
                  <MatchCard match={match} isLive={true} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-300 italic mt-10">
              Aucun match en live pour le moment.
            </div>
          )
        ) : loading ? (
          <div className="text-gray-400 mt-12">Chargement des matchs du jour...</div>
        ) : filteredMatches.length > 0 ? (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => navigate(`/analyse/${match.id}`)}
                className="cursor-pointer"
              >
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-300 italic mt-10">
            Aucun match du jour trouvé avec ces critères.
          </div>
        )}
      </div>
    </div>
  );
}

// src/pages/MatchAnalysis.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/Button";
import SuggestionBlock from "../components/SuggestionBlock";
import AdminBanner from "../components/layout/AdminBanner";
import { useAuth } from "../context/AuthContext"; // pour attendre l'auth au moment de créer un ticket

// === Blocs spécialisés pour chaque type de stats ===
function FixtureDetails({ fixture }: { fixture: any }) {
  if (!fixture || Object.keys(fixture).length === 0) {
    return <div className="text-gray-400 italic">Non disponible…</div>;
  }
  return (
    <div className="grid gap-2 text-left">
      <div><b>Stade :</b> {fixture.venue?.name} ({fixture.venue?.city})</div>
      <div><b>Pays :</b> {fixture.league?.country}</div>
      <div><b>Compétition :</b> {fixture.league?.name}</div>
      <div><b>Saison :</b> {fixture.league?.season}</div>
      <div><b>Date :</b> {fixture.fixture?.date?.replace("T", " ").slice(0, 16)}</div>
      <div>
        <b>Statut :</b> {fixture.fixture?.status?.long}{" "}
        {fixture.fixture?.status?.elapsed ? `(${fixture.fixture?.status?.elapsed}’)` : ""}
      </div>
      <div><b>Arbitre :</b> {fixture.fixture?.referee || "Non précisé"}</div>
    </div>
  );
}

function StatBlock({ stats }: { stats: any[] }) {
  if (!stats?.length) return <div className="text-gray-400 italic">Non disponible…</div>;
  // stats = tableau [team1, team2]
  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th className="text-left">{stats[0]?.team?.name ?? "?"}</th>
          <th className="text-center">Stat</th>
          <th className="text-right">{stats[1]?.team?.name ?? "?"}</th>
        </tr>
      </thead>
      <tbody>
        {stats[0]?.statistics?.map((stat: any, i: number) => (
          <tr key={stat.type} className="border-t border-gray-200 dark:border-gray-700">
            <td className="py-1 text-left w-1/4">{stat.value}</td>
            <td className="py-1 text-center text-gray-600 dark:text-gray-300">{stat.type}</td>
            <td className="py-1 text-right w-1/4">{stats[1]?.statistics?.[i]?.value ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EventsBlock({ events }: { events: any[] }) {
  if (!events?.length) return <div className="text-gray-400 italic">Aucun événement…</div>;
  return (
    <ul className="space-y-1">
      {events.map((event, idx) => (
        <li key={idx} className="text-xs">
          <b>{event.player?.name}</b> — {event.type}
          {event.detail && <> ({event.detail})</>}
          {event.team && <span className="ml-2 text-gray-500">({event.team.name})</span>}
        </li>
      ))}
    </ul>
  );
}

function LineupsBlock({ lineups }: { lineups: any[] }) {
  if (!lineups?.length) return <div className="text-gray-400 italic">Non disponible…</div>;
  return (
    <div className="flex flex-wrap gap-4">
      {lineups.map((line, i) => (
        <div key={i} className="flex-1 min-w-[130px]">
          <div className="font-semibold mb-1">{line.team?.name}</div>
          <ul className="text-xs list-disc pl-4">
            {line.startXI?.map((p: any, idx: number) => (
              <li key={idx}>{p.player.name} ({p.player.pos})</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function OddsBlock({ odds, title = "Cotes" }: { odds: any[]; title?: string }) {
  if (!odds?.length) return <div className="text-gray-400 italic">Aucune cote détectée…</div>;
  return (
    <div>
      <div className="font-semibold mb-1">{title}</div>
      <pre className="overflow-x-auto text-xs">{JSON.stringify(odds, null, 2)}</pre>
    </div>
  );
}

type MatchStats = {
  last5Home?: { date: string; homeTeam: string; awayTeam: string; score: string }[];
  last5Away?: { date: string; homeTeam: string; awayTeam: string; score: string }[];
  headToHead?: { date: string; homeTeam: string; awayTeam: string; score: string }[];
  advanced?: { type: string; statistics: { type: string; value: string | number }[] }[];
};

type Prediction = { risk: string; text: string };

type MatchDetails = {
  id: number;
  home_team: string;
  away_team: string;
  logo_home?: string;
  logo_away?: string;
  time: string;
  is_live?: boolean;
  stats?: MatchStats;
  predictions?: Prediction[];
  message?: string;
  details_debug?: { no_suggestion_reason?: string };
};

export default function MatchAnalysis() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { ready } = useAuth(); // pour le POST de ticket

  // States pour pré-match
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // States pour live
  const [isLive, setIsLive] = useState(false);
  const [liveStats, setLiveStats] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [lineups, setLineups] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [odds, setOdds] = useState<any[]>([]);
  const [oddsPre, setOddsPre] = useState<any[]>([]);
  const [fixture, setFixture] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const [debugInfo, setDebugInfo] = useState({
    modelUsed: "",
    matchesAnalyzed: 0,
    analysisTimestamp: "",
  });

  // Récupère le type de match d'abord
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    axios
      .get(`/api/matchs/${id}/`)
      .then((res) => {
        if (res.data.is_live) {
          setIsLive(true);
          axios
            .get(`/api/matchs/${id}/stats-live/`)
            .then((res) => {
              setLiveStats(res.data.statistics || []);
              setEvents(res.data.events || []);
              setLineups(res.data.lineups || []);
              setPlayers(res.data.players || []);
              setOdds(res.data.odds_live || []);
              setOddsPre(res.data.odds || []);
              setFixture(res.data.fixture?.[0] || {});
              setMatch({
                id: res.data.fixture?.[0]?.fixture?.id ?? Number(id),
                home_team: res.data.fixture?.[0]?.teams?.home?.name || "Équipe 1",
                away_team: res.data.fixture?.[0]?.teams?.away?.name || "Équipe 2",
                logo_home: res.data.fixture?.[0]?.teams?.home?.logo || undefined,
                logo_away: res.data.fixture?.[0]?.teams?.away?.logo || undefined,
                time: res.data.fixture?.[0]?.fixture?.date?.slice(11, 16) || "",
                is_live: true,
              });
              setLoading(false);
            })
            .catch(() => {
              setError("Impossible de charger les statistiques live.");
              setLoading(false);
            });
        } else {
          setIsLive(false);
          axios
            .get(`/api/matchs/${id}/analyse/`)
            .then((res) => {
              setMatch(res.data);
              setDebugInfo({
                modelUsed: res.data.model,
                matchesAnalyzed: res.data.predictions?.length || 0,
                analysisTimestamp: new Date().toLocaleString(),
              });
              setLoading(false);
            })
            .catch(() => {
              setError("Impossible de charger l’analyse du match.");
              setLoading(false);
            });
        }
      })
      .catch(() => {
        setError("Impossible de charger les informations du match.");
        setLoading(false);
      });
  }, [id]);

  const handleSaveTicket = () => {
    if (!match) return;
    if (!ready) {
      alert("⏳ Initialisation en cours… réessayez dans une seconde.");
      return;
    }
    const payload = {
      match_id: match.id,
      // plus de user_id : backend => owner=request.user
      status: "pending",
      risk_level: "faible",
      result: "",
    };
    axios
      .post("/api/tickets/", payload)
      .then(() => alert("✅ Ticket enregistré avec succès ! 🎉"))
      .catch(() => {
        alert("❌ Erreur lors de l’enregistrement du ticket.");
      });
  };

  if (!id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 dark:text-gray-100">
        <div className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            Vous n'avez pas encore sélectionné un match à analyser.
          </h2>
          <p className="mb-6">
            Cliquez sur le bouton ci-dessous pour voir la liste des matchs du jour ou en live et en choisir un à analyser.
          </p>
          <Button onClick={() => navigate("/")}>Sélectionner un match</Button>
        </div>
      </div>
    );
  }

  if (loading || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-100">
        Chargement de l’analyse du match…
      </div>
    );
  }

  const placeholder = "https://placehold.co/40x40";

  return (
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition-colors duration-300">
      <Button onClick={() => navigate(-1)} className="mb-4">
        ← Retour
      </Button>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow text-center transition-colors duration-300">
        <div className="text-xl font-bold mb-2">🕒 {match.time}</div>
        <div className="flex justify-center items-center gap-4 mb-4">
          <img src={match.logo_home || placeholder} alt={match.home_team} className="w-10 h-10" />
          <span className="font-semibold">{match.home_team}</span>
          <span className="text-gray-500 dark:text-gray-300">vs</span>
          <span className="font-semibold">{match.away_team}</span>
          <img src={match.logo_away || placeholder} alt={match.away_team} className="w-10 h-10" />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {isLive ? (
          <>
            {/* 5 derniers matchs & Face à face même en live */}
            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.home_team}</h3>
              <div className="space-y-2">
                {match.stats?.last5Home?.length ? (
                  match.stats.last5Home.map((m, i) => (
                    <div key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      📅 {m.date} — {m.homeTeam} vs {m.awayTeam} : <strong>{m.score}</strong>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">Aucune donnée</div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.away_team}</h3>
              <div className="space-y-2">
                {match.stats?.last5Away?.length ? (
                  match.stats.last5Away.map((m, i) => (
                    <div key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      📅 {m.date} — {m.homeTeam} vs {m.awayTeam} : <strong>{m.score}</strong>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">Aucune donnée</div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">🤝 Face à face</h3>
              <div className="space-y-2">
                {match.stats?.headToHead?.length ? (
                  match.stats.headToHead.map((m, i) => (
                    <div key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      📅 {m.date} — {m.homeTeam} vs {m.awayTeam} : <strong>{m.score}</strong>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">Aucune donnée</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">📊 Statistiques LIVE</h3>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow mb-6">
                <StatBlock stats={liveStats} />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">📝 Événements (buts, cartons, changements…)</h3>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow mb-6">
                <EventsBlock events={events} />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">🧑‍💼 Compositions d’équipes</h3>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow mb-6">
                <LineupsBlock lineups={lineups} />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">💸 Cotes live (si dispo)</h3>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow mb-6">
                <OddsBlock odds={odds} title="Cotes live" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">📍 Infos supplémentaires</h3>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow mb-6">
                <FixtureDetails fixture={fixture} />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">💸 Cotes pré-match</h3>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow mb-6">
                <OddsBlock odds={oddsPre} title="Cotes pré-match" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.home_team}</h3>
              <div className="space-y-2">
                {match.stats?.last5Home?.length ? (
                  match.stats.last5Home.map((m, i) => (
                    <div key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      📅 {m.date} — {m.homeTeam} vs {m.awayTeam} : <strong>{m.score}</strong>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">Aucune donnée</div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.away_team}</h3>
              <div className="space-y-2">
                {match.stats?.last5Away?.length ? (
                  match.stats.last5Away.map((m, i) => (
                    <div key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      📅 {m.date} — {m.homeTeam} vs {m.awayTeam} : <strong>{m.score}</strong>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">Aucune donnée</div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">🤝 Face à face</h3>
              <div className="space-y-2">
                {match.stats?.headToHead?.length ? (
                  match.stats.headToHead.map((m, i) => (
                    <div key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      📅 {m.date} — {m.homeTeam} vs {m.awayTeam} : <strong>{m.score}</strong>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">Aucune donnée</div>
                )}
              </div>
            </div>
            <SuggestionBlock
              predictions={match.predictions}
              message={match.message}
              details_debug={match.details_debug}
            />
          </>
        )}
        <AdminBanner
          modelUsed={debugInfo.modelUsed}
          matchesAnalyzed={debugInfo.matchesAnalyzed}
          analysisTimestamp={debugInfo.analysisTimestamp}
        />
        <div className="text-center mt-6">
          <Button onClick={handleSaveTicket}>✅ Enregistrer ce ticket</Button>
        </div>
      </div>
    </div>
  );
}

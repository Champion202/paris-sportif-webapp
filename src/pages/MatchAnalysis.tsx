// src/pages/MatchAnalysis.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/Button";
import SuggestionBlock from "../components/SuggestionBlock";
import AdminBanner from "../components/layout/AdminBanner";
import { useAuth } from "../context/AuthContext";

// ---------- Helpers d'affichage/normalisation ----------
type APIFootballScore = {
  halftime?: { home?: number; away?: number };
  fulltime?: { home?: number; away?: number };
  extratime?: { home?: number; away?: number };
  penalty?: { home?: number; away?: number };
};

function fmtScore(s?: APIFootballScore): string {
  const ft = s?.fulltime;
  if (ft && (ft.home != null || ft.away != null)) return `${ft.home ?? 0}-${ft.away ?? 0}`;
  const ht = s?.halftime;
  if (ht && (ht.home != null || ht.away != null)) return `${ht.home ?? 0}-${ht.away ?? 0}`;
  return "-";
}

/** Convertit un item brut API-Football OU déjà "plat" en ligne lisible */
function toRow(item: any) {
  // Cas "plat" déjà conforme à l'ancien type attendu
  if (item?.date && item?.homeTeam && item?.awayTeam) {
    return {
      date: String(item.date),
      homeTeam: String(item.homeTeam),
      awayTeam: String(item.awayTeam),
      score: typeof item.score === "string" ? item.score : fmtScore(item.score),
    };
  }
  // Cas brut API-Football
  const dateStr: string =
    item?.fixture?.date ? String(item.fixture.date).replace("T", " ").slice(0, 16) : "";
  const home = item?.teams?.home?.name ?? item?.team?.home?.name ?? "Équipe A";
  const away = item?.teams?.away?.name ?? item?.team?.away?.name ?? "Équipe B";
  const scoreObj: APIFootballScore | undefined = item?.score;
  const scoreStr = fmtScore(scoreObj);
  return { date: dateStr, homeTeam: home, awayTeam: away, score: scoreStr };
}

/** Rend un tableau d'historiques hétérogènes (plats ou bruts API) */
function renderHistory(list?: any[]) {
  if (!list?.length) {
    return <div className="text-gray-400">Aucune donnée</div>;
  }
  return (
    <div className="space-y-2">
      {list.map((m, i) => {
        const row = toRow(m);
        return (
          <div key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
            📅 {row.date} — {row.homeTeam} vs {row.awayTeam} : <strong>{row.score}</strong>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Blocs spécialisés pour les stats avancées ----------
function FixtureDetails({ fixture }: { fixture: any }) {
  if (!fixture || Object.keys(fixture).length === 0) {
    return <div className="text-gray-400 italic">Non disponible…</div>;
  }
  return (
    <div className="grid gap-2 text-left">
      <div>
        <b>Stade :</b> {fixture.venue?.name} ({fixture.venue?.city})
      </div>
      <div>
        <b>Pays :</b> {fixture.league?.country}
      </div>
      <div>
        <b>Compétition :</b> {fixture.league?.name}
      </div>
      <div>
        <b>Saison :</b> {fixture.league?.season}
      </div>
      <div>
        <b>Date :</b>{" "}
        {fixture.fixture?.date ? String(fixture.fixture.date).replace("T", " ").slice(0, 16) : ""}
      </div>
      <div>
        <b>Statut :</b> {fixture.fixture?.status?.long}{" "}
        {fixture.fixture?.status?.elapsed ? `(${fixture.fixture?.status?.elapsed}’)` : ""}
      </div>
      <div>
        <b>Arbitre :</b> {fixture.fixture?.referee || "Non précisé"}
      </div>
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
        {(stats[0]?.statistics ?? []).map((stat: any, i: number) => (
          <tr key={`${stat.type}-${i}`} className="border-t border-gray-200 dark:border-gray-700">
            <td className="py-1 text-left w-1/4">{stat.value ?? "-"}</td>
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
            {(line.startXI ?? []).map((p: any, idx: number) => (
              <li key={idx}>
                {p.player?.name} ({p.player?.pos})
              </li>
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

// ---------- Types locaux ----------
type MatchStats = {
  last5Home?: any[];
  last5Away?: any[];
  headToHead?: any[];
  advanced?: any[];
};

// Type compatible avec SuggestionBlock (risk requis)
type UISuggestion = { risk: string; text: string };

type MatchDetails = {
  id: number;
  home_team: string;
  away_team: string;
  logo_home?: string;
  logo_away?: string;
  time: string;
  is_live?: boolean;
  stats?: MatchStats;
  predictions?: UISuggestion[];
  message?: string;
  details_debug?: { no_suggestion_reason?: string; model_reason?: string };
  model?: string;
};

// ---------- Page ----------
export default function MatchAnalysis() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { ready } = useAuth();

  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Live-only blocs
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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    axios
      .get(`/api/matchs/${id}/`)
      .then((res) => {
        if (res.data?.is_live) {
          // ----- MODE LIVE -----
          axios
            .get(`/api/matchs/${id}/stats-live/`)
            .then((r2) => {
              setLiveStats(r2.data?.statistics || []);
              setEvents(r2.data?.events || []);
              setLineups(r2.data?.lineups || []);
              setPlayers(r2.data?.players || []);
              setOdds(r2.data?.odds_live || []);
              setOddsPre(r2.data?.odds || []);
              setFixture((r2.data?.fixture ?? [])[0] || {});

              setMatch({
                id: (r2.data?.fixture?.[0]?.fixture?.id ?? Number(id)) as number,
                home_team: r2.data?.fixture?.[0]?.teams?.home?.name || "Équipe 1",
                away_team: r2.data?.fixture?.[0]?.teams?.away?.name || "Équipe 2",
                logo_home: r2.data?.fixture?.[0]?.teams?.home?.logo || undefined,
                logo_away: r2.data?.fixture?.[0]?.teams?.away?.logo || undefined,
                time: r2.data?.fixture?.[0]?.fixture?.date?.slice(11, 16) || "",
                is_live: true,
                stats: {
                  last5Home: r2.data?.last5Home ?? [],
                  last5Away: r2.data?.last5Away ?? [],
                  headToHead: r2.data?.headToHead ?? [],
                },
                predictions: [], // pas de prédictions dans ce flux
              });

              setDebugInfo({
                modelUsed: "LIVE",
                matchesAnalyzed: 0,
                analysisTimestamp: new Date().toLocaleString(),
              });
              setLoading(false);
            })
            .catch(() => {
              setError("Impossible de charger les statistiques live.");
              setLoading(false);
            });
        } else {
          // ----- MODE PREMATCH -----
          axios
            .get(`/api/matchs/${id}/analyse/`)
            .then((r2) => {
              const d = r2.data || {};
              // S'assure que stats existe toujours
              const stats: MatchStats = {
                last5Home: d?.stats?.last5Home ?? d?.last5Home ?? [],
                last5Away: d?.stats?.last5Away ?? d?.last5Away ?? [],
                headToHead: d?.stats?.headToHead ?? d?.headToHead ?? [],
                advanced: d?.stats?.advanced ?? [],
              };

              // Normalise les prédictions pour être compatibles avec SuggestionBlock
              const predictions: UISuggestion[] = (d.predictions ?? []).map((p: any) => ({
                text: String(p?.text ?? ""),
                risk: String(p?.risk ?? "standard"),
              }));

              setMatch({
                id: d.id ?? Number(id),
                home_team: d.home_team ?? "Équipe 1",
                away_team: d.away_team ?? "Équipe 2",
                logo_home: d.logo_home,
                logo_away: d.logo_away,
                time: d.time ?? "",
                is_live: false,
                stats,
                predictions,
                message: d.message,
                details_debug: d.details_debug,
                model: d.model,
              });

              setDebugInfo({
                modelUsed: d.model ?? "",
                matchesAnalyzed: predictions.length,
                analysisTimestamp: new Date().toLocaleString(),
              });
              setLoading(false);
            })
            .catch(() => {
              setError("Impossible de charger l’analyse du match.");
              setLoading(false);   // <<< FIX ICI
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
            Cliquez sur le bouton ci-dessous pour voir la liste des matchs du jour ou en live et en
            choisir un à analyser.
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
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition-colors durée-300">
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
        {match.is_live ? (
          <>
            {/* 5 derniers matchs & Face à face même en live */}
            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.home_team}</h3>
              {renderHistory(match.stats?.last5Home)}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.away_team}</h3>
              {renderHistory(match.stats?.last5Away)}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">🤝 Face à face</h3>
              {renderHistory(match.stats?.headToHead)}
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
              {renderHistory(match.stats?.last5Home)}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.away_team}</h3>
              {renderHistory(match.stats?.last5Away)}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">🤝 Face à face</h3>
              {renderHistory(match.stats?.headToHead)}
            </div>

            <SuggestionBlock
              predictions={match.predictions ?? []}
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

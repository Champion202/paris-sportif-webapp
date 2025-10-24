// src/pages/MatchAnalysis.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/Button";
import SuggestionBlock from "../components/SuggestionBlock";
import AdminBanner from "../components/layout/AdminBanner";
import { useAuth } from "../context/AuthContext";
import LineupList from "../components/LineupList";

import Section from "../components/layout/Section";
import Row from "../components/ui/Row";
import KeyValueList from "../components/KeyValueList";
import StandingsSide from "../components/StandingsSide";
import HistoryList from "../components/history/HistoryList";

import FixtureDetails from "../components/live/FixtureDetails";
import StatBlock from "../components/live/StatBlock";
import EventsBlock from "../components/live/EventsBlock";
import LineupsBlock from "../components/live/LineupsBlock";
import OddsBlock from "../components/live/OddsBlock";

// Forme / Stats
import FormSection from "../components/form/FormSection";
import AvgStatsSection from "../components/stats/AvgStatsSection";

// ✅ même normalisation que HistoryList
import { toRow } from "../utils/football";
import ScorerWeightSection, { ScorerRow } from "../components/stats/ScorerWeightSection";
import SignalsSection from "../components/stats/SignalsSection";
import HomeAdvantageSection from "../components/stats/HomeAdvantageSection";

// 🔥 Règle 0 (H2H par lieu)
import { evaluateH2HVenueRule } from "../logic/rules/h2hVenueRule";

import type {
  MatchStats,
  UISuggestion,
  FeaturesUsed,
  MarketUsed,
  MatchDetails,
} from "../types/match";

/** ================= Fenêtres de calcul ================= */
const N_LAST_FOR_STATS = 5;      // pour AvgStats + H2H
const N_LAST_FOR_SCORERS = 8;    // pour "Poids des buteurs récents"

/* =============================================================================
   Helpers: extraction équipes/scores + calcul FORM côté client
============================================================================= */

function _extractTeams(item: any): { homeName?: string; awayName?: string } {
  if (!item) return {};
  if (item.homeTeam || item.awayTeam) {
    return { homeName: item.homeTeam, awayName: item.awayTeam };
  }
  return {
    homeName: item?.teams?.home?.name ?? item?.team?.home?.name,
    awayName: item?.teams?.away?.name ?? item?.team?.away?.name,
  };
}

function _extractGoals(item: any): { gh?: number; ga?: number } {
  const asStr = typeof item?.score === "string" ? item.score : undefined;
  if (asStr && /^\d+\s*-\s*\d+$/.test(asStr)) {
    const [a, b] = asStr.split("-").map((s: string) => Number(s.trim()));
    return { gh: a, ga: b };
  }
  const goals = item?.goals || item?.score || {};
  const gh = Number(goals?.home ?? goals?.Home ?? goals?.h ?? goals?.H);
  const ga = Number(goals?.away ?? goals?.Away ?? goals?.a ?? goals?.A);
  return {
    gh: Number.isFinite(gh) ? gh : undefined,
    ga: Number.isFinite(ga) ? ga : undefined,
  };
}

function computeCompactFormFromLast5(list: any[] | undefined, teamName?: string) {
  if (!Array.isArray(list) || !teamName) return undefined;

  let n = 0, win = 0, draw = 0, loss = 0;
  let gfSum = 0, gaSum = 0;
  const seq: string[] = [];

  for (const it of list.slice(0, 5)) {
    const { homeName, awayName } = _extractTeams(it);
    if (!homeName || !awayName) continue;

    const { gh, ga } = _extractGoals(it);
    if (gh == null || ga == null) continue;

    let gf: number | undefined, gaMe: number | undefined;
    if (homeName === teamName) { gf = gh; gaMe = ga; }
    else if (awayName === teamName) { gf = ga; gaMe = gh; }
    else { continue; }

    n += 1;
    gfSum += gf!;
    gaSum += gaMe!;

    if (gf! > gaMe!) { win += 1; seq.push("W"); }
    else if (gf! === gaMe!) { draw += 1; seq.push("D"); }
    else { loss += 1; seq.push("L"); }
  }

  if (n === 0) return undefined;

  return {
    n, win, draw, loss,
    gf_avg: +(gfSum / n).toFixed(2),
    ga_avg: +(gaSum / n).toFixed(2),
    seq: seq.join(""),
  };
}

function computeVenueFormFromList(
  list: any[] | undefined,
  teamName?: string,
  venue: "home" | "away" = "home"
) {
  if (!Array.isArray(list) || !teamName) return undefined;
  const filtered = list.filter((it) => {
    const { homeName, awayName } = _extractTeams(it);
    return venue === "home" ? homeName === teamName : awayName === teamName;
  });
  return computeCompactFormFromLast5(filtered, teamName);
}

/* =============================================================================
   Helpers AvgStats: lecture tolérante dans /advanced/ (mêmes libellés que le drawer)
============================================================================= */

type MetricKey =
  | "sot" | "soff" | "shots" | "attacks" | "dangerous"
  | "fouls" | "offsides" | "corners" | "yellow" | "red";

const METRIC_KEYS: Record<MetricKey, string[]> = {
  sot: [
    "Shots on Goal","Shots On Goal","Shots on target","Shots On Target",
    "On Target","SOG","SoT","shots_on_target","sot"
  ],
  soff: ["Shots off Goal","Shots Off Goal","Off Target","SOFF","shots_off_target","soff"],
  shots: ["Total Shots","Shots","shots","Total shots"],
  attacks: ["Attacks","attacks"],
  dangerous: ["Dangerous Attacks","dangerous_attacks","Dangerous"],
  fouls: ["Fouls","fouls"],
  offsides: ["Offsides","offsides"],
  corners: ["Corner Kicks","Corners","Corner","corners"],
  yellow: ["Yellow Cards","Yellow","yellow_cards","yellow"],
  red: ["Red Cards","Red","red_cards","red"],
};

function _num(v: any): number | null {
  const n = Number(String(v ?? "").replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
}

function _readMetricFromAdvanced(advanced: any, teamName: string, metric: MetricKey): number | null {
  if (!advanced) return null;
  const rows = advanced.statistics ?? advanced.stats ?? [];
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const row =
    rows.find(
      (r: any) =>
        (r.team?.name ?? r.team ?? "").toString().toLowerCase() ===
        teamName.toLowerCase()
    ) ?? null;
  if (!row) return null;

  const table = row.table ?? row.statistics ?? [];
  if (!Array.isArray(table)) return null;

  for (const k of METRIC_KEYS[metric]) {
    const cell = table.find(
      (x: any) =>
        (x.key || x.type || x.name)?.toString().toLowerCase() ===
        k.toLowerCase()
    );
    if (!cell) continue;
    const n = _num(cell.val ?? cell.value ?? cell.v);
    if (n != null) return n;
  }
  return null;
}

/* =============================================================================
   Page
============================================================================= */

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

  // Drawer
  const [openFix, setOpenFix] = useState<number | null>(null);
  const [fixDetails, setFixDetails] = useState<any | null>(null);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);

  // 📊 Stats moyennes détaillées (séries M1..M5 préfetchées depuis /advanced/)
  const emptySeries = {
    sot: [] as Array<number | null>,
    soff: [] as Array<number | null>,
    shots: [] as Array<number | null>,
    attacks: [] as Array<number | null>,
    dangerous: [] as Array<number | null>,
    fouls: [] as Array<number | null>,
    offsides: [] as Array<number | null>,
    corners: [] as Array<number | null>,
    yellow: [] as Array<number | null>,
    red: [] as Array<number | null>,
  };
  const [avgStatsLoading, setAvgStatsLoading] = useState(false);
  const [avgStatsHome, setAvgStatsHome] = useState({ ...emptySeries });
  const [avgStatsAway, setAvgStatsAway] = useState({ ...emptySeries });
  const [avgStatsH2HHome, setAvgStatsH2HHome] = useState({ ...emptySeries });
  const [avgStatsH2HAway, setAvgStatsH2HAway] = useState({ ...emptySeries });

  const [scorersHome, setScorersHome] = useState<ScorerRow[]>([]);
  const [scorersAway, setScorersAway] = useState<ScorerRow[]>([]);

  async function openLastMatchDetails(fixtureId?: number) {
    if (!fixtureId) return;
    setOpenFix(fixtureId);
    setFixLoading(true);
    setFixError(null);
    setFixDetails(null);
    try {
      const { data } = await axios.get(`/api/matchs/${fixtureId}/advanced/`);
      setFixDetails(data);
    } catch {
      setFixError("Impossible de charger les détails de ce match.");
    } finally {
      setFixLoading(false);
    }
  }

  // mapping id->nom pour composants avancés
  const idNameMap = useMemo<Record<string, string>>(() => {
    const fu = match?.features_used;
    const map: Record<string, string> = { ...(fu?.players_index || {}) };

    const addFromComposition = (side?: any) => {
      if (!side) return;
      ["xi", "bench", "out"].forEach((k) => {
        (side?.[k] || []).forEach((p: any) => {
          if (p?.id && p?.name && !map[String(p.id)]) map[String(p.id)] = String(p.name);
        });
      });
    };
    addFromComposition(fu?.composition?.home);
    addFromComposition(fu?.composition?.away);

    const addFromImpact = (side?: any) => {
      (side?.details || []).forEach((d: any) => {
        if (d?.player_id && d?.name && !map[String(d.player_id)]) map[String(d.player_id)] = String(d.name);
      });
    };
    addFromImpact(fu?.missing_players_impact?.home);
    addFromImpact(fu?.missing_players_impact?.away);

    return map;
  }, [match?.features_used]);

  // Charge le match (pré-match ou live)
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
                predictions: [],
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
              const stats: MatchStats = {
                last5Home: d?.stats?.last5Home ?? d?.last5Home ?? [],
                last5Away: d?.stats?.last5Away ?? d?.last5Away ?? [],
                headToHead: d?.stats?.headToHead ?? d?.headToHead ?? [],
                advanced: d?.stats?.advanced ?? [],
              };

              const predictions: UISuggestion[] = (d.predictions ?? []).map((p: any) => ({
                text: String(p?.text ?? ""),
                risk: String(p?.risk ?? "standard"),
              }));

              // Marché
              let market_used: MarketUsed | undefined = d.market_used;
              const fu: FeaturesUsed | undefined = d.features_used ?? {};
              const baseMarket = fu?.market;
              if (!market_used && baseMarket) {
                market_used = {
                  source: baseMarket.source,
                  is_live: baseMarket.is_live,
                  odds: baseMarket.odds,
                  implied_probs: baseMarket.implied_probs,
                };
              }
              if ((!market_used?.odds || Object.keys(market_used.odds).length === 0) && d?.odds_1x2_1X2) {
                const o = d.odds_1x2_1X2;
                market_used = {
                  ...(market_used || {}),
                  odds: { home: o["1"], draw: o["X"], away: o["2"] },
                };
              }

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
                features_used: fu,
                market_used,
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
              setLoading(false);
            });
        }
      })
      .catch(() => {
        setError("Impossible de charger les informations du match.");
        setLoading(false);
      });
  }, [id, ready]);

  // ✅ Pré-fetch /advanced/ : Stats (5) + H2H (5) + Buteurs (8)
  useEffect(() => {
    if (!match || match.is_live) return;

    // --- Fenêtres pour ce run
    const listH = (match.stats?.last5Home ?? []).slice(0, N_LAST_FOR_STATS);
    const listA = (match.stats?.last5Away ?? []).slice(0, N_LAST_FOR_STATS);

    const h2hList = match.stats?.headToHead ?? [];
    const h2hHomeList = h2hList
      .filter((it: any) => _extractTeams(it).homeName === match.home_team)
      .slice(0, N_LAST_FOR_STATS);
    const h2hAwayList = h2hList
      .filter((it: any) => _extractTeams(it).awayName === match.away_team)
      .slice(0, N_LAST_FOR_STATS);

    // Fenêtre spécifique pour le poids des buteurs
    const homeListForScorers = (match.stats?.last5Home ?? []).slice(0, N_LAST_FOR_SCORERS);
    const awayListForScorers = (match.stats?.last5Away ?? []).slice(0, N_LAST_FOR_SCORERS);

    const homeName = match.home_team;
    const awayName = match.away_team;

    const metrics: MetricKey[] = [
      "sot","soff","shots","attacks","dangerous","fouls","offsides","corners","yellow","red"
    ];

    // ---- Helpers communs (réutilisés pour stats & buteurs) ----
    const fetchAdvsForList = async (list: any[]) => {
      const ids = list
        .map((it) => (toRow(it)?.fixtureId as number | undefined))
        .filter((x): x is number => Number.isFinite(x));
      if (!ids.length) return [] as any[];
      const results = await Promise.allSettled(
        ids.map(async (fid) => {
          const { data } = await axios.get(`/api/matchs/${fid}/advanced/`);
          return data ?? null;
        })
      );
      return results.map((r) => (r.status === "fulfilled" ? r.value : null));
    };

    const buildSeriesFromAdvs = (advs: any[], teamName: string) => {
      const out: Record<MetricKey, Array<number | null>> = {} as any;
      for (const m of metrics) {
        out[m] = advs.map((adv) => _readMetricFromAdvanced(adv, teamName, m));
      }
      return out as typeof emptySeries;
    };

    const aggregateScorersFromAdvs = (advs: any[], teamName: string): ScorerRow[] => {
      const same = (a?: string, b?: string) => (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
      const goalsByPlayer = new Map<string, number>();
      let total = 0;
      for (const adv of advs) {
        const goals = (adv?.events?.goals ?? adv?.goals ?? []) as any[];
        for (const g of goals) {
          const detail = (g.detail ?? "").toString().toLowerCase();
          if (!same(g.team, teamName)) continue;
          if (detail.includes("own goal")) continue; // ignore CSC
          const player = g.player;
          if (!player) continue;
          goalsByPlayer.set(player, (goalsByPlayer.get(player) ?? 0) + 1);
          total += 1;
        }
      }
      const arr: ScorerRow[] = Array.from(goalsByPlayer.entries())
        .map(([player, goals]) => ({ player, goals, pct: total > 0 ? (goals * 100) / total : 0 }))
        .sort((a, b) => b.goals - a.goals || b.pct - a.pct);
      return arr;
    };

    (async () => {
      setAvgStatsLoading(true);
      try {
        // Stats (5) & H2H (5)
        const [advsH, advsA, advsH2hH, advsH2hA] = await Promise.all([
          fetchAdvsForList(listH),
          fetchAdvsForList(listA),
          fetchAdvsForList(h2hHomeList),
          fetchAdvsForList(h2hAwayList),
        ]);

        setAvgStatsHome(buildSeriesFromAdvs(advsH, homeName));
        setAvgStatsAway(buildSeriesFromAdvs(advsA, awayName));
        setAvgStatsH2HHome(buildSeriesFromAdvs(advsH2hH, homeName));
        setAvgStatsH2HAway(buildSeriesFromAdvs(advsH2hA, awayName));

        // Buteurs (8)
        const [advsH_scorers, advsA_scorers] = await Promise.all([
          fetchAdvsForList(homeListForScorers),
          fetchAdvsForList(awayListForScorers),
        ]);

        // buteurs récents + statut selon composition
        const compHome = match.features_used?.composition?.home;
        const compAway = match.features_used?.composition?.away;

        const statusOf = (name: string, comp?: any): ScorerRow["status"] => {
          if (!comp) return "Inconnu";
          const inXI = (comp.xi ?? comp.startXI ?? []).some((p: any) => (p.player?.name ?? p.name) === name);
          const onBench = (comp.bench ?? comp.substitutes ?? []).some((p: any) => (p.player?.name ?? p.name) === name);
          const isOut = (comp.out ?? []).some((p: any) => (p.player?.name ?? p.name) === name);
          if (inXI) return "XI";
          if (onBench) return "Banc";
          if (isOut) return "Absent";
          return "Inconnu";
        };

        const scorersH = aggregateScorersFromAdvs(advsH_scorers, homeName).map(s => ({ ...s, status: statusOf(s.player, compHome) }));
        const scorersA = aggregateScorersFromAdvs(advsA_scorers, awayName).map(s => ({ ...s, status: statusOf(s.player, compAway) }));

        setScorersHome(scorersH);
        setScorersAway(scorersA);
      } finally {
        setAvgStatsLoading(false);
      }
    })();
  }, [
    match?.id,
    match?.is_live,
    match?.home_team,
    match?.away_team,
    match?.stats?.last5Home,
    match?.stats?.last5Away,
    match?.stats?.headToHead,
  ]);

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
  const f = match.features_used ?? {};
  const mkt = match.market_used ?? {};

  // Standings (si tu veux les afficher plus tard)
  const standingsHome =
    f?.standings?.home ??
    (f?.standings?.home_rank != null || f?.standings?.home_points != null
      ? { rank: f?.standings?.home_rank, points: f?.standings?.home_points }
      : undefined);

  const standingsAway =
    f?.standings?.away ??
    (f?.standings?.away_rank != null || f?.standings?.away_points != null
      ? { rank: f?.standings?.away_rank, points: f?.standings?.away_points }
      : undefined);

  // ===== Forme & H2H : calcul côté client par équipe et par venue =====
  const homeTeamHomeForm = computeVenueFormFromList(match.stats?.last5Home, match.home_team, "home");
  const awayTeamAwayForm = computeVenueFormFromList(match.stats?.last5Away, match.away_team, "away");

  // 🤝 Face à face filtré (mêmes rôles)
  const h2hList = match.stats?.headToHead ?? [];
  const h2hForHomeAtHome = h2hList.filter((it: any) => _extractTeams(it).homeName === match.home_team);
  const h2hForAwayAtAway = h2hList.filter((it: any) => _extractTeams(it).awayName === match.away_team);
  const h2hHomeAtHomeForm = computeVenueFormFromList(h2hForHomeAtHome, match.home_team, "home");
  const h2hAwayAtAwayForm = computeVenueFormFromList(h2hForAwayAtAway, match.away_team, "away");

  // === ✔️ RÈGLE 0 (H2H par lieu, série parfaite) ===
  const rule0 = evaluateH2HVenueRule({
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homeH2HForm: h2hHomeAtHomeForm || undefined,
    awayH2HForm: h2hAwayAtAwayForm || undefined,
    odds: mkt?.odds,
    implied: mkt?.implied_probs,
    // minN: 3, // défaut = 3
  });

  const mergedPredictions: UISuggestion[] = [
    ...(rule0.triggered
      ? [{ text: rule0.suggestionText!, risk: rule0.risk || "standard" }]
      : []),
    ...(match.predictions ?? []),
  ];

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
        {match.is_live ? (
          <>
            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.home_team}</h3>
              <HistoryList list={match.stats?.last5Home} onOpen={openLastMatchDetails} />
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.away_team}</h3>
              <HistoryList list={match.stats?.last5Away} onOpen={openLastMatchDetails} />
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">🤝 Face à face</h3>
              <HistoryList list={match.stats?.headToHead} onOpen={openLastMatchDetails} />
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
            {/* Historique */}
            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.home_team}</h3>
              <HistoryList list={match.stats?.last5Home} onOpen={openLastMatchDetails} />
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">📊 5 derniers matchs - {match.away_team}</h3>
              <HistoryList list={match.stats?.last5Away} onOpen={openLastMatchDetails} />
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">🤝 Face à face</h3>
              <HistoryList list={match.stats?.headToHead} onOpen={openLastMatchDetails} />
            </div>

            {/* Suggestions (avec Règle 0 si déclenchée) */}
            <SuggestionBlock
              predictions={mergedPredictions}
              message={rule0.triggered ? (match.message || rule0.reason) : match.message}
              details_debug={match.details_debug}
            />

            {/* Données utilisées */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg mt-4">🧠 Données utilisées par l’algorithme</h3>

              <Section title="🏟️ Contexte & Ligue">
                <KeyValueList obj={f?.context} />
              </Section>

              <Section title="📈 Classement (standings)">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StandingsSide title="Domicile" data={f?.standings?.home ?? f?.standings} />
                  <StandingsSide title="Extérieur" data={f?.standings?.away ?? f?.standings} />
                </div>
              </Section>

              {/* 🔥 Forme + 🤝 Face à face */}
              <FormSection
                homeTeamName={match.home_team}
                awayTeamName={match.away_team}
                /* 🔥 Forme (générale par venue) */
                homeTeamHomeForm={homeTeamHomeForm}
                awayTeamAwayForm={awayTeamAwayForm}
                /* 🤝 Face à face (filtrée) */
                h2hHomeAtHomeForm={h2hHomeAtHomeForm}
                h2hAwayAtAwayForm={h2hAwayAtAwayForm}
              />

              {/* 📊 Stats moyennes détaillées (séries M1..M5 préfetchées) */}
              <AvgStatsSection
                loading={avgStatsLoading}
                home={avgStatsHome}
                away={avgStatsAway}
                homeTeamName={match.home_team}
                awayTeamName={match.away_team}
                h2hHome={avgStatsH2HHome}
                h2hAway={avgStatsH2HAway}
              />

              {/* 🥅 Poids des buteurs récents */}
              <ScorerWeightSection
                homeTeamName={match.home_team}
                awayTeamName={match.away_team}
                home={scorersHome}
                away={scorersAway}
                n={N_LAST_FOR_SCORERS}
              />

              <Section title="🧑‍🏫 Composition (XI, banc, absents)">
                <LineupList
                  composition={f?.composition}
                  homeName={match.home_team}
                  awayName={match.away_team}
                  className="mt-2"
                />
              </Section>

              <SignalsSection signals={f?.signals} />

              {/* 🏠 Avantage terrain (masqué automatiquement si non appliqué) */}
              <HomeAdvantageSection data={f?.home_advantage} />

              <Section title="💸 Marché (cotes 1X2 & probabilités implicites)">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="font-medium mb-1">Cotes 1X2</div>
                    <KeyValueList obj={mkt?.odds} />
                  </div>
                  <div>
                    <div className="font-medium mb-1">Probabilités implicites</div>
                    <KeyValueList obj={mkt?.implied_probs} />
                  </div>
                </div>
                <div className="mt-2">
                  <Row label="Source" value={mkt?.source ?? "—"} />
                </div>
              </Section>

              {f?.raw_subset && (
                <Section title="🧪 Avancé (extrait brut utilisé)">
                  <pre className="overflow-x-auto text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                    {JSON.stringify(f.raw_subset, null, 2)}
                  </pre>
                </Section>
              )}
            </div>
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

      {/* ===== Drawer de détails sur un match passé ===== */}
      {openFix && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex"
          onClick={() => setOpenFix(null)}
        >
          <div
            className="ml-auto h-full w-full sm:w-[560px] bg-white dark:bg-gray-900 shadow-xl
                 p-4 overflow-y-auto overscroll-contain
                 pb-28 sm:pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Détails du match #{openFix}</div>
              <Button onClick={() => setOpenFix(null)}>Fermer</Button>
            </div>

            {fixLoading && <div className="text-sm opacity-80">Chargement…</div>}
            {fixError && <div className="text-sm text-red-500">{fixError}</div>}

            {fixDetails && (
              <div className="space-y-4 text-sm">
                {/* LINEUPS */}
                <div>
                  <div className="font-medium mb-1">Compositions</div>
                  <div className="grid grid-cols-1 gap-3">
                    {(fixDetails.lineups || fixDetails.lineup || []).map((ln: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="font-semibold">
                          {ln.team?.name || ln.team_name || "—"} {ln.formation ? `(${ln.formation})` : ""}
                        </div>
                        <div className="mt-1">
                          <div className="opacity-70 mb-1">XI</div>
                          <ul className="list-disc pl-5">
                            {((ln.startXI || ln.xi) || []).map((p: any, i: number) => {
                              const pl = p.player || p;
                              return (
                                <li key={i}>
                                  {pl.name} {pl.pos ? `(${pl.pos})` : ""} {pl.number != null ? `[#${pl.number}]` : ""}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        {((ln.substitutes || ln.bench) || []).length > 0 && (
                          <div className="mt-2">
                            <div className="opacity-70 mb-1">Banc</div>
                            <ul className="list-disc pl-5">
                              {((ln.substitutes || ln.bench) || []).map((p: any, i: number) => {
                                const pl = p.player || p;
                                return (
                                  <li key={i}>
                                    {pl.name} {pl.pos ? `(${pl.pos})` : ""} {pl.number != null ? `[#${pl.number}]` : ""}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* EVENTS */}
                <div>
                  <div className="font-medium mb-1">Événements</div>
                  <div className="space-y-2">
                    <div>
                      <div className="opacity-70">Buts</div>
                      <ul className="list-disc pl-5">
                        {((fixDetails.events?.goals) || fixDetails.goals || []).map((e: any, i: number) => (
                          <li key={i}>
                            {e.minute}’ — {e.team} — <b>{e.player}</b>
                            {e.assist ? ` (${e.assist})` : ""} {e.detail ? `· ${e.detail}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="opacity-70">Cartons</div>
                      <ul className="list-disc pl-5">
                        {((fixDetails.events?.cards) || fixDetails.cards || []).map((e: any, i: number) => (
                          <li key={i}>
                            {e.minute}’ — {e.team} — <b>{e.player}</b> — {e.card}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="opacity-70">Changements</div>
                      <ul className="list-disc pl-5">
                        {((fixDetails.events?.subs) || fixDetails.subs || []).map((e: any, i: number) => (
                          <li key={i}>
                            {e.minute}’ — {e.team} — {e.out} → <b>{e.inn}</b>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* STATS */}
                <div>
                  <div className="font-medium mb-1">Statistiques</div>
                  {((fixDetails.statistics || fixDetails.stats) || []).length === 2 ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left">Team</th>
                          <th>SOG</th><th>SOFF</th><th>Shots</th>
                          <th>Attacks</th><th>Dangerous</th>
                          <th>Fouls</th><th>Offsides</th><th>Corners</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((fixDetails.statistics || fixDetails.stats) || []).map((row: any, i: number) => {
                          const get = (k: string) =>
                            row.table?.find((x: any) => x.key === k)?.val ??
                            row.statistics?.find((x: any) => x.type === k)?.value ??
                            0;
                          return (
                            <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                              <td className="py-1 text-left">{row.team?.name || row.team}</td>
                              <td className="text-center">{get("Shots on Goal")}</td>
                              <td className="text-center">{get("Shots off Goal")}</td>
                              <td className="text-center">{get("Total Shots")}</td>
                              <td className="text-center">{get("Attacks")}</td>
                              <td className="text-center">{get("Dangerous Attacks")}</td>
                              <td className="text-center">{get("Fouls")}</td>
                              <td className="text-center">{get("Offsides")}</td>
                              <td className="text-center">{get("Corner Kicks")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-gray-500">Statistiques indisponibles.</div>
                  )}
                </div>
              </div>
            )}

            <div className="h-8" />
          </div>
        </div>
      )}
    </div>
  );
}

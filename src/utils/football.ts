// src/utils/football.ts
import { APIFootballScore } from "../types/match";

export function fmtScore(s?: APIFootballScore | string): string {
  if (typeof s === "string") return s;
  const ft = s?.fulltime;
  if (ft && (ft.home != null || ft.away != null)) return `${ft.home ?? 0}-${ft.away ?? 0}`;
  const ht = s?.halftime;
  if (ht && (ht.home != null || ht.away != null)) return `${ht.home ?? 0}-${ht.away ?? 0}`;
  return "-";
}

/** Convertit un item brut API-Football OU déjà "plat" en ligne lisible */
export function toRow(item: any) {
  if (item?.date && item?.homeTeam && item?.awayTeam) {
    return {
      fixtureId: item.fixtureId ?? item.id ?? item.fixture_id,
      date: String(item.date),
      homeTeam: String(item.homeTeam),
      awayTeam: String(item.awayTeam),
      score: typeof item.score === "string" ? item.score : fmtScore(item.score),
    };
  }
  const dateStr: string =
    item?.fixture?.date ? String(item.fixture.date).replace("T", " ").slice(0, 16) : "";
  const home = item?.teams?.home?.name ?? item?.team?.home?.name ?? "Équipe A";
  const away = item?.teams?.away?.name ?? item?.team?.away?.name ?? "Équipe B";
  const scoreStr = fmtScore(item?.score);
  return {
    fixtureId: item?.fixture?.id ?? item?.id ?? item?.fixture_id,
    date: dateStr,
    homeTeam: home,
    awayTeam: away,
    score: scoreStr,
  };
}

/** Fallback: compacte un tableau headToHead en {home_win, draw, away_win} */
export function compactH2H(list?: any[]) {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  let home_win = 0, draw = 0, away_win = 0;
  for (const m of list.slice(0, 10)) {
    const gh = Number(m?.goals?.home ?? 0);
    const ga = Number(m?.goals?.away ?? 0);
    if (Number.isNaN(gh) || Number.isNaN(ga)) continue;
    if (gh === ga) draw += 1;
    else if (gh > ga) home_win += 1;
    else away_win += 1;
  }
  return { home_win, draw, away_win };
}

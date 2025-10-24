// src/utils/statsExtractors.ts
export type Venue =
  | "home"
  | "away";

/** Mappage des métriques que l’on sait extraire des 5 derniers & des /advanced/ */
export type Metric =
  | "sot"          // Shots on Target (SOG)
  | "soff"         // Shots off Target
  | "shots"        // Total Shots
  | "attacks"      // Attacks
  | "dangerous"    // Dangerous Attacks
  | "fouls"        // Fouls
  | "offsides"     // Offsides
  | "corners"      // Corner Kicks
  | "yellow"       // Yellow Cards
  | "red";         // Red Cards

/** ============================================================
 *  Helpers d'identité des équipes / perspective
 *  ============================================================ */
export function extractTeamsFromItem(it: any): { homeName?: string; awayName?: string } {
  if (!it) return {};
  if (it.homeTeam || it.awayTeam) return { homeName: it.homeTeam, awayName: it.awayTeam };
  return {
    homeName: it?.teams?.home?.name ?? it?.team?.home?.name,
    awayName: it?.teams?.away?.name ?? it?.team?.away?.name,
  };
}

export function perspectiveForTeam(it: any, team: string): Venue | null {
  const { homeName, awayName } = extractTeamsFromItem(it);
  if (!homeName || !awayName) return null;
  if (homeName === team) return "home";
  if (awayName === team) return "away";
  return null;
}

/** ============================================================
 *  Normalisation de clés & alias robustes
 *  ============================================================ */
const norm = (s: any): string =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replaceAll("–", "-")
    .replaceAll("—", "-");

const alias = (...arr: string[]) => arr.map(norm);

/** Alias pour retrouver la même statistique malgré les variations de texte */
const METRIC_KEYS: Record<Metric, string[]> = {
  // Shots on Target
  sot: alias(
    "shots on goal",
    "shots on target",
    "sog",
    "sot",
    "shots on targ.",
    "shots on targ",          // par sécurité
    "shots on-target",
    "on target",
    "shots_on_target"
  ),
  // Shots off Target
  soff: alias(
    "shots off goal",
    "shots off target",
    "soff",
    "off target",
    "shots_off_target"
  ),
  // Total Shots
  shots: alias(
    "total shots",
    "shots total",
    "shots",
    "shot attempts"
  ),
  // Attacks
  attacks: alias("attacks"),
  // Dangerous Attacks
  dangerous: alias("dangerous attacks", "dangerous", "dangerous-atks"),
  // Fouls
  fouls: alias("fouls"),
  // Offsides
  offsides: alias("offsides", "offside"),
  // Corners
  corners: alias("corner kicks", "corners", "corner"),
  // Yellow Cards
  yellow: alias("yellow cards", "yellow", "yellow_cards"),
  // Red Cards
  red: alias("red cards", "red", "red_cards"),
};

const toNumber = (v: any): number | null => {
  // on tolère "12", "12%", " 12 ", etc.
  const n = Number(String(v ?? "").replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
};

/** ============================================================
 *  Lecture directe dans les items last5* (si déjà présents)
 *  - Supporte it.statistics: [{ type, home, away }...]
 *  - ou it.table:       [{ key, val_home, val_away }...]
 *  - ou quelques clés simples fallback
 *  ============================================================ */
export function readStatValueFromItem(
  it: any,
  metric: Metric,
  teamPerspective: Venue
): number | null {
  if (!it) return null;

  // (A) statistics: [{ type, home, away }]
  const statsArr = it?.statistics;
  if (Array.isArray(statsArr)) {
    for (const row of statsArr) {
      const keyNorm = norm(row.type ?? row.key ?? row.name);
      if (METRIC_KEYS[metric].includes(keyNorm)) {
        const v =
          teamPerspective === "home"
            ? row.home ?? row.value_home ?? row.h
            : row.away ?? row.value_away ?? row.a;
        const parsed = toNumber(v);
        if (parsed != null) return parsed;
      }
    }
  }

  // (B) table: [{ key, val_home, val_away }]
  const table = it?.table;
  if (Array.isArray(table)) {
    for (const row of table) {
      const keyNorm = norm(row.key ?? row.type ?? row.name);
      if (METRIC_KEYS[metric].includes(keyNorm)) {
        const v =
          teamPerspective === "home"
            ? row.val_home ?? row.home ?? row.h ?? row.val
            : row.val_away ?? row.away ?? row.a ?? row.val;
        const parsed = toNumber(v);
        if (parsed != null) return parsed;
      }
    }
  }

  // (C) quelques clés simples éventuelles (au cas où)
  const simpleKey = (k: string) => toNumber(it?.[k]);
  switch (metric) {
    case "corners":
      return simpleKey(teamPerspective === "home" ? "corners_home" : "corners_away");
    case "sot":
      return simpleKey(teamPerspective === "home" ? "sot_home" : "sot_away");
    case "soff":
      return simpleKey(teamPerspective === "home" ? "soff_home" : "soff_away");
    case "shots":
      return simpleKey(teamPerspective === "home" ? "shots_home" : "shots_away");
    case "yellow":
      return simpleKey(teamPerspective === "home" ? "yellow_home" : "yellow_away");
    case "red":
      return simpleKey(teamPerspective === "home" ? "red_home" : "red_away");
    case "fouls":
      return simpleKey(teamPerspective === "home" ? "fouls_home" : "fouls_away");
    case "offsides":
      return simpleKey(teamPerspective === "home" ? "offsides_home" : "offsides_away");
    case "attacks":
      return simpleKey(teamPerspective === "home" ? "attacks_home" : "attacks_away");
    case "dangerous":
      return simpleKey(teamPerspective === "home" ? "dangerous_home" : "dangerous_away");
  }

  return null;
}

/** ============================================================
 *  Lecture dans le payload /advanced/ (ton drawer)
 *  - advanced.statistics || advanced.stats -> array de 2 lignes
 *  - chaque ligne: { team, table: [{ key, val }] } OU statistics: [{ type, value }]
 *  ============================================================ */
export function readStatValueFromAdvanced(
  advanced: any,
  teamName: string,
  metric: Metric
): number | null {
  if (!advanced) return null;

  const rows = advanced.statistics ?? advanced.stats ?? null;
  if (!Array.isArray(rows) || rows.length === 0) return null;

  // On cherche la ligne de la bonne équipe
  const teamRow =
    rows.find(
      (r: any) => norm(r?.team?.name ?? r?.team) === norm(teamName)
    ) ?? null;

  if (!teamRow) return null;

  // Format 1: table: [{ key, val }]
  const table = Array.isArray(teamRow.table) ? teamRow.table : null;
  if (table) {
    for (const cell of table) {
      const keyNorm = norm(cell.key ?? cell.type ?? cell.name);
      if (METRIC_KEYS[metric].includes(keyNorm)) {
        const parsed = toNumber(cell.val ?? cell.value ?? cell.v);
        if (parsed != null) return parsed;
      }
    }
  }

  // Format 2: statistics: [{ type, value }]
  const stats2 = Array.isArray(teamRow.statistics) ? teamRow.statistics : null;
  if (stats2) {
    for (const cell of stats2) {
      const keyNorm = norm(cell.type ?? cell.key ?? cell.name);
      if (METRIC_KEYS[metric].includes(keyNorm)) {
        const parsed = toNumber(cell.value ?? cell.val ?? cell.v);
        if (parsed != null) return parsed;
      }
    }
  }

  return null;
}

/** Moyenne (arrondie à 2 décimales) */
export function computeAvg(values: Array<number | null | undefined>): number | null {
  const arr = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (arr.length === 0) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  return +(sum / arr.length).toFixed(2);
}

/** Utilitaire UI: garantie d’avoir 5 lignes (M1..M5) */
export const pad5 = <T,>(arr: T[], fill: T): T[] =>
  [...arr, ...Array(Math.max(0, 5 - arr.length)).fill(fill)].slice(0, 5);

/** Récupère un fixtureId depuis un item last5 */
export function fixtureIdOf(it: any): number | null {
  return (
    it?.fixture?.id ??
    it?.id ??
    it?.match_id ??
    it?.fixture_id ??
    it?.game_id ??
    null
  );
}

// src/config/signalsRegistry.ts
export type SignalFormat =
  | "int"
  | "float2"
  | "ratio01_pct1"   // 0..1 -> "63.3%"
  | "pct1"           // 0..100 -> "63.3%"
  | "probs_block";   // objet {home,draw,away} -> bloc spécial

export type SignalDef = {
  key: string;
  label: string;
  fmt: SignalFormat;
  help?: string;
  hideIfNull?: boolean; // true = ne pas afficher si null/undefined
};

// 🔰 REGISTRE : ajoutez ici toutes les clés que le back peut émettre.
// Celles absentes côté données seront simplement ignorées (cachées).
export const SIGNALS_REGISTRY: SignalDef[] = [
  {
    key: "home_rating",
    label: "home_rating",
    fmt: "ratio01_pct1",
    help: "Indice synthétique 0–1 : plus haut = plus favorable à l’équipe à domicile.",
    hideIfNull: true,
  },
  {
    key: "away_rating",
    label: "away_rating",
    fmt: "ratio01_pct1",
    help: "Indice synthétique 0–1 : plus haut = plus favorable à l’équipe à l’extérieur.",
    hideIfNull: true,
  },
  {
    key: "pressure_home",
    label: "pressure_home",
    fmt: "ratio01_pct1",
    help: "Pression/risque agrégé 0–1 (plus haut = plus de risques/volatilité) côté domicile.",
    hideIfNull: true,
  },
  {
    key: "pressure_away",
    label: "pressure_away",
    fmt: "ratio01_pct1",
    help: "Pression/risque agrégé 0–1 (plus haut = plus de risques/volatilité) côté extérieur.",
    hideIfNull: true,
  },
  {
    key: "elo_diff",
    label: "elo_diff",
    fmt: "float2",
    help: "Différentiel ELO (positif = avantage domicile, négatif = avantage extérieur).",
    hideIfNull: true,
  },
  {
    key: "league_gf_avg",
    label: "league_gf_avg",
    fmt: "float2",
    help: "Moyenne de buts marqués par équipe dans la ligue.",
    hideIfNull: true,
  },
  {
    key: "league_ga_avg",
    label: "league_ga_avg",
    fmt: "float2",
    help: "Moyenne de buts encaissés par équipe dans la ligue.",
    hideIfNull: true,
  },

  // 🔮 Probabilités ajustées (bloc spécial)
  {
    key: "probs_adjusted",
    label: "probs_adjusted",
    fmt: "probs_block",
    help: "Micro-correction des probabilités brutes {home, draw, away}.",
    hideIfNull: true,
  },

  // 📈 Vous pouvez déjà prévoir les futures métriques (elles resteront cachées tant que null)
  { key: "avg_sot_home",       label: "avg_sot_home",       fmt: "float2", hideIfNull: true,
    help: "Moyenne tirs cadrés (domicile) – pré-calcul si exposé côté back." },
  { key: "avg_sot_away",       label: "avg_sot_away",       fmt: "float2", hideIfNull: true },
  { key: "avg_corners_home",   label: "avg_corners_home",   fmt: "float2", hideIfNull: true },
  { key: "avg_corners_away",   label: "avg_corners_away",   fmt: "float2", hideIfNull: true },
  { key: "avg_yellow_home",    label: "avg_yellow_home",    fmt: "float2", hideIfNull: true },
  { key: "avg_yellow_away",    label: "avg_yellow_away",    fmt: "float2", hideIfNull: true },
  { key: "avg_shots_home",     label: "avg_shots_home",     fmt: "float2", hideIfNull: true },
  { key: "avg_shots_away",     label: "avg_shots_away",     fmt: "float2", hideIfNull: true },
];

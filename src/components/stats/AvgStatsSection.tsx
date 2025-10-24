// src/components/stats/AvgStatsSection.tsx
import React from "react";
import Section from "../layout/Section";
import MetricBreakdownCard from "./MetricBreakdownCard";

/** Utils locaux (conservés de ta version) */
function computeAvg(values: Array<number | null | undefined>): number | null {
  const arr = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (arr.length === 0) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  return +(sum / arr.length).toFixed(2);
}
const pad5 = <T,>(arr: T[], fill: T): T[] =>
  [...arr, ...Array(Math.max(0, 5 - arr.length)).fill(fill)].slice(0, 5);

/** ===== Séries de métriques disponibles =====
 *  Les champs sont optionnels pour ne rien casser si tu ne les passes pas encore.
 */
interface Series {
  // déjà existant
  sot?: Array<number | null>;
  corners?: Array<number | null>;
  yellow?: Array<number | null>;
  red?: Array<number | null>;
  // nouveaux
  soff?: Array<number | null>;
  shots?: Array<number | null>;
  attacks?: Array<number | null>;
  dangerous?: Array<number | null>;
  fouls?: Array<number | null>;
  offsides?: Array<number | null>;
}

/** Props: on garde home/away, et on ajoute H2H filtrés (facultatifs) */
interface Props {
  homeTeamName: string;
  awayTeamName: string;
  loading?: boolean;

  /** 5 derniers (home @ domicile) */
  home: Series;
  /** 5 derniers (away @ extérieur) */
  away: Series;

  /** H2H où l’équipe à domicile actuelle jouait à domicile (facultatif) */
  h2hHome?: Series;
  /** H2H où l’équipe à l’extérieur actuelle jouait à l’extérieur (facultatif) */
  h2hAway?: Series;
}

/** Petit helper pour éviter le boilerplate */
function renderMetricCard(
  label: string,
  arr?: Array<number | null | undefined>,
  className?: string
) {
  const values = pad5(arr ?? [], null);
  const avg = computeAvg(values);
  const n = (arr ?? []).filter((v) => v != null).length;
  return (
    <MetricBreakdownCard
      title={label}
      values={values}
      avg={avg}
      n={n}
      className={className}
    />
  );
}

const METRIC_ORDER: Array<{ key: keyof Series; label: string }> = [
  { key: "sot",       label: "Tirs cadrés" },
  { key: "soff",      label: "Tirs non cadrés" },
  { key: "shots",     label: "Tirs (total)" },
  { key: "attacks",   label: "Attaques" },
  { key: "dangerous", label: "Attaques dangereuses" },
  { key: "corners",   label: "Corners" },
  { key: "fouls",     label: "Fautes" },
  { key: "offsides",  label: "Hors-jeu" },
  { key: "yellow",    label: "Cartons jaunes" },
  { key: "red",       label: "Cartons rouges" },
];

function hasAnyValue(series?: Series): boolean {
  if (!series) return false;
  return METRIC_ORDER.some(({ key }) => (series[key] ?? []).some((v) => v != null));
}

const AvgStatsSection: React.FC<Props> = ({
  homeTeamName,
  awayTeamName,
  loading,
  home,
  away,
  h2hHome,
  h2hAway,
}) => {
  if (loading) {
    return (
      <Section title="📊 Stats moyennes (détaillées)">
        <div className="text-sm text-gray-500">Récupération des valeurs des 5 derniers matchs…</div>
      </Section>
    );
  }

  return (
    <Section title="📊 Stats moyennes (détaillées)">
      {/* ===== Domicile (5 derniers) ===== */}
      <div className="mb-5">
        <div className="text-base font-semibold mb-2">Domicile — {homeTeamName}</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {METRIC_ORDER.map(({ key, label }) =>
            renderMetricCard(label, home[key])
          )}
        </div>
      </div>

      {/* ===== Extérieur (5 derniers) ===== */}
      <div className="mb-2">
        <div className="text-base font-semibold mb-2">Extérieur — {awayTeamName}</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {METRIC_ORDER.map(({ key, label }) =>
            renderMetricCard(label, away[key])
          )}
        </div>
      </div>

      {/* ===== Face à face (H2H) - optionnel si fourni ===== */}
      {(hasAnyValue(h2hHome) || hasAnyValue(h2hAway)) && (
        <>
          <div className="h-4" />
          <div className="text-base font-semibold mb-2">🤝 Face à face (H2H)</div>

          {hasAnyValue(h2hHome) && (
            <div className="mb-5">
              <div className="text-sm font-medium mb-2">
                {homeTeamName} — matches H2H joués <span className="italic">à domicile</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {METRIC_ORDER.map(({ key, label }) =>
                  renderMetricCard(label, h2hHome?.[key])
                )}
              </div>
            </div>
          )}

          {hasAnyValue(h2hAway) && (
            <div>
              <div className="text-sm font-medium mb-2">
                {awayTeamName} — matches H2H joués <span className="italic">à l’extérieur</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {METRIC_ORDER.map(({ key, label }) =>
                  renderMetricCard(label, h2hAway?.[key])
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  );
};

export default AvgStatsSection;

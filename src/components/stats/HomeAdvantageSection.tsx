// src/components/stats/HomeAdvantageSection.tsx
import React from "react";
import Section from "../layout/Section";
import Row from "../ui/Row";

export type HomeAdvantageData = {
  applied?: boolean;    // si false/absent => on masque la carte
  coef?: number;        // intensité du bonus (ex: 0.1)
  note?: string;        // facultatif: raison / explication
  // Facultatifs si un jour vous voulez afficher l'effet chiffré:
  effect_home_pct?: number; // ex: +2.3 (points de probabilité)
  effect_draw_pct?: number; // ex: -0.7
  effect_away_pct?: number; // ex: -1.6
};

const fmtPct = (v?: number) =>
  typeof v === "number" && isFinite(v) ? `${v.toFixed(1)}%` : "—";

const HomeAdvantageSection: React.FC<{ data?: HomeAdvantageData }> = ({ data }) => {
  // Masquer si non appliqué ou données absentes
  if (!data || data.applied !== true) return null;

  return (
    <Section title="🏠 Avantage terrain">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm font-medium mb-2">Paramètres</div>
          <div className="text-sm space-y-1">
            <Row label="Appliqué" value="true" />
            <Row label="Coef" value={data.coef ?? "—"} />
            {data.note ? <Row label="Note" value={data.note} /> : null}
          </div>
        </div>

        {/* Bloc “Effet” rendu uniquement si on vous fournit des deltas */}
        {(data.effect_home_pct != null ||
          data.effect_draw_pct != null ||
          data.effect_away_pct != null) && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-medium mb-2">Effet sur les probabilités</div>
            <div className="text-sm space-y-1">
              <Row label="Δ Home" value={fmtPct(data.effect_home_pct)} />
              <Row label="Δ Draw" value={fmtPct(data.effect_draw_pct)} />
              <Row label="Δ Away" value={fmtPct(data.effect_away_pct)} />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
};

export default HomeAdvantageSection;

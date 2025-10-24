// src/components/stats/ScorerWeightSection.tsx
import React from "react";
import Section from "../layout/Section";

export type ScorerRow = {
  player: string;
  goals: number;
  pct: number;              // 0..100
  status?: "XI" | "Banc" | "Absent" | "Inconnu";
};

function StatusChip({ s }: { s?: ScorerRow["status"] }) {
  const map: Record<string, string> = {
    XI: "bg-green-100 text-green-800",
    Banc: "bg-amber-100 text-amber-800",
    Absent: "bg-red-100 text-red-800",
    Inconnu: "bg-gray-100 text-gray-700",
  };
  const cls = map[s || "Inconnu"] || map.Inconnu;
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${cls}`}>{s || "Inconnu"}</span>;
}

function Table({ title, rows, n }: { title: string; rows: ScorerRow[]; n: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="text-sm font-medium mb-2">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-gray-500 italic">Aucun but sur les {n} derniers matchs.</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="text-left py-1">Joueur</th>
              <th className="text-right py-1">Buts</th>
              <th className="text-right py-1">% équipe</th>
              <th className="text-right py-1">Statut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                <td className="py-1">{r.player}</td>
                <td className="py-1 text-right">{r.goals}</td>
                <td className="py-1 text-right">{r.pct.toFixed(1)}%</td>
                <td className="py-1 text-right"><StatusChip s={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

interface Props {
  homeTeamName: string;
  awayTeamName: string;
  home: ScorerRow[];
  away: ScorerRow[];
  /** Nombre de matchs considérés (par défaut 5) */
  n?: number;
}

const ScorerWeightSection: React.FC<Props> = ({
  homeTeamName,
  awayTeamName,
  home,
  away,
  n = 5,
}) => {
  return (
    <Section title={`🥅 Poids des buteurs récents (${n} derniers matchs)`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Table title={`Domicile — ${homeTeamName}`} rows={home} n={n} />
        <Table title={`Extérieur — ${awayTeamName}`} rows={away} n={n} />
      </div>
    </Section>
  );
};

export default ScorerWeightSection;

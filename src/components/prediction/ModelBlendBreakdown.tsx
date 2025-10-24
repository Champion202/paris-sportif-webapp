// src/components/prediction/ModelBlendBreakdown.tsx
import React from "react";

/**
 * Ce composant lit detailsDebug (backend) et affiche :
 * - les probas calibrées de A1, A2, A3 (p_home, p_draw, p_away)
 * - leur meilleur pick
 * - les poids du blend (w_A1,w_A2,w_A3)
 * - la ligne "BLEND" finale (si présent)
 *
 * Contrat attendu (souple) dans detailsDebug :
 * {
 *   probs_by_model?: {
 *     A1?: { home?:number, draw?:number, away?:number },
 *     A2?: { home?:number, draw?:number, away?:number },
 *     A3?: { home?:number, draw?:number, away?:number },
 *     BLEND?: { home?:number, draw?:number, away?:number }
 *   },
 *   blend_weights?: { A1?:number, A2?:number, A3?:number },
 *   blend_reason?: string
 * }
 */

type Trio = { home?: number; draw?: number; away?: number } | undefined;

function pct(v?: number) {
  const x = typeof v === "number" ? Math.max(0, Math.min(1, v)) : 0;
  return `${(x * 100).toFixed(1)}%`;
}

function bestLabel(p?: Trio): "1" | "X" | "2" | "-" {
  if (!p) return "-";
  const items: Array<["1" | "X" | "2", number]> = [
    ["1", p.home ?? 0],
    ["X", p.draw ?? 0],
    ["2", p.away ?? 0],
  ];
  items.sort((a, b) => b[1] - a[1]);
  return items[0][1] > 0 ? items[0][0] : "-";
}

function Bar({ value }: { value?: number }) {
  const w = typeof value === "number" ? Math.max(0, Math.min(1, value)) * 100 : 0;
  return (
    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded">
      <div
        className="h-2 rounded bg-gray-900 dark:bg-white"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

function RowLine({
  label,
  p,
  weight,
  emphasize = false,
}: {
  label: string;
  p?: Trio;
  weight?: number;
  emphasize?: boolean;
}) {
  const cls = emphasize
    ? "bg-emerald-50 dark:bg-emerald-900/30"
    : "bg-white dark:bg-gray-900";

  return (
    <tr className={`${cls}`}>
      <td className="px-2 py-1 font-medium">{label}</td>
      <td className="px-2 py-1">
        <div className="flex items-center gap-2">
          <Bar value={p?.home} />
          <div className="w-14 text-right text-xs">{pct(p?.home)}</div>
        </div>
      </td>
      <td className="px-2 py-1">
        <div className="flex items-center gap-2">
          <Bar value={p?.draw} />
          <div className="w-14 text-right text-xs">{pct(p?.draw)}</div>
        </div>
      </td>
      <td className="px-2 py-1">
        <div className="flex items-center gap-2">
          <Bar value={p?.away} />
          <div className="w-14 text-right text-xs">{pct(p?.away)}</div>
        </div>
      </td>
      <td className="px-2 py-1 text-center">
        <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800">
          {bestLabel(p)}
        </span>
      </td>
      <td className="px-2 py-1 text-right text-xs">{weight != null ? pct(weight) : "—"}</td>
    </tr>
  );
}

const ModelBlendBreakdown: React.FC<{
  detailsDebug?: any;
  className?: string;
  title?: string;
}> = ({ detailsDebug, className = "", title = "🤝 Accord des modèles (A1/A2/A3 + blend)" }) => {
  const probs = (detailsDebug?.probs_by_model ?? {}) as {
    A1?: Trio; A2?: Trio; A3?: Trio; BLEND?: Trio;
  };
  const w = (detailsDebug?.blend_weights ?? {}) as { A1?: number; A2?: number; A3?: number };
  const reason = detailsDebug?.blend_reason as string | undefined;

  const hasAny =
    (probs?.A1 && (probs.A1.home != null || probs.A1.draw != null || probs.A1.away != null)) ||
    (probs?.A2 && (probs.A2.home != null || probs.A2.draw != null || probs.A2.away != null)) ||
    (probs?.A3 && (probs.A3.home != null || probs.A3.draw != null || probs.A3.away != null)) ||
    (probs?.BLEND && (probs.BLEND.home != null || probs.BLEND.draw != null || probs.BLEND.away != null));

  if (!hasAny) {
    return null; // on n'affiche rien si le backend n'a pas envoyé ces infos
  }

  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="px-4 pt-3 pb-2 text-sm font-medium">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="text-left px-2 py-1">Modèle</th>
              <th className="text-left px-2 py-1">P(1)</th>
              <th className="text-left px-2 py-1">P(X)</th>
              <th className="text-left px-2 py-1">P(2)</th>
              <th className="text-center px-2 py-1">Pick</th>
              <th className="text-right px-2 py-1">Poids</th>
            </tr>
          </thead>
          <tbody>
            <RowLine label="A1" p={probs.A1} weight={w.A1} />
            <RowLine label="A2" p={probs.A2} weight={w.A2} />
            <RowLine label="A3" p={probs.A3} weight={w.A3} />
            <tr>
              <td colSpan={6}><div className="h-2 bg-gray-100 dark:bg-gray-800" /></td>
            </tr>
            <RowLine label="BLEND" p={probs.BLEND} emphasize />
          </tbody>
        </table>
      </div>
      {reason && (
        <div className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
          {reason}
        </div>
      )}
    </div>
  );
};

export default ModelBlendBreakdown;

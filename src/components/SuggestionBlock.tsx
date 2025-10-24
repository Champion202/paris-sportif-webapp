// src/components/SuggestionBlock.tsx
import React, { useState } from "react";
import Section from "./layout/Section";
import Row from "./ui/Row";
import ModelBlendBreakdown from "./prediction/ModelBlendBreakdown";

type UISuggestion = {
  text: string;
  risk?: string;
  choice?: "1" | "X" | "2";
  confidence?: number; // 0..1
  probs?: { home?: number; draw?: number; away?: number };
  edge?: number;
  stake?: number;
};

const RiskBadge: React.FC<{ risk?: string }> = ({ risk }) => {
  const r = (risk || "standard").toLowerCase();
  const map: Record<string, string> = {
    faible: "bg-emerald-100 text-emerald-800",
    standard: "bg-sky-100 text-sky-800",
    élevé: "bg-amber-100 text-amber-800",
    eleve: "bg-amber-100 text-amber-800",
    high: "bg-amber-100 text-amber-800",
  };
  const cls = map[r] || map.standard;
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${cls}`}>{risk || "standard"}</span>;
};

const SuggestionCard: React.FC<{ s: UISuggestion; idx: number }> = ({ s, idx }) => {
  const p = s.probs || {};
  const pct = (v?: number) => (typeof v === "number" ? `${(Math.max(0, Math.min(1, v)) * 100).toFixed(1)}%` : "—");
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div className="font-medium">Suggestion #{idx + 1}</div>
        <RiskBadge risk={s.risk} />
      </div>
      {s.text && <div className="mt-2 text-sm">{s.text}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
        <Row label="Choix" value={s.choice ?? "—"} />
        <Row label="Confiance" value={pct(s.confidence)} />
        {"edge" in s && <Row label="Edge vs marché" value={typeof s.edge === "number" ? `${(s.edge * 100).toFixed(1)}%` : "—"} />}
      </div>
      {p && (p.home != null || p.draw != null || p.away != null) && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1">Probas</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
              <div className="opacity-60">P(1)</div>
              <div className="font-mono">{pct(p.home)}</div>
            </div>
            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
              <div className="opacity-60">P(X)</div>
              <div className="font-mono">{pct(p.draw)}</div>
            </div>
            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
              <div className="opacity-60">P(2)</div>
              <div className="font-mono">{pct(p.away)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SuggestionBlock: React.FC<{
  predictions: UISuggestion[];
  message?: string;
  details_debug?: any;
}> = ({ predictions, message, details_debug }) => {
  const [showModels, setShowModels] = useState<boolean>(true);

  const hasModels =
    details_debug &&
    (details_debug.probs_by_model?.A1 ||
      details_debug.probs_by_model?.A2 ||
      details_debug.probs_by_model?.A3 ||
      details_debug.probs_by_model?.BLEND);

  return (
    <div className="space-y-3">
      <Section title="🎯 Suggestions">
        {message && (
          <div className="mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm whitespace-pre-line">
            {message}
          </div>
        )}

        {(!predictions || predictions.length === 0) ? (
          <div className="text-sm text-gray-500">Aucune suggestion pour ce match.</div>
        ) : (
          <div className="grid gap-3">
            {predictions.map((s, i) => (
              <SuggestionCard s={s} idx={i} key={i} />
            ))}
          </div>
        )}
      </Section>

      {/* Accord des modèles (A1/A2/A3 + blend) */}
      {hasModels && (
        <Section title="🤝 Accord des modèles">
          <div className="flex items-center justify-end mb-2">
            <button
              onClick={() => setShowModels((v) => !v)}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {showModels ? "Masquer" : "Afficher"}
            </button>
          </div>
          {showModels && <ModelBlendBreakdown detailsDebug={details_debug} />}
        </Section>
      )}

      {/* (Facultatif) Debug brut */}
      {/* <Section title="🔎 Debug (brut)">
        <pre className="text-xs overflow-x-auto bg-gray-50 dark:bg-gray-900 p-3 rounded">{JSON.stringify(details_debug, null, 2)}</pre>
      </Section> */}
    </div>
  );
};

export default SuggestionBlock;

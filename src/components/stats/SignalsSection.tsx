// src/components/stats/SignalsSection.tsx
import React from "react";
import Section from "../layout/Section";
import Row from "../ui/Row";
import { SIGNALS_REGISTRY, SignalDef } from "../../config/signalsRegistry";

type SignalsObj = Record<string, any>;

function fmtValue(fmt: SignalDef["fmt"], v: any): string {
  if (v == null) return "—";
  if (fmt === "int") return String(Math.trunc(Number(v)));
  if (fmt === "float2") return Number(v).toFixed(2).replace(/\.00$/, "");
  if (fmt === "ratio01_pct1") return `${(Number(v) * 100).toFixed(1)}%`;
  if (fmt === "pct1") return `${Number(v).toFixed(1)}%`;
  return String(v);
}

const ProbsAdjustedBlock: React.FC<{ obj: any }> = ({ obj }) => {
  if (!obj || typeof obj !== "object") return null;
  const home = obj.home ?? obj.H ?? obj.h;
  const draw = obj.draw ?? obj.D ?? obj.x ?? obj.X;
  const away = obj.away ?? obj.A ?? obj.a;

  const toPct = (x: any) =>
    x == null ? "—" : `${(Number(x) * 100).toFixed(1)}%`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
      <Row label="Home" value={toPct(home)} />
      <Row label="Draw" value={toPct(draw)} />
      <Row label="Away" value={toPct(away)} />
    </div>
  );
};

const SignalsSection: React.FC<{ signals?: SignalsObj }> = ({ signals }) => {
  const sig = signals || {};

  // Filtrer champs visibles (soit non-null, soit fmt spécial)
  const visibleDefs = SIGNALS_REGISTRY.filter((def) => {
    if (def.fmt === "probs_block") return sig[def.key] != null;
    const val = sig[def.key];
    return def.hideIfNull ? val != null : true;
  });

  if (visibleDefs.length === 0) {
    return (
      <Section title="🧩 Signaux & Ratings">
        <div className="text-gray-400 italic text-sm">Aucun signal disponible pour ce match.</div>
      </Section>
    );
  }

  return (
    <Section title="🧩 Signaux & Ratings">
      <div className="space-y-2">
        {visibleDefs.map((def) =>
          def.fmt === "probs_block" ? (
            <div key={def.key} className="mt-2">
              <div className="font-medium mb-1">Probabilités ajustées</div>
              <ProbsAdjustedBlock obj={sig[def.key]} />
            </div>
          ) : (
            <div key={def.key} title={def.help || ""}>
              <Row label={def.label} value={fmtValue(def.fmt, sig[def.key])} />
            </div>
          )
        )}
      </div>
    </Section>
  );
};

export default SignalsSection;

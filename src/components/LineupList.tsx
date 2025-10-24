// src/components/LineupList.tsx
import React from "react";

/**
 * Composition attendue (voir services/player_impact.composition_from_lineups) :
 * {
 *   home: { team_id, team_name?, xi:[{id,name,number,pos}], bench:[...], out:[{id,name,status,reason}] },
 *   away: { ... },
 *   source: "api-football"
 * }
 */

type Player = {
  id?: number;
  name?: string;
  number?: number;
  pos?: string;
  status?: "injury" | "suspension" | string; // utilisé pour "out"
  reason?: string;                            // utilisé pour "out"
};

type Side = {
  team_id?: number;
  team_name?: string;
  xi?: Player[];
  bench?: Player[];
  out?: Player[];
};

type Composition = {
  home?: Side;
  away?: Side;
  source?: string | null;
};

// ---------- UI helpers ----------
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 ml-2">
      {children}
    </span>
  );
}

function StatusIcon({ status }: { status?: string }) {
  if (!status) return null;
  const s = String(status).toLowerCase();
  if (s.startsWith("injur") || status === "injury") {
    return <span className="text-red-600 mr-1">❌</span>;
  }
  if (s.includes("susp") || status === "suspension") {
    return <span className="mr-1">🟥</span>;
  }
  return null;
}

function PlayerRow({ p }: { p: Player }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {p.number != null && (
          <span className="inline-flex w-6 h-6 items-center justify-center text-xs rounded bg-gray-200 dark:bg-gray-700">
            {p.number}
          </span>
        )}
        <span className="font-medium">{p.name ?? "Inconnu"}</span>
      </div>
      <span className="text-xs text-gray-500">{p.pos ?? ""}</span>
    </div>
  );
}

/**
 * On résout le nom affiché en priorité:
 * 1) p.name si fourni
 * 2) lookup via index id->name construit sur xi+bench+out
 * 3) "Inconnu"
 */
function OutRow({ p, nameIndex }: { p: Player; nameIndex: Record<number, string> }) {
  const displayName =
    p.name ??
    (p.id != null && nameIndex[p.id] ? nameIndex[p.id] : undefined) ??
    "Inconnu";
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <StatusIcon status={p.status} />
        <span className="font-medium">{displayName}</span>
      </div>
      <span className="text-xs text-gray-500">{p.reason ?? p.status ?? ""}</span>
    </div>
  );
}

function buildNameIndex(side?: Side): Record<number, string> {
  const idx: Record<number, string> = {};
  if (!side) return idx;
  const push = (arr?: Player[]) => {
    (arr || []).forEach((p) => {
      if (p && typeof p.id === "number" && p.name) {
        idx[p.id] = p.name;
      }
    });
  };
  push(side.xi);
  push(side.bench);
  push(side.out);
  return idx;
}

function TeamColumn({
  title,
  side,
}: {
  title: string;
  side?: Side;
}) {
  const xi = side?.xi ?? [];
  const bench = side?.bench ?? [];
  const out = side?.out ?? [];
  const nameIndex = buildNameIndex(side);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-gray-500">
          XI<Badge>{xi.length}</Badge> Banc<Badge>{bench.length}</Badge> Absents<Badge>{out.length}</Badge>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-sm font-medium mb-1">Onze de départ</div>
        {xi.length ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {xi.map((p, i) => (
              <PlayerRow key={`${p.id ?? "xi"}-${i}`} p={p} />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 italic text-sm">Non disponible…</div>
        )}
      </div>

      <div className="mb-3">
        <div className="text-sm font-medium mb-1">Banc</div>
        {bench.length ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {bench.map((p, i) => (
              <PlayerRow key={`${p.id ?? "bench"}-${i}`} p={p} />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 italic text-sm">—</div>
        )}
      </div>

      <div>
        <div className="text-sm font-medium mb-1">Non retenus / Absents</div>
        {out.length ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {out.map((p, i) => (
              <OutRow key={`${p.id ?? "out"}-${i}`} p={p} nameIndex={nameIndex} />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 italic text-sm">—</div>
        )}
      </div>
    </div>
  );
}

// ---------- Composant principal ----------
export default function LineupList({
  composition,
  homeName,
  awayName,
  className,
  title = "🧑‍🏫 Composition des équipes",
  // rétro-compat : certains appels t’envoient encore `comp`
  comp,
}: {
  composition?: Composition | null;
  homeName?: string;
  awayName?: string;
  className?: string;
  title?: string;
  comp?: Composition | null; // fallback
}) {
  const compEff = composition ?? comp ?? undefined;

  if (!compEff || (!compEff.home && !compEff.away)) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow ${className ?? ""}`}>
        <div className="font-semibold mb-2">{title}</div>
        <div className="text-gray-400 italic text-sm">Non disponible…</div>
      </div>
    );
  }

  const homeTitle = compEff.home?.team_name || homeName || "Domicile";
  const awayTitle = compEff.away?.team_name || awayName || "Extérieur";

  return (
    <div className={className}>
      <div className="font-semibold mb-3">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TeamColumn title={homeTitle} side={compEff.home} />
        <TeamColumn title={awayTitle} side={compEff.away} />
      </div>
      <div className="flex items-center justify-between mt-2">
        {compEff.source && (
          <div className="text-xs text-gray-500">Source: {compEff.source}</div>
        )}
        <div className="text-xs text-gray-500">
          Légende : <span className="inline-flex items-center mr-3"><span className="text-red-600 mr-1">❌</span>blessure</span>
          <span className="inline-flex items-center"><span className="mr-1">🟥</span>suspension/carton rouge</span>
        </div>
      </div>
    </div>
  );
}

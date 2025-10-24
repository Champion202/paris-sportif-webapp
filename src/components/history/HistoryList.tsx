// src/components/history/HistoryList.tsx
import { toRow } from "../../utils/football";

export default function HistoryList({
  list,
  onOpen,
}: {
  list?: any[];
  onOpen?: (fixtureId?: number) => void;
}) {
  if (!list?.length) {
    return <div className="text-gray-400">Aucune donnée</div>;
  }
  return (
    <div className="space-y-2">
      {list.map((m, i) => {
        const row = toRow(m);
        const clickable = !!row.fixtureId && !!onOpen;
        const Comp: any = clickable ? "button" : "div";
        return (
          <Comp
            key={i}
            className={
              "text-sm p-2 rounded-lg w-full text-left transition " +
              (clickable
                ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                : "bg-gray-100 dark:bg-gray-700")
            }
            onClick={clickable ? () => onOpen!(row.fixtureId as number) : undefined}
            title={clickable ? `Voir détails (FIX ${row.fixtureId})` : undefined}
          >
            📅 {row.date} — {row.homeTeam} vs {row.awayTeam} : <strong>{row.score}</strong>
            {row.fixtureId ? <span className="ml-2 opacity-60">#{row.fixtureId}</span> : null}
          </Comp>
        );
      })}
    </div>
  );
}

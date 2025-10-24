// src/components/StandingsSide.tsx
import KeyValueList from "./KeyValueList";
import Row from "./ui/Row";

export default function StandingsSide({
  title,
  data,
}: {
  title: string;
  data?: { rank?: number; points?: number } | any;
}) {
  if (!data)
    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
        <div className="font-medium mb-1">{title}</div>
        <div className="text-gray-400 italic">Non disponible…</div>
      </div>
    );

  const rank = data?.rank ?? data?.home_rank ?? data?.away_rank ?? null;
  const points = data?.points ?? data?.home_points ?? data?.away_points ?? null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
      <div className="font-medium mb-1">{title}</div>
      {rank != null || points != null ? (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Row label="Rang" value={rank ?? "—"} />
          <Row label="Points" value={points ?? "—"} />
        </div>
      ) : (
        <KeyValueList obj={data} />
      )}
    </div>
  );
}

// src/components/live/LineupsBlock.tsx
export default function LineupsBlock({ lineups }: { lineups: any[] }) {
  if (!lineups?.length) return <div className="text-gray-400 italic">Non disponible…</div>;
  return (
    <div className="flex flex-wrap gap-4">
      {lineups.map((line, i) => (
        <div key={i} className="flex-1 min-w-[130px]">
          <div className="font-semibold mb-1">{line.team?.name}</div>
          <ul className="text-xs list-disc pl-4">
            {(line.startXI ?? []).map((p: any, idx: number) => (
              <li key={idx}>
                {p.player?.name} ({p.player?.pos})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

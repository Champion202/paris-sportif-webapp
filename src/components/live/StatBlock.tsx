// src/components/live/StatBlock.tsx
export default function StatBlock({ stats }: { stats: any[] }) {
  if (!stats?.length) return <div className="text-gray-400 italic">Non disponible…</div>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th className="text-left">{stats[0]?.team?.name ?? "?"}</th>
          <th className="text-center">Stat</th>
          <th className="text-right">{stats[1]?.team?.name ?? "?"}</th>
        </tr>
      </thead>
      <tbody>
        {(stats[0]?.statistics ?? []).map((stat: any, i: number) => (
          <tr key={`${stat.type}-${i}`} className="border-t border-gray-200 dark:border-gray-700">
            <td className="py-1 text-left w-1/4">{stat.value ?? "-"}</td>
            <td className="py-1 text-center text-gray-600 dark:text-gray-300">{stat.type}</td>
            <td className="py-1 text-right w-1/4">{stats[1]?.statistics?.[i]?.value ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

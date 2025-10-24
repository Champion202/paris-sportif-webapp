// src/components/live/OddsBlock.tsx
export default function OddsBlock({ odds, title = "Cotes" }: { odds: any[]; title?: string }) {
  if (!odds?.length) return <div className="text-gray-400 italic">Aucune cote détectée…</div>;
  return (
    <div>
      <div className="font-semibold mb-1">{title}</div>
      <pre className="overflow-x-auto text-xs">{JSON.stringify(odds, null, 2)}</pre>
    </div>
  );
}

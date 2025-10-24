// src/components/KeyValueList.tsx
import Row from "./ui/Row";

export default function KeyValueList({ obj }: { obj: any }) {
  if (!obj || (typeof obj === "object" && Object.keys(obj).length === 0))
    return <div className="text-gray-400 italic">Non disponible…</div>;

  if (Array.isArray(obj)) {
    return (
      <pre className="overflow-x-auto text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
        {JSON.stringify(obj, null, 2)}
      </pre>
    );
  }

  const entries = Object.entries(obj as Record<string, any>);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      {entries.map(([k, v]) => (
        <Row key={k} label={k} value={typeof v === "number" ? v : String(v)} />
      ))}
    </div>
  );
}

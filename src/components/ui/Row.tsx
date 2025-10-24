// src/components/ui/Row.tsx
export default function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg">
      <div className="text-gray-600 dark:text-gray-300">{label}</div>
      <div className="font-medium">{String(value)}</div>
    </div>
  );
}

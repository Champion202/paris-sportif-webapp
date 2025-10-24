// src/components/ui/FormMiniCard.tsx
import Row from "./Row";

export type FormData = {
  n: number;
  win: number;
  draw: number;
  loss: number;
  gf_avg: number;
  ga_avg: number;
  seq?: string;
};

export default function FormMiniCard({ data }: { data?: Partial<FormData> | null }) {
  if (!data) return <div className="text-gray-400 italic">Non disponible…</div>;
  const { n, win, draw, loss, gf_avg, ga_avg, seq } = data;

  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Row label="Matchs (n)" value={n ?? "—"} />
        <Row label="Série" value={seq ?? "—"} />
        <Row label="Victoires" value={win ?? 0} />
        <Row label="Nuls" value={draw ?? 0} />
        <Row label="Défaites" value={loss ?? 0} />
        <Row label="GF moyen" value={gf_avg ?? "—"} />
        <Row label="GA moyen" value={ga_avg ?? "—"} />
      </div>
    </div>
  );
}

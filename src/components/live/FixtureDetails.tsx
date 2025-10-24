// src/components/live/FixtureDetails.tsx
export default function FixtureDetails({ fixture }: { fixture: any }) {
  if (!fixture || Object.keys(fixture).length === 0) {
    return <div className="text-gray-400 italic">Non disponible…</div>;
  }
  return (
    <div className="grid gap-2 text-left">
      <div>
        <b>Stade :</b> {fixture.venue?.name} ({fixture.venue?.city})
      </div>
      <div>
        <b>Pays :</b> {fixture.league?.country}
      </div>
      <div>
        <b>Compétition :</b> {fixture.league?.name}
      </div>
      <div>
        <b>Saison :</b> {fixture.league?.season}
      </div>
      <div>
        <b>Date :</b>{" "}
        {fixture.fixture?.date ? String(fixture.fixture.date).replace("T", " ").slice(0, 16) : ""}
      </div>
      <div>
        <b>Statut :</b> {fixture.fixture?.status?.long}{" "}
        {fixture.fixture?.status?.elapsed ? `(${fixture.fixture?.status?.elapsed}’)` : ""}
      </div>
      <div>
        <b>Arbitre :</b> {fixture.fixture?.referee || "Non précisé"}
      </div>
    </div>
  );
}

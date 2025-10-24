// src/components/live/EventsBlock.tsx
export default function EventsBlock({ events }: { events: any[] }) {
  if (!events?.length) return <div className="text-gray-400 italic">Aucun événement…</div>;
  return (
    <ul className="space-y-1">
      {events.map((event, idx) => (
        <li key={idx} className="text-xs">
          <b>{event.player?.name}</b> — {event.type}
          {event.detail && <> ({event.detail})</>}
          {event.team && <span className="ml-2 text-gray-500">({event.team.name})</span>}
        </li>
      ))}
    </ul>
  );
}
